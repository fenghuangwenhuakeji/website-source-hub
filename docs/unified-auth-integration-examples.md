# Unified Auth Integration Examples

This document shows how a new software client can integrate with the 凤煌 unified auth system without depending on current website page code.

Use this together with:

- [Unified Auth Spec](./unified-auth-spec.md)

## Required Request Headers

New clients should send:

```http
Content-Type: application/json
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0
```

Protected requests should also send:

```http
Authorization: Bearer <access-token>
```

## Password Login Example

### Request

```http
POST /api/auth/login
Content-Type: application/json
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0

{
  "account": "demo@example.com",
  "username": "demo@example.com",
  "password": "secret123"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "userId": "user-id",
      "username": "demo",
      "nickname": "Demo",
      "role": "user",
      "bindingStatus": {
        "phoneBound": true,
        "phoneVerified": true,
        "wechatBound": false
      }
    },
    "token": "access-token",
    "refreshToken": "refresh-token"
  }
}
```

## Phone Code Example

### Step 1: send code

```http
POST /api/auth/phone/code
Content-Type: application/json
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0

{
  "phoneNumber": "13800138000",
  "purpose": "login"
}
```

### Step 2: login

```http
POST /api/auth/phone/login
Content-Type: application/json
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0

{
  "phoneNumber": "13800138000",
  "code": "123456"
}
```

## Refresh Token Example

When the client gets `401`, it should try one refresh request:

```http
POST /api/auth/refresh
Content-Type: application/json
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0

{
  "refreshToken": "refresh-token"
}
```

If refresh succeeds:

1. replace local `token`
2. replace local `refreshToken` if a new one is returned
3. retry the failed protected request once

If refresh fails:

1. clear local session
2. return user to login

## Current User Example

```http
GET /api/auth/me
Authorization: Bearer <access-token>
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0
```

## WeChat QR Login Example

### Step 1: request QR login

```http
GET /api/wechat/login-qrcode
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0
```

### Step 2: open `authUrl` in a browser window

The response contains:

```json
{
  "success": true,
  "data": {
    "authUrl": "https://open.weixin.qq.com/...",
    "state": "wechat-state"
  }
}
```

### Step 3: poll login status

```http
GET /api/wechat/status/wechat-state
x-client-type: desktop
x-app-id: fenghuang-writer
x-app-version: 1.2.0
```

When the response status becomes `success`, use the returned:

- `user`
- `token`
- `refreshToken`

## JavaScript Example

```ts
type Session = {
  user: any;
  token: string;
  refreshToken: string;
};

async function passwordLogin(account: string, password: string): Promise<Session> {
  const response = await fetch('https://your-domain.com/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-type': 'desktop',
      'x-app-id': 'fenghuang-writer',
      'x-app-version': '1.2.0',
    },
    body: JSON.stringify({
      account,
      username: account,
      password,
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.data?.token || !payload?.data?.user) {
    throw new Error(payload?.message || 'Login failed');
  }

  return {
    user: payload.data.user,
    token: payload.data.token,
    refreshToken: payload.data.refreshToken,
  };
}
```

## Error Handling

New software should prefer `code` over raw `message` for program logic.

Common auth codes:

- `AUTH_INVALID_CREDENTIALS`
- `AUTH_ACCOUNT_LOCKED`
- `AUTH_ACCOUNT_DISABLED`
- `AUTH_PHONE_CODE_INVALID`
- `AUTH_PHONE_CODE_RATE_LIMITED`
- `AUTH_REFRESH_INVALID`
- `AUTH_TOKEN_EXPIRED`
- `APP_UPDATE_REQUIRED`

`message` is still suitable for direct display, but `code` is the stable control surface.
