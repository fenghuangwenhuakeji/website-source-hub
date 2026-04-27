import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { WeChatGroupPromo } from '../components/WeChatGroupPromo';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../store/auth';
import { buildPathWithFrom, getSafeReturnPath, openReturnPath } from '../utils/safeReturnPath';

const registerSchema = z
  .object({
    username: z.string().min(3, '用户名至少需要 3 位').max(20, '用户名最多 20 位'),
    nickname: z.string().min(2, '昵称至少需要 2 位').max(20, '昵称最多 20 位'),
    email: z.string().email('请输入正确的邮箱').optional().or(z.literal('')),
    phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入正确的手机号').optional().or(z.literal('')),
    password: z.string().min(6, '密码至少需要 6 位'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '两次输入的密码不一致',
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const returnPath = getSafeReturnPath(location.search);
  const wechatLoginHref = buildPathWithFrom('/login?mode=wechat', returnPath);
  const smsLoginHref = buildPathWithFrom('/login?mode=sms', returnPath);
  const loginHref = buildPathWithFrom('/login', returnPath);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/register', {
        username: data.username,
        nickname: data.nickname,
        email: data.email || undefined,
        phone: data.phone || undefined,
        password: data.password,
      });

      const payload = response.data?.data ?? response.data;
      const { user, token, refreshToken } = payload;
      if (!user || !token) {
        throw new Error('Invalid register response');
      }
      setAuth(user, token, refreshToken);
      openReturnPath(returnPath, navigate);
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败，请稍后再试');
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
                  <input {...register('phone')} placeholder="可选" />
                  {errors.phone ? <small>{errors.phone.message}</small> : null}
                </label>
              </div>

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
