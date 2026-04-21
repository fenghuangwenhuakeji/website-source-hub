# 2026-04-13 支付链路跟进记录

## 已确认修复

- 支付宝已切换到最新证书模式：
  - `alipayCertPublicKey_RSA2.crt`
  - `alipayRootCert.crt`
  - `appCertPublicKey_2021006143648824.crt`
- 后端已经兼容支付宝 SDK 返回的 `qrCode` 驼峰字段。
- 实测支付宝已经能生成二维码并进入待支付环节。

## 微信支付当前状态

- 云端配置已补齐并生效：
  - `WECHAT_MCH_ID=1739644242`
  - `WECHAT_PAY_PRIVATE_KEY=file:/var/www/keys/apiclient_key.pem`
  - `WECHAT_PAY_SERIAL_NO=2514C5845BA13C5D29AA347FE91E238A120E1CB2`
  - `WECHAT_PAY_PUBLIC_KEY=file:/var/www/keys/wechatpay_pubkey.pem`
  - `WECHAT_PAY_PUBLIC_KEY_ID=PUB_KEY_ID_0117396442422026032000382197000200`
  - `WECHAT_PAY_API_V3_KEY` 已配置
- 云端文件与本地文件 SHA256 一致：
  - `apiclient_key.pem`
  - `apiclient_cert.pem`
- 本地验证 `apiclient_key.pem` 与 `apiclient_cert.pem` 为同一对 RSA 密钥。
- 服务端时间已同步，非时间戳漂移问题。

## 关键排查结论

- 直接用后端代码发起微信查询请求，微信返回：
  - `401`
  - `{"code":"SIGN_ERROR","message":"签名信息错误，验签失败"}`
- 直接绕过业务代码，改用远端 `openssl` 对同一报文签名，再通过 Python 发起请求，微信仍返回同样的：
  - `401`
  - `SIGN_ERROR`

这说明：

- 当前问题已经不是 Node 签名实现问题。
- 当前问题也不是云端上传文件损坏问题。
- 当前问题大概率是微信商户平台侧对这套商户 API 证书身份未正确认可，或平台当前有效证书与本地拿到的这套证书并不一致。

## 代码侧已补的规范修正

- 微信 `Authorization` 头已经修正为标准格式：
  - `WECHATPAY2-SHA256-RSA2048 mchid="..."`
  - 中间是空格，不是逗号

文件：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\src\services\payment\providers\wechatProvider.ts`

## 下一步建议

1. 到微信商户平台重新确认“当前生效中的商户 API 证书序列号”是否确实为：
   - `2514C5845BA13C5D29AA347FE91E238A120E1CB2`
2. 若后台显示的仍是旧序列号，则重新申请并下载新的商户 API 证书，再替换云端：
   - `apiclient_cert.pem`
   - `apiclient_key.pem`
3. 若后台显示就是该序列号，但仍返回 `SIGN_ERROR`，优先在商户平台重新申请一套全新的商户 API 证书后再测试。
