# 2026-04-09 Cloud Deployment Log

## SSH Confirmation

- On `2026-04-09 22:14:33`, server logs confirmed one successful public-key login from `100.70.195.73`.
- The known-good route used Clash `GLOBAL = DIRECT`.

## Main Release

Release timestamp:

- `20260409-223316`

Published to:

- `/var/www/chaowuqiong/apps/backend/dist`
- `/var/www/chaowuqiong/frontend`
- `/var/www/chaowuqiong/apps/web-manage/dist`

Validation passed:

- `chaowuqiong-api` restarted and was online
- `nginx -t` passed
- `http://127.0.0.1/` returned `200 OK`
- `http://127.0.0.1/admin/` returned `200 OK`

Backups:

- `/var/www/chaowuqiong/apps/backend/dist_backup_20260409-223316`
- `/var/www/chaowuqiong/frontend_backup_20260409-223316`
- `/var/www/chaowuqiong/apps/web-manage/dist_backup_20260409-223316`

Known untouched PM2 errors at that time:

- `fenghuang-admin`
- `super-api`

## Frontend Hotfix

Hotfix time:

- `2026-04-09 22:45`

Hotfix details:

- only frontend was replaced
- target path: `/var/www/chaowuqiong/frontend`
- fix was for the Vite split-chunk circular dependency issue that caused the `useState` runtime error

Validation:

- `http://127.0.0.1/` returned `200 OK`
- `http://fhwhkj.top/` returned new asset names including new `index` and `vendor-react` bundles

Hotfix backup:

- `/var/www/chaowuqiong/frontend_backup_20260409-224552`
