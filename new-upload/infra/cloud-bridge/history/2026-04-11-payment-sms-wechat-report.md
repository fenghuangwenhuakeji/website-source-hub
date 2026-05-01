# 2026-04-11 凤煌云端支付 / 短信 / 微信登录问题汇总

## 范围

- 域名: `https://fhwhkj.top`
- 服务器: `115.190.158.182`
- 后端进程: `pm2 -> chaowuqiong-api`
- 后端工作目录: `/var/www/chaowuqiong/apps/backend`
- 核对时间: `2026-04-11 03:xx (UTC+8)`

## 当前结论

这轮前端页面本身已经能正常访问，登录入口 `/access/login?forceLogin=1` 也已经能直达云端页面。

当前剩余问题全部集中在云端后端配置层，不是前端路由问题：

1. 支付宝支付会创建订单，但 `POST /api/payment/create` 在拉起支付宝二维码时返回 `500`，根因是支付宝网关返回 `Invalid Arguments`。
2. 微信支付同样在 `POST /api/payment/create` 时返回 `500`，根因是微信支付必需字段缺失，后端明确报 `WeChat Pay is not fully configured`。
3. 微信扫码登录能生成登录流程，但在回调换 token 时失败，根因是 `WECHAT_LOGIN_APPSECRET` 不是微信开放平台原始 `AppSecret`。
4. 短信验证码接口 `POST /api/sms/send-code` 返回 `500`，根因是 `VOLCENGINE_SMS_ACCOUNT` 填成了错误类型，当前值看起来是账号 ID，不是火山短信控制台里的 `SmsAccount` 消息组 ID。

## 已确认的云端日志

来自 `pm2 logs chaowuqiong-api` 与 `/root/.pm2/logs/chaowuqiong-api-error.log` 的已确认结果：

- 启动摘要:
  - `WeChat pay config: configured`
  - `WeChat login config: invalid-secret-format`
  - `Alipay config: configured`

说明:
- 启动摘要里的“configured”只代表“有值”，不代表值一定正确可用。
- 真正决定是否能下单/回调的，是支付服务运行时校验和第三方网关响应。

### 支付宝错误

错误日志多次出现:

- 路径: `POST /api/payment/create`
- 报错: `Invalid Arguments`
- 堆栈落点:
  - `src/services/payment/providers/alipayProvider.ts:47`
  - `src/services/payment/paymentService.ts:79`
  - `src/routes/payment.ts:46`

这说明:
- 订单已经创建成功
- 前端传参也已经进入支付路由
- 真正失败点在 `alipay.trade.precreate`
- 当前不是前端参数缺失，而是支付宝网关拒绝当前应用配置或签名参数组合

结合此前已经确认过的情况，这一项大概率仍然是以下之一:

1. 支付宝开放平台里的应用公钥没有和当前私钥配套
2. 平台上配置的公钥不是这把私钥对应的公钥
3. 部分支付产品能力或参数仍未开通/未匹配

## 微信支付错误

错误日志多次出现:

- 路径: `POST /api/payment/create`
- 报错: `WeChat Pay is not fully configured`
- 堆栈落点:
  - `src/services/payment/common.ts:98`
  - `src/services/payment/providers/wechatProvider.ts:168`

后端运行时代码要求微信支付必须同时具备这些字段:

- `WECHAT_MCH_ID`
- `WECHAT_PAY_PRIVATE_KEY`
- `WECHAT_PAY_SERIAL_NO`
- `WECHAT_PAY_API_V3_KEY`
- `WECHAT_PAY_PUBLIC_KEY`
- `WECHAT_CALLBACK_URL`

而云端当前掩码检查结果是:

- `WECHAT_APPID=SET`
- `WECHAT_MCH_ID=SET`
- `WECHAT_API_KEY=SET`
- `WECHAT_CALLBACK_URL=SET`
- `WECHAT_PAY_APPID=MISSING`
- `WECHAT_PAY_API_V3_KEY=MISSING`
- `WECHAT_PAY_SERIAL_NO=MISSING`
- `WECHAT_PAY_PRIVATE_KEY=MISSING`
- `WECHAT_PAY_PUBLIC_KEY=MISSING`
- `WECHAT_PAY_PUBLIC_KEY_ID=MISSING`

结论:
- 微信支付现在不是“值不对”，而是“关键字段没填全”
- 所以当前一定无法生成微信支付二维码

## 微信扫码登录错误

错误日志已确认:

- 路径: `GET /api/wechat/callback`
- 报错: `WeChat login config is invalid: WECHAT_LOGIN_APPSECRET must be the plain AppSecret from WeChat Open Platform.`
- 堆栈落点:
  - `src/routes/wechatAuth.ts:65`

后端代码里的校验规则是:

- `WECHAT_LOGIN_APPSECRET` 必须匹配 32 位字母数字串

而云端当前掩码检查结果:

- `WECHAT_LOGIN_APPID=SET`
- `WECHAT_LOGIN_CALLBACK_DOMAIN=SET`
- `WECHAT_LOGIN_APPSECRET=SET len=44`

结论:
- 现在云端填进去的不是微信开放平台原始 `AppSecret`
- 很像是被填成了 Base64、带额外包装的字符串，或根本填错了别的密钥
- 所以扫码后会卡在回调换 token 这一步

## 短信验证码错误

前端现象:

- `POST /api/sms/send-code 500`
- 页面提示:
  - `SMS provider config is invalid: VOLCENGINE_SMS_ACCOUNT must be the SmsAccount message group ID from Volcengine SMS, not an account ID.`

后端代码在 `src/utils/sms.ts` 里已经做了明确的错误归一化。

云端当前掩码检查结果:

- `VOLCENGINE_ACCESS_KEY_ID=SET`
- `VOLCENGINE_SECRET_KEY=SET`
- `VOLCENGINE_SMS_ACCOUNT=SET len=10 sample=2120060161`
- `VOLCENGINE_SMS_SIGN=SET`
- `VOLCENGINE_SMS_TEMPLATE_ID=SET`

结论:
- AccessKey / SecretKey 已填
- 短信签名和模板看起来也有值
- 当前最大问题是 `VOLCENGINE_SMS_ACCOUNT`
- 这个字段现在大概率填成了“账户 ID / 账号编号”
- 正确应填火山短信控制台里的 `SmsAccount` 消息组 ID

## 云端当前配置掩码摘要

### 微信支付

- `WECHAT_APPID=SET len=18`
- `WECHAT_MCH_ID=SET len=10`
- `WECHAT_API_KEY=SET len=32`
- `WECHAT_CALLBACK_URL=SET len=46`
- `WECHAT_PAY_APPID=MISSING`
- `WECHAT_PAY_API_V3_KEY=MISSING`
- `WECHAT_PAY_SERIAL_NO=MISSING`
- `WECHAT_PAY_PRIVATE_KEY=MISSING`
- `WECHAT_PAY_PUBLIC_KEY=MISSING`
- `WECHAT_PAY_PUBLIC_KEY_ID=MISSING`

### 微信登录

- `WECHAT_LOGIN_APPID=SET len=18`
- `WECHAT_LOGIN_APPSECRET=SET len=44`
- `WECHAT_LOGIN_CALLBACK_DOMAIN=SET len=10`

### 支付宝

- `ALIPAY_APP_ID=SET len=16`
- `ALIPAY_PRIVATE_KEY=SET len=1624`
- `ALIPAY_PUBLIC_KEY=SET len=392`
- `ALIPAY_CALLBACK_URL=SET len=46`

### 火山短信

- `VOLCENGINE_ACCESS_KEY_ID=SET len=47`
- `VOLCENGINE_SECRET_KEY=SET len=60`
- `VOLCENGINE_SMS_ACCOUNT=SET len=10`
- `VOLCENGINE_SMS_SIGN=SET len=12`
- `VOLCENGINE_SMS_TEMPLATE_ID=SET len=12`

## 代码层对应位置

- 短信校验: [sms.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/utils/sms.ts)
- 微信登录校验: [wechatAuth.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/routes/wechatAuth.ts)
- 支付路由入口: [payment.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/routes/payment.ts)
- 支付运行时校验: [common.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/services/payment/common.ts)
- 支付主流程: [paymentService.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/services/payment/paymentService.ts)
- 支付宝下单: [alipayProvider.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/services/payment/providers/alipayProvider.ts)
- 微信支付下单: [wechatProvider.ts](/D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend/src/services/payment/providers/wechatProvider.ts)

## 白天处理时的优先顺序

建议按这个顺序改，收益最高：

1. 先修 `VOLCENGINE_SMS_ACCOUNT`
   - 因为只要改对消息组 ID，短信登录最容易最快恢复
2. 再修 `WECHAT_LOGIN_APPSECRET`
   - 替换成微信开放平台扫码登录应用的原始 `AppSecret`
3. 再补齐微信支付缺失字段
   - 至少要补全 `APIv3 Key / 商户证书序列号 / 商户私钥 / 微信支付平台公钥 / 平台公钥ID`
4. 最后处理支付宝
   - 因为支付宝现在不是缺字段，而是网关级参数/签名不认可，排查要比前两项更细

## 现在不需要再怀疑的点

- 不是前端页面打不开
- 不是 `/access/login` 路由跳错
- 不是云端 Nginx 没通
- 不是订单创建入口没走到后端

这几项已经确认是通的。

## 一句话总结

当前线上阻塞点已经非常明确：

- 短信: `SmsAccount` 填错类型
- 微信登录: `AppSecret` 填错格式
- 微信支付: 关键支付证书字段没填
- 支付宝: 已有配置但网关仍返回 `Invalid Arguments`，需要白天按开放平台实际配置继续对表
