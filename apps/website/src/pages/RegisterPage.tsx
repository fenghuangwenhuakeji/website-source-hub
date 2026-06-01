import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  AUTH_ENDPOINTS,
  buildRegisterPayload,
  buildSendPhoneCodePayload,
  extractAuthSession,
  normalizeAuthError,
} from '@fhwh/shared/utils/auth';
import { WeChatGroupPromo } from '../components/WeChatGroupPromo';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom, getSafeReturnPath, openReturnPath } from '../utils/safeReturnPath';

const registerSchema = z
  .object({
    username: z.string().min(3, '用户名至少需要 3 位').max(20, '用户名最多 20 位'),
    nickname: z.string().min(2, '昵称至少需要 2 位').max(20, '昵称最多 20 位'),
    email: z.string().email('请输入正确的邮箱').optional().or(z.literal('')),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号'),
    phoneCode: z.string().regex(/^\d{6}$/, '请输入 6 位短信验证码'),
    password: z.string().min(6, '密码至少需要 6 位'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  });

type RegisterForm = z.infer<typeof registerSchema>;

function normalizeRegisterError(error: any) {
  const code = String(error?.response?.data?.code || error?.code || '').trim();
  if (code) {
    return normalizeAuthError(error, '注册失败，请稍后再试');
  }

  const rawMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    '';

  const message = String(rawMessage);
  if (!message) return '注册失败，请稍后再试';
  if (message.includes('must bind a phone number') || message.includes('Phone registration requires')) {
    return '注册需要先填写手机号并完成短信验证码验证。';
  }
  if (message.includes('Invalid phone number')) return '手机号格式不正确。';
  if (message.includes('verification') || message.includes('Verification')) return '短信验证码不正确或已过期，请重新获取。';
  if (message.includes('already exists')) return '用户名、手机号、邮箱或微信账号已存在，请更换后再试。';
  if (message.includes('too frequently') || message.includes('Sending too frequently')) return '验证码发送太频繁，请稍后再试。';
  if (message.includes('Invalid request parameters')) return '提交信息不完整，请检查后再试。';
  if (message.includes('Invalid register response')) return '注册成功返回异常，请刷新后尝试登录。';
  return message;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const returnPath = getSafeReturnPath(location.search);
  const wechatLoginHref = buildPathWithFrom('/login?mode=wechat', returnPath);
  const smsLoginHref = buildPathWithFrom('/login?mode=sms', returnPath);
  const loginHref = buildPathWithFrom('/login', returnPath);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => Math.max(value - 1, 0)), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const sendRegisterPhoneCode = async (phoneNumber: string) => {
    try {
      return await apiClient.post(
        AUTH_ENDPOINTS.sendPhoneCode,
        buildSendPhoneCodePayload({ phoneNumber, purpose: 'register' }),
      );
    } catch (error) {
      return await apiClient.post('/api/sms/send-code', {
        phoneNumber,
        purpose: 'register',
      });
    }
  };

  const handleSendCode = async () => {
    const phone = getValues('phone')?.trim();
    setError('');
    setNotice('');

    if (!/^1[3-9]\d{9}$/.test(phone || '')) {
      setError('请先填写正确的手机号。');
      return;
    }

    try {
      setIsSendingCode(true);
      const response = await sendRegisterPhoneCode(phone);

      if (response.data?.success === false) {
        throw new Error(response.data?.message || '验证码发送失败');
      }

      setNotice('验证码已发送，请查看手机短信。');
      setCountdown(60);
    } catch (err: any) {
      setError(normalizeRegisterError(err) || '验证码发送失败，请稍后再试');
    } finally {
      setIsSendingCode(false);
    }
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');
    setNotice('');

    try {
      const response = await apiClient.post('/api/auth/register', buildRegisterPayload({
        username: data.username,
        password: data.password,
        nickname: data.nickname,
        email: data.email || undefined,
        phone: data.phone,
        phoneCode: data.phoneCode,
      }));

      const session = extractAuthSession(response.data);
      if (!session) {
        throw new Error('Invalid register response');
      }
      setAuth(session.user, session.tokens.token, session.tokens.refreshToken);
      openReturnPath(returnPath, navigate);
    } catch (err: any) {
      setError(normalizeRegisterError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="container py-10 sm:py-14">
        <div className="auth-register-layout">
          <section className="auth-form auth-card auth-card-register glass-card">
            <div className="section-kicker">注册</div>
            <h1 className="auth-title">创建凤煌账号</h1>
            <p className="auth-form-copy">填写基础信息后即可完成注册，随后可进入官网工作台体验完整功能。</p>

            <form className="auth-form-body" onSubmit={handleSubmit(onSubmit)}>
              {error ? <div className="auth-alert">{error}</div> : null}
              {notice ? <div className="auth-alert auth-alert-success">{notice}</div> : null}

              <div className="auth-grid-two">
                <label className="auth-field">
                  <span>用户名</span>
                  <input {...register('username')} placeholder="3-20 位" />
                  {errors.username ? <small>{errors.username.message}</small> : null}
                </label>

                <label className="auth-field">
                  <span>昵称</span>
                  <input {...register('nickname')} placeholder="显示名称" />
                  {errors.nickname ? <small>{errors.nickname.message}</small> : null}
                </label>
              </div>

              <div className="auth-grid-two">
                <label className="auth-field">
                  <span>邮箱</span>
                  <input {...register('email')} placeholder="可选" />
                  {errors.email ? <small>{errors.email.message}</small> : null}
                </label>

                <label className="auth-field">
                  <span>手机号</span>
                  <input {...register('phone')} placeholder="用于接收注册验证码" />
                  {errors.phone ? <small>{errors.phone.message}</small> : null}
                </label>
              </div>

              <label className="auth-field">
                <span>短信验证码</span>
                <div className="auth-code-row">
                  <input {...register('phoneCode')} placeholder="请输入 6 位验证码" />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    disabled={isSendingCode || countdown > 0}
                    onClick={() => void handleSendCode()}
                  >
                    {countdown > 0 ? `${countdown}s 后重发` : isSendingCode ? '发送中...' : '发送验证码'}
                  </button>
                </div>
                {errors.phoneCode ? <small>{errors.phoneCode.message}</small> : null}
              </label>

              <div className="auth-grid-two">
                <label className="auth-field">
                  <span>密码</span>
                  <input {...register('password')} type="password" placeholder="至少 6 位" />
                  {errors.password ? <small>{errors.password.message}</small> : null}
                </label>

                <label className="auth-field">
                  <span>确认密码</span>
                  <input {...register('confirmPassword')} type="password" placeholder="再输入一次" />
                  {errors.confirmPassword ? <small>{errors.confirmPassword.message}</small> : null}
                </label>
              </div>

              <button type="submit" className="btn btn-primary auth-submit" disabled={isLoading}>
                {isLoading ? '注册中...' : '注册'}
              </button>
            </form>

            <div className="auth-shortcuts">
              <a href={wechatLoginHref} className="btn btn-secondary btn-sm">
                微信登录
              </a>
              <a href={smsLoginHref} className="btn btn-secondary btn-sm">
                短信登录
              </a>
              <Link to={loginHref} className="btn btn-secondary btn-sm">
                返回登录
              </Link>
            </div>
          </section>

          <aside className="auth-register-aside">
            <WeChatGroupPromo variant="register" autoOpen sessionKey="" />
          </aside>
        </div>
      </div>
    </div>
  );
}
