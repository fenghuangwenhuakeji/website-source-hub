import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../utils/api';
import { useAuthStore } from '../store/auth';

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
  const { setAuth } = useAuthStore();
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
      navigate('/writing');
    } catch (err: any) {
      setError(err.response?.data?.error || '注册失败，请稍后再试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-shell auth-shell">
      <div className="container py-10 sm:py-14">
        <div className="auth-grid">
          <section className="auth-panel glass-card order-2 lg:order-1">
            <div className="section-kicker">官网注册</div>
            <h1 className="auth-title">创建官网账号，继续使用同一套凤煌账户</h1>
            <p className="auth-copy">
              官网注册页继续独立保留，但创建出的账号会和主程序共用同一个认证系统，后续进入官网或桌面系统都能直接使用。
            </p>

            <div className="auth-highlights">
              <div className="auth-highlight">
                <strong>官网独立入口</strong>
                <span>官网注册页仍然留在官网，不会直接跳去主程序页面。</span>
              </div>
              <div className="auth-highlight">
                <strong>同一后端认证</strong>
                <span>注册出的账号会直接写入同一套用户系统，后续登录链路保持一致。</span>
              </div>
              <div className="auth-highlight">
                <strong>后续可进入桌面系统</strong>
                <span>注册完成后你可以继续用这个账号进入官网写作区，也可以进入主程序。</span>
              </div>
            </div>
          </section>

          <section className="auth-form glass-card order-1 lg:order-2">
            <div className="section-kicker">注册</div>
            <h2 className="auth-form-title">创建官网账号</h2>
            <p className="auth-form-copy">填写基础资料后即可进入官网写作入口。</p>

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
                {isLoading ? '注册中...' : '注册并进入官网'}
              </button>
            </form>

            <div className="auth-footer-note">
              已经有账号？
              <Link to="/login">返回登录</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
