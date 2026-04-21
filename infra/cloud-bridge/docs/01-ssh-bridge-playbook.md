# SSH Bridge Playbook

## Purpose

This document captures the exact bridge path that successfully connected and deployed to the cloud server, so the workflow can be reproduced later without relying on chat history.

## Server

- Host: `115.190.158.182`
- User: `root`
- Main site domain: `fhwhkj.top`

## Exact Working Chain

The successful non-interactive path was:

`PowerShell bridge -> run-ssh-command-via-clash.ps1 -> ssh.exe -> ssh-http-proxy.js -> Clash 127.0.0.1:7890 -> 115.190.158.182:22`

When using the managed local bridge, the full chain was:

`invoke-managed-powershell-command.ps1 -> C:\Users\8\.codex\ps-bridge\queue -> managed-powershell-bridge.ps1 -> results + transcript -> run-ssh-command-via-clash.ps1`

## Why It Worked

The key condition from the known-good run was:

- Clash `GLOBAL` was switched to `DIRECT`

This was explicitly observed in the earlier successful log from April 9, 2026.

## Current Entry Scripts

- `scripts/run-ssh-via-clash.ps1`
- `scripts/run-ssh-command-via-clash.ps1`
- `scripts/run-scp-via-clash.ps1`
- `scripts/deploy-chaowuqiong-cloud.ps1`

## Local Helper Scripts

- `scripts/set-clash-global.js`
- `scripts/ssh-http-proxy.js`

These are copied into this folder so the bridge is easier to carry forward. The PowerShell scripts still fall back to `C:\Users\8\.codex\bin\...` if needed.

## Key Material

The scripts search keys in this order:

1. `cloud-bridge/secrets/fenghuangwenhua.pem`
2. `C:\Users\8\.codex\bin\fenghuangwenhua.pem`
3. `cloud-bridge/secrets/id_rsa_chaowuqiong`
4. `C:\Users\8\.codex\bin\id_rsa_chaowuqiong`

## Success Signal

A real successful connection looked like:

- current directory output was `/root`
- current user output was `root`
- remote hostname returned normally
- `uname -a` returned normally

That means a single remote command completed end to end.

## Failure Signal

Typical failure:

```text
Connection closed by 115.190.158.182 port 22
```

or the SSH handshake breaks during `kex_exchange_identification`.

When that happens, check these in order:

1. Clash is running.
2. Clash `GLOBAL` is really `DIRECT`.
3. `127.0.0.1:7890` is reachable.
4. The key file is still valid.
5. The server is accepting SSH from the current route.

## Minimal Repro Commands

Interactive shell:

```powershell
.\run-ssh-via-clash.ps1
```

Single remote command:

```powershell
.\run-ssh-command-via-clash.ps1 -RemoteCommand "pwd; whoami; hostname; uname -a"
```

Upload a file:

```powershell
.\run-scp-via-clash.ps1 -LocalPath "D:\path\to\file" -RemotePath "/tmp/file"
```
