# Website Source Hub

`website-source-hub` is the normalized source repository for the website, web clients, admin UI, backend, desktop shell, shared packages, and cloud bridge references.

## Repository Layout

```text
website-source-hub/
├─ apps/
│  ├─ website/
│  ├─ client-web/
│  ├─ admin-web/
│  ├─ backend/
│  └─ client-desktop/
├─ packages/
│  └─ shared/
├─ infra/
│  └─ cloud-bridge/
├─ docs/
│  └─ chaowuqiong-project/
└─ legacy/
   ├─ desktop-experiments/
   └─ chaowuqiong-project-support/
```

## Mainline Targets

- `apps/website`: the official marketing site
- `apps/client-web`: the main user-facing web client
- `apps/admin-web`: the admin dashboard
- `apps/backend`: the backend service
- `apps/client-desktop`: the thin Electron shell that packages `apps/client-web/dist`
- `packages/shared`: shared TypeScript utilities and types
- `infra/cloud-bridge`: deployment bridge docs, scripts, and history

## Build Contract

The repository exposes these root-level commands:

- `npm run build:website`
- `npm run build:client-web`
- `npm run build:admin-web`
- `npm run build:desktop-main`
- `npm run build:acceptance:win`

`build:acceptance:win` is the Windows acceptance path and is designed to run from a fresh clone on `Win-Workstation` under `F:\work`.

## Legacy Material

- `legacy/desktop-experiments` keeps non-default desktop variants and historical Electron experiments.
- `legacy/chaowuqiong-project-support` keeps old deployment helpers, SQL references, and support files that are not part of the default build path.

Those directories are intentionally preserved for reference, but they are not part of the default acceptance build.

## Start Here

Read [`SETUP.md`](./SETUP.md) for the Win-Workstation onboarding and build flow.
