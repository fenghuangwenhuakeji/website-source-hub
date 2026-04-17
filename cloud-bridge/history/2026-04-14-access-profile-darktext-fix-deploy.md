# 2026-04-14 Access Profile Darktext Fix Deploy

## Scope

- access frontend: `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps`

## Built Package

- artifact:
  - `D:\网站部署\cloud-bridge\artifacts\webuiapps-access-profile-darktext-20260414-075011.tar.gz`
- build outDir:
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\dist-access-20260414-075011`

## Release Highlights

- expanded dark theme overrides for `surfaceCard` and `infoAlert`
- forced white text and full opacity for:
  - alert message and description
  - form labels and helper text
  - tag text and icons
  - input prefix and suffix icons
  - disabled buttons in withdrawal and binding areas
- kept deployment scope limited to `/access`

## Remote Target

- `/var/www/chaowuqiong/access`

## Backup

- `/var/www/chaowuqiong/access_backup_20260414-080420`

## Validation

- `http://127.0.0.1/access/profile` -> `200`
- `http://127.0.0.1/access/recharge` -> `200`
- active entry:
  - `assets/index-DbC-oR4B-v1776124212192.js`
- active profile chunk:
  - `ProfileCenter-CjPeLQFL-v1776124212192.js`

## Notes

- local direct `curl.exe` to the public HTTPS URL returned a connection reset during header fetch, so final validation used server-local HTTP checks plus live file verification
- Sass deprecation warnings and large chunk warnings remain existing non-blocking build noise
