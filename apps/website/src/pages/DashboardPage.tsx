import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';
import { apiClient } from '../utils/api';

const desktopDownloadUrl = resolveDesktopDownloadUrl();

const workspaceCards = [
  {
    title: '下载桌面端',
    description: '真正承接完整创作流程的桌面工作台，适合继续写作、整理项目和本地联动。',
    href: desktopDownloadUrl,
    cta: '立即下载桌面端',
    featured: true,
  },
  {
    title: '小说展示',
    description: '浏览官网里的小说作品、题材样稿和展示页面，不作为完整创作工具使用。',
    to: '/novels',
    cta: '查看小说展示',
  },
  {
    title: '剧本展示',
    description: '查看剧本方向、分场结构和镜头化表达的展示页面。',
    to: '/writing?type=script',
    cta: '查看剧本展示',
  },
  {
    title: '分镜规划',
    description: '梳理镜头顺序、画面节奏和视觉线索。',
    to: '/writing?type=storyboard',
    cta: '进入分镜规划',
  },
  {
    title: '作品展示',
    description: '查看官网展示页与已经整理好的作品入口。',
    to: '/showcase',
    cta: '查看展示页',
  },
  {
    title: '订阅与积分',
    description: '开通订阅、补充积分，并查询充值记录。',
    to: '/recharge',
    cta: '管理订阅积分',
  },
  {
    title: '桌面端说明',
    description: '不确定该点哪里时，先下载桌面端；官网页主要负责展示和账号分发。',
    href: desktopDownloadUrl,
    cta: '桌面端使用说明',
  },
].map((card) => ({ ...card, featured: 'featured' in card ? card.featured : false }));

function formatSubscriptionHint(duration?: {
  isActive?: boolean;
  isPermanent?: boolean;
  remainingSeconds?: number;
  expiresAt?: string | null;
  canEnter?: boolean;
}) {
  if (duration?.isPermanent) {
    return {
      value: '永久',
      hint: '已开通永久权益',
    };
  }

  if (duration?.isActive || duration?.canEnter) {
    const remainingDays = duration.remainingSeconds
      ? Math.max(1, Math.ceil(duration.remainingSeconds / 86400))
      : null;

    return {
      value: '已订阅',
      hint: remainingDays ? `剩余约 ${remainingDays} 天` : '权益有效中',
    };
  }

  return {
    value: '未订阅',
    hint: '可按需开通权益',
  };
}

export default function DashboardPage() {
  const { user, updateUser } = useAuthStore();
  const subscription = formatSubscriptionHint(user?.duration);
  const roleLabel =
    user?.role && ['admin', 'rootadmin', 'super_admin'].includes(String(user.role).toLowerCase())
      ? '管理账号'
      : '官网账号';
  const accountLabel = user?.email || user?.phone || user?.username || '官网账号已连接';

  useEffect(() => {
    let cancelled = false;

    const syncProfile = async () => {
      try {
        const response = await apiClient.get('/api/auth/profile');
        const profile = response.data?.data ?? response.data;
        if (!cancelled && profile) {
          updateUser(profile);
        }
      } catch {
        // Keep the locally cached user snapshot if profile sync fails.
      }
    };

    void syncProfile();

    return () => {
      cancelled = true;
    };
  }, [updateUser]);

  const summaryCards = [
    {
      label: '当前身份',
      value: user?.nickname ?? '官网用户',
      hint: '欢迎回来',
    },
    {
      label: '账号角色',
      value: roleLabel,
      hint: '官网与桌面端账号互通',
    },
    {
      label: '订阅状态',
      value: subscription.value,
      hint: subscription.hint,
    },
    {
      label: '工作台状态',
      value: '官网已连接',
      hint: '展示浏览可直接使用，完整创作请前往桌面端',
    },
  ];

  return (
    <div className="page-shell dashboard-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="section-kicker">创作入口</div>
              <h1 className="page-title mt-4">
                先下载桌面端，再看官网展示
              </h1>
              <p className="page-lead mt-4">
                官网里的小说页和剧本页更适合展示作品、浏览资料和分发入口，不是完整创作工具。
                如果你要真正继续项目，请优先进入桌面端。
              </p>
              <div className="mt-5 rounded-[24px] border border-[var(--fh-accent)]/20 bg-[var(--fh-accent)]/10 px-4 py-4 text-sm leading-7 text-[var(--fh-text-secondary)]">
                站内最容易被误解的是小说页和剧本页。这里已经调整为展示语义，避免再被当成网页版写作工具。
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <a href={desktopDownloadUrl} className="btn btn-primary">
                  立即下载桌面端
                </a>
                <Link to="/novels" className="btn btn-secondary">
                  查看小说展示
                </Link>
                <Link to="/showcase" className="btn btn-secondary">
                  查看作品展示
                </Link>
                <Link to="/writing?type=script" className="btn btn-secondary">
                  查看剧本展示
                </Link>
                <Link to="/recharge" className="btn btn-secondary">
                  订阅与积分
                </Link>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fh-text-muted)]">
                当前账号
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                <p>{accountLabel}</p>
                <p>当前角色：{roleLabel}</p>
                <p>头像、昵称和基础资料可以在个人设置里维护，创作主流程建议在桌面端继续。</p>
                <div className="pt-2">
                  <a href={desktopDownloadUrl} className="btn btn-primary btn-sm">
                    下载桌面端
                  </a>
                  <Link to="/profile" className="btn btn-secondary btn-sm">
                    打开个人设置
                  </Link>
                  <Link to="/recharge" className="btn btn-secondary btn-sm">
                    订阅与积分
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="assistant-kpi-grid">
          {summaryCards.map((card) => (
            <div key={card.label} className="assistant-kpi">
              <div className="text-left">
                <p className="text-sm text-[var(--fh-text-muted)]">{card.label}</p>
                <p className="mt-2 text-3xl font-black text-[var(--fh-text)]">{card.value}</p>
                <p className="mt-3 text-sm leading-6 text-[var(--fh-text-secondary)]">{card.hint}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="glass-card p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="section-kicker">常用入口</div>
                <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">选择接下来要做的事</h2>
              </div>
              <Link to="/" className="hero-panel-link">
                返回官网首页
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {workspaceCards.map((card) => (
                <article key={card.title} className="glass-card p-5">
                  <div className="text-sm font-semibold text-[var(--fh-text)]">{card.title}</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">{card.description}</p>
                  {'href' in card ? (
                    <a
                      href={card.href}
                      className={`mt-5 inline-block btn ${card.featured ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {card.cta}
                    </a>
                  ) : (
                    <Link
                      to={card.to}
                      className={`mt-5 inline-block btn ${card.featured ? 'btn-primary' : 'btn-secondary'}`}
                    >
                      {card.cta}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="glass-card p-6">
            <div className="section-kicker">下一步</div>
            <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">下一步</h2>
            <div className="mt-6 space-y-3">
              <a
                href={desktopDownloadUrl}
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">01</span>
                <span>下载桌面端</span>
              </a>
              <Link
                to="/profile"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">02</span>
                <span>进入个人设置</span>
              </Link>
              <Link
                to="/recharge"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">03</span>
                <span>管理订阅与积分</span>
              </Link>
              <Link
                to="/showcase"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">04</span>
                <span>查看作品展示</span>
              </Link>
              <Link
                to="/novels"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">05</span>
                <span>查看小说展示</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
