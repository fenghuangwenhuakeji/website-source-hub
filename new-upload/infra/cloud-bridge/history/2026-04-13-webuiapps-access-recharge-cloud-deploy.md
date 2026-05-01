# 2026-04-13 `/access` 前台迁移部署记录

## 本次目标
- 将 `https://fhwhkj.top/access/recharge` 迁移到与主前台一致的新 `webuiapps` 版本
- 保持当前业务口径不变：用户仍需先充值积分，再兑换出有效时长后进入主程序
- 同步 `/access/profile`、充值套餐、积分兑换、用户中心等前台内容

## 本地产物
- 项目目录：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
- `/access` 专用构建目录：`dist-access`
- 上传归档：`D:\网站部署\cloud-bridge\artifacts\webuiapps-access-20260413-2300.tar.gz`

## 构建方式
在 `webuiapps` 目录执行：

```powershell
$env:BIZ_PROJECT_NAME='access'
$env:VITE_APP_BASE='/access/'
npm run build -- --outDir dist-access
```

## 云端部署
- 目标目录：`/var/www/chaowuqiong/access`
- 备份目录：`/var/www/chaowuqiong/access_backup_20260413-220216`
- 上传临时包：`/tmp/webuiapps-access-20260413-2300.tar.gz`

部署步骤：
1. 备份旧目录
2. 解压新包到 `/var/www/chaowuqiong/access`
3. 执行 `nginx -t`
4. 重载 Nginx

## 验证结果
- `https://fhwhkj.top/access/recharge` -> `HTTP/2 200`
- `https://fhwhkj.top/access/profile` -> `HTTP/2 200`
- 新主入口资源：`index-BqnaJ9Sf-v1776088655711.js`

## 说明
- 这次未改动后端逻辑
- 主程序进入条件保持不变，仍按“有效时长”判断
