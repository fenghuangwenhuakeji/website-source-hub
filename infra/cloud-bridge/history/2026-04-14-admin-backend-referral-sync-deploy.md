# 2026-04-14 Admin + Backend Referral Sync Deploy

## Scope

- admin frontend: `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage`
- backend: `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend`

## Built Packages

- admin:
  - `D:\网站部署\cloud-bridge\artifacts\admin-dist-referral-sync-20260414-081900.tar.gz`
- backend:
  - `D:\网站部署\cloud-bridge\artifacts\backend-dist-referral-sync-20260414-081900.tar.gz`

## Local Build

- admin:
  - `npm run build` passed
- backend:
  - `npm run build` passed

## Remote Targets

- admin:
  - `/var/www/chaowuqiong/apps/web-manage/dist`
- backend:
  - `/var/www/chaowuqiong/apps/backend/dist`

## Backups

- admin:
  - `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260414-082115`
- backend:
  - `/var/www/chaowuqiong/apps/backend/dist_backup_20260414-082115`

## Remote Actions

- uploaded both tarballs to `/tmp`
- replaced admin dist and backend dist with freshly built packages
- ran `nginx -t`
- reloaded nginx
- ran `pm2 restart chaowuqiong-api --update-env`

## Validation

- `http://127.0.0.1/admin/` -> `200`
- admin active index chunk:
  - `assets/index-kg98S7wp.js`
- admin referrals chunk:
  - `referrals-DcE-4k-U.js`
- `http://127.0.0.1/api/referral/rules` -> `success: true`

## Notes

- PM2 restart completed successfully for `chaowuqiong-api`
- unrelated PM2 entries `fenghuang-admin` and `super-api` were already in `errored` state and were not touched in this deployment
