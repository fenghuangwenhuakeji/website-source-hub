# 2026-04-14 User Center / Referral / Admin Deploy

## Scope

- backend: `apps/backend`
- access frontend: `apps/frontent/webuiapps` -> `dist-access`
- admin frontend: `apps/frontent/web-manage` -> `dist`
- release focus:
  - old `referral_settings` schema compatibility
  - user center微信提现约束
  - mobile user center cleanup
  - admin dashboard recent-users mobile labels fix

## Built Packages

- backend:
  - `D:\网站部署\cloud-bridge\artifacts\backend-dist-referral-center-20260414-010354.tar.gz`
  - hotfix:
    - `D:\网站部署\cloud-bridge\artifacts\backend-dist-referral-fix-20260414-011127.tar.gz`
- access:
  - `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-referral-center-20260414-010354.tar.gz`
- admin:
  - `D:\网站部署\cloud-bridge\artifacts\admin-dist-referral-center-20260414-010354.tar.gz`

## Remote Targets

- access:
  - `/var/www/chaowuqiong/access`
- admin:
  - `/var/www/chaowuqiong/apps/web-manage/dist`
- backend:
  - `/var/www/chaowuqiong/apps/backend/dist`

## Backups

- access:
  - `/var/www/chaowuqiong/access_backup_20260414-010354`
- admin:
  - `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260414-010354`
- backend:
  - `/var/www/chaowuqiong/apps/backend/dist_backup_20260414-010354`
  - hotfix backup:
    - `/var/www/chaowuqiong/apps/backend/dist_backup_20260414-011127`

## Key Changes

- backend:
  - added legacy-table `ALTER TABLE` compatibility for `referral_settings`
  - fixed MySQL `TEXT/LONGTEXT` default issue on `commission_rules`
  - backfilled `commission_rules` and `withdrawal_notice` with `COALESCE`
  - enforced微信提现 only and required bound `wechat_openid` for withdrawal submission
- access frontend:
  - removed user-center bottom mobile tab bar
  - changed payout form to微信-only copy and warnings
  - disabled withdrawal submit when WeChat is not bound
  - preserved SMS phone binding and password update
- admin frontend:
  - rewrote dashboard page with clean labels
  - fixed recent-users mobile card fields:
    - 手机
    - 积分
    - 累计付费
    - 会员
    - 状态
    - 注册时间

## Validation

- local build:
  - backend `npm run build` passed
  - access `npm run build -- --outDir dist-access` passed
  - admin `npm run build` passed
- remote HTTP:
  - `http://127.0.0.1/access/profile` -> `200`
  - `http://127.0.0.1/admin/` -> `200`
  - `http://127.0.0.1/api/referral/rules` -> `success: true`
  - `http://127.0.0.1/api/referral/stats` -> `401 Unauthorized`
  - `http://127.0.0.1/api/auth/profile` -> `401 Unauthorized`
- PM2:
  - `pm2 restart chaowuqiong-api --update-env` succeeded
  - no fresh referral 500 after hotfix restart

## Notes

- an intermediate deploy exposed `ER_BLOB_CANT_HAVE_DEFAULT` on `/api/referral/rules`
- resolved by redeploying backend hotfix package `backend-dist-referral-fix-20260414-011127.tar.gz`
