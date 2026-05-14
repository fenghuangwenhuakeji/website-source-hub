import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AUTH_ENDPOINTS,
  buildPasswordLoginPayload,
  buildPhoneCodeLoginPayload,
  buildSendPhoneCodePayload,
  extractAuthSession,
  normalizeAuthError,
} from '@fhwh/shared/utils/auth';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom, getSafeReturnPath, openReturnPath } from '../utils/safeReturnPath';

const loginSchema = z.object({
  username: z.string().min(1, '请输入账号、邮箱或手机号'),
  password: z.string().min(6, '密码至少需要 6 位'),
});

type LoginForm = z.infer<typeof loginSchema>;
type LoginMode = 'password' | 'sms' | 'wechat';

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function parseLoginMode(search: string): LoginMode {
  const mode = new URLSearchParams(search).get('mode');
  return mode === 'sms' || mode === 'wechat' ? mode : 'password';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const returnPath = getSafeReturnPath(location.search);
  const mode = parseLoginMode(location.search);
  const wechatLoginHref = buildPathWithFrom('/login?mode=wechat', returnPath);
  const smsLoginHref = buildPathWithFrom('/login?mode=sms', returnPath);
  const passwordLoginHref = buildPathWithFrom('/login', returnPath);
  const registerHref = buildPathWithFrom('/register', returnPath);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsCode, setSmsCode] = useState('');
  const [smsSending, setSmsSending] = useState(false);
  const [smsLoading, setSmsLoading] = useState(false);
  const [wechatLoading, setWechatLoading] = useState(false);
  const [wechatAuthUrl, setWechatAuthUrl] = useState('');
  const [wechatState, setWechatState] = useState('');
  const [wechatMessage, setWechatMessage] = useState('点击按钮，在新窗口完成微信登录。');
  const pollTimerRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const finishAuth = (user: any, token: string, refreshToken?: string) => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    setAuth(user, token, refreshToken || '');
    openReturnPath(returnPath, navigate);
  };

  const sendPhoneCode = async (phoneNumber: string, purpose: 'login' | 'register') => {
    try {
      return await apiClient.post(
        AUTH_ENDPOINTS.sendPhoneCode,
        buildSendPhoneCodePayload({ phoneNumber, purpose }),
      );
    } catch (error) {
      return await apiClient.post('/api/sms/send-code', {
        phoneNumber,
        purpose,
      });
    }
  };

  const loginWithPhoneCode = async (phoneNumber: string, code: string) => {
    try {
      return await apiClient.post(
        AUTH_ENDPOINTS.phoneLogin,
        buildPhoneCodeLoginPayload({ phoneNumber, code }),
      );
    } catch (error) {
      return await apiClient.post('/api/sms/login', {
        phoneNumber,
        code,
      });
    }
  };

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/login', buildPasswordLoginPayload({
        account: data.username,
        password: data.password,
      }));
      const session = extractAuthSession(response.data);
      if (!session) {
        throw new Error('Invalid login response');
      }
      finishAuth(session.user, session.tokens.token, session.tokens.refreshToken);
    } catch (err: any) {
      setError(normalizeAuthError(err, '登录失败，请检查账号和密码'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSmsCode = async () => {
    const phoneNumber = normalizePhone(smsPhone);
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setError('请输入正确的手机号');
      return;
    }

    setSmsSending(true);
    setError('');

    try {
      const response = await sendPhoneCode(phoneNumber, 'login');
      const payload = response.data?.data ?? response.data;
      setSmsPhone(phoneNumber);
      setError(payload?.code ? `验证码已发送，开发验证码：${payload.code}` : '验证码已发送，请查收短信。');
    } catch (err: any) {
      setError(normalizeAuthError(err, '验证码发送失败'));
    } finally {
      setSmsSending(false);
    }
  };

  const handleSmsLogin = async () => {
    const phoneNumber = normalizePhone(smsPhone);
    if (!/^1[3-9]\d{9}$/.test(phoneNumber)) {
      setError('请输入正确的手机号');
      return;
    }

    if (!smsCode.trim()) {
      setError('请输入短信验证码');
      return;
    }

    setSmsLoading(true);
    setError('');

    try {
      const response = await loginWithPhoneCode(phoneNumber, smsCode.trim());
      const session = extractAuthSession(response.data);
      if (!session) {
        throw new Error('Invalid sms login response');
      }
      finishAuth(session.user, session.tokens.token, session.tokens.refreshToken);
    } catch (err: any) {
      setError(normalizeAuthError(err, '短信登录失败'));
    } finally {
      setSmsLoading(false);
    }
  };

  const startWechatPolling = (state: string) => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
    }

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/wechat/status/${state}`);
        const payload = response.data?.data ?? response.data;
        if (!payload) {
          return;
        }

        setWechatMessage(payload.message || '等待微信确认中...');

        if (payload.status === 'success' && payload.token && payload.user) {
          finishAuth(payload.user, payload.token, payload.refreshToken);
        }

        if (payload.status === 'expired' && pollTimerRef.current) {
          window.clearInterval(pollTimerRef.current);
          pollTimerRef.current = null;
        }
      } catch {
        // Polling failures are usually transient.
      }
    }, 2000);
  };

  const handleWechatLogin = async (forceRefresh = false) => {
    const loginWindow = window.open('', '_blank');

    try {
      setWechatLoading(true);
      setError('');

      let authUrl = wechatAuthUrl;
      let state = wechatState;

      if (forceRefresh || !authUrl || !state) {
        const response = await apiClient.get('/api/wechat/login-qrcode');
        const payload = response.data?.data ?? response.data;
        authUrl = payload?.authUrl || '';
        state = payload?.state || '';
      }

      if (!authUrl || !state) {
        throw new Error('获取微信登录地址失败');
      }

      setWechatAuthUrl(authUrl);
      setWechatState(state);
      setWechatMessage(authUrl.includes('/api/wechat/mock-login/') ? '本地模拟微信登录已开启。' : '请在新窗口完成微信授权。');
      startWechatPolling(state);

      if (loginWindow) {
        loginWindow.opener = null;
        loginWindow.location.replace(authUrl);
      } else {
        window.open(authUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err: any) {
      loginWindow?.close();
      setError(normalizeAuthError(err, '打开微信登录失败'));
    } finally {
      setWechatLoading(false);
    }
  };

  useEffect(() => {
    if (mode !== 'wechat' || wechatAuthUrl || wechatLoading) {
      return;
    }

    void handleWechatLogin();
  }, [mode, wechatAuthUrl, wechatLoading]);

  useEffect(
    () => () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
      }
    },
    [],
  );

  return (
    <div className="page-shell auth-shell">
      <div className="container py-10 sm:py-14">
        <section className="auth-form auth-card auth-card-login glass-card">
          <div className="section-kicker">登录</div>
          <h1 className="auth-title">
            {mode === 'sms' ? '短信验证码登录' : mode === 'wechat' ? '微信登录' : '账号密码登录'}
          </h1>
          <p className="auth-form-copy">
            {mode === 'sms'
              ? '输入手机号和验证码，登录同一个凤煌账号。'
              : mode === 'wechat'
                ? '使用微信授权登录，成功后会自动回到你的目标页面。'
                : '使用用户名、邮箱或手机号登录。'}
          </p>

          {error ? <div className="auth-alert">{error}</div> : null}

          {mode === 'password' ? (
            <form className="auth-form-body" onSubmit={handleSubmit(onSubmit)}>
              <label className="auth-field">
                <span>账号</span>
                <input {...register('username')} placeholder="用户名 / 邮箱 / 手机号" />
                {errors.username ? <small>{errors.username.message}</small> : null}
              </label>

              <label className="auth-field">
                <span>密码</span>
                <input {...register('password')} type="password" placeholder="请输入密码" />
                {errors.password ? <small>{errors.password.message}</small> : null}
              </label>

              <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : null}

          {mode === 'sms' ? (
            <div className="auth-form-body">
              <label className="auth-field">
                <span>手机号</span>
                <input value={smsPhone} onChange={(event) => setSmsPhone(event.target.value)} placeholder="请输入手机号" />
              </label>
              <label className="auth-field">
                <span>验证码</span>
                <input value={smsCode} onChange={(event) => setSmsCode(event.target.value)} placeholder="请输入短信验证码" />
              </label>
              <button type="button" className="btn btn-secondary auth-submit" disabled={smsSending} onClick={() => void handleSendSmsCode()}>
                {smsSending ? '发送中...' : '发送验证码'}
              </button>
              <button type="button" className="btn btn-primary auth-submit" disabled={smsLoading} onClick={() => void handleSmsLogin()}>
                {smsLoading ? '登录中...' : '短信登录'}
              </button>
            </div>
          ) : null}

          {mode === 'wechat' ? (
            <div className="auth-form-body">
              <div className="auth-alert">{wechatMessage}</div>
              <button type="button" className="btn btn-primary auth-submit" disabled={wechatLoading} onClick={() => void handleWechatLogin(true)}>
                {wechatLoading ? '打开中...' : '重新打开微信登录'}
              </button>
            </div>
          ) : null}

          <div className="auth-shortcuts">
            {mode !== 'password' ? (
              <Link to={passwordLoginHref} className="btn btn-secondary btn-sm">
                密码登录
              </Link>
            ) : null}
            <a href={wechatLoginHref} className="btn btn-secondary btn-sm">
              微信登录
            </a>
            <a href={smsLoginHref} className="btn btn-secondary btn-sm">
              短信登录
            </a>
            <Link to={registerHref} className="btn btn-secondary btn-sm">
              立即注册
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
