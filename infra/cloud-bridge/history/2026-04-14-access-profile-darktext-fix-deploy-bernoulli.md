# 2026-04-14 `/access` Deploy Log

## Scope

- Published only `/access`
- Left `/var/www/chaowuqiong/frontend` and backend untouched

## Local Package

- `D:\网站部署\cloud-bridge\staging\webuiapps-access-20260414-075738.tar.gz`

## Source Build

- `D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\dist-access-20260414-075738`

## Remote Backup

- `/var/www/chaowuqiong/access_backup_20260414-080205`

## Deployment Flow

1. `run-scp-via-clash.ps1` uploaded the tar.gz package to `/tmp/webuiapps-access-20260414-075738.tar.gz`
2. `run-ssh-command-via-clash.ps1` backed up `/var/www/chaowuqiong/access`
3. `tar -xzf` extracted the package into `/var/www/chaowuqiong/access`

## Verification

- `/access/profile` returned `200`
- `/access/recharge` returned `200`
- Active index chunk in remote `index.html`:
  - `index-CZ_z0r_V-v1776124659219.js`
- Remote `ProfileCenter` chunk:
  - `ProfileCenter-gkbsy1nd-v1776124659219.js`

## Notes

- This release was limited to the `/access` path only.
- No root site or admin deployment was performed.
