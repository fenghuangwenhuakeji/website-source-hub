# 2026-04-10 Debug 审计

## 范围

- `D:\网站部署\fenghuang-unified`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`

## 已确认并已修复

### 已修复 1. 写作中心循环更新

- 文件：`D:\网站部署\fenghuang-unified\src\pages\WritingPage.tsx`
- 问题：`onProjectChange` 每次渲染生成新函数，导致 `WritingWorkbench` 内部 `useEffect` 持续触发并反复写回路由参数。
- 结果：已改成稳定回调，并增加相同 `project` 不重复写回保护。

### 已修复 2. 统一站点 React Router future flag warning

- 文件：`D:\网站部署\fenghuang-unified\src\App.tsx`
- 结果：已打开
  - `v7_startTransition`
  - `v7_relativeSplatPath`

### 已修复 3. 备案外链图片报错

- 文件：`D:\网站部署\fenghuang-unified\src\components\Footer.tsx`
- 问题：公安备案图标走外链图片，网络不通时会报 `ERR_CONNECTION_CLOSED`
- 结果：已改为纯文字备案链接

### 已修复 4. 主应用充值页错误导入

- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\pages\RechargeCenter.tsx`
- 问题：错误引用 `../../api`
- 结果：已修正为正确路径并通过构建

## 当前仍需处理的高优先级问题

### P1. `web-manage` 仍存在 Antd 静态 `message` 调用

证据文件：

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\exchange-products\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\login\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\packages\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\recharge\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\referrals\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\users\index.tsx`

说明：

- 虽然 `App.tsx` 已用 `AntdApp` 包裹，但这些页面仍直接调用 `message.success/error/info`
- 这类静态 message 在动态主题下仍可能继续发出 context warning

建议：

1. 各页面改用 `const { message } = App.useApp()`
2. 不再直接从 `antd` 顶层静态调用 `message`

### P1. `web-manage` 仍未打开 React Router future flag

- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\App.tsx`
- 当前：`<BrowserRouter basename="/admin">`
- 建议：
  - 增加 `future={{ v7_startTransition: true, v7_relativeSplatPath: true }}`

### P1. `webuiapps` 仍有过时的 Spin `tip`

- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\App.tsx`
- 当前：`<Spin size="large" tip="加载中..." />`
- 建议：
  - 改为 `description`

## 中优先级风险

### P2. 写作中心本地存储同步写入过于频繁

- 文件：
  - `D:\网站部署\fenghuang-unified\src\components\writing\WritingWorkbench.tsx`
  - `D:\网站部署\fenghuang-unified\src\utils\localWriting.ts`
- 风险：
  - 高频输入时卡顿
  - 存储写满时没有明确用户提示

建议：

1. 加 debounce
2. 存储失败时给出显式错误提示
3. 考虑按项目分片存储

### P2. `webuiapps` 路由体系存在双实现痕迹

- 文件：
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\index.tsx`
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\Router\index.tsx`

说明：

- 两处都存在 Browser Router / RouterProvider 方案
- 不一定是当前 bug，但后续维护时容易出现“改了一套、另一套还在”的情况

建议：

1. 确认真正入口
2. 将历史 router 实现标记 legacy 或移除引用

## 低优先级说明

### 非项目源码问题

以下报错没有在当前源码内发现引用，基本可视为浏览器扩展、注入脚本或外部网络噪音：

- `px.effirst.com`
- `chat-sdk`
- `Unchecked runtime.lastError: can not use with devtools`

建议：

- 用无痕窗口或禁用扩展再复测

## 推荐执行顺序

1. 先修 `web-manage` 的 `message` 调用
2. 再给 `web-manage` 加 React Router future flag
3. 再收 `webuiapps` 的 `Spin description`
4. 最后做写作中心持久化节流

## 最小执行清单

### 第一批

- `web-manage/src/pages/exchange-products/index.tsx`
- `web-manage/src/pages/referrals/index.tsx`
- `web-manage/src/pages/login/index.tsx`
- `web-manage/src/pages/packages/index.tsx`
- `web-manage/src/pages/recharge/index.tsx`
- `web-manage/src/pages/users/index.tsx`

统一改成 `App.useApp()`

### 第二批

- `web-manage/src/App.tsx`
- `webuiapps/src/App.tsx`

分别收路由 future flag 与 `Spin` 新 API

### 第三批

- `fenghuang-unified/src/components/writing/WritingWorkbench.tsx`
- `fenghuang-unified/src/utils/localWriting.ts`

增加保存节流和存储异常提示
