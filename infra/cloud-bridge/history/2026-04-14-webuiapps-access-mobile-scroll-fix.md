# 2026-04-14 `/access` 移动端统一应用滚动修复部署记录

## 目标
- 修复移动端统一应用接口、设置面板、智能体等页面无法上下滑动的问题
- 修复移动端统一应用壳层内信息被压缩折叠的问题
- 仅更新 `/access` 前台入口，先最小范围上线验证

## 本地修改
- 文件：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\src\components\MacOSDesktop\index.module.scss`
- 核心调整：
  - `mobileAppBody` 从 `overflow: hidden` 改为允许纵向滚动
  - `mobileAppBodyInner` 从固定 `height: 100%` 改为 `height: auto`
  - `mobileDesktopAppMode` 下的应用内容容器取消统一锁死高度，允许内容自然撑开

## 本地构建
- 目录：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
- 命令：

```powershell
$env:BIZ_PROJECT_NAME='access'
$env:VITE_APP_BASE='/access/'
npm run build -- --outDir dist-access
```

## 上传产物
- 归档：`D:\网站部署\cloud-bridge\artifacts\webuiapps-access-mobile-scroll-20260414-003026.tar.gz`
- 远端临时包：`/tmp/webuiapps-access-mobile-scroll-20260414-003026.tar.gz`

## 云端部署
- 目标目录：`/var/www/chaowuqiong/access`
- 备份目录：`/var/www/chaowuqiong/access_backup_20260414-003026`
- 发布动作：
  1. 备份当前 `/access`
  2. 解压新包到 `/var/www/chaowuqiong/access`
  3. 执行 `nginx -t`
  4. 执行 `systemctl reload nginx`

## 回验
- `https://fhwhkj.top/access/` -> `HTTP/2 200`
- `https://fhwhkj.top/access/recharge` -> `HTTP/2 200`
- 线上入口资源：
  - `/access/assets/index-CAgxLHkv-v1776097719335.js`
- 线上样式包校验：
  - `component-macosdesktop-BKXYSDd_-v1776097789520.css` 已包含 `overflow-y:auto`

## 说明
- 这次只处理移动端统一应用的滚动容器问题
- 后续如果还存在某个单独应用内部滚动异常，再按具体组件继续细修
