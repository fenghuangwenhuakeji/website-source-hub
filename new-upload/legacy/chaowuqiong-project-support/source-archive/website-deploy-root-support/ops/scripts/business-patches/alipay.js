const express = require('express');
const router = express.Router();
const { AlipaySdk } = require('alipay-sdk');
const { authMiddleware } = require('../middleware/auth');

// 初始化支付宝SDK
const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID,
  privateKey: process.env.ALIPAY_PRIVATE_KEY,
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
  gateway: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
  signType: 'RSA2'
});

// 创建支付宝支付订单
router.post('/create', authMiddleware, async (req, res, next) => {
  try {
    const { orderId, payMethod } = req.body;
    const db = req.app.locals.db;
    
    if (!db) {
      return res.json({
        success: true,
        data: {
          orderId: orderId || 'TEST' + Date.now(),
          qrCode: null,
          payUrl: null,
          autoPaid: true
        }
      });
    }

    // 获取订单信息
    const orders = await db.query(
      'SELECT * FROM recharge_orders WHERE id = ? AND user_id = ? AND status = ?',
      [orderId, req.user.userId, 'pending']
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在或已支付' });
    }

    const order = orders[0];

    // 调用支付宝接口创建支付订单
    const bizContent = {
      outTradeNo: order.order_no,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: order.amount.toString(),
      subject: order.package_name,
      body: `充值${order.package_name}`,
      passbackParams: encodeURIComponent(JSON.stringify({
        orderId: order.id,
        userId: req.user.userId
      }))
    };

    // 生成支付链接
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
      returnUrl: process.env.ALIPAY_RETURN_URL,
      bizContent: bizContent
    });

    // 更新订单支付方式
    await db.query(
      'UPDATE recharge_orders SET pay_method = ? WHERE id = ?',
      ['alipay', orderId]
    );

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        payUrl: result,
        qrCode: null,
        amount: order.amount
      }
    });

  } catch (error) {
    console.error('创建支付宝订单失败:', error);
    next(error);
  }
});

// 支付宝异步回调通知
router.post('/callback/alipay', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const notifyData = req.body;

    console.log('支付宝回调数据:', notifyData);

    // 验签
    const signVerified = alipaySdk.checkNotifySign(notifyData);
    
    if (!signVerified) {
      console.error('支付宝回调验签失败');
      return res.send('fail');
    }

    // 检查交易状态
    if (notifyData.trade_status !== 'TRADE_SUCCESS' && notifyData.trade_status !== 'TRADE_FINISHED') {
      console.log('交易未成功:', notifyData.trade_status);
      return res.send('success'); // 返回success表示已收到通知
    }

    const outTradeNo = notifyData.out_trade_no;
    const tradeNo = notifyData.trade_no;

    if (!db) {
      console.log('演示模式：跳过数据库更新');
      return res.send('success');
    }

    // 查询订单
    const orders = await db.query(
      'SELECT * FROM recharge_orders WHERE order_no = ? AND status = ?',
      [outTradeNo, 'pending']
    );

    if (orders.length === 0) {
      console.log('订单不存在或已处理:', outTradeNo);
      return res.send('success');
    }

    const order = orders[0];

    // 更新订单状态
    await db.query(
      'UPDATE recharge_orders SET status = ?, paid_at = NOW(), trade_no = ? WHERE id = ?',
      ['paid', tradeNo, order.id]
    );

    // 更新用户积分
    await db.query(
      'UPDATE users SET points = points + ?, total_recharge = total_recharge + ? WHERE id = ?',
      [order.points, order.amount, order.user_id]
    );

    // 更新会员时长
    const [users] = await db.query('SELECT membership_expire FROM users WHERE id = ?', [order.user_id]);
    const user = users?.[0] || users;
    const now = new Date();
    let newExpire;

    if (order.duration_unit === 'permanent') {
      newExpire = new Date('2099-12-31');
    } else if (order.duration_unit === 'hour') {
      newExpire = new Date(now.getTime() + order.duration * 60 * 60 * 1000);
    } else {
      newExpire = new Date(now.getTime() + order.duration * 24 * 60 * 60 * 1000);
    }

    // 如果已有会员时长，在原有基础上累加
    if (user && user.membership_expire && new Date(user.membership_expire) > now) {
      if (order.duration_unit === 'hour') {
        newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 60 * 60 * 1000);
      } else if (order.duration_unit !== 'permanent') {
        newExpire = new Date(new Date(user.membership_expire).getTime() + order.duration * 24 * 60 * 60 * 1000);
      }
    }

    await db.query('UPDATE users SET membership_expire = ? WHERE id = ?', 
      [newExpire.toISOString().slice(0, 19).replace('T', ' '), order.user_id]);

    // 处理邀请奖励（如果有邀请人）
    const [userInfo] = await db.query('SELECT referred_by FROM users WHERE id = ?', [order.user_id]);
    if (userInfo && userInfo.referred_by) {
      // 更新邀请记录状态为已充值
      await db.query(
        'UPDATE invitation_records SET status = ?, reward_points = reward_points + ? WHERE invitee_id = ?',
        ['recharged', Math.floor(order.amount * 0.1), order.user_id]
      );
      
      // 给邀请人发放返佣积分
      const commission = Math.min(Math.floor(order.amount * 0.1), 100);
      await db.query(
        'UPDATE users SET points = points + ? WHERE id = ?',
        [commission, userInfo.referred_by]
      );
      
      // 更新邀请统计
      await db.query(
        'INSERT INTO invitation_stats (user_id, recharged_count, total_reward_points) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE recharged_count = recharged_count + 1, total_reward_points = total_reward_points + ?',
        [userInfo.referred_by, commission, commission]
      );
    }

    console.log('支付宝支付处理成功:', outTradeNo);
    res.send('success');

  } catch (error) {
    console.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
});

// 支付宝同步回调（支付完成跳转）
router.get('/return/alipay', async (req, res) => {
  const { out_trade_no, trade_no } = req.query;
  
  // 验证签名
  const signVerified = alipaySdk.checkNotifySign(req.query);
  
  if (signVerified) {
    // 支付成功，重定向到成功页面
    res.redirect('/payment/success?orderNo=' + out_trade_no);
  } else {
    // 支付失败或验签失败
    res.redirect('/payment/fail');
  }
});

// 刷新二维码
router.post('/refresh-qr/:orderNo', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { orderNo } = req.params;
    
    if (!db) {
      return res.json({
        success: true,
        data: { qrCode: 'https://example.com/qr/demo' + Date.now() }
      });
    }

    // 查询订单
    const orders = await db.query(
      'SELECT * FROM recharge_orders WHERE order_no = ? AND user_id = ? AND status = ?',
      [orderNo, req.user.userId, 'pending']
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在或已支付' });
    }

    const order = orders[0];

    // 重新创建支付订单
    const bizContent = {
      outTradeNo: order.order_no,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: order.amount.toString(),
      subject: order.package_name,
      body: `充值${order.package_name}`,
      passbackParams: encodeURIComponent(JSON.stringify({
        orderId: order.id,
        userId: req.user.userId
      }))
    };

    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
      returnUrl: process.env.ALIPAY_RETURN_URL,
      bizContent: bizContent
    });

    res.json({
      success: true,
      data: {
        qrCode: result,
        orderNo: order.order_no
      }
    });

  } catch (error) {
    console.error('刷新二维码失败:', error);
    next(error);
  }
});

// 查询订单支付状态
router.get('/status/:orderNo', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    
    if (!db) {
      return res.json({
        success: true,
        data: { status: 'paid', message: '演示模式' }
      });
    }

    const orders = await db.query(
      'SELECT id, order_no, status, paid_at, amount, points, package_name, duration, duration_unit FROM recharge_orders WHERE order_no = ? AND user_id = ?',
      [req.params.orderNo, req.user.userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }

    const order = orders[0];
    
    // 如果订单已支付，同时返回用户信息
    let userInfo = null;
    if (order.status === 'paid') {
      const [users] = await db.query(
        'SELECT points, membership_expire FROM users WHERE id = ?',
        [req.user.userId]
      );
      if (users && users.length > 0) {
        userInfo = users[0];
      }
    }

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.order_no,
        status: order.status,
        paidAt: order.paid_at,
        amount: order.amount,
        points: order.points,
        packageName: order.package_name,
        duration: order.duration,
        durationUnit: order.duration_unit,
        userInfo: userInfo
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
