import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { ShowcaseApp } from '../data/showcaseApps';
import { showcaseApps } from '../data/showcaseApps';

type ShowcaseGroup = {
  category: string;
  apps: ShowcaseApp[];
};

function isExternalUrl(url: string) {
  return /^https?:\/\//i.test(url);
}

function OpenLink({
  url,
  className,
  children,
  ariaLabel,
  newTab = false,
}: {
  url: string;
  className: string;
  children: ReactNode;
  ariaLabel: string;
  newTab?: boolean;
}) {
  if (isExternalUrl(url) || newTab) {
    return (
      <a
        href={url}
        className={className}
        aria-label={ariaLabel}
        target={newTab || isExternalUrl(url) ? '_blank' : undefined}
        rel={newTab || isExternalUrl(url) ? 'noreferrer' : undefined}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={url} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

const capabilityRows = [
  '桌面开发',
  '小说写作',
  '漫剧剧本',
  '分镜视频制作',
  '网页软件编程',
  '游戏开发',
  '共创合作',
];

export default function AppsShowcasePage() {
  const featuredApps = showcaseApps.filter((app) => app.featured);
  const catalogGroups = showcaseApps.reduce<ShowcaseGroup[]>((groups, app) => {
    const currentGroup = groups.find((group) => group.category === app.category);
    if (currentGroup) {
      currentGroup.apps.push(app);
      return groups;
    }

    groups.push({
      category: app.category,
      apps: [app],
    });
    return groups;
  }, []);

  return (
    <div className="page-shell showcase-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-card rounded-[32px] p-6 sm:p-8 premium-hero-card">
          <div className="page-hero-grid showcase-hero-grid">
            <div>
              <div className="section-kicker">精选代表作</div>
              <h1 className="page-title mt-4">把我们真正拿得出手的应用，堂堂正正摆上台面。</h1>
              <p className="page-lead mt-4">
                这里不是功能目录，而是凤凰体系里最值得先被看见的一批作品。
                第一眼先看 Edit Code · 凤凰早期合集，再看凤煌创世合集、中短篇创作、短篇拆书版，
                以及官网正在持续生长的小说助手与剧本工坊。
              </p>
              <div className="mt-6 flex flex-wrap gap-3 showcase-top-actions">
                <Link to="/" className="btn btn-primary showcase-return-link">
                  返回主页
                </Link>
                <a href="/#contact" className="btn btn-secondary">
                  联系合作
                </a>
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-xs text-slate-500">
                {capabilityRows.map((item) => (
                  <span key={item} className="rounded-full bg-white/80 px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="showcase-highlight premium-float">
              <div className="showcase-stage-label">作品主舞台</div>
              <h2>{showcaseApps.length} 个核心展示位</h2>
              <p>
                从桌面旗舰到在线工坊，我们把最能代表审美、能力和完成度的产品，压缩成这一页的主陈列。
              </p>
            </div>
          </div>
        </section>

        <section id="showcase-featured" className="glass-card rounded-[32px] p-6 sm:p-8 premium-featured-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-kicker">头牌顺序</div>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">先看最值得被记住的那几件作品</h2>
              <p className="mt-2 text-sm text-slate-600">
                这一排不是凑数卡片，而是我们整个体系里最适合拿去推广、演示和被人一眼记住的产品。
              </p>
            </div>
            <div className="text-sm text-slate-500">精选 {featuredApps.length} 项</div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredApps.map((app) => (
              <article key={app.id} className="rounded-[26px] border border-white/70 bg-white/90 p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="chip">{app.category}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{app.status}</span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-slate-900">{app.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{app.description}</p>
                <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                  {app.featuredReason}
                </p>
                <div className="chip-row mt-4">
                  {app.features.map((feature) => (
                    <span key={`${app.id}-${feature}`} className="chip">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
                  {app.pageUrl}
                </div>
                <div className="mt-5 flex gap-3">
                  <OpenLink url={app.pageUrl} className="btn btn-primary flex-1" ariaLabel={`打开 ${app.title}`}>
                    直接打开
                  </OpenLink>
                  <OpenLink
                    url={app.pageUrl}
                    className="btn btn-secondary flex-1"
                    ariaLabel={`新标签打开 ${app.title}`}
                    newTab
                  >
                    新标签
                  </OpenLink>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="showcase-catalog" className="showcase-display-wall showcase-display-wall--studio">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="section-kicker">完整陈列</div>
              <h2 className="text-2xl font-bold text-slate-900">从桌面旗舰到在线工坊，完整看一遍我们的产品面孔</h2>
              <p className="mt-2 text-sm text-slate-600">
                这一页负责展示我们已经做出来、并且值得被推广的应用。你看到的不只是页面，而是一整套正在成形的产品谱系。
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-500 showcase-catalog-actions">
              <a href="/#contact" className="showcase-inline-link">
                发起合作
              </a>
              <Link to="/" className="showcase-inline-link showcase-return-link">
                返回主页
              </Link>
            </div>
          </div>

          <div className="space-y-8">
            {catalogGroups.map((group, groupIndex) => (
              <section key={group.category} id={`catalog-group-${groupIndex}`} className="space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <div className="section-kicker">{group.category}</div>
                    <h3 className="text-xl font-bold text-slate-900">
                      {group.category} · {group.apps.length} 项
                    </h3>
                  </div>
                  <a href="/#contact" className="text-sm text-slate-500 hover:text-slate-700">
                    发起合作
                  </a>
                </div>

                <div className="showcase-grid showcase-grid--editorial">
                  {group.apps.map((app, index) => (
                    <article key={app.id} className="showcase-card">
                      <div className="showcase-card-glow" />
                      <div className="showcase-card-top">
                        <span className="showcase-index">{String(index + 1).padStart(2, '0')}</span>
                        <div className="flex items-center gap-2">
                          {app.featured ? <span className="novel-status">精选</span> : null}
                          <span className="novel-status">{app.status}</span>
                        </div>
                      </div>
                      <div className="showcase-card-body">
                        <span className="chip">{app.category}</span>
                        <h2>{app.title}</h2>
                        <p>{app.description}</p>
                        <div className="chip-row">
                          {app.features.map((feature) => (
                            <span key={feature} className="chip">
                              {feature}
                            </span>
                          ))}
                        </div>
                        <div className="mt-4 rounded-2xl border border-dashed border-white/50 bg-white/60 px-3 py-2 font-mono text-xs text-slate-500">
                          {app.pageUrl}
                        </div>
                      </div>
                      <div className="showcase-app-actions">
                        <OpenLink url={app.pageUrl} className="btn btn-primary" ariaLabel={`打开 ${app.title}`}>
                          直接打开
                        </OpenLink>
                        <OpenLink
                          url={app.pageUrl}
                          className="btn btn-secondary"
                          ariaLabel={`新标签打开 ${app.title}`}
                          newTab
                        >
                          新标签
                        </OpenLink>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
