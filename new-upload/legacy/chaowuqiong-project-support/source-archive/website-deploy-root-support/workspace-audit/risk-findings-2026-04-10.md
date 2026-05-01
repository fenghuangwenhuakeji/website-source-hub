# 风险清单（2026-04-10）

## P1 已修复

### 1. `super_admin` 与前台权限判断不一致

- 后端：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\src\routes\auth.ts`
- 前端：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\lib\permissionManager.ts`
- 风险：
  - SQLite 默认超级管理员使用 `super_admin`
  - 用户前台原先只识别 `rootadmin`
  - 会导致超级管理员在前台主程序里权限判断、充值绕过或入口展示不一致
- 处理：
  - 已统一让前台权限层识别 `super_admin`
  - 已让 `/auth/check-recharge` 把 `super_admin` 当作管理员特权处理

### 2. 统一站点刷新 token 逻辑会错误覆盖 refresh token

- 文件：`D:\网站部署\fenghuang-unified\src\utils\api.ts`
- 风险：
  - 刷新接口当前只稳定返回新 `token`
  - 旧实现会直接写入 `newRefreshToken`，当其不存在时可能污染本地存储
- 处理：
  - 已改成仅在后端返回新 refresh token 时才覆盖
  - 同时兼容 `response.data.data` 与 `response.data`

### 3. 统一站点用户对象字段不一致

- 文件：`D:\网站部署\fenghuang-unified\src\store\auth.ts`
- 风险：
  - 后端登录返回 `userId`
  - 前端 store 接口原先要求 `id`
  - 后续如果某个页面按 `user.id` 取值，会出现空值或状态异常
- 处理：
  - 已在 store 层加入 user 归一化逻辑，把 `userId` 收口为 `id`

### 4. 写作中心本地存储缺少失败兜底

- 文件：`D:\网站部署\fenghuang-unified\src\utils\localWriting.ts`
- 风险：
  - `localStorage.getItem/setItem` 在受限浏览器、私密模式、容量打满时可能抛错
  - 会直接影响写作中心初始化与保存
- 处理：
  - 已补充 `safeWriteStorage`
  - 初始化读取失败时回退种子数据，不让页面崩掉

### 5. 主应用接口层对非 JSON / 非 2xx 响应不稳

- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\api.ts`
- 风险：
  - 原实现直接 `response.json()`
  - 后端返回 400/429/空响应/网关错误页时会抛异常并放大 UI 不稳定
- 处理：
  - 已改为先读文本、再尝试 JSON 解析
  - 非 2xx 时统一返回稳定错误对象

### 6. 激活码管理旧后端接口仍暴露

- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\src\routes\admin.ts`
- 风险：
  - 前端入口虽已移除，但旧 `/keys` 仍存在
  - 这正是历史 `GET /api/keys 500` 风险源之一
- 处理：
  - 已把旧 keys 路由整体失效化，统一返回 `410`

## P1 待继续处理

### 7. 统一站点 auth 页仍复用完整主布局

- 文件：
  - `D:\网站部署\fenghuang-unified\src\App.tsx`
  - `D:\网站部署\fenghuang-unified\src\layouts\MainLayout.tsx`
  - `D:\网站部署\fenghuang-unified\src\pages\LoginPage.tsx`
  - `D:\网站部署\fenghuang-unified\src\pages\RegisterPage.tsx`
- 风险：
  - 手机端登录注册页任务不聚焦
  - 顶栏 + Footer + 说明卡会把真正表单往下推

### 8. 统一站点移动端菜单能力不完整

- 文件：
  - `D:\网站部署\fenghuang-unified\src\components\Header.tsx`
  - `D:\网站部署\fenghuang-unified\src\styles\website-theme.css`
- 风险：
  - 手机端缺少完整登录态动作、主题切换、菜单滚动锁与遮罩
  - 短屏设备上可用性不足

### 9. 写作中心保存过于频繁

- 文件：`D:\网站部署\fenghuang-unified\src\components\writing\WritingWorkbench.tsx`
- 风险：
  - 当前是输入即整项目 `localStorage` 落盘
  - 长文本输入时会放大主线程卡顿和移动端输入延迟
- 建议：
  - 后续改成节流/防抖保存

### 10. 管理后台仍有旧功能页与静态数据页残留

- 文件：
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\recharge\index.tsx`
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage\src\pages\durations\index.tsx`
- 风险：
  - 旧演示页与正式套餐、订单体系可能不一致
  - 容易让后台出现“有页面但不是当前业务真相”的错觉

## P2 待观察

### 11. 统一站点 API 默认直连 `127.0.0.1:3000`

- 文件：`D:\网站部署\fenghuang-unified\src\utils\api.ts`
- 风险：
  - 本地开发可用
  - 正式部署若漏配 `VITE_API_BASE_URL`，会直接打到本机回环地址

### 12. 顶层目录存在大量历史压缩包与近重复项目

- 文件参考：`D:\网站部署\workspace-audit\structure-audit-2026-04-10.md`
- 风险：
  - 后续云部署、备份、回滚和接手维护时容易误选错误源目录
