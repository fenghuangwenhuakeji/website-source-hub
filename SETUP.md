# SETUP

This guide is the canonical onboarding path for building the normalized repository on `Win-Workstation`.

## Environment

Use the following baseline on Windows:

- Node.js `20.x`
- npm `10.x`
- Git
- PowerShell

The reference acceptance environment is:

- machine: `Win-Workstation`
- workspace root: `F:\work`

## Clone Location

```powershell
cd F:\work
git clone https://github.com/Nike232/website-source-hub.git
cd .\website-source-hub
```

## Repository Map

```text
apps/
  website/         official website
  client-web/      main user-facing web client
  admin-web/       admin dashboard
  backend/         backend service
  client-desktop/  Electron shell for client-web/dist
packages/
  shared/          shared types and utilities
infra/
  cloud-bridge/    bridge docs and scripts
docs/
  chaowuqiong-project/ historical project docs
legacy/
  desktop-experiments/
  chaowuqiong-project-support/
```

## Install Commands

Install only what you need, or use the acceptance installer:

```powershell
npm run install:acceptance:win
```

Individual installs:

```powershell
npm run install:website
npm run install:client-web
npm run install:admin-web
npm run install:backend
npm run install:desktop-main
```

## Acceptance Build Order

The required Windows acceptance order is fixed:

1. `npm run build:website`
2. `npm run build:client-web`
3. `npm run build:admin-web`
4. `npm run build:backend`
5. `npm run build:desktop-main`

Or run the full acceptance chain:

```powershell
set LOCAL_ACCEPTANCE_MODE=1
npm run build:acceptance:win
```

## Desktop Packaging Rule

`apps/client-desktop` does not build its own frontend bundle. It packages the output of `apps/client-web/dist`.

That means:

- `apps/client-web` must build successfully first
- `apps/client-desktop` must package without depending on `D:\网站部署`
- no external Electron toolchain directory is required

## Backend Notes

Backend is part of the required Windows acceptance gate for this round.

## Legacy Notes

- `legacy/desktop-experiments` contains historical desktop variants and should not be used as the default build target.
- `legacy/chaowuqiong-project-support` contains old deployment scripts, SQL references, and support files kept for reference only.
- `infra/cloud-bridge/history` may still mention the original `D:\网站部署` paths because those files are historical records.
