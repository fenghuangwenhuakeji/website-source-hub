# 2026-04-14 Access User Center WeChat Bind Deploy

## Scope

- backend: `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend`
- access frontend: `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`

## Built Packages

- backend:
  - `D:\网站部署\cloud-bridge\artifacts\backend-dist-wechat-bind-20260414-015146.tar.gz`
- access:
  - `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-user-center-20260414-015146.tar.gz`

## Local Build

- backend:
  - `npm run build` passed
- access:
  - `npm run build -- --outDir dist-access-20260414-profilecenter` passed
- note:
  - default `dist-access` output directory was locked on Windows, so the release build used a temporary outdir

## Release Highlights

- backend:
  - added `/api/wechat/bind-qrcode` for binding the current logged-in user to WeChat
  - extended `/api/wechat/callback`, `/api/wechat/status/:state`, and local mock flow to support `bind` mode
- access frontend:
  - rebuilt `ProfileCenter` as a scrollable route page
  - added phone binding by SMS
  - added WeChat binding entry with QR polling
  - enforced WeChat-only withdrawal UX
  - added referral overview, withdrawal preview, recent invite records, and recent withdrawal records
- shared frontend API:
  - restored `wechatStatus` and `sendSmsCode`
  - added `wechat.getBindQrcode`

## Remote Targets

- backend:
  - `/var/www/chaowuqiong/apps/backend/dist`
- access:
  - `/var/www/chaowuqiong/access`

## Backups

- backend:
  - `/var/www/chaowuqiong/apps/backend/dist_backup_20260414-015146`
- access:
  - `/var/www/chaowuqiong/access_backup_20260414-015146`

## Validation

- `http://127.0.0.1/access/profile` -> `200`
- `http://127.0.0.1/api/referral/rules` -> `200`
- `http://127.0.0.1/api/wechat/bind-qrcode` -> `401` without auth, expected
- `pm2 restart chaowuqiong-api --update-env` succeeded

## Notes

- old log noise about `commission_rules` came from earlier process history; post-deploy live checks returned healthy responses
