import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const ease: [number, number, number, number] = [0.16, 1, 0.3, 1];

/* ── Hero variants ── */
const heroContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const heroKicker = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease, delay: 0.1 } },
};

const heroTitleMask = {
  initial: { y: '110%' },
  animate: { y: 0, transition: { duration: 0.9, ease, delay: 0.2 } },
};

const heroLead = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.4 } },
};

const heroButtonContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } },
};

const heroButtonItem = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease } },
};

const heroPanelCard = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.7, ease, delay: 0.5 } },
};

const heroAccentLine = {
  initial: { scaleX: 0 },
  animate: { scaleX: 1, transition: { duration: 0.8, ease, delay: 0.3 } },
};

/* ── Featured variants ── */
const featuredHeader = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease, delay: 0.2 } },
};

const featuredCardContainer = {
  initial: {},
  animate: { transition: { staggerChildren: 0.14, delayChildren: 0.3 } },
};

const featuredCardItem = {
  initial: { opacity: 0, y: 32, filter: 'blur(8px) saturate(0%)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px) saturate(100%)', transition: { duration: 0.85, ease } },
};

/* ── Catalog variants ── */
const catalogHeader = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  viewport: { once: true, margin: '-80px' },
};

const catalogGroupHeader = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  viewport: { once: true, margin: '-80px' },
};

const catalogStripContainer = {
  initial: 'initial',
  whileInView: 'animate',
  viewport: { once: true, margin: '-80px' },
};

const catalogStripItem = {
  initial: { opacity: 0, x: -20, skewY: 1.5 },
  animate: { opacity: 1, x: 0, skewY: 0, transition: { duration: 0.6, ease } },
};

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
      {/* Atmospheric background */}
      <div className="showcase-bg-aura" />
      <div className="showcase-bg-grid" />

      <div className="container py-10 sm:py-14 space-y-8 relative z-10">
        {/* ── Hero ── */}
        <motion.section
          className="glass-card p-6 sm:p-8 relative overflow-hidden"
          variants={heroContainer}
          initial="initial"
          animate="animate"
        >
          <div className="showcase-hero-grid">
            <div>
              <motion.div variants={heroKicker} className="section-kicker">
                代表作
              </motion.div>

              <h1 className="page-title mt-4">
                <span className="title-line-mask">
                  <motion.span className="title-line" variants={heroTitleMask}>
                    值得记住的面孔
                  </motion.span>
                </span>
              </h1>

              <motion.p variants={heroLead} className="page-lead mt-4">
                非功能目录，乃凤煌体系里真正拿得出手的面孔
                <br />
                从早期技术底座到内容创作中台，从小说工坊到剧本生产线，每一件皆在持续生长
              </motion.p>

              <motion.div variants={heroButtonContainer} className="mt-6 flex flex-wrap gap-3">
                <motion.div variants={heroButtonItem}>
                  <Link to="/" className="btn btn-primary">
                    返回主页
                  </Link>
                </motion.div>
                <motion.div variants={heroButtonItem}>
                  <a href="/#contact" className="btn btn-secondary">
                    联系合作
                  </a>
                </motion.div>
              </motion.div>
            </div>

            <motion.div
              variants={heroPanelCard}
              className="showcase-hero-panel relative overflow-hidden"
            >
              <div className="showcase-hero-panel-inner">
                <div className="showcase-stage-label">产品展示</div>
                <h2 className="showcase-hero-panel-title">全部面孔</h2>
                <p className="showcase-hero-panel-desc">
                  从桌面旗舰到在线工坊，代表审美、能力与完成度
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="showcase-hero-accent-line"
            variants={heroAccentLine}
          />
        </motion.section>

        {/* ── Featured ── */}
        <motion.section
          id="showcase-featured"
          className="glass-card p-6 sm:p-8"
          initial="initial"
          animate="animate"
        >
          <motion.div
            variants={featuredHeader}
            className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="section-kicker">最值得记住的</div>
              <h2
                className="mt-2 text-2xl font-bold text-[var(--fh-text)]"
                style={{ fontFamily: 'var(--fh-font-serif)' }}
              >
                这三件，先看
              </h2>
              <p className="mt-2 text-sm text-[var(--fh-text-secondary)]">
                整个体系中最适合推广、演示与被人一眼记住的产品
              </p>
            </div>
            <div className="text-sm text-[var(--fh-text-muted)]">
              精选 {featuredApps.length} 项
            </div>
          </motion.div>

          <motion.div
            variants={featuredCardContainer}
            className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
          >
            {featuredApps.map((app, index) => (
              <motion.article
                key={app.id}
                variants={featuredCardItem}
                className="showcase-card showcase-card--cinematic"
              >
                <span className="showcase-card-deco-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex items-center justify-between gap-3">
                  <span className="chip">{app.category}</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--fh-text-muted)]">
                    {app.status}
                  </span>
                </div>
                <h3 className="mt-4 text-xl font-bold text-[var(--fh-text)]">{app.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                  {app.description}
                </p>
                <p className="mt-3 rounded-2xl bg-[var(--fh-bg-elevated)] px-4 py-3 text-sm leading-6 text-[var(--fh-text-secondary)]">
                  {app.featuredReason}
                </p>
                <div className="mt-4 rounded-2xl border border-dashed border-[var(--fh-border)] bg-[var(--fh-bg-elevated)] px-3 py-2 font-mono text-xs text-[var(--fh-text-muted)]">
                  {app.pageUrl}
                </div>
                <div className="mt-5 flex gap-3">
                  <OpenLink
                    url={app.pageUrl}
                    className="btn btn-primary flex-1"
                    ariaLabel={`打开 ${app.title}`}
                  >
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
              </motion.article>
            ))}
          </motion.div>
        </motion.section>

        {/* ── Catalog ── */}
        <section id="showcase-catalog" className="showcase-display-wall">
          <motion.div
            {...catalogHeader}
            className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <div className="section-kicker">完整陈列</div>
              <h2
                className="text-2xl font-semibold text-[var(--fh-text)]"
                style={{ fontFamily: 'var(--fh-font-serif)' }}
              >
                全部产品面孔，一次看完
              </h2>
              <p className="mt-2 text-sm text-[var(--fh-text-secondary)]">
                从桌面旗舰到在线工坊，每一件皆在持续迭代，所见非页面，乃一整套正在成形的产品谱系
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-[var(--fh-text-muted)]">
              <a href="/#contact" className="hero-panel-link">
                发起合作
              </a>
              <Link to="/" className="hero-panel-link">
                返回主页
              </Link>
            </div>
          </motion.div>

          <div className="space-y-12">
            {catalogGroups.map((group, groupIndex) => (
              <section key={group.category} id={`catalog-group-${groupIndex}`}>
                <motion.div
                  {...catalogGroupHeader}
                  className="showcase-group-header"
                >
                  <motion.div
                    className="showcase-group-deco"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 0.06, x: 0, transition: { duration: 0.5, ease } }}
                    viewport={{ once: true }}
                  >
                    {String(groupIndex + 1).padStart(2, '0')}
                  </motion.div>
                  <div>
                    <div className="section-kicker">{group.category}</div>
                    <h3
                      className="text-xl font-semibold text-[var(--fh-text)]"
                      style={{ fontFamily: 'var(--fh-font-serif)' }}
                    >
                      {group.category}
                    </h3>
                  </div>
                  <motion.div
                    className="showcase-group-line"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1, transition: { duration: 0.8, ease, delay: 0.2 } }}
                    viewport={{ once: true }}
                    style={{ transformOrigin: 'left' }}
                  />
                  <span className="phoenix-entry-index">{group.apps.length} 项</span>
                </motion.div>

                <motion.div
                  {...catalogStripContainer}
                  className="showcase-strip-list"
                >
                  {group.apps.map((app, index) => (
                    <motion.article
                      key={app.id}
                      variants={catalogStripItem}
                      className="showcase-strip showcase-strip--cinematic"
                    >
                      <span className="showcase-strip-index">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="showcase-strip-main">
                        <div className="showcase-strip-meta">
                          <span className="chip">{app.category}</span>
                          {app.featured ? <span className="novel-status">精选</span> : null}
                          <span className="novel-status">{app.status}</span>
                        </div>
                        <h4 style={{ fontFamily: 'var(--fh-font-serif)' }}>{app.title}</h4>
                        <p>{app.description}</p>
                      </div>
                      <div className="showcase-strip-actions">
                        <OpenLink
                          url={app.pageUrl}
                          className="btn btn-primary"
                          ariaLabel={`打开 ${app.title}`}
                        >
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
                    </motion.article>
                  ))}
                </motion.div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
