import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { AdminGlyph } from '../../components/AdminGlyph';
import { resolveThemeMode, setPreferredThemeMode, subscribeThemeMode } from '../../themePreference';

type LoginStatus =
  | { tone: 'error' | 'success'; message: string }
  | { tone: null; message: '' };

const emptyStatus: LoginStatus = { tone: null, message: '' };

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [themeMode, setThemeMode] = useState(resolveThemeMode());
  const [status, setStatus] = useState<LoginStatus>(emptyStatus);

  useEffect(() => subscribeThemeMode(setThemeMode), []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedUsername = username.trim();
    if (!trimmedUsername || !password) {
      setStatus({ tone: 'error', message: '请输入管理员账号和密码。' });
      return;
    }

    setLoading(true);
    setStatus(emptyStatus);

    try {
      const response = (await api.auth.login({
        username: trimmedUsername,
        password,
      })) as {
        success?: boolean;
        data?: { token: string; user: unknown };
        message?: string;
      };

      if (!response.success || !response.data) {
        setStatus({ tone: 'error', message: response.message || '登录失败，请检查账号和密码。' });
        return;
      }

      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setStatus({ tone: 'success', message: '登录成功，正在进入凤煌科技控制台。' });
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      setStatus({
        tone: 'error',
        message: error?.response?.data?.message || '登录失败，请稍后再试。',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    setPreferredThemeMode(nextMode);
  };

  return (
    <div className="admin-login-shell">
      <button type="button" className="admin-theme-toggle" onClick={toggleTheme}>
        <AdminGlyph name={themeMode === 'dark' ? 'sun' : 'moon'} />
        {themeMode === 'dark' ? '浅色' : '深色'}
      </button>

      <div className="admin-login-grid">
        <section className="admin-login-hero">
          <span className="admin-login-badge">
            <AdminGlyph name="shield" />
            Fenghuang Console
          </span>
          <h1 className="admin-login-title">凤煌科技</h1>
          <p className="admin-login-copy">
            凤煌科技统一管理后台，用于查看用户、订单、套餐、时长与运营数据。
            现在登录页不再绑定后台公共组件，手机与桌面都能更轻、更快地进入控制台。
          </p>

          <div className="admin-login-metrics">
            <div className="admin-login-metric">
              <strong>用户</strong>
              查看账号状态、积分、累计付费与邀请链路。
            </div>
            <div className="admin-login-metric">
              <strong>订单</strong>
              统一处理充值单与时长单，追踪支付与来源。
            </div>
            <div className="admin-login-metric">
              <strong>移动端</strong>
              顶栏、侧栏与内容区都已按触控设备重新收口。
            </div>
          </div>
        </section>

        <section className="admin-login-panel">
          <span className="admin-status-pill">内部工作台</span>
          <h2 className="admin-login-panel-title">登录凤煌科技</h2>
          <p className="admin-login-panel-copy">使用管理员账号进入控制台，查看运营数据并处理用户与支付事务。</p>

          <form className="admin-login-form" onSubmit={handleSubmit} autoComplete="off" noValidate>
            <label className="admin-form-field">
              <span className="admin-field-label">账号</span>
              <span className="admin-field-input-wrap">
                <span className="admin-field-icon">
                  <AdminGlyph name="user" />
                </span>
                <input
                  className="admin-field-input"
                  name="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="请输入用户名或邮箱"
                  autoComplete="username"
                />
              </span>
            </label>

            <label className="admin-form-field">
              <span className="admin-field-label">密码</span>
              <span className="admin-field-input-wrap">
                <span className="admin-field-icon">
                  <AdminGlyph name="lock" />
                </span>
                <input
                  className="admin-field-input"
                  type="password"
                  name="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </span>
            </label>

            {status.tone ? (
              <div
                className={[
                  'admin-form-status',
                  status.tone === 'error' ? 'admin-form-status-error' : 'admin-form-status-success',
                ].join(' ')}
              >
                {status.message}
              </div>
            ) : null}

            <button type="submit" className="admin-login-submit" disabled={loading}>
              {loading ? '正在登录...' : '进入后台'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
