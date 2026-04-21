# Cloud Bridge Hub

This folder keeps the current bridge playbooks, helper scripts, and deployment history that were extracted from the original workspace.

## What Belongs Here

- `config/`: reusable bridge configuration templates
- `docs/`: active bridge and deployment playbooks
- `scripts/`: helper scripts for SSH, SCP, proxying, and verification
- `history/`: historical deployment records

## Important Context

- Historical records inside `history/` can still reference the original `D:\网站部署` paths because they document how the old workspace was operated.
- The normalized repository itself does not require `D:\网站部署` to build the website or the desktop main client.
- Treat this directory as operational reference material, not as part of the default application build chain.

## Read First

1. `docs/01-ssh-bridge-playbook.md`
2. `docs/02-separate-mysql-deploy-plan.md`
3. `history/2026-04-09-cloud-deployment-log.md`
