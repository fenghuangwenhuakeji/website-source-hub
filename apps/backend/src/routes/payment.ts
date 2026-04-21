import { Router, Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';
import {
  confirmLocalPayment,
  createPaymentCode,
  formatOrderStatus,
  getAlipayRemoteStatus,
  getOrderStatus,
  getPaymentConfig,
  getWechatRemoteStatus,
  handleAlipayCallback,
  handleWechatCallback,
} from '../services/payment/paymentService.js';

const router = Router();

function buildIssueResponse(order: {
  id: string;
  orderNo: string;
  amount: number;
  expireTime: Date | null;
}, qrCode: string) {
  return {
    orderId: order.id,
    orderNo: order.orderNo,
    qrCode,
    amount: order.amount,
    expireTime: order.expireTime || new Date(Date.now() + 30 * 60 * 1000),
  };
}

router.get('/config', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: getPaymentConfig(),
  });
});

router.get('/health', (_req: Request, res: Response) => {
  const wechatPayMissing: string[] = [];
  if (!config.wechat.mchId) wechatPayMissing.push('WECHAT_MCH_ID');
  if (!config.wechat.privateKey) wechatPayMissing.push('WECHAT_PAY_PRIVATE_KEY');
  if (!config.wechat.serialNo) wechatPayMissing.push('WECHAT_PAY_SERIAL_NO');
  if (!config.wechat.apiV3Key) wechatPayMissing.push('WECHAT_PAY_API_V3_KEY');
  if (!config.wechat.payPublicKey) wechatPayMissing.push('WECHAT_PAY_PUBLIC_KEY');
  if (!config.wechat.callbackUrl) wechatPayMissing.push('WECHAT_CALLBACK_URL');

  const alipayMissing: string[] = [];
  const alipayUsesCertMode = Boolean(
    config.alipay.appCert || config.alipay.rootCert || config.alipay.publicCert,
  );
  if (!config.alipay.appId) alipayMissing.push('ALIPAY_APP_ID');
  if (!config.alipay.privateKey) alipayMissing.push('ALIPAY_PRIVATE_KEY');
  if (alipayUsesCertMode) {
    if (!config.alipay.appCert) alipayMissing.push('ALIPAY_APP_CERT');
    if (!config.alipay.rootCert) alipayMissing.push('ALIPAY_ROOT_CERT');
    if (!config.alipay.publicCert) alipayMissing.push('ALIPAY_PUBLIC_CERT');
  } else if (!config.alipay.alipayPublicKey) {
    alipayMissing.push('ALIPAY_PUBLIC_KEY');
  }
  if (!config.alipay.callbackUrl) alipayMissing.push('ALIPAY_CALLBACK_URL');

  const wechatLoginMissing: string[] = [];
  if (!config.wechatLogin.appId) wechatLoginMissing.push('WECHAT_LOGIN_APPID');
  if (!config.wechatLogin.appSecret) wechatLoginMissing.push('WECHAT_LOGIN_APPSECRET');
  if (!config.wechatLogin.callbackDomain)
    wechatLoginMissing.push('WECHAT_LOGIN_CALLBACK_DOMAIN');

  const smsMissing: string[] = [];
  if (!config.volcengine.accessKeyId) smsMissing.push('VOLCENGINE_ACCESS_KEY_ID');
  if (!config.volcengine.secretKey) smsMissing.push('VOLCENGINE_SECRET_KEY');
  if (!config.volcengine.smsAccount) smsMissing.push('VOLCENGINE_SMS_ACCOUNT');
  if (!config.volcengine.smsSign) smsMissing.push('VOLCENGINE_SMS_SIGN');
  if (!config.volcengine.smsTemplateId) smsMissing.push('VOLCENGINE_SMS_TEMPLATE_ID');

  res.json({
    success: true,
    data: {
      wechatPay: {
        enabled: wechatPayMissing.length === 0,
        missing: wechatPayMissing,
      },
      alipay: {
        enabled: alipayMissing.length === 0,
        missing: alipayMissing,
        mode: alipayUsesCertMode ? 'cert' : 'key',
      },
      wechatLogin: {
        enabled: wechatLoginMissing.length === 0,
        missing: wechatLoginMissing,
      },
      sms: {
        enabled: smsMissing.length === 0,
        missing: smsMissing,
      },
    },
  });
});

router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderId, orderNo, payMethod, method } = req.body as {
      orderId?: string;
      orderNo?: string;
      payMethod?: string;
      method?: string;
    };
    const { order, issued } = await createPaymentCode({
      orderId,
      orderNo,
      payMethod: payMethod || method,
    });

    res.json({
      success: true,
      data: buildIssueResponse(order, issued.qrCode),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderStatus(req.params.orderNo);
    res.json({
      success: true,
      data: formatOrderStatus(order),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/query/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await getOrderStatus(req.params.orderNo);
    res.json({
      success: true,
      data: formatOrderStatus(order),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wechat/qr/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order, issued } = await createPaymentCode({
      orderId: req.params.orderId,
      payMethod: 'wechat',
    });

    res.json({
      success: true,
      data: buildIssueResponse(order, issued.qrCode),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alipay/qr/:orderId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order, issued } = await createPaymentCode({
      orderId: req.params.orderId,
      payMethod: 'alipay',
    });

    res.json({
      success: true,
      data: buildIssueResponse(order, issued.qrCode),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/wechat/query/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const remote = await getWechatRemoteStatus(req.params.orderNo);
    res.json({
      success: true,
      data: remote,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/alipay/query/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const remote = await getAlipayRemoteStatus(req.params.orderNo);
    res.json({
      success: true,
      data: remote,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/alipay/refresh-qr/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { order, issued } = await createPaymentCode({
      orderNo: req.params.orderNo,
      payMethod: 'alipay',
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        orderNo: order.orderNo,
        qrCode: issued.qrCode,
        payMethod: 'alipay',
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/mock-confirm/:orderNo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orderNo = req.params.orderNo;
    const payMethod = req.query.method;
    const confirm = req.query.confirm === '1';

    if (!confirm) {
      const confirmUrl =
        `/api/payment/mock-confirm/${encodeURIComponent(orderNo)}?confirm=1&method=${encodeURIComponent(String(payMethod || 'alipay'))}`;

      res.status(200).type('html').send(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>本地模拟支付</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .card { width: min(92vw, 360px); background: #fff; border-radius: 18px; padding: 28px 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0 0 18px; color: #475569; line-height: 1.6; }
      .meta { font-size: 13px; color: #64748b; margin-bottom: 18px; word-break: break-all; }
      .actions { display: flex; gap: 12px; }
      a { text-decoration: none; text-align: center; padding: 12px 14px; border-radius: 12px; font-weight: 600; }
      .primary { background: #1677ff; color: #fff; flex: 1; }
      .secondary { background: #eef2ff; color: #334155; flex: 1; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>本地模拟支付</h1>
      <p>这个页面不会自动完成支付。只有你手动点击“确认支付”后，主界面的支付状态才会变成已支付。</p>
      <div class="meta">订单号: ${orderNo}</div>
      <div class="actions">
        <a class="primary" href="${confirmUrl}">确认支付</a>
        <a class="secondary" href="javascript:window.close()">取消</a>
      </div>
    </div>
  </body>
</html>`);
      return;
    }

    await confirmLocalPayment({
      orderNo,
      payMethod,
    });

    res.status(200).type('html').send(`<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>支付已确认</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .card { width: min(92vw, 360px); background: #fff; border-radius: 18px; padding: 28px 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); text-align: center; }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0; color: #475569; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>支付已确认</h1>
      <p>本地模拟支付已经完成，你可以回到主窗口等待状态自动刷新。</p>
    </div>
  </body>
</html>`);
  } catch (error) {
    next(error);
  }
});

router.post('/wechat/callback', async (req: Request, res: Response) => {
  const result = await handleWechatCallback(req);

  if (result.end) {
    res.status(result.statusCode).end();
    return;
  }

  res.status(result.statusCode).json(
    result.json || {
      code: 'FAIL',
      message: 'Callback handling failed',
    }
  );
});

router.post('/alipay/callback', async (req: Request, res: Response) => {
  const result = await handleAlipayCallback(req.body as Record<string, any>);
  res.status(result.statusCode).send(result.text || 'fail');
});

export default router;
