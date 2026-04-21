# 2026-04-13 凤煌官网根站 + /access + admin + backend 部署记录

## 本次目标

- 修复 `apps/backend/src/routes/wechatAuth.ts` 的旧类型错误
- 将真正官网 `fenghuang-unified` 切到云端根站
- 同步更新 `/access` 前台、`/admin` 后台和后端 `dist`

## 本地构建

- 官网项目：`D:\网站部署\fenghuang-unified`
  - `npm run build` 通过
  - 产物：`dist`
- 后端项目：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend`
  - `npm run build` 通过
  - 修复文件：`src/routes/wechatAuth.ts`
- 后台项目：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`
  - `npm run build` 通过
  - 产物：`dist`
- `/access` 前台：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
  - 通过 `BIZ_PROJECT_NAME=access` + `VITE_APP_BASE=/access/` 构建
  - 命令：`npm run build -- --outDir dist-access`

## 上传归档

- 官网根站包：
  - `D:\网站部署\cloud-bridge\artifacts\fenghuang-unified-root-20260413-230013.tar.gz`
- 后端包：
  - `D:\网站部署\cloud-bridge\artifacts\backend-dist-referral-diamond-20260413-225421.tar.gz`
- 后台包：
  - `D:\网站部署\cloud-bridge\artifacts\admin-dist-referral-diamond-20260413-225421.tar.gz`
- `/access` 包：
  - `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-referral-diamond-20260413-225421.tar.gz`

## 云端替换

- 官网根站目录：
  - 旧配置：`/var/www/fenghuang-website/fenghuang-website`
  - 新根站目录：`/var/www/chaowuqiong/frontend`
- `/access` 目录：
  - `/var/www/chaowuqiong/access`
- 后台目录：
  - `/var/www/chaowuqiong/apps/web-manage/dist`
- 后端目录：
  - `/var/www/chaowuqiong/apps/backend/dist`

## 备份

- 官网前台旧目录备份：
  - `/var/www/chaowuqiong/frontend_backup_20260413-231210`
- `/access` 备份：
  - `/var/www/chaowuqiong/access_backup_20260413-231210`
- 后台备份：
  - `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260413-231210`
- 后端备份：
  - `/var/www/chaowuqiong/apps/backend/dist_backup_20260413-231210`
- Nginx 配置备份：
  - `/etc/nginx/conf.d/default.conf.backup-20260413-231210`

## Nginx 调整

- 将 `default.conf` 中根站 `root` 从：
  - `/var/www/fenghuang-website/fenghuang-website`
- 切换为：
  - `/var/www/chaowuqiong/frontend`

## 验证结果

- 本机 HTTP：
  - `http://127.0.0.1/` -> `200`
  - `http://127.0.0.1/home/` -> `200`
  - `http://127.0.0.1/showcase` -> `200`
  - `http://127.0.0.1/access/recharge` -> `200`
  - `http://127.0.0.1/admin/` -> `200`
- 服务器本机 HTTPS：
  - `https://fhwhkj.top/` -> `HTTP/2 200`
  - `https://fhwhkj.top/access/recharge` -> `HTTP/2 200`
  - `https://fhwhkj.top/admin/` -> `HTTP/2 200`
- 官网主入口资源：
  - `index-BI5JWzv8.js`
  - `vendor-DUyiyyUD.js`
  - `index-TsE190ly.css`
- `/access` 主入口资源：
  - `index-9k7eZVdI-v1776091968745.js`
- 后台主入口资源：
  - `index-CUR5xNqS.js`
  - `vendor-antd-display-BiRQkXG9.js`

## 额外说明

- 真正官网首页路由由 `D:\网站部署\fenghuang-unified\src\App.tsx` 控制：
  - `/` -> 重定向到 `/home`
  - `/home` -> `HomePage`
- `D:\网站部署\fenghuang-unified\src\pages\index.ts` 是页面导出汇总，不是单独可部署页面
- 后端进程已执行：
  - `pm2 restart chaowuqiong-api --update-env`
