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

const focusTags = ['剧本', '分镜', '镜头', '排演'];

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
    <div className="page-shell dashboard-shell bg-[#0b0f17]">
      <div className="mx-auto max-w-7xl px-4 py-10 pb-16 sm:px-6 sm:py-14 lg:px-8">
        <section className="mb-10 overflow-hidden rounded-[32px] border border-slate-700/40 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_42%),linear-gradient(140deg,#0f172a_0%,#111827_45%,#020617_100%)] p-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.35)]">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/80">
                剧本工坊
              </div>
              <h1 className="mt-5 text-3xl font-black leading-tight sm:text-4xl">
                把剧本、分镜、镜头和排演放进一条独立产品线里
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/75 sm:text-base">
                欢迎回来，{user?.nickname ?? '创作者'}。这里只服务脚本流程，不承接小说卷章创作。官网入口、CTA 和工作台都直接指向剧本工坊，不再把它当作小说助手的附属跳转页。
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {focusTags.map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/85">
                    {item}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/writing?type=script"
                  className="inline-flex items-center rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
                >
                  进入剧本写作
                </Link>
                <Link
                  to="/writing?type=storyboard"
                  className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  进入分镜线
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/12 bg-white/8 p-5 backdrop-blur">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/55">独立边界</div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-white/75">
                <p>小说助手处理长文本创作，剧本工坊只处理剧本、分镜、镜头和排演流程。</p>
                <p>官网里的剧本入口、展示卡片和 CTA 直接指向剧本工坊，不再借小说产品说明绕过去。</p>
                <p>剧本写作和分镜规划并列保留，同属剧本工坊，但不和小说路径混在一起。</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-slate-800 bg-[#121826] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">账户项目</p>
                <p className="mt-2 text-3xl font-black text-white">{stats?.novels.total || 0}</p>
              </div>
              <span className="text-4xl opacity-60">🗂️</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#121826] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">累计访问</p>
                <p className="mt-2 text-3xl font-black text-white">{stats?.novels.views || 0}</p>
              </div>
              <span className="text-4xl opacity-60">👁️</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#121826] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">收藏</p>
                <p className="mt-2 text-3xl font-black text-white">{stats?.bookmarks || 0}</p>
              </div>
              <span className="text-4xl opacity-60">⭐</span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-[#121826] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">点赞</p>
                <p className="mt-2 text-3xl font-black text-white">{stats?.likes || 0}</p>
              </div>
              <span className="text-4xl opacity-60">👍</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-[30px] border border-slate-800 bg-[#121826] p-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">剧本工坊入口</div>
                <h2 className="mt-2 text-2xl font-black text-white">当前可继续推进的工作线</h2>
              </div>
                <Link to="/writing?type=script" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
                  直接进入剧本工坊
                </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {workshopCards.map((card) => (
                <article key={card.title} className="rounded-[24px] border border-slate-700 bg-[#1a2233] p-5">
                  <div className="text-sm font-semibold text-white">{card.title}</div>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{card.description}</p>
                  <Link
                    to={card.to}
                    className="mt-5 inline-flex items-center rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-white"
                  >
                    {card.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <aside className="rounded-[30px] border border-slate-800 bg-[#121826] p-6">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">继续推进</div>
            <h2 className="mt-2 text-2xl font-black text-white">本轮 CTA</h2>
            <div className="mt-6 space-y-3">
              <Link
                to="/writing?type=script"
                className="flex items-center rounded-2xl bg-[#1a2233] p-4 text-white transition hover:bg-[#222d43]"
              >
                <span className="mr-3 text-2xl">✍️</span>
                <span>新建剧本项目</span>
              </Link>
              <Link
                to="/writing?type=storyboard"
                className="flex items-center rounded-2xl bg-[#1a2233] p-4 text-white transition hover:bg-[#222d43]"
              >
                <span className="mr-3 text-2xl">🎬</span>
                <span>新建分镜项目</span>
              </Link>
              <Link
                to="/showcase"
                className="flex items-center rounded-2xl bg-[#1a2233] p-4 text-white transition hover:bg-[#222d43]"
              >
                <span className="mr-3 text-2xl">🖼️</span>
                <span>查看作品展示</span>
              </Link>
              <Link
                  to="/#contact"
                className="flex items-center rounded-2xl bg-[#1a2233] p-4 text-white transition hover:bg-[#222d43]"
              >
                <span className="mr-3 text-2xl">🤝</span>
                <span>联系合作</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
