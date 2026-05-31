import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../utils/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSafeReturnPath, openReturnPath } from '../utils/safeReturnPath';

const profileSchema = z.object({
  nickname: z.string().min(2, '昵称至少 2 个字符').max(50, '昵称最多 50 个字符'),
  gender: z.enum(['male', 'female', 'other']).optional(),
  birthday: z.string().optional(),
  location: z.string().max(50, '地址最多50个字符').optional(),
  website: z.string().url('请输入有效的网址').optional().or(z.literal('')),
});

type ProfileForm = z.infer<typeof profileSchema>;
type PhoneFeedback = {
  type: 'info' | 'success' | 'error';
  text: string;
};

const phonePattern = /^1[3-9]\d{9}$/;

function normalizePhone(value: string) {
  return value.replace(/\D/g, '');
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '未记录';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function formatDuration(seconds?: number) {
  if (!seconds || seconds <= 0) {
    return '未开通';
  }

  const days = Math.ceil(seconds / 86400);
  return `${days} 天`;
}

function genderLabel(value?: string | null) {
  switch (value) {
    case 'male':
      return '男';
    case 'female':
      return '女';
    case 'other':
      return '其他';
    default:
      return '未设置';
  }
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, updateUser, setAuth } = useAuthStore();
  const forcePassword = new URLSearchParams(location.search).get('forcePassword') === '1';
  const returnPath = getSafeReturnPath(location.search);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneBinding, setPhoneBinding] = useState(false);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [phoneFeedback, setPhoneFeedback] = useState<PhoneFeedback | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<PhoneFeedback | null>(null);
  const avatarSrc = typeof user?.avatar === 'string' && user.avatar.trim() ? user.avatar.trim() : '';
  const avatarFallback = user?.nickname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '凤';
  const accountLabel = user?.email || user?.phone || user?.username || '官网账号';
  const binding = user?.bindingStatus;
  const duration = user?.duration;
  const accountStats = [
    {
      label: '积分',
      value: String(user?.points ?? 0),
      hint: '充值和兑换记录实时计入',
    },
    {
      label: '微信',
      value: binding?.wechatBound ? '已绑定' : '未绑定',
      hint: binding?.wechatBoundAt ? formatDateTime(binding.wechatBoundAt) : '可通过微信登录绑定',
    },
    {
      label: '手机号',
      value: binding?.phoneBound ? '已绑定' : '未绑定',
      hint: binding?.phoneVerified ? '已验证' : '待验证',
    },
    {
      label: '权益',
      value: duration?.isPermanent ? '永久' : duration?.isActive ? formatDuration(duration.remainingSeconds) : '未开通',
      hint: duration?.expiresAt ? `到期 ${formatDateTime(duration.expiresAt)}` : '可前往订阅与积分开通',
    },
  ];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: user?.nickname || '',
      gender: user?.gender,
      birthday: user?.birthday || '',
      location: user?.location || '',
      website: user?.website || '',
    },
  });

  useEffect(() => {
    if (forcePassword) {
      setPasswordFeedback({
        type: 'info',
        text: '为了降低短信登录成本并保护账号，请先设置登录密码。设置完成后会继续进入原页面。',
      });
    }
  }, [forcePassword]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      try {
        const response = await apiClient.get('/api/auth/profile');
        const profile = response.data?.data ?? response.data;

        if (cancelled || !profile) {
          return;
        }

        updateUser(profile);
        reset({
          nickname: profile.nickname || '',
          gender: profile.gender,
          birthday: profile.birthday || '',
          location: profile.location || '',
          website: profile.website || '',
        });
      } catch (err: any) {
        if (!cancelled) {
          const status = err.response?.status;
          const rawMessage = err.response?.data?.error || err.response?.data?.message || '';
          if (status === 401) {
            setMessage('登录状态已过期，请重新登录。');
            return;
          }
          setMessage(rawMessage || '资料加载失败');
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    };

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [reset, updateUser]);

  useEffect(() => {
    if (phoneCountdown <= 0) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setPhoneCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [phoneCountdown]);

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true);
    setMessage('');

    try {
      const response = await apiClient.put('/api/auth/profile', data);
      const nextUser = response.data?.data ?? response.data;
      updateUser(nextUser);
      setMessage('资料更新成功');
    } catch (err: any) {
      setMessage(err.response?.data?.error || err.response?.data?.message || '更新失败');
    } finally {
      setIsLoading(false);
    }
  };

  const syncProfile = async () => {
    const response = await apiClient.get('/api/auth/profile');
    const profile = response.data?.data ?? response.data;
    if (profile) {
      updateUser(profile);
    }
    return profile;
  };

  const handleSendBindPhoneCode = async () => {
    const normalizedPhone = normalizePhone(phoneNumber);
    setMessage('');
    setPhoneFeedback(null);

    if (!phonePattern.test(normalizedPhone)) {
      setPhoneFeedback({ type: 'error', text: '请输入正确的 11 位手机号。' });
      return;
    }

    setPhoneSending(true);
    setPhoneFeedback({ type: 'info', text: '正在发送验证码，请稍候。' });
    try {
      const response = await apiClient.post('/api/sms/send-code', {
        phoneNumber: normalizedPhone,
        purpose: 'bind_phone',
      });
      const payload = response.data?.data ?? response.data;
      setPhoneNumber(normalizedPhone);
      setPhoneCountdown(60);
      setPhoneFeedback({
        type: 'success',
        text: payload?.code ? `验证码已发送。开发验证码：${payload.code}` : '验证码已发送，请查看短信。',
      });
    } catch (err: any) {
      setPhoneFeedback({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || '验证码发送失败，请稍后再试。',
      });
    } finally {
      setPhoneSending(false);
    }
  };

  const handleBindPhone = async () => {
    const normalizedPhone = normalizePhone(phoneNumber);
    setMessage('');
    setPhoneFeedback(null);

    if (!phonePattern.test(normalizedPhone)) {
      setPhoneFeedback({ type: 'error', text: '请输入正确的 11 位手机号。' });
      return;
    }

    if (!phoneCode.trim()) {
      setPhoneFeedback({ type: 'error', text: '请输入短信验证码。' });
      return;
    }

    setPhoneBinding(true);
    setPhoneFeedback({ type: 'info', text: '正在绑定手机号，请稍候。' });
    try {
      const response = await apiClient.post('/api/auth/bind-phone', {
        phoneNumber: normalizedPhone,
        code: phoneCode.trim(),
      });
      const payload = response.data?.data ?? response.data;
      if (payload?.token && payload?.user) {
        setAuth(payload.user, payload.token, payload.refreshToken ?? '');
      }
      await syncProfile();
      setPhoneNumber('');
      setPhoneCode('');
      setPhoneCountdown(0);
      setPhoneFeedback({ type: 'success', text: response.data?.message || '手机号绑定成功。' });
    } catch (err: any) {
      setPhoneFeedback({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || '手机号绑定失败，请确认验证码后重试。',
      });
    } finally {
      setPhoneBinding(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordFeedback(null);
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: 'error', text: '新密码至少 6 位。' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', text: '两次输入的新密码不一致。' });
      return;
    }

    setPasswordSaving(true);
    try {
      await apiClient.post('/api/auth/change-password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordFeedback({ type: 'success', text: '密码已更新，下次可以直接使用手机号或账号密码登录。' });
      updateUser({ hasPassword: true, mustSetPassword: false });
      if (forcePassword) {
        openReturnPath(returnPath, navigate);
      }
    } catch (err: any) {
      setPasswordFeedback({
        type: 'error',
        text: err.response?.data?.message || err.response?.data?.error || '密码更新失败，请确认当前密码后重试。',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const passwordPanel = (
    <section className={`profile-bind-box${forcePassword ? ' is-unbound' : ''}`}>
      <div className="profile-bind-heading">
        <div>
          <div className="section-kicker">登录方式</div>
          <h2>{forcePassword ? '请先设置登录密码' : '设置登录密码'}</h2>
          <p>
            {forcePassword
              ? '这是首次短信登录后的必要步骤。设置完成后，下次可以直接用手机号和密码登录。'
              : '设置后可用手机号、用户名或邮箱加密码登录，日常登录不再依赖短信验证码。'}
          </p>
        </div>
        <span className="profile-bind-status">{forcePassword ? '必须完成' : '推荐'}</span>
      </div>
      <div className="profile-bind-form">
        <label className="profile-field">
          <span>当前密码</span>
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => {
              setCurrentPassword(event.target.value);
              setPasswordFeedback(null);
            }}
            placeholder="首次设置可留空"
          />
        </label>
        <label className="profile-field">
          <span>新密码</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => {
              setNewPassword(event.target.value);
              setPasswordFeedback(null);
            }}
            placeholder="至少 6 位"
          />
        </label>
        <label className="profile-field">
          <span>确认新密码</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setPasswordFeedback(null);
            }}
            placeholder="再输入一次"
          />
        </label>
        <div className="profile-bind-actions">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleChangePassword}
            disabled={passwordSaving}
          >
            {passwordSaving ? '保存中...' : '保存密码并继续'}
          </button>
        </div>
      </div>
      {passwordFeedback ? (
        <div className={`profile-bind-feedback is-${passwordFeedback.type}`} role="status" aria-live="polite">
          {passwordFeedback.text}
        </div>
      ) : null}
    </section>
  );

  const bindPhonePanel = (
    <section className={`profile-bind-box${binding?.phoneBound ? ' is-bound' : ' is-unbound'}`}>
      <div className="profile-bind-heading">
        <div>
          <div className="section-kicker">账号安全</div>
          <h2>绑定手机号</h2>
          <p>{binding?.phoneBound ? `当前手机号：${user?.phone || '已绑定'}` : '绑定后可以使用短信登录、找回密码，也能作为账号安全校验方式。'}</p>
        </div>
        {binding?.phoneBound ? <span className="profile-bind-status">已绑定</span> : <span className="profile-bind-status">建议完成</span>}
      </div>

      {binding?.phoneBound ? (
        <div className="profile-bind-note">如需更换手机号，请先联系管理员处理。</div>
      ) : (
        <>
          <div className="profile-bind-form">
            <label className="profile-field">
              <span>手机号</span>
              <input
                value={phoneNumber}
                onChange={(event) => {
                  setPhoneNumber(normalizePhone(event.target.value));
                  setPhoneFeedback(null);
                }}
                inputMode="numeric"
                placeholder="输入 11 位手机号"
              />
            </label>
            <label className="profile-field">
              <span>短信验证码</span>
              <input
                value={phoneCode}
                onChange={(event) => {
                  setPhoneCode(event.target.value);
                  setPhoneFeedback(null);
                }}
                inputMode="numeric"
                placeholder="输入验证码"
              />
            </label>
            <div className="profile-bind-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSendBindPhoneCode}
                disabled={phoneSending || phoneCountdown > 0}
              >
                {phoneSending ? '发送中...' : phoneCountdown > 0 ? `${phoneCountdown}s 后重发` : '发送验证码'}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleBindPhone}
                disabled={phoneBinding}
              >
                {phoneBinding ? '绑定中...' : '绑定手机号'}
              </button>
            </div>
          </div>
          {phoneFeedback ? (
            <div className={`profile-bind-feedback is-${phoneFeedback.type}`} role="status" aria-live="polite">
              {phoneFeedback.text}
            </div>
          ) : null}
        </>
      )}
    </section>
  );

  return (
    <div className="page-shell profile-shell">
      <div className="container py-10 sm:py-14">
        <section className="profile-hero">
          <div className="profile-identity">
            <div className="profile-avatar" aria-hidden="true">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <span>{avatarFallback}</span>
            </div>
            <div>
              <div className="section-kicker">个人设置</div>
              <h1 className="profile-title">{user?.nickname || '官网用户'}</h1>
              <p className="profile-subtitle">{accountLabel}</p>
            </div>
          </div>
          {!forcePassword ? (
            <div className="profile-hero-actions">
              <Link to="/recharge" className="btn btn-primary btn-sm">
                订阅与积分
              </Link>
              <Link to="/dashboard" className="btn btn-secondary btn-sm">
                返回工作台
              </Link>
            </div>
          ) : null}
        </section>

        {!forcePassword ? (
          <div className="profile-stats">
            {accountStats.map((item) => (
              <section key={item.label} className="profile-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.hint}</small>
              </section>
            ))}
          </div>
        ) : null}

        {forcePassword ? passwordPanel : bindPhonePanel}

        {!forcePassword ? passwordPanel : null}

        {!forcePassword ? (
        <div className="profile-layout">
          <section className="profile-panel profile-form-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>基础资料</h2>
                <p>用于个人资料与账号信息展示。</p>
              </div>
            </div>

          {message && (
            <div className="profile-alert">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="profile-form">
            <div className="profile-avatar-row">
              <div className="profile-avatar profile-avatar-small" aria-hidden="true">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                ) : null}
                <span>{avatarFallback}</span>
              </div>
              <div className="profile-avatar-copy">
                <strong>{avatarSrc ? '微信头像已同步' : '当前使用昵称头像'}</strong>
                <span>{avatarSrc ? '头像来自微信授权资料。' : '微信登录后可同步头像。'}</span>
              </div>
            </div>

            <label className="profile-field profile-field-wide">
              <span>昵称</span>
              <input
                {...register('nickname')}
                type="text"
              />
              {errors.nickname && (
                <small>{errors.nickname.message}</small>
              )}
            </label>

            <div className="profile-form-grid">
              <label className="profile-field">
                <span>性别</span>
                <select
                  {...register('gender')}
                >
                  <option value="">未设置</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </label>

              <label className="profile-field">
                <span>生日</span>
                <input
                  {...register('birthday')}
                  type="date"
                />
              </label>
            </div>

            <label className="profile-field profile-field-wide">
              <span>所在地</span>
              <input
                {...register('location')}
                type="text"
                placeholder="你所在的城市"
              />
            </label>

            <label className="profile-field profile-field-wide">
              <span>个人网站</span>
              <input
                {...register('website')}
                type="text"
                placeholder="https://你的站点.com"
              />
              {errors.website && (
                <small>{errors.website.message}</small>
              )}
            </label>

            <div className="profile-form-footer">
              <p>
                {isFetching ? '正在同步账号资料...' : isDirty ? '有未保存的更改' : '所有更改已保存'}
              </p>
              <button
                type="submit"
                disabled={isLoading || isFetching || !isDirty}
                className="btn btn-primary disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存更改'}
              </button>
            </div>
          </form>
          </section>

          <aside className="profile-panel profile-side-panel">
            <div className="profile-panel-heading">
              <div>
                <h2>账号状态</h2>
                <p>登录方式、手机号与订阅权益概览。</p>
              </div>
            </div>

            <div className="profile-status-list">
              <div>
                <span>账号 ID</span>
                <strong>{user?.id || '-'}</strong>
              </div>
              <div>
                <span>用户名</span>
                <strong>{user?.username || '-'}</strong>
              </div>
              <div>
                <span>展示性别</span>
                <strong>{genderLabel(user?.gender)}</strong>
              </div>
              <div>
                <span>邀请码</span>
                <strong>{user?.referralCode || '未生成'}</strong>
              </div>
              <div>
                <span>最近登录</span>
                <strong>{formatDateTime(user?.lastLoginAt)}</strong>
              </div>
              <div>
                <span>创建时间</span>
                <strong>{formatDateTime(user?.createdAt)}</strong>
              </div>
            </div>

            <div className="profile-side-actions">
              <Link to="/dashboard" className="btn btn-primary btn-sm">
                进入工作台
              </Link>
              <Link to="/recharge" className="btn btn-secondary btn-sm">
                订阅与积分
              </Link>
              <Link to="/showcase" className="btn btn-secondary btn-sm">
                查看展示
              </Link>
            </div>
          </aside>
        </div>
        ) : null}
      </div>
    </div>
  );
}
