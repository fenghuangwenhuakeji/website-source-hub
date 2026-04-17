# 2026-04-14 根站 + /access + 后台滚动与深色样式修复部署

## 本次目标
- 根站切回 `fenghuang-unified/dist`，去掉线上 `/ -> /home` 的 Nginx 强制跳转
- `/access` 上线最新用户中心与移动端滚动/深色样式修复
- 管理后台同步上线当前 `web-manage/dist`
- 用同一轮部署覆盖 `frontend`、`access`、`admin` 和 `default.conf`

## 本地构建
- 官网：
  - 目录：`D:\网站部署\fenghuang-unified`
  - 命令：`npm run build`
  - 产物：`dist`
- access：
  - 目录：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
  - 命令：`BIZ_PROJECT_NAME=access VITE_APP_BASE=/access/ npm run build -- --outDir dist-access-20260414-continue`
  - 产物：`dist-access-20260414-continue`
- admin：
  - 目录：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`
  - 命令：`npm run build`
  - 产物：`dist`

## 样式修复
- `authExperience.module.scss`
  - 深色表单标签、Alert 区和图标颜色进一步提亮
  - 用户中心/充值页的统计卡片改成更稳定的网格布局
  - 小卡片内容改为自顶向下排布，避免不同宽度下挤压失真
- `MacOSDesktop/index.module.scss`
  - 保留移动端 app 模式滚动层和 PC 端设置面板网格修复
- `FrontendAppConverter/index.tsx`
  - 保留 `SettingsIcon` 修复，避免统一应用管理 `Settings is not defined`

## 打包产物
- `D:\网站部署\cloud-bridge\artifacts\fenghuang-unified-root-20260414-073935.tar.gz`
- `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-20260414-073935.tar.gz`
- `D:\网站部署\cloud-bridge\artifacts\admin-dist-20260414-073935.tar.gz`

## 远端上传
- `/tmp/fenghuang-unified-root-20260414-073935.tar.gz`
- `/tmp/webuiapps-access-20260414-073935.tar.gz`
- `/tmp/admin-dist-20260414-073935.tar.gz`
- `/tmp/nginx-default-fhwhkj-ssl.conf`

## 云端替换
- 根站目录：`/var/www/chaowuqiong/frontend`
- access 目录：`/var/www/chaowuqiong/access`
- admin 目录：`/var/www/chaowuqiong/apps/web-manage/dist`
- nginx 配置：`/etc/nginx/conf.d/default.conf`
- 部署时间戳：`20260414-074150`

备份：
- `/var/www/chaowuqiong/frontend_backup_20260414-074150`
- `/var/www/chaowuqiong/access_backup_20260414-074150`
- `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260414-074150`
- `/etc/nginx/conf.d/default.conf.backup_20260414-074150`

## 验证结果
- `https://fhwhkj.top/` -> `HTTP/2 200`
- `https://fhwhkj.top/home` -> `HTTP/2 200`
- `https://fhwhkj.top/access/profile` -> `HTTP/2 200`
- `https://fhwhkj.top/admin/referrals` -> `HTTP/2 200`
- `https://fhwhkj.top/api/referral/rules` -> `200`

线上资源：
- 根站入口：`assets/index-Bozbh301.js`
- 根站首页分包：`/var/www/chaowuqiong/frontend/assets/HomePage-B0v4VE5j.js`
- access 入口：`assets/index-CK-mLE1e-v1776123485047.js`
- access 用户中心分包：`/var/www/chaowuqiong/access/assets/ProfileCenter-B8tVmleh-v1776123485047.js`
- admin 邀请页分包：`/var/www/chaowuqiong/apps/web-manage/dist/assets/referrals-DcE-4k-U.js`
