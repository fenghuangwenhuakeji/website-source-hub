# Cloud Bridge Hub

This folder centralizes the currently working cloud connection and deployment path for `D:\网站部署`.

## What Is In Here

- `scripts/`
  - SSH via Clash + HTTP CONNECT proxy
  - remote command execution
  - SCP upload
  - cloud deploy entry scripts
- `secrets/`
  - local SSH key material used by the bridge
- `config/`
  - reusable environment templates for server and MySQL separation
- `docs/`
  - bridge playbook
  - MySQL separation plan
- `history/`
  - successful connection and deployment records

## Current Known-Good Path

The stable path that was confirmed to work is:

1. Clash `GLOBAL` must be switched to `DIRECT`.
2. Use `run-ssh-via-clash.ps1` or `run-ssh-command-via-clash.ps1`.
3. These scripts call local `ssh.exe` through `ssh-http-proxy.js`.
4. The proxy script opens `127.0.0.1:7890` and sends an HTTP `CONNECT` to `115.190.158.182:22`.

## Root Compatibility

The root-level files below still work and now forward into this folder:

- `D:\网站部署\run-ssh-via-clash.ps1`
- `D:\网站部署\run-ssh-command-via-clash.ps1`
- `D:\网站部署\run-scp-via-clash.ps1`
- `D:\网站部署\deploy-chaowuqiong-cloud.ps1`
- `D:\网站部署\verify-deployment.ps1`
- `D:\网站部署\verify-deployment-v2.ps1`
- `D:\网站部署\upload-admin.ps1`

## First Files To Read

1. `docs/01-ssh-bridge-playbook.md`
2. `history/2026-04-09-cloud-deployment-log.md`
3. `docs/02-separate-mysql-deploy-plan.md`
