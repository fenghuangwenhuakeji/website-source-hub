# 凤煌引擎双版本分叉 Spec

**日期:** 2026-05-15  
**基线工程:** `F:\长篇修改专用项目文件夹\长篇`  
**备份:** `F:\长篇修改专用项目文件夹\备份\长篇_双版本会员登录充值与开放API规划前_20260515_014353`  
**商业会员版源码:** `F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_商业会员版_20260515_014400`  
**开放 API 本地版源码:** `F:\长篇修改专用项目文件夹\版本源码\凤煌引擎_开放API本地版_20260515_014400`

## 1. 目标

把当前“创世纪引擎/创世旗舰版”分叉成两套独立源码：

1. **凤煌引擎商业会员版**
   - 公司主体：南京凤煌文化科技有限公司。
   - 登录体系：微信扫码登录、短信注册/登录。
   - 会员体系：服务端会员、套餐、额度、到期、用量账本。
   - 充值体系：微信支付、支付宝支付；必须使用服务端创建订单、异步回调、验签、幂等入账。
   - API 体系：去掉用户自行配置 API 的入口；所有模型 Key 保存在公司后端，前端只调用公司 AI 代理。
   - 法律文本：商业版用户协议、隐私政策、付费/退款/AI 输出责任边界。

2. **凤煌引擎开放 API 本地版**
   - 无登录、无注册、无会员、无充值、无激活码。
   - 不内置任何可用 API Key。
   - 用户自行配置 OpenAI 兼容协议、Anthropic 协议及其他主流厂商 API。
   - 主控模型、拆书模型、解析模型、图像等 API 池逻辑沿用当前软件。
   - 法律文本：开放版用户协议、隐私政策，重点说明本地存储和第三方 API 自行选择。

## 2. 当前机制基线

### 2.1 登录

文件：`assets/js/core/user-manager.js`

当前登录是浏览器本地账号：

- 用户列表保存在 `localStorage`。
- 密码只做 SHA-256，本地校验。
- 登录态是 `__genesis_current_user__`。
- `UserManager.key(baseKey)` 用于给不同本地账号隔离 `localStorage` 数据。

结论：

- 适合单机体验，不适合商业版鉴权。
- 商业版必须改为服务端签发会话，建议使用 HttpOnly Secure SameSite Cookie 加服务端 JWT/session。
- 开放版不需要登录，必须绕过这一层。

### 2.2 激活码/会员

文件：`assets/js/core/license-core.js`、`assets/js/core/membership.js`

当前卡密是前端 HMAC 校验：

- 卡密密钥片段在前端 `_kParts` 中。
- 卡密格式为 24 位，含类型、档位、日期偏移、序列号、签名。
- `Membership.activate(key)` 直接前端验证并写入本地会员记录。
- 每日 Token 额度也是本地记录。

结论：

- 前端卡密可被逆向和篡改，商业版必须废弃。
- 商业版额度、套餐、订单、支付状态必须以服务端数据库为准。
- 开放版不能保留升级、充值、激活入口。

### 2.3 模型/API

文件：`assets/js/core/ai.js`、`assets/js/modules_split/settings/settings_api_pool.js`

当前 API 池逻辑：

- API 配置存在 IndexedDB 的 `text_api_pool`、`parse_api_pool`、`fusion_api_pool`、`image_api_pool` 等 store。
- `AI.getActiveConfig(type)` 根据类型取主控/激活配置；解析、拆书可回退主控。
- `AI.buildRequest(config, prompt, stream)` 支持 OpenAI 兼容、Anthropic Claude、Gemini 等。
- `AI.generate()` 在存在 `Membership` 时先查额度，再浏览器直连第三方 API。

结论：

- 开放版应保留这套逻辑。
- 商业版必须替换为 `/api/ai/stream` 服务端代理，前端不允许输入或保存第三方 Key。

## 3. 商业会员版产品设计

### 3.1 前端边界

前端负责：

- 显示“凤煌引擎”和南京凤煌文化科技有限公司品牌。
- 提供微信登录按钮、短信验证码登录表单。
- 展示会员状态、套餐、充值入口。
- 调用 `/api/me` 获取账号与会员状态。
- 调用 `/api/pay/orders` 创建订单。
- 调用 `/api/ai/stream` 生成内容。
- 显示用户协议和隐私政策链接。

前端不负责：

- 不保存模型供应商 API Key。
- 不生成或验证卡密。
- 不直接相信“支付成功”页面事件。
- 不直接改写会员权益。

### 3.2 后端边界

后端负责：

- 身份认证：手机号、短信验证码、微信 openid/unionid 绑定。
- 会话管理：签发、续期、注销、风控。
- 会员权益：套餐、到期时间、每日额度、消耗账本。
- 支付订单：创建、查询、回调验签、幂等入账、退款记录。
- AI 代理：隐藏供应商 Key，统一鉴权、用量统计、失败回滚、成功扣费。
- 合规记录：协议版本、隐私政策版本、同意时间、支付前确认。

### 3.3 必要接口

身份：

- `POST /api/auth/sms/send`
  - 入参：`phone`、`purpose`。
  - 要求：手机号格式校验、图形验证码/滑块、IP/手机号频控、5 分钟有效。

- `POST /api/auth/sms/login`
  - 入参：`phone`、`code`、`agreeTermsVersion`、`agreePrivacyVersion`。
  - 出参：`token`、`user`、`membership`。
  - 要求：验证码最多尝试 5 次，成功后删除验证码。

- `GET /api/auth/wechat/oauth-url`
  - 入参：`redirect`。
  - 出参：微信开放平台 OAuth URL 和服务端保存的 `state`。

- `POST /api/auth/wechat/callback`
  - 入参：`code`、`state`。
  - 要求：校验 state，换取 access_token/openid/unionid，创建或绑定用户。

- `GET /api/me`
  - 要求：登录后返回用户、会员、今日剩余额度。

支付：

- `GET /api/pay/plans`
  - 返回套餐：套餐 ID、名称、价格、每日额度、有效期、退款规则摘要。

- `POST /api/pay/orders`
  - 入参：`packageId`、`channel`。
  - 要求：服务端创建 `out_trade_no`，记录金额、用户、套餐、渠道、状态。

- `GET /api/pay/orders/:id`
  - 用于前端轮询支付结果。

- `POST /api/pay/wechat/notify`
  - 要求：微信支付 APIv3 回调验签，解密 resource，校验商户号、金额、订单号，幂等入账。

- `POST /api/pay/alipay/notify`
  - 要求：支付宝异步通知验签，校验 app_id、seller_id、金额、订单号，幂等入账，返回 `success`。

AI：

- `POST /api/ai/stream`
  - 入参：`prompt`、`config`。
  - 要求：登录校验、会员可用校验、额度预估、调用模型、流式转发、成功扣费、失败不扣费。

合规：

- `GET /api/legal/current`
  - 返回当前用户协议、隐私政策版本。

- `POST /api/legal/consent`
  - 记录用户同意的协议版本、隐私版本、时间、IP、客户端信息。

- `POST /api/privacy/export`
  - 用户导出个人信息请求。

- `POST /api/privacy/delete`
  - 用户注销/删除个人信息请求；必须保留法律要求的订单与审计记录。

### 3.4 支付幂等规则

订单状态：

- `CREATED`
- `PAYING`
- `PAID`
- `CLOSED`
- `REFUNDED`
- `FAILED`

回调处理：

1. 先验签，不通过直接拒绝。
2. 查订单，不存在则记录异常，不发放权益。
3. 校验金额、币种、商户号、AppID、订单号。
4. 使用订单行锁或唯一事务锁。
5. 如果订单已 `PAID`，直接返回成功，不重复发放。
6. 如果订单未支付，写支付流水，再发放会员权益。
7. 支付平台可能重复通知，回调必须幂等。
8. 前端支付成功提示不能作为发放依据，只能依赖服务端订单状态。

## 4. 开放 API 本地版产品设计

### 4.1 前端边界

保留：

- 项目管理、执笔台、融合拆书、RAG、记忆、导出等现有创作功能。
- `settings_api_pool.js` 的 API 池配置。
- 主控、解析、拆书模型分别配置和回退逻辑。
- OpenAI 兼容和 Anthropic 协议。

移除/禁用：

- 登录弹窗。
- 用户中心。
- 会员/额度页中的充值和卡密。
- 顶部升级按钮。
- 激活码校验。
- 内置可用 API。

### 4.2 API 配置规则

开放版允许用户配置：

- OpenAI 兼容：`base_url + /chat/completions`、`Authorization: Bearer <key>`。
- Anthropic：`/v1/messages`、`x-api-key`、`anthropic-version`。
- Gemini：Google API Key 模式。
- Ollama：本地 OpenAI 兼容地址，可允许空 Key。
- DeepSeek、OpenRouter、Azure OpenAI 等。

隐私提示必须写清：

- API Key 保存在本机浏览器 IndexedDB 或 localStorage 中。
- 作品内容在用户主动调用模型时会发送给用户选择的第三方 API 服务商。
- 公司不托管、不转发、不审查开放版本地作品，除非用户主动使用公司后续提供的云服务。

## 5. 法律文本口径

用户提出“规避公司责任”，本 spec 改成合规口径：

- 可以明确责任边界。
- 可以在法律允许范围内限制间接损失、预期收益、第三方行为等责任。
- 不能写“公司不承担任何责任”“充值概不退款”“隐私泄露与公司无关”等违法或可能无效的格式条款。
- 必须保留消费者依法享有的权利。
- 必须说明 AI 输出仅为辅助创作，用户公开发布前应自行审查。
- 商业版必须说明公司会处理登录、支付、用量、AI 请求相关个人信息。
- 开放版必须说明本地软件不默认收集个人信息，但第三方 API 由用户自行选择并受第三方条款约束。

上线前必须由中国法域专业律师复核，尤其是：

- 用户协议。
- 隐私政策。
- 退款规则。
- 付费套餐说明。
- 未成年人条款。
- 投诉举报和侵权处理机制。

## 6. 合规参考

以下为写 spec 和文案时使用的一手/官方参考方向：

- 《中华人民共和国个人信息保护法》：个人信息处理规则、告知同意、敏感个人信息、个人权利、跨境提供。
- 《中华人民共和国消费者权益保护法》：格式条款不得排除或限制消费者权利、减轻或免除经营者责任。
- 《中华人民共和国电子商务法》：电子商务经营者、合同、支付、消费者权益。
- 《生成式人工智能服务管理暂行办法》：生成式 AI 服务提供者义务、内容安全、用户权益。
- 微信开放平台网站应用微信登录文档：OAuth 登录流程。
- 微信支付 APIv3 文档：支付通知验签和 resource 解密。
- 支付宝开放平台异步通知文档：`notify_url`、验签、返回 `success`。
- 阿里云短信服务文档：短信验证码发送、签名模板审核。

## 7. 当前落地版本说明

本次分叉落地采用“原模块不大改，版本脚本接管入口”的方式：

- 商业版新增 `assets/js/editions/fenghuang_commercial.js`。
  - 接管 App 初始化、登录、会员状态、充值入口和 AI.generate。
  - 隐藏 API 配置能力，统一走 `/api/ai/stream`。
  - 增加商业后端骨架 `server/`。

- 开放版新增 `assets/js/editions/fenghuang_open_local.js`。
  - 绕过登录、会员、激活码。
  - 保留设置页 API 池。
  - 顶部状态改为开放版说明。

该方式的优点：

- 不破坏原有功能文件。
- 便于未来把公共创作核心继续复用。
- 可以单独迭代两个版本。

后续正式产品化建议：

- 抽出 `ProductConfig`。
- 把 `App.init`、`AI.generate`、`Membership` 改为可注入服务。
- 把品牌文案从代码中抽到配置。
- 商业版后端从内存 store 替换为 PostgreSQL/MySQL，并增加 Redis 频控。
