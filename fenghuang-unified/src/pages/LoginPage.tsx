import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
      navigate('/writing');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败，请检查账号和密码');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="container py-10 sm:py-14">
        <div className="auth-grid">
          <section className="auth-panel glass-card order-2 lg:order-1">
            <div className="section-kicker">官网登录</div>
            <h1 className="auth-title">先登录，再进入官网内容与写作入口</h1>
            <p className="auth-copy">
              官网登录页保留独立界面，但账号体系和主程序共用同一套后端。登录后你可以继续进入官网写作页，也可以再跳到桌面系统。
            </p>

            <div className="auth-highlights">
              <div className="auth-highlight">
                <strong>官网独立界面</strong>
                <span>官网保持自己的登录布局和内容节奏，不直接并入主程序页面。</span>
              </div>
              <div className="auth-highlight">
                <strong>同一账号体系</strong>
                <span>账号、密码和后端认证继续和主程序共用，不会分裂成两套用户系统。</span>
              </div>
              <div className="auth-highlight">
                <strong>桌面系统入口</strong>
                <span>如果你要直接进入桌面系统，仍然可以从官网里的“桌面登录”按钮跳过去。</span>
              </div>
            </div>
          </section>

          <section className="auth-form glass-card order-1 lg:order-2">
            <div className="section-kicker">登录</div>
            <h2 className="auth-form-title">进入凤煌科技官网</h2>
            <p className="auth-form-copy">使用你的用户名、邮箱或手机号登录。</p>

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
                {isLoading ? '登录中...' : '登录并进入官网'}
              </button>
            </form>

            <div className="auth-footer-note">
              还没有账号？
              <Link to="/register">立即注册</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
