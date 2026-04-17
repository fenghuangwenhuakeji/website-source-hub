const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('SSH连接成功');
  
  const commands = `
cd /root/backup_20260324/apps/license-backend/src/routes

echo "=== 1. 检查当前 alipay.js 内容 ==="
head -20 alipay.js

echo ""
echo "=== 2. 检查 alipay-sdk 模块导出 ==="
cd /root/backup_20260324
node -e "const m = require('alipay-sdk'); console.log('Type:', typeof m); console.log('Keys:', Object.keys(m)); console.log('AlipaySdk type:', typeof m.AlipaySdk);" 2>&1

echo ""
echo "=== 3. 修复 alipay.js 导入 ==="
cat > alipay.js << 'ALIEOF'
const express = require('express');
const router = express.Router();

// 尝试不同的导入方式
let AlipaySdk;
try {
    const alipayModule = require('alipay-sdk');
    AlipaySdk = alipayModule.AlipaySdk || alipayModule.default || alipayModule;
} catch (e) {
    console.error('导入支付宝SDK失败:', e.message);
}

const { authMiddleware } = require('../middleware/auth');

// 初始化支付宝SDK
let alipaySdk = null;
try {
    if (AlipaySdk && process.env.ALIPAY_APP_ID && process.env.ALIPAY_PRIVATE_KEY) {
        alipaySdk = new AlipaySdk({
            appId: process.env.ALIPAY_APP_ID,
            privateKey: process.env.ALIPAY_PRIVATE_KEY,
            alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY,
            gateway: process.env.ALIPAY_GATEWAY_URL || 'https://openapi.alipay.com/gateway.do',
            signType: 'RSA2'
        });
        console.log('✅ 支付宝SDK初始化成功');
    } else {
        console.warn('⚠️ 支付宝SDK未初始化: 缺少配置或导入失败');
    }
} catch (error) {
    console.error('❌ 支付宝SDK初始化失败:', error.message);
}

// 创建支付宝支付订单
router.post('/create', authMiddleware, async (req, res, next) => {
  try {
    if (!alipaySdk) {
      return res.status(500).json({ success: false, message: '支付宝支付未配置' });
    }
    
    const db = req.app.locals.db;
    const { packageId, packageName, points, amount, duration, durationUnit } = req.body;
    
    // 生成订单号
    const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 创建订单记录
    const orderId = require('uuid').v4();
    
    if (db) {
      await db.query(
        'INSERT INTO orders (id, order_no, user_id, package_id, package_name, points, amount, duration, duration_unit, pay_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
        [orderId, orderNo, req.user.userId, packageId, packageName, points, amount, duration, durationUnit, 'alipay', 'pending']
      );
    }
    
    // 调用支付宝接口创建支付订单
    const bizContent = {
      outTradeNo: orderNo,
      productCode: 'FAST_INSTANT_TRADE_PAY',
      totalAmount: amount.toString(),
      subject: packageName,
      body: \`充值\${packageName}\`,
      passbackParams: encodeURIComponent(JSON.stringify({
        orderId: orderId,
        userId: req.user.userId
      }))
    };

    // 生成支付链接
    const result = await alipaySdk.exec('alipay.trade.page.pay', {
      notifyUrl: process.env.ALIPAY_NOTIFY_URL,
      returnUrl: process.env.ALIPAY_RETURN_URL,
      bizContent: bizContent
    });

    res.json({
      success: true,
      data: {
        orderNo: orderNo,
        qrCode: result,
        amount: amount
      }
    });
  } catch (error) {
    console.error('创建支付宝订单失败:', error);
    next(error);
  }
});

// 支付宝支付回调
router.post('/callback/alipay', async (req, res) => {
  try {
    if (!alipaySdk) {
      return res.status(500).send('支付宝支付未配置');
    }
    
    const { out_trade_no, trade_status, total_amount } = req.body;
    
    // 验证签名
    const signVerified = alipaySdk.checkNotifySign(req.body);
    
    if (signVerified && trade_status === 'TRADE_SUCCESS') {
      // 更新订单状态
      const db = req.app.locals.db;
      if (db) {
        await db.query(
          'UPDATE orders SET status = ?, paid_at = NOW(), trade_no = ? WHERE order_no = ?',
          ['paid', req.body.trade_no, out_trade_no]
        );
      }
      
      res.send('success');
    } else {
      res.send('fail');
    }
  } catch (error) {
    console.error('支付宝回调处理失败:', error);
    res.send('fail');
  }
});

// 查询订单支付状态
router.get('/status/:orderNo', authMiddleware, async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { orderNo } = req.params;
    
    if (!db) {
      return res.json({ success: true, data: { status: 'pending' } });
    }
    
    const orders = await db.query(
      'SELECT status FROM orders WHERE order_no = ? AND user_id = ?',
      [orderNo, req.user.userId]
    );
    
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: '订单不存在' });
    }
    
    res.json({
      success: true,
      data: {
        status: orders[0].status
      }
    });
  } catch (error) {
    console.error('查询订单状态失败:', error);
    next(error);
  }
});

module.exports = router;
ALIEOF

echo ""
echo "=== 4. 重启服务 ==="
cd /root/backup_20260324/apps/license-backend
pm2 restart license-backend

sleep 3

echo ""
echo "=== 5. 检查状态 ==="
pm2 status | grep license-backend
`;
  
  conn.exec(commands, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('\n命令执行完成，退出码: ' + code);
      conn.end();
    }).on('data', (data) => {
      console.log('' + data);
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data);
    });
  });
}).connect({
  host: '115.190.158.182',
  port: 22,
  username: 'root',
  password: 'Brfj0114'
});
