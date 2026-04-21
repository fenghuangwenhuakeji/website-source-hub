# 2026-04-14 `/access` + Backend Session Persistence Deploy

## Scope

- Published `/access`
- Published backend `dist`
- Updated backend session lifetime env on cloud server

## Local Builds

- access frontend:
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\dist-access-20260414-100951`
- backend:
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\dist`

## Uploaded Packages

- access:
  - `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-20260414-100951.tar.gz`
- backend:
  - `D:\网站部署\cloud-bridge\artifacts\backend-dist-auth-session-20260414-100951.tar.gz`

## Remote Targets

- access:
  - `/var/www/chaowuqiong/access`
- backend dist:
  - `/var/www/chaowuqiong/apps/backend/dist`
- backend env:
  - `/var/www/chaowuqiong/apps/backend/.env`

## Backups

- access:
  - `/var/www/chaowuqiong/access_backup_20260414-100951`
- backend dist:
  - `/var/www/chaowuqiong/apps/backend/dist_backup_20260414-100951`

## Remote Actions

1. Uploaded both tarballs to `/tmp`
2. Replaced `/var/www/chaowuqiong/access`
3. Replaced `/var/www/chaowuqiong/apps/backend/dist`
4. Updated backend env:
   - `REFRESH_TOKEN_EXPIRES_IN=365d`
5. Ran:
   - `nginx -t`
   - `systemctl reload nginx`
   - `pm2 restart chaowuqiong-api --update-env`

## Validation

- `http://127.0.0.1/access/profile` -> `200`
- `http://127.0.0.1/access/recharge` -> `200`
- active access index chunk:
  - `assets/index-SclYf5DG-v1776132635869.js`
- active access profile chunk:
  - `ProfileCenter-BgSl7w77-v1776132635869.js`
- backend env:
  - `JWT_EXPIRES_IN=24h`
  - `REFRESH_TOKEN_EXPIRES_IN=365d`
- PM2:
  - `chaowuqiong-api` status `online`
  - script path `/var/www/chaowuqiong/apps/backend/dist/app.js`

## Notes

- This deploy included the refresh-token rotation backend response and the frontend session refresh helpers.
- External curl from the local machine hit a connection reset during verification, so final validation was performed from the server itself.
