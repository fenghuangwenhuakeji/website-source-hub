# 2026-04-14 `/access` Starry Shell Deploy Log

## Scope

- Published only `/access`
- Left `/var/www/chaowuqiong/frontend` and backend untouched

## Local Package

- `D:\网站部署\cloud-bridge\staging\webuiapps-access-20260414-100940.tar.gz`

## Source Build

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\dist`

## Remote Backup

- `/var/www/chaowuqiong/access_backup_20260414-100940`

## Deployment Flow

1. `run-scp-via-clash.ps1` uploaded the tar.gz package to `/tmp/webuiapps-access-20260414-100940.tar.gz`
2. `run-ssh-command-via-clash.ps1` backed up `/var/www/chaowuqiong/access`
3. `tar -xzf` extracted the package into `/var/www/chaowuqiong/access`

## Verification

- `/access/profile` returned `200`
- `/access/recharge` returned `200`
- Active index chunk in remote `index.html`:
  - `/access/assets/index-khtem69I-v1776132468395.js`
- Remote `ProfileCenter` chunk:
  - `/var/www/chaowuqiong/access/assets/ProfileCenter-rRutGn94-v1776132468395.js`

## Notes

- This release was limited to the `/access` path only.
- No root site or admin deployment was performed.
