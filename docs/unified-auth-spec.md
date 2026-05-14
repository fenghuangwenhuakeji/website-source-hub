# Unified Auth Spec

## Goal

This repository already contains a working auth system, but it is split across multiple route groups and client entrypoints. The goal of the unified auth system is to turn the current website login flow into a stable platform capability that can be reused by:

- `apps/website`
- `apps/client-web`
- `apps/client-desktop`
- future desktop tools
- future standalone software that needs 凤煌 account login

This document defines the canonical interface, integration rules, and the cleanup direction for the existing implementation.

## Scope

The unified auth system covers:

- account/password login
- phone code login
- WeChat QR login
- registration
- refresh token exchange
- current-user lookup
- logout
- password reset
- phone binding

This document does not define payment, recharge, or business authorization rules beyond the auth session boundary.

## Current Canonical Backend Surface

The backend currently mounts the main auth routes here:

- `/api/auth/*`
- `/api/wechat/*`

Compatibility routes also exist:

- `/api/sms/*`
- `/api/user/*`

For all new integrations, treat `/api/auth/*` and `/api/wechat/*` as the source of truth. `/api/sms/*` and `/api/user/*` should be considered compatibility surfaces that can be deprecated later.

## Design Principles

1. One account system for every 凤煌 client.
2. One canonical token model for every client.
3. One normalized user payload for every login method.
4. One documented retry and refresh flow for every client.
5. Compatibility aliases may exist, but only one canonical spec should be documented.

## Session Model

The current implementation uses JWT access tokens and JWT refresh tokens.

- Access token source: `Authorization: Bearer <token>`
- Refresh token source: request body `refreshToken`
- Current example TTL from `apps/backend/.env.example`:
  - `JWT_EXPIRES_IN=24h`
  - `REFRESH_TOKEN_EXPIRES_IN=365d`

### Standard session payload

Every successful login or refresh flow should normalize to this shape:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "username": "demo",
      "nickname": "Demo",
      "email": "demo@example.com",
      "phone": "13800138000",
      "avatar": null,
      "role": "user",
      "isAdmin": false,
      "points": 0,
      "totalRecharge": 0,
      "referralCode": "CWXXXXXX",
      "bindingStatus": {
        "phoneBound": true,
        "phoneVerified": true,
        "phoneVerifiedAt": "2026-05-14T10:00:00Z",
        "wechatBound": false,
        "wechatBoundAt": null,
        "mustBindContact": false
      }
    },
    "token": "access-token",
    "refreshToken": "refresh-token"
  }
}
```

## Client Integration Rules

### Required headers

All clients should support these headers:

| Header | Required | Meaning |
|---|---|---|
| `Authorization` | protected APIs | bearer access token |
| `x-client-type` | recommended | `web`, `desktop`, `admin`, `service` |
| `x-app-version` | desktop strongly recommended | packaged client version |
| `x-app-id` | recommended | app identifier for future auditing |

### Version-gated auth behavior

Some current auth endpoints are wrapped by `requireSupportedDesktopVersion`. This means headless or desktop-like requests can be rejected with:

- HTTP `426`
- `code: APP_UPDATE_REQUIRED`

When a client is not a browser, it should send:

- `x-client-type`
- `x-app-version`

If we later generalize the auth gateway, this rule should move from “desktop-only version gate” to a more explicit “client capability gate”.

### Local storage contract

The current website shares auth state across apps using these keys:

- `fhwh_token`
- `fhwh_refresh_token`
- `fhwh_user`
- compatibility aliases: `token`, `refreshToken`, `user`

New web-based clients should reuse the `fhwh_*` keys unless we intentionally migrate to a new storage contract.

## Canonical Endpoints

## `POST /api/auth/register`

Create a new account.

### Request

```json
{
  "username": "demo_user",
  "password": "secret123",
  "nickname": "Demo",
  "email": "demo@example.com",
  "phone": "13800138000",
  "phoneCode": "123456",
  "referralCode": "CWABC123",
  "wechatOpenid": null,
  "wechatUnionid": null
}
```

### Rules

- username is required
- password is required
- registration must bind phone or WeChat before account creation
- phone registration requires `phone` + `phoneCode`

### Response

- `201 Created`
- session payload with `user`, `token`, `refreshToken`

## `POST /api/auth/login`

Password login using username, phone, or email as the account field.

### Canonical request shape

```json
{
  "account": "demo@example.com",
  "password": "secret123"
}
```

### Current implementation note

Current website calls this endpoint with:

```json
{
  "username": "demo@example.com",
  "password": "secret123"
}
```

To keep compatibility, the backend should currently accept `username` as the account field. For all new client SDKs and docs, `account` should be treated as the canonical field name, with `username` marked as legacy-compatible input.

## `POST /api/auth/phone/code`

Canonical phone-code send endpoint.

### Request

```json
{
  "phoneNumber": "13800138000",
  "purpose": "login"
}
```

### Current implementation note

The current website uses `/api/sms/send-code`. That route is still valid for compatibility, but new clients should target the canonical auth namespace.

## `POST /api/auth/phone/login`

Phone-code login.

### Request

```json
{
  "phoneNumber": "13800138000",
  "code": "123456",
  "inviteCode": "CWABC123"
}
```

### Response

- session payload with `user`, `token`, `refreshToken`

## `GET /api/wechat/login-qrcode`

Start WeChat QR login.

### Response

```json
{
  "success": true,
  "data": {
    "authUrl": "https://open.weixin.qq.com/...",
    "state": "wechat-login-state"
  }
}
```

## `GET /api/wechat/status/:state`

Poll WeChat login state.

### Status values

- `pending`
- `success`
- `expired`
- `error`

When status is `success`, the payload should include:

- `user`
- `token`
- `refreshToken`

## `POST /api/auth/refresh`

Refresh the access token.

### Request

```json
{
  "refreshToken": "refresh-token"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "token": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

### Client rule

Clients should refresh once on `401`, replace both tokens if present, and retry the original request once.

## `GET /api/auth/me`

Fetch the authenticated user profile.

### Response

Return the normalized user object, including:

- base identity
- binding status
- points
- total recharge
- creation time
- last login time

## `POST /api/auth/logout`

Current server-side logout is stateless and only returns success. Clients must also clear local tokens and cached user info.

## `POST /api/auth/forgot-password/request`

Send password reset code.

### Request

```json
{
  "phoneNumber": "13800138000",
  "account": "demo_user"
}
```

## `POST /api/auth/forgot-password/reset`

Reset password after phone verification.

### Request

```json
{
  "phoneNumber": "13800138000",
  "code": "123456",
  "newPassword": "new-secret123"
}
```

## `POST /api/auth/change-password`

Protected endpoint for logged-in password changes.

## `POST /api/auth/bind-phone`

Protected endpoint to attach a verified phone number to the current account.

## Response Envelope Standard

The unified auth system should use one envelope everywhere:

```json
{
  "success": true,
  "code": "OPTIONAL_MACHINE_CODE",
  "message": "Human-readable summary",
  "data": {}
}
```

### Success rules

- business data always lives in `data`
- optional machine code lives in `code`
- human message lives in `message`

### Error rules

- HTTP status carries transport status
- `success` must be `false`
- `code` should be stable for client logic
- `message` should be readable by users or logs

### Recommended auth error codes

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_TOKEN_EXPIRED`
- `AUTH_REFRESH_INVALID`
- `AUTH_ACCOUNT_LOCKED`
- `AUTH_ACCOUNT_DISABLED`
- `AUTH_PHONE_CODE_INVALID`
- `AUTH_PHONE_CODE_RATE_LIMITED`
- `AUTH_BIND_REQUIRED`
- `APP_UPDATE_REQUIRED`

## Canonical User Model

Clients should consume the following fields as stable:

| Field | Meaning |
|---|---|
| `id` | string user id |
| `username` | stable account name |
| `nickname` | display name |
| `email` | optional email |
| `phone` | optional bound phone |
| `avatar` | optional avatar url |
| `role` | user role |
| `isAdmin` | explicit admin flag |
| `points` | user points |
| `totalRecharge` | total recharge amount |
| `referralCode` | self referral code |
| `bindingStatus` | phone/wechat binding state |
| `createdAt` | account creation time |
| `lastLoginAt` | last login time |

## Integration Checklist For New Software

1. Use the canonical endpoints from this document.
2. Send `x-client-type` on every auth request.
3. Send `x-app-version` if the client is packaged or versioned.
4. Store `token`, `refreshToken`, and `user` as one session object.
5. Attach `Authorization: Bearer <token>` to protected calls.
6. Refresh once on `401`.
7. Clear session locally on refresh failure or explicit logout.
8. Do not hardcode compatibility endpoints like `/api/user/login`.

## Current Gaps To Clean Up

These gaps exist today and should guide implementation work after this spec lands.

### 1. Duplicate route surfaces

Current auth behavior is spread across:

- `/api/auth/*`
- `/api/sms/*`
- `/api/user/*`
- `/api/wechat/*`

Target state:

- one canonical auth namespace
- compatibility routes preserved only as aliases during migration

### 2. Inconsistent request naming

Current password login accepts `username` even though the field behaves like an account identifier.

Target state:

- canonical field name: `account`
- legacy alias: `username`

### 3. Stateless refresh-token logout

Refresh tokens are JWTs and are not persisted or revoked server-side.

Target state:

- either persist refresh sessions for revocation
- or document clearly that logout is client-side only

### 4. Website storage is localStorage-based

This is convenient for the current multi-app browser setup, but it is weaker than httpOnly cookie sessions.

Target state:

- keep localStorage for desktop/web bridge scenarios if needed
- define one explicit storage strategy per client type

### 5. Desktop gating is mixed into auth

Version gating currently sits directly on some auth endpoints.

Target state:

- keep the protection
- but treat it as a client capability rule, not as hidden auth behavior

## Shared TypeScript Contract

The shared package should export the unified auth types from:

- `packages/shared/src/types/auth.ts`

That file is the TypeScript companion to this spec and should be used by:

- web clients
- desktop clients
- future SDK helpers

## Migration Direction

### Phase 1

- document the canonical contract
- export shared auth types
- keep current compatibility routes working

### Phase 2

- make `/api/auth/*` the only documented login surface
- convert website and desktop callers to canonical field names
- add stable machine-readable error codes

### Phase 3

- decide refresh-token revocation strategy
- decide long-term storage strategy for each client type
- deprecate `/api/user/*` and `/api/sms/*` auth entrypoints
