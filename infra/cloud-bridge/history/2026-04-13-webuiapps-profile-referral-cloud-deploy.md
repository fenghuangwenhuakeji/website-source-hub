# 2026-04-13 前台用户中心/邀请提现 UI 云端桥接部署记录

## 本次目标

- 将 `apps/frontent/webuiapps` 最新前台包桥接部署到云端
- 上线用户中心、邀请增长、提现试算、钻石转积分、手机号绑定、实名收款资料 UI
- 同步充值页里的用户中心入口、账号总览和邀请提现摘要

## 本地构建

- 路径：`D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`
- 命令：`npm run build`
- 结果：通过

## 本次桥接文件

- 本地归档：
  - `D:\网站部署\cloud-bridge\artifacts\frontend-dist-profile-ui-20260413-212600.tar.gz`
- 远端归档：
  - `/tmp/frontend-dist-profile-ui-20260413-212600.tar.gz`

## 远端替换动作

- 解压到：
  - `/tmp/frontend-deploy-20260413-212715`
- 备份旧前台目录：
  - `/var/www/chaowuqiong/frontend_backup_20260413-212715`
- 替换线上目录：
  - `/var/www/chaowuqiong/frontend`
- 校验并重载：
  - `nginx -t`
  - `systemctl reload nginx`

## 线上验证

- 主站首页：
  - `https://fhwhkj.top/`
  - 返回：`HTTP/2 200`
- 用户中心路由：
  - `https://fhwhkj.top/profile`
  - 返回：`HTTP/2 200`
- 充值页路由：
  - `https://fhwhkj.top/recharge`
  - 返回：`HTTP/2 200`
- 当前线上主入口资源：
  - `index-Bf6INoM2-v1776086509874.js`
- 当前线上用户中心资源存在：
  - `assets/ProfileCenter-CZ9LUrhf-v1776086509874.js`

## 本次上线内容

- 用户中心：
  - `apps/frontent/webuiapps/src/pages/ProfileCenter.tsx`
- 充值页入口与账号总览：
  - `apps/frontent/webuiapps/src/pages/RechargeCenter.tsx`
- 前台接口补充：
  - `apps/frontent/webuiapps/src/api.ts`
- 路由接入：
  - `apps/frontent/webuiapps/src/routers/index.tsx`
- 登录页邀请码预填：
  - `apps/frontent/webuiapps/src/pages/LoginGate.tsx`

## 说明

- 这次只桥接了前台 `webuiapps`，未改动后端和管理后台线上包
- 桌面主程序本地 `dist` 已在同一轮同步并重新打包，但桌面包发布记录单独管理
