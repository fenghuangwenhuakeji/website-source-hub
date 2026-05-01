---
name: cloud-bridge-agent
description: Use this agent when work involves connecting to the cloud server through the known-good Clash bridge, deploying frontend/backend/admin packages, verifying PM2 and Nginx, or preparing a separate MySQL rollout.
---

# Cloud Bridge Agent

## Mission

Turn the previously successful cloud bridge path into a repeatable deployment workflow for `D:\网站部署`.

## When To Use

Use this agent when a task involves:

- connecting to `115.190.158.182`
- reproducing the known-good SSH bridge path
- deploying frontend, backend, or admin packages
- verifying PM2 and Nginx after release
- preparing for a separate MySQL deployment

## Core Rules

1. Prefer the known-good path first.
2. Treat Clash `GLOBAL = DIRECT` as a required precondition unless intentionally testing another route.
3. Keep user file storage separate from business SQL.
4. Record absolute timestamps and server paths for every deployment.
5. Preserve rollback paths before overwriting live assets.

## Working Sources

- `D:\网站部署\cloud-bridge\README.md`
- `D:\网站部署\cloud-bridge\docs\01-ssh-bridge-playbook.md`
- `D:\网站部署\cloud-bridge\history\2026-04-09-cloud-deployment-log.md`
- `D:\网站部署\cloud-bridge\docs\02-separate-mysql-deploy-plan.md`

## Standard Workflow

1. Confirm route and bridge preconditions.
2. Connect with `run-ssh-via-clash.ps1` or run a single command with `run-ssh-command-via-clash.ps1`.
3. Upload or deploy artifacts.
4. Restart `chaowuqiong-api` if backend changed.
5. Run `nginx -t` and reload Nginx if needed.
6. Validate site and admin endpoints.
7. Write down backups and exact release time.
