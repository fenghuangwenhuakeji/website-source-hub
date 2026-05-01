# 2026-04-14 `webuiapps` 深色默认 + 用户中心补齐 + 转换器修复

## 本地修改
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\FrontendAppConverter\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\FrontendAppConverter\index.module.scss`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\lib\themePreference.ts`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\styles\mobile.scss`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\App.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\MacOSDesktop\index.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\pages\LoginGate.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\pages\RechargeCenter.tsx`
- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\pages\ProfileCenter.tsx`

## 主要结果
- 修复 `FrontendAppConverter` 的 `Sparkles is not defined` 崩溃
- 将默认主题切到深色，减少白底黑字/黑底白字互相吞字的问题
- 新增 `/profile` 用户中心页，补齐手机号绑定、微信状态、实名收款与提现资料
- 转换器改成深色玻璃风，保留颜色卡与图标卡选择

## 构建
- `npm run build` 成功
- `BIZ_PROJECT_NAME=access VITE_APP_BASE='/access/' npm run build -- --outDir dist-access-20260414` 成功

## 上传产物
- `D:\网站部署\cloud-bridge\artifacts\fenghuang-unified-root-modern-20260414-0150.tar.gz`
- `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-modern-20260414-0150.tar.gz`

## 远端目标
- `/var/www/chaowuqiong/frontend`
- `/var/www/chaowuqiong/access`

## 验证
- `https://fhwhkj.top/` -> `301`
- `https://fhwhkj.top/home` -> `200`
- `https://fhwhkj.top/access/recharge` -> `200`
- `https://fhwhkj.top/access/profile` -> `200`
