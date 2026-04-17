# 2026-04-14 `webuiapps` UI 现代化 + 双入口发布记录

## 目标
- 将 `FrontendAppConverter` 的“统一应用接口”从抽象文字选择改成更直观的颜色卡 + 图标卡
- 继续强化移动端的现代星空感、玻璃感和统一底层变量
- 将根站与 `/access` 一并重新打包并上线

## 本地修改
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\FrontendAppConverter\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\FrontendAppConverter\index.module.scss`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\styles\mobile.scss`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\MobileTabBar\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\MobileTabBar\index.module.scss`

## 视觉方向
- 深夜蓝黑底 + 星空渐变背景
- 玻璃拟态卡片
- 霓虹高亮按钮
- 颜色卡、图标卡、应用预览徽章都改为更具体的视觉表达
- 移动端底层变量统一到更稳定的暗色星空体系

## 构建
- 根站构建：`npm run build`
- `/access` 构建：`BIZ_PROJECT_NAME=access VITE_APP_BASE=/access/ npm run build -- --outDir dist-access`

## 产物
- `D:\网站部署\cloud-bridge\artifacts\fenghuang-unified-root-modern-20260414-005421.tar.gz`
- `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-modern-20260414-005421.tar.gz`

## 上线目录
- 根站：`/var/www/chaowuqiong/frontend`
- `/access`：`/var/www/chaowuqiong/access`

## 结果
- `https://fhwhkj.top/` -> `301` 到 `https://fhwhkj.top/home`
- `https://fhwhkj.top/home` -> `200`
- `https://fhwhkj.top/access/recharge` -> `200`
- `https://fhwhkj.top/access/profile` -> `200`

