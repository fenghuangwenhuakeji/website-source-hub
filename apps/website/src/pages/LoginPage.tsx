import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../store/auth';

const loginSchema = z.object({
  username: z.string().min(1, '请输入账号、邮箱或手机号'),
  password: z.string().min(6, '密码至少需要 6 位'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const wechatLoginHref = resolveDesktopLoginUrl({ mode: 'wechat', from: '/login' });
  const smsLoginHref = resolveDesktopLoginUrl({ mode: 'sms', from: '/login' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/api/auth/login', data);
      const payload = response.data?.data ?? response.data;
      const { user, token, refreshToken } = payload;
      if (!user || !token) {
        throw new Error('Invalid login response');
      }
      setAuth(user, token, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查账号和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="container py-10 sm:py-14">
        <section className="auth-form auth-card auth-card-login glass-card">
          <div className="section-kicker">登录</div>
          <h1 className="auth-title">账号密码登录</h1>
          <p className="auth-form-copy">使用用户名、邮箱或手机号登录。</p>

          <form className="auth-form-body" onSubmit={handleSubmit(onSubmit)}>
            {error ? <div className="auth-alert">{error}</div> : null}

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

          <div className="auth-shortcuts">
            <a href={wechatLoginHref} className="btn btn-secondary btn-sm">
              微信登录
            </a>
            <a href={smsLoginHref} className="btn btn-secondary btn-sm">
              短信登录
            </a>
            <Link to="/register" className="btn btn-secondary btn-sm">
              立即注册
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
