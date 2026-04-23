import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../utils/api';

interface Stats {
  novels: { total: number; views: number };
  chapters: number;
  bookmarks: number;
  likes: number;
  comments: number;
}


const workshopCards = [
  {
    title: '剧本写作线',
    description: '从幕结构、场景目标、对白和排演推进脚本。',
    to: '/writing?type=script',
    cta: '进入剧本写作',
  },
  {
    title: '分镜规划线',
    description: '从镜头顺序、转场节拍和视觉线索推进画面流程。',
    to: '/writing?type=storyboard',
    cta: '进入分镜线',
  },
  {
    title: '作品展示',
    description: '查看已经整理好的展示入口与对外演示页面。',
    to: '/showcase',
    cta: '查看展示页',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    apiClient.get('/api/users/stats').then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="page-shell dashboard-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="section-kicker">剧本工坊</div>
              <h1 className="page-title mt-4">
                把剧本、分镜、镜头和排演放进一条独立产品线里
              </h1>
              <p className="page-lead mt-4">
                欢迎回来，{user?.nickname ?? '创作者'}。这里只服务脚本流程，不承接小说卷章创作。官网入口、CTA 和工作台都直接指向剧本工坊，不再把它当作小说助手的附属跳转页。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/writing?type=script" className="btn btn-primary">
                  进入剧本写作
                </Link>
                <Link to="/writing?type=storyboard" className="btn btn-secondary">
                  进入分镜线
                </Link>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fh-text-muted)]">
                独立边界
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                <p>小说助手处理长文本创作，剧本工坊只处理剧本、分镜、镜头和排演流程。</p>
                <p>官网里的剧本入口、展示卡片和 CTA 直接指向剧本工坊，不再借小说产品说明绕过去。</p>
                <p>剧本写作和分镜规划并列保留，同属剧本工坊，但不和小说路径混在一起。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="assistant-kpi-grid">
          <div className="assistant-kpi">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fh-text-muted)]">账户项目</p>
                <p className="mt-2 text-3xl font-black text-[var(--fh-text)]">{stats?.novels.total || 0}</p>
              </div>
              <span className="text-2xl text-[var(--fh-text-muted)]">Proj</span>
            </div>
          </div>

          <div className="assistant-kpi">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fh-text-muted)]">累计访问</p>
                <p className="mt-2 text-3xl font-black text-[var(--fh-text)]">{stats?.novels.views || 0}</p>
              </div>
              <span className="text-2xl text-[var(--fh-text-muted)]">View</span>
            </div>
          </div>

          <div className="assistant-kpi">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fh-text-muted)]">收藏</p>
                <p className="mt-2 text-3xl font-black text-[var(--fh-text)]">{stats?.bookmarks || 0}</p>
              </div>
              <span className="text-2xl text-[var(--fh-text-muted)]">Save</span>
            </div>
          </div>

          <div className="assistant-kpi">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--fh-text-muted)]">点赞</p>
                <p className="mt-2 text-3xl font-black text-[var(--fh-text)]">{stats?.likes || 0}</p>
              </div>
              <span className="text-2xl text-[var(--fh-text-muted)]">Like</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="glass-card p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="section-kicker">剧本工坊入口</div>
                <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">当前可继续推进的工作线</h2>
              </div>
              <Link to="/writing?type=script" className="hero-panel-link">
                直接进入剧本工坊
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {workshopCards.map((card) => (
                <article key={card.title} className="glass-card p-5">
                  <div className="text-sm font-semibold text-[var(--fh-text)]">{card.title}</div>
                  <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">{card.description}</p>
                  <Link to={card.to} className="btn btn-primary mt-5 inline-block">
                    {card.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <aside className="glass-card p-6">
            <div className="section-kicker">继续推进</div>
            <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">本轮 CTA</h2>
            <div className="mt-6 space-y-3">
              <Link
                to="/writing?type=script"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">01</span>
                <span>新建剧本项目</span>
              </Link>
              <Link
                to="/writing?type=storyboard"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">02</span>
                <span>新建分镜项目</span>
              </Link>
              <Link
                to="/showcase"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">03</span>
                <span>查看作品展示</span>
              </Link>
              <Link
                to="/#contact"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">04</span>
                <span>联系合作</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
