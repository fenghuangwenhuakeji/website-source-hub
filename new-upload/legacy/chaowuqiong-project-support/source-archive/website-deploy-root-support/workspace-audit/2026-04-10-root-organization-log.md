# 2026-04-10 Root Organization Log

## What Changed

Safe first-phase cleanup was applied at `D:\网站部署`.

New top-level folders created:

- `archives`
- `docs`
- `ops`
- `cloud-bridge`
- `codex-agents`

## Moved Items

- archives moved: `20` files
  - target: `D:\网站部署\archives\root-bundles`
- root notes moved: `7` files
  - target: `D:\网站部署\docs\root-notes`
- SQL files moved: `10` files
  - target: `D:\网站部署\ops\sql`
- Nginx config files moved: `5` files
  - target: `D:\网站部署\ops\nginx`
- cloud bridge operational files moved: `14` files
  - target: `D:\网站部署\cloud-bridge\scripts`
- cloud bridge secrets moved: `3` files
  - target: `D:\网站部署\cloud-bridge\secrets`

## Preserved

The following were intentionally not reorganized in this phase:

- active project repositories
- imported skill trees and agent libraries
- root `package.json` and lockfiles
- remaining loose utility scripts that still need a second-pass categorization

## Compatibility Layer

Root wrapper entries were restored for the main cloud scripts, so old commands still work from `D:\网站部署`.

## Next Cleanup Phase

If continued, the next safe pass should focus on:

1. categorizing remaining loose utility scripts into `ops`
2. separating generic local debug scripts from current production deployment scripts
3. moving stray secret or scratch files like `Brfj0114.txt` and `-`
