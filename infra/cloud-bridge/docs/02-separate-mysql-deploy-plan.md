# Separate MySQL Deploy Plan

## Goal

Split future cloud deployment into:

1. frontend and program binaries
2. business database
3. user local files

## Business Data That Should Go To SQL

- users and auth
- orders and recharge
- VIP and durations
- points and referral rewards
- novels
- chapters

## Data That Should Stay Local To The User

- imported source files
- user uploads for local workflows
- app workspace files
- private generated artifacts

These should not be uploaded to cloud storage by default.

## Novel Rule

Novel data should keep two copies:

- cloud SQL copy for continuity
- local mirror copy for user ownership and safety

## Local To Cloud Path

Local now:

- backend adapter can run with SQLite
- export script already exists at:
  - `D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\scripts\export-sqlite-business-data.mjs`

Future cloud:

- backend switches to `DB_ADAPTER=mysql`
- MySQL becomes the business source of truth
- local user files still remain outside MySQL

## Recommended MySQL Env

Use `config/mysql.env.example` as the base template.

Core variables:

```env
DB_ADAPTER=mysql
DB_HOST=<mysql-host>
DB_PORT=3306
DB_USER=<mysql-user>
DB_PASSWORD=<mysql-password>
DB_NAME=chaowuqiong_db
```

## Recommended Migration Order

1. Finish the website writing center backend sync.
2. Keep user file storage local-only.
3. Export local SQLite business data.
4. Import into cloud MySQL with a dedicated importer.
5. Switch backend env from SQLite to MySQL.
6. Re-verify auth, orders, points, novels, chapters.

## Existing Reference

For the fuller architecture split, also read:

- `D:\网站部署\workspace-audit\2026-04-10-data-separation-plan.md`
