import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { db, getDatabaseAdapter } from '../config/database.js';
import { config } from '../config/index.js';
import { authMiddleware, type AuthRequest } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { generateToken } from '../middleware/auth.js';

const router = Router();
const LOGIN_STATE_TTL_MS = 10 * 60 * 1000;
const WECHAT_APP_SECRET_PATTERN = /^[A-Za-z0-9]{32}$/;

type LoginStateRecord = {
  state: string;
  mode: 'login' | 'bind';
  status: 'pending' | 'success' | 'expired' | 'failed';
  createdAt: number;
  bindUserId?: string;
  token?: string;
  user?: Record<string, unknown>;
  message?: string;
};

type WechatTokenData = {
  openid: string;
  unionid?: string;
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
};

type WechatUserProfile = {
  nickname: string;
  avatarUrl: string;
};

const loginStateStore = new Map<string, LoginStateRecord>();

function createState(): string {
  return Buffer.from(
    JSON.stringify({
      id: uuidv4(),
      ts: Date.now(),
    }),
  ).toString('base64url');
}

function generateReferralCode(): string {
  return `CW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

function cleanupStates(): void {
  const now = Date.now();

  for (const [key, value] of loginStateStore.entries()) {
    if (now - value.createdAt > LOGIN_STATE_TTL_MS && value.status === 'pending') {
      loginStateStore.set(key, {
        ...value,
        status: 'expired',
        message: 'QR code expired. Please refresh on the desktop login page and try again.',
      });
    }
  }
}

function buildLocalDevWechatAuthUrl(state: string): string {
  return `http://127.0.0.1:${config.port}/api/wechat/mock-login/${encodeURIComponent(state)}`;
}

function hasValidWechatLoginSecret(secret?: string): secret is string {
  return Boolean(secret && WECHAT_APP_SECRET_PATTERN.test(secret));
}

async function exchangeCodeForWechatToken(code: string) {
  if (!config.wechatLogin?.appId || !config.wechatLogin?.appSecret) {
    throw ApiError.internal('WeChat login config is incomplete.');
  }

  if (!hasValidWechatLoginSecret(config.wechatLogin.appSecret)) {
    throw ApiError.internal(
      'WeChat login config is invalid: WECHAT_LOGIN_APPSECRET must be the plain AppSecret from WeChat Open Platform.',
    );
  }

  const tokenUrl =
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.wechatLogin.appId}` +
    `&secret=${config.wechatLogin.appSecret}&code=${code}&grant_type=authorization_code`;
  const tokenResponse = await axios.get(tokenUrl);
  const tokenData = tokenResponse.data;

  if (tokenData.errcode) {
    throw ApiError.internal(`WeChat authorization failed: ${tokenData.errmsg || tokenData.errcode}`);
  }

  return tokenData as WechatTokenData;
}

function normalizeWechatProfileValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isFallbackWechatNickname(value: unknown): boolean {
  const nickname = normalizeWechatProfileValue(value);
  return !nickname || /^WeChat User\s+/i.test(nickname) || /^微信用户/.test(nickname);
}

function buildWechatFallbackNickname(openid: string): string {
  return `微信用户${String(openid || '').slice(-6)}`;
}

async function fetchWechatUserInfo(tokenData: WechatTokenData): Promise<WechatUserProfile | null> {
  const accessToken = normalizeWechatProfileValue(tokenData.access_token);
  const openid = normalizeWechatProfileValue(tokenData.openid);

  if (!accessToken || !openid) {
    return null;
  }

  try {
    const userInfoUrl =
      `https://api.weixin.qq.com/sns/userinfo?access_token=${encodeURIComponent(accessToken)}` +
      `&openid=${encodeURIComponent(openid)}&lang=zh_CN`;
    const response = await axios.get(userInfoUrl);
    const data = response.data;

    if (!data || data.errcode) {
      console.warn('[wechat-login] Unable to fetch WeChat user info:', data?.errmsg || data?.errcode || 'empty response');
      return null;
    }

    return {
      nickname: normalizeWechatProfileValue(data.nickname),
      avatarUrl: normalizeWechatProfileValue(data.headimgurl),
    };
  } catch (error) {
    console.warn('[wechat-login] Unable to fetch WeChat user info:', error instanceof Error ? error.message : String(error));
    return null;
  }
}

function createWechatUserPayload(user: any): Record<string, unknown> {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar_url,
    role: user.role || 'user',
    points: Number(user.points || 0),
  };
}

async function findOrCreateWechatUser(openid: string, unionid?: string, profile: WechatUserProfile | null = null) {
  const users = await db.query<any[]>(
    `SELECT *
     FROM users
     WHERE wechat_openid = ?
        OR (? IS NOT NULL AND wechat_unionid = ?)
     LIMIT 1`,
    [openid, unionid || null, unionid || null],
  );

  if (users.length > 0) {
    const user = users[0];
    const nextNickname = normalizeWechatProfileValue(profile?.nickname);
    const nextAvatar = normalizeWechatProfileValue(profile?.avatarUrl);
    const shouldSyncNickname = nextNickname && isFallbackWechatNickname(user.nickname) ? 1 : 0;

    await db.execute(
      `UPDATE users
       SET wechat_openid = ?,
           wechat_unionid = COALESCE(?, wechat_unionid),
           nickname = CASE
             WHEN ? = 1 THEN ?
             ELSE nickname
           END,
           avatar_url = CASE
             WHEN ? <> '' AND (avatar_url IS NULL OR avatar_url = '') THEN ?
             ELSE avatar_url
           END,
           wechat_bound_at = COALESCE(wechat_bound_at, NOW()),
           must_bind_contact = 0,
           last_login = NOW()
       WHERE id = ?`,
      [openid, unionid || null, shouldSyncNickname, nextNickname, nextAvatar, nextAvatar, user.id],
    );

    const latest = await db.query<any[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [user.id]);
    return latest[0];
  }

  const userId = uuidv4();
  const username = `wx_${Date.now().toString().slice(-8)}${Math.random().toString(36).slice(2, 4)}`;
  const nickname = normalizeWechatProfileValue(profile?.nickname) || buildWechatFallbackNickname(openid);
  const avatarUrl = normalizeWechatProfileValue(profile?.avatarUrl) || null;
  const referralCode = generateReferralCode();

  await db.execute(
    `INSERT INTO users (
      id, username, password_hash, nickname, avatar_url, role, status, points, total_recharge, total_earnings,
      wechat_openid, wechat_unionid, wechat_bound_at, referral_code, must_bind_contact, created_at, last_login
    ) VALUES (?, ?, ?, ?, ?, 'user', 'active', 0, 0, 0, ?, ?, NOW(), ?, 0, NOW(), NOW())`,
    [userId, username, '', nickname, avatarUrl, openid, unionid || null, referralCode],
  );

  const created = await db.query<any[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  return created[0];
}

async function bindWechatToUser(userId: string, openid: string, unionid?: string, profile: WechatUserProfile | null = null) {
  const currentRows = await db.query<any[]>(
    `SELECT *
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId],
  );

  if (currentRows.length === 0) {
    throw ApiError.notFound('Current user does not exist.');
  }

  const currentUser = currentRows[0];
  const currentOpenId = currentUser.wechat_openid ? String(currentUser.wechat_openid) : '';
  const currentUnionId = currentUser.wechat_unionid ? String(currentUser.wechat_unionid) : '';

  if (currentOpenId && currentOpenId !== openid) {
    throw ApiError.badRequest('This account is already bound to a different WeChat account.');
  }

  if (currentUnionId && unionid && currentUnionId !== unionid) {
    throw ApiError.badRequest('This account is already bound to a different WeChat account.');
  }

  const conflictRows = await db.query<any[]>(
    `SELECT id
     FROM users
     WHERE id <> ?
       AND (
         wechat_openid = ?
         OR (? IS NOT NULL AND wechat_unionid = ?)
       )
     LIMIT 1`,
    [userId, openid, unionid || null, unionid || null],
  );

  if (conflictRows.length > 0) {
    throw ApiError.badRequest('This WeChat account is already bound to another user.');
  }

  const nextNickname = normalizeWechatProfileValue(profile?.nickname);
  const nextAvatar = normalizeWechatProfileValue(profile?.avatarUrl);
  const shouldSyncNickname = nextNickname && isFallbackWechatNickname(currentUser.nickname) ? 1 : 0;

  await db.execute(
    `UPDATE users
     SET wechat_openid = ?,
         wechat_unionid = COALESCE(?, wechat_unionid),
         nickname = CASE
           WHEN ? = 1 THEN ?
           ELSE nickname
         END,
         avatar_url = CASE
           WHEN ? <> '' AND (avatar_url IS NULL OR avatar_url = '') THEN ?
           ELSE avatar_url
         END,
         wechat_bound_at = COALESCE(wechat_bound_at, NOW()),
         must_bind_contact = 0,
         last_login = NOW()
     WHERE id = ?`,
    [openid, unionid || null, shouldSyncNickname, nextNickname, nextAvatar, nextAvatar, userId],
  );

  const latest = await db.query<any[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [userId]);
  return latest[0];
}

async function completeLocalDevWechatLogin(state: string, createdAt: number): Promise<LoginStateRecord> {
  const openid = `local-wechat-${state.slice(-8)}`;
  const user = await findOrCreateWechatUser(openid, `local-union-${state.slice(-8)}`);
  const token = generateToken({
    userId: String(user.id),
    username: user.username,
    role: user.role || 'user',
  });

  const record: LoginStateRecord = {
    state,
    mode: 'login',
    status: 'success',
    createdAt,
    token,
    user: {
      ...createWechatUserPayload(user),
    },
    message: 'Local development mode: WeChat login has been confirmed. Return to the desktop window to continue.',
  };

  loginStateStore.set(state, record);
  return record;
}

async function completeLocalDevWechatBind(
  state: string,
  createdAt: number,
  bindUserId: string,
): Promise<LoginStateRecord> {
  const suffix = state.slice(-8);
  const user = await bindWechatToUser(bindUserId, `local-wechat-bind-${suffix}`, `local-union-bind-${suffix}`);

  const record: LoginStateRecord = {
    state,
    mode: 'bind',
    status: 'success',
    createdAt,
    user: {
      ...createWechatUserPayload(user),
    },
    message: 'Local development mode: the WeChat account has been bound to your current user.',
  };

  loginStateStore.set(state, record);
  return record;
}

router.get('/login-qrcode', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    cleanupStates();

    if (getDatabaseAdapter() === 'sqlite') {
      const state = createState();
      loginStateStore.set(state, {
        state,
        mode: 'login',
        status: 'pending',
        createdAt: Date.now(),
        message: 'Local development mode: open the new window and confirm the mock WeChat login manually.',
      });

      res.json({
        success: true,
        data: {
          authUrl: buildLocalDevWechatAuthUrl(state),
          state,
          expiresIn: Math.floor(LOGIN_STATE_TTL_MS / 1000),
        },
      });
      return;
    }

    if (!config.wechatLogin?.appId || !config.wechatLogin?.callbackDomain) {
      throw ApiError.internal('WeChat login is not configured.');
    }

    const state = createState();
    loginStateStore.set(state, {
      state,
      mode: 'login',
      status: 'pending',
      createdAt: Date.now(),
      message: 'Waiting for WeChat QR confirmation.',
    });

    const callbackUrl = `https://${config.wechatLogin.callbackDomain}/api/wechat/callback`;
    const authUrl =
      `https://open.weixin.qq.com/connect/qrconnect?appid=${config.wechatLogin.appId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code&scope=snsapi_login&state=${encodeURIComponent(state)}#wechat_redirect`;

    res.json({
      success: true,
      data: {
        authUrl,
        state,
        expiresIn: Math.floor(LOGIN_STATE_TTL_MS / 1000),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/bind-qrcode', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    cleanupStates();

    const authReq = req as AuthRequest;
    const userId = authReq.user?.id;
    if (!userId) {
      throw ApiError.unauthorized('Please log in before binding WeChat.');
    }

    if (getDatabaseAdapter() === 'sqlite') {
      const state = createState();
      loginStateStore.set(state, {
        state,
        mode: 'bind',
        status: 'pending',
        createdAt: Date.now(),
        bindUserId: String(userId),
        message: 'Local development mode: open the new window and confirm WeChat binding manually.',
      });

      res.json({
        success: true,
        data: {
          authUrl: buildLocalDevWechatAuthUrl(state),
          state,
          mode: 'bind',
          expiresIn: Math.floor(LOGIN_STATE_TTL_MS / 1000),
        },
      });
      return;
    }

    if (!config.wechatLogin?.appId || !config.wechatLogin?.callbackDomain) {
      throw ApiError.internal('WeChat login is not configured.');
    }

    const state = createState();
    loginStateStore.set(state, {
      state,
      mode: 'bind',
      status: 'pending',
      createdAt: Date.now(),
      bindUserId: String(userId),
      message: 'Waiting for WeChat bind confirmation.',
    });

    const callbackUrl = `https://${config.wechatLogin.callbackDomain}/api/wechat/callback`;
    const authUrl =
      `https://open.weixin.qq.com/connect/qrconnect?appid=${config.wechatLogin.appId}` +
      `&redirect_uri=${encodeURIComponent(callbackUrl)}` +
      `&response_type=code&scope=snsapi_login&state=${encodeURIComponent(state)}#wechat_redirect`;

    res.json({
      success: true,
      data: {
        authUrl,
        state,
        mode: 'bind',
        expiresIn: Math.floor(LOGIN_STATE_TTL_MS / 1000),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/mock-login/:state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    cleanupStates();

    if (getDatabaseAdapter() !== 'sqlite') {
      throw ApiError.notFound('Mock login is only available in local development mode.');
    }

    const { state } = req.params;
    const record = loginStateStore.get(state);
    if (!record) {
      res
        .status(410)
        .type('html')
        .send('<!doctype html><html><body><p>QR code expired. Refresh the desktop page and try again.</p></body></html>');
      return;
    }

    if (Date.now() - record.createdAt > LOGIN_STATE_TTL_MS) {
      loginStateStore.set(state, {
        ...record,
        status: 'expired',
        message: 'Local development mode: QR code expired. Refresh the desktop page and try again.',
      });
      res
        .status(410)
        .type('html')
        .send('<!doctype html><html><body><p>QR code expired. Refresh the desktop page and try again.</p></body></html>');
      return;
    }

    if (req.query.confirm === '1') {
      const nextRecord =
        record.status === 'success'
          ? record
          : record.mode === 'bind' && record.bindUserId
            ? await completeLocalDevWechatBind(state, record.createdAt, record.bindUserId)
            : await completeLocalDevWechatLogin(state, record.createdAt);

      res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WeChat Login Confirmed</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f0fdf4; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .card { width: min(92vw, 360px); background: #fff; border-radius: 18px; padding: 28px 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.08); text-align: center; }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0; color: #475569; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${nextRecord.mode === 'bind' ? 'Binding Confirmed' : 'Login Confirmed'}</h1>
      <p>${
        nextRecord.message ||
        (nextRecord.mode === 'bind'
          ? 'Local development mode: WeChat binding confirmed. Return to the desktop window to continue.'
          : 'Local development mode: WeChat login confirmed. Return to the desktop window to continue.')
      }</p>
    </div>
  </body>
</html>`);
      return;
    }

    res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Mock WeChat Login</title>
    <style>
      body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f5f7fb; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      .card { width: min(92vw, 360px); background: #fff; border-radius: 18px; padding: 28px 24px; box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0 0 18px; color: #475569; line-height: 1.6; }
      .actions { display: flex; gap: 12px; }
      a { text-decoration: none; text-align: center; padding: 12px 14px; border-radius: 12px; font-weight: 600; }
      .primary { background: #07c160; color: #fff; flex: 1; }
      .secondary { background: #eef2ff; color: #334155; flex: 1; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${record.mode === 'bind' ? 'Mock WeChat Binding' : 'Mock WeChat Login'}</h1>
      <p>${
        record.mode === 'bind'
          ? 'This page does not bind automatically. Click "Confirm Binding" to complete the current user binding flow.'
          : 'This page does not log you in automatically. Click "Confirm Login" to complete the desktop QR flow.'
      }</p>
      <div class="actions">
        <a class="primary" href="/api/wechat/mock-login/${encodeURIComponent(state)}?confirm=1">${
          record.mode === 'bind' ? 'Confirm Binding' : 'Confirm Login'
        }</a>
        <a class="secondary" href="javascript:window.close()">Cancel</a>
      </div>
    </div>
  </body>
</html>`);
  } catch (error) {
    next(error);
  }
});

router.get('/callback', async (req: Request, res: Response, next: NextFunction) => {
  const { code, state } = req.query;

  try {
    cleanupStates();

    if (!code || typeof code !== 'string') {
      throw ApiError.badRequest('WeChat callback failed: missing code.');
    }

    if (!state || typeof state !== 'string') {
      throw ApiError.badRequest('WeChat callback failed: missing state.');
    }

    const existingState = loginStateStore.get(state);
    if (!existingState) {
      throw ApiError.badRequest('Login state is invalid or expired.');
    }

    if (Date.now() - existingState.createdAt > LOGIN_STATE_TTL_MS) {
      loginStateStore.set(state, {
        ...existingState,
        status: 'expired',
        message: 'QR code expired. Please refresh on the desktop page and try again.',
      });
      throw ApiError.badRequest('QR code expired. Please refresh on the desktop page and try again.');
    }

    const tokenData = await exchangeCodeForWechatToken(code);
    const wechatProfile = await fetchWechatUserInfo(tokenData);

    if (existingState.mode === 'bind') {
      if (!existingState.bindUserId) {
        throw ApiError.badRequest('Binding state is missing the current user.');
      }

      const user = await bindWechatToUser(existingState.bindUserId, tokenData.openid, tokenData.unionid, wechatProfile);

      loginStateStore.set(state, {
        state,
        mode: 'bind',
        status: 'success',
        createdAt: existingState.createdAt,
        user: createWechatUserPayload(user),
        message: 'WeChat binding successful. Return to the desktop page to continue.',
      });
    } else {
      const user = await findOrCreateWechatUser(tokenData.openid, tokenData.unionid, wechatProfile);
      const token = generateToken({
        userId: String(user.id),
        username: user.username,
        role: user.role || 'user',
      });

      loginStateStore.set(state, {
        state,
        mode: 'login',
        status: 'success',
        createdAt: existingState.createdAt,
        token,
        user: createWechatUserPayload(user),
        message: 'Login successful. Return to the desktop page to continue.',
      });
    }

    res.status(200).type('html').send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>WeChat Login Success</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; display:flex; min-height:100vh; align-items:center; justify-content:center; background:#f6f8ff; margin:0; }
      .card { background:#fff; padding:28px 24px; border-radius:18px; box-shadow:0 16px 48px rgba(15,23,42,.08); max-width:320px; text-align:center; }
      h1 { font-size:22px; margin:0 0 10px; }
      p { color:#4b5563; margin:0; line-height:1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${existingState.mode === 'bind' ? 'Binding Successful' : 'Login Successful'}</h1>
      <p>${
        existingState.mode === 'bind'
          ? 'You have completed WeChat binding for the current account. Return to the desktop page to continue.'
          : 'You have completed WeChat QR login. Return to the desktop page to continue.'
      }</p>
    </div>
  </body>
</html>`);
  } catch (error) {
    if (typeof state === 'string' && loginStateStore.has(state)) {
      const existingState = loginStateStore.get(state)!;
      loginStateStore.set(state, {
        ...existingState,
        status: existingState.status === 'expired' ? 'expired' : 'failed',
        message: error instanceof Error ? error.message : 'WeChat login failed.',
      });
    }
    next(error);
  }
});

router.post('/get-openid', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.body;
    if (!code) {
      throw ApiError.badRequest('Code is required.');
    }

    const tokenData = await exchangeCodeForWechatToken(code);
    res.json({
      success: true,
      data: {
        openid: tokenData.openid,
        unionid: tokenData.unionid || null,
        accessToken: tokenData.access_token,
        expiresIn: tokenData.expires_in || 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status/:state', async (req: Request, res: Response, next: NextFunction) => {
  try {
    cleanupStates();
    const { state } = req.params;
    const record = loginStateStore.get(state);

    if (!record) {
      return res.json({
        success: true,
        data: {
          status: 'expired',
          message: 'QR code expired. Please refresh and try again.',
        },
      });
    }

    if (Date.now() - record.createdAt > LOGIN_STATE_TTL_MS && record.status === 'pending') {
      record.status = 'expired';
      record.message = 'QR code expired. Please refresh and try again.';
      loginStateStore.set(state, record);
    }

    return res.json({
      success: true,
      data: {
        mode: record.mode,
        status: record.status,
        token: record.token,
        user: record.user,
        message:
          record.message || (record.status === 'pending' ? 'Waiting for QR confirmation.' : 'Status updated.'),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/qrcode-page', async (_req: Request, res: Response) => {
  res.json({
    success: false,
    message: 'WeChat payment has switched to the native QR flow. Use /api/payment/create to fetch the payment QR data.',
  });
});

router.get('/pay-callback', (_req: Request, res: Response) => {
  res
    .status(410)
    .type('html')
    .send('<!doctype html><html><body><p>This legacy callback entry has been retired. Please restart payment from the app.</p></body></html>');
});

export default router;
