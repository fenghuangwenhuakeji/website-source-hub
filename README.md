# Website Source Hub

`website-source-hub` is the normalized source repository for the 凤煌平台线: website, user web client, admin UI, backend, desktop shell, shared packages, and the full 凤煌 desktop app surface used for Win acceptance.

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

## Official Account And Novella Bridge

The official website is the account source for the current `fhwhkj.top` product line.

- Official login lives in `apps/website` and `apps/backend`.
- Password login is the default path. SMS login is retained for first login, recovery, binding, and risk control.
- A user who logs in by SMS without an existing password receives `mustSetPassword: true` and is forced through `/profile?forcePassword=1` before returning to the requested product.
- The top navigation item `中短篇小说` is a normal browser link to `/novella/`, not an internal React route.
- Login and register pages honor safe `from` values. External app return paths currently include `/access/*` and `/novella/`, and are opened with `window.location.assign(...)`.
- The medium-short novella app reads the official `fhwh_token` from local storage and calls `/novella-api/api/auth/session` to establish its own business session.
- Product entitlements are separated. Official website points, duration, and licenses do not equal novella wallet, membership, orders, or daily quota.

Current production website release after the unified login return fixes:

```text
/srv/prod-sites/fenghuang-platform/releases/novella-login-return-20260601-0145
```

The desktop acceptance target is not just the login/recharge shell. The packaged 凤煌 app must expose the current repo's app ecosystem, including:

- `代码编辑器`
- `Agent Creator`
- `短篇拆书版`
- `HTML Vault`
- `凤煌创作入口`

## Build Contract

The repository exposes these root-level commands:

- `npm run build:website`
- `npm run build:client-web`
- `npm run build:admin-web`
- `npm run build:backend`
- `npm run build:desktop-main`
- `npm run build:acceptance:win`

`build:acceptance:win` is the Windows acceptance path and is designed to run from a fresh clone on `Win-Workstation` under `F:\work`.

That command now packages the desktop in local acceptance mode automatically, so the packaged Electron app enters `/main?localAcceptance=1` and validates the full 凤煌 desktop surface instead of stopping at login/recharge.

## Legacy Material

- `legacy/desktop-experiments` keeps non-default desktop variants and historical Electron experiments.
- `legacy/chaowuqiong-project-support` keeps old deployment helpers, SQL references, support files, and `D:\网站部署` support-material imports that are not part of the default build path.

Those directories are intentionally preserved for reference, but they are not part of the default acceptance build.

## Start Here

Read [`SETUP.md`](./SETUP.md) for the Win-Workstation onboarding and build flow.

Read [`docs/source-coverage.md`](./docs/source-coverage.md) for the source-of-truth mapping from `D:\网站部署` and `D:\HTML`.

`Nike232/super-wuqiong-app` remains the launcher/archive repo for the older super-wuqiong namespace. It is not allowed to own the required 凤煌 desktop app surface for this repository.
