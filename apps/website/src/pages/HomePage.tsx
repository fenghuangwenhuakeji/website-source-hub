import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { WeChatGroupPromo } from '../components/WeChatGroupPromo';
import { showcaseApps } from '../data/showcaseApps';
import { useAuthStore } from '../store/auth';
import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';
import { useParallax } from '../hooks/useParallax';

const desktopDownloadUrl = resolveDesktopDownloadUrl();
const DESKTOP_GUIDE_DISMISSED_KEY = 'fh_desktop_download_guide_dismissed';

const featuredShowcase = showcaseApps.slice(0, 3);

const coreLines = [
  {
    id: 'desktop',
    label: '桌面产品',
    title: '完整入口',
    description: '真实产品形态，承接登录、导入、本地联动和完整工作流。',
  },
  {
    id: 'workshops',
    label: '网页展示',
    title: '资料浏览',
    description: '官网页主要用于展示作品、入口和项目资料。',
  },
  {
    id: 'showcase',
    label: '作品展示',
    title: '对外门面',
    description: '代表作、应用和项目集中陈列。',
  },
];

const capabilityCards = [
  {
    title: '桌面软件',
    description: '真正能跑起来、能承接完整创作流程的正式客户端。',
    index: '01',
  },
  {
    title: '官网展示',
    description: '网页端更适合展示小说、剧本、应用和品牌信息。',
    index: '02',
  },
  {
    title: '网页与游戏',
    description: '网页软件、互动产品、游戏开发，同一条产品线。',
    index: '03',
  },
  {
    title: '共创合作',
    description: '品牌合作、内容共创、项目共建，直接进入执行。',
    index: '04',
  },
];

const partnerItems = [
  {
    role: '品牌方',
    view: '可联名的产品、可持续更新的内容、可长期运营的阵地。',
  },
  {
    role: '内容方',
    view: '从小说、剧本到分镜和视频化表达的一整条生产链。',
  },
  {
    role: '项目方',
    view: '桌面软件、网页软件、游戏开发和内容共创的执行能力。',
  },
  {
    role: '投资合作方',
    view: '已经开始成形的产品体系、内容资产和持续迭代能力。',
  },
];

const heroItem = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const heroRule = {
  initial: { scaleX: 0 },
  animate: {
    scaleX: 1,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.4 },
  },
};

const heroSubtitleVariant = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.7 },
  },
};

const heroButtonContainer = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.1, delayChildren: 0.4 },
  },
};

const heroButtonItem = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const heroTocContainer = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      delay: 0.5,
      staggerChildren: 0.12,
      delayChildren: 0.5,
    },
  },
};

const heroTocItem = {
  initial: { opacity: 0, x: 20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    const selectors = [
      '.reveal',
      '.reveal-ink',
      '.reveal-skew',
      '.reveal-roll',
      '.reveal-flip',
      '.reveal-diagonal',
    ];
    selectors.forEach((selector) => {
      el.querySelectorAll(selector).forEach((r) => observer.observe(r));
    });

    return () => observer.disconnect();
  }, []);

  return ref;
}

export default function HomePage() {
  const { isAuthenticated, user } = useAuthStore();
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const revealRef = useScrollReveal();
  const parallaxSlow = useParallax(0.15);
  const parallaxMedium = useParallax(0.3);
  const parallaxFast = useParallax(0.5);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      el.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    };
    el.addEventListener('mousemove', handleMove);
    return () => el.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.sessionStorage.getItem(DESKTOP_GUIDE_DISMISSED_KEY) === '1') return;

    const timer = window.setTimeout(() => {
      setShowDesktopGuide(true);
    }, 900);

    return () => window.clearTimeout(timer);
  }, []);

  const closeDesktopGuide = () => {
    setShowDesktopGuide(false);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DESKTOP_GUIDE_DISMISSED_KEY, '1');
    }
  };

  const [featuredHero, ...featuredRest] = featuredShowcase;
  const heroSubtitle = isAuthenticated
    ? `欢迎回来，${user?.nickname ?? '创作者'}。桌面端才是真实产品，官网页主要负责展示和账号分发；需要完整体验，请下载客户端。`
    : '桌面端才是真实产品，网页端仅为展示与入口分发；需要完整体验，请下载客户端。';
  const entryCards = [
    {
      id: '01',
      title: isAuthenticated ? '官网工作台' : '官网账号',
      code: 'ACCOUNT',
      description: isAuthenticated
        ? '官网账号已经连上，可以继续前往展示页、个人设置和客户端下载入口。'
        : '先登录或注册官网账号，再统一进入展示页、个人设置和客户端下载入口。',
      primaryCta: isAuthenticated ? '进入官网工作台' : '官网登录',
      primaryHref: isAuthenticated ? '/dashboard' : '/login',
      secondaryCta: isAuthenticated ? '个人设置' : '立即注册',
      secondaryHref: isAuthenticated ? '/profile' : '/register',
    },
    {
      id: '02',
      title: '桌面端',
      code: 'DESKTOP',
      description: '真实产品形态，完整体验、完整能力、完整工作流都在客户端。',
      primaryCta: '下载客户端',
      primaryHref: desktopDownloadUrl,
      external: true,
    },
    {
      id: '03',
      title: '小说展示 / 剧本展示',
      code: 'WORKSHOPS',
      description: '网页端以展示和入口说明为主，不承担完整创作职责。',
      primaryCta: '查看小说展示',
      primaryHref: '/novels',
      secondaryCta: '查看剧本展示',
      secondaryHref: '/writing?type=script',
    },
    {
      id: '04',
      title: '作品展示',
      code: 'SHOWCASE',
      description: '最能打的应用、项目和代表作，全部集中陈列。',
      primaryCta: '查看作品展示',
      primaryHref: '/showcase',
    },
  ];

  return (
    <div ref={revealRef} className="home-shell">
      {showDesktopGuide ? (
        <div className="desktop-guide-overlay" role="dialog" aria-modal="true" aria-labelledby="desktop-guide-title">
          <div className="desktop-guide-modal">
            <button
              type="button"
              className="desktop-guide-close"
              onClick={closeDesktopGuide}
              aria-label="关闭桌面端下载提示"
            >
              ×
            </button>
            <div className="desktop-guide-kicker">桌面端客户端</div>
            <h2 id="desktop-guide-title">下载桌面端，进入完整工作台</h2>
            <p>
              桌面端才是真实产品，网页端仅为展示和入口分发。需要完整体验，请下载客户端；小说展示、剧本入口都不是安装包。
            </p>
            <div className="desktop-guide-actions">
              <a href={desktopDownloadUrl} className="btn btn-primary" onClick={closeDesktopGuide}>
                立即下载客户端
              </a>
              <button type="button" className="btn btn-secondary" onClick={closeDesktopGuide}>
                先看看官网
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <section className="hero" id="home" ref={heroRef}>
        <div
          className="hero-background"
          style={{ transform: `translateY(${parallaxSlow}px)` }}
        />
        <div className="hero-overlay" />
        <div
          className="dot-grid"
          style={{ transform: `translateY(${parallaxMedium}px)` }}
        />
        <div
          className="brand-aura"
          style={{ transform: `translateY(${parallaxSlow}px) scale(1.02)` }}
        />
        <div
          className="brand-ring"
          style={{ transform: `translateY(${parallaxMedium}px) rotate(${parallaxSlow * 0.05}deg)` }}
        />
        <div
          className="brand-arc"
          style={{ transform: `translateY(${parallaxFast}px)` }}
        />
        <div className="brand-line" />
        <div className="hero-mouse-glow" />

        <div className="container">
          <h1 className="hero-title">
            <span className="title-line-mask">
              <motion.span
                className="title-line"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.1 }}
              >
                我们造工具，
              </motion.span>
            </span>
            <span className="title-line-mask">
              <motion.span
                className="title-line"
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.24 }}
              >
                也造叙事
              </motion.span>
            </span>
          </h1>

          <motion.div
            className="hero-rule"
            variants={heroRule}
            initial="initial"
            animate="animate"
          />

          <div className="hero-bottom-grid">
            <motion.div className="hero-intro" variants={heroItem} initial="initial" animate="animate">
              <motion.p className="hero-subtitle" variants={heroSubtitleVariant}>
                {heroSubtitle}
              </motion.p>
              <motion.div className="hero-buttons" variants={heroButtonContainer}>
                <motion.div variants={heroButtonItem}>
                  {isAuthenticated ? (
                    <Link to="/dashboard" className="btn btn-primary">
                      进入官网工作台
                    </Link>
                  ) : (
                    <Link to="/login" className="btn btn-primary">
                      官网登录
                    </Link>
                  )}
                </motion.div>
                <motion.div variants={heroButtonItem}>
                  {isAuthenticated ? (
                    <Link to="/profile" className="btn btn-secondary">
                      个人设置
                    </Link>
                  ) : (
                    <Link to="/register" className="btn btn-secondary">
                      立即注册
                    </Link>
                  )}
                </motion.div>
                <motion.div variants={heroButtonItem}>
                  <Link to="/showcase" className="btn btn-secondary">
                    查看作品展示
                  </Link>
                </motion.div>
                <motion.div variants={heroButtonItem}>
                  <a href={desktopDownloadUrl} className="btn btn-secondary">
                    下载客户端
                  </a>
                </motion.div>
              </motion.div>
            </motion.div>

            <motion.div className="hero-toc" variants={heroTocContainer} initial="initial" animate="animate">
              {coreLines.map((item, index) => (
                <motion.article
                  key={item.id}
                  variants={heroTocItem}
                  className={`phoenix-preview-card ${index === 0 ? 'phoenix-preview-card--primary' : 'phoenix-preview-card--sub'}`}
                >
                  <span className="phoenix-preview-label">{item.label}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="community-spotlight-shell">
        <div className="container">
          <div className="reveal-diagonal">
            <WeChatGroupPromo variant="home" />
          </div>
        </div>
      </section>

      {/* Breath page */}
      <section className="editorial-breath">
        <div className="container">
          <div className="breath-content reveal">
            <span className="breath-index">卷首</span>
            <p className="breath-quote">
              技术提供骨架，内容填充血肉
              <br />
              我们相信，好的产品本身就是一篇好故事
            </p>
            <div className="editorial-rule-short" />
          </div>
        </div>
      </section>

      {/* Showcase: 1 large + 2 small */}
      <section className="phoenix-band">
        <div className="container">
          <div className="panel-heading phoenix-section-heading reveal">
            <div>
              <div className="section-kicker">代表作</div>
              <h2>三件代表作</h2>
            </div>
          </div>

          {featuredHero && (
            <article className="phoenix-showcase-card phoenix-showcase-hero reveal-ink">
              <div className="phoenix-showcase-meta">
                <span className="phoenix-band-title">{featuredHero.category}</span>
                <span className="phoenix-chip phoenix-chip-soft">{featuredHero.status}</span>
              </div>
              <h3>{featuredHero.title}</h3>
              <p>{featuredHero.description}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link to="/showcase" className="btn btn-primary">
                  看全部作品
                </Link>
                <a href={featuredHero.pageUrl} className="btn btn-secondary">
                  直接打开
                </a>
              </div>
            </article>
          )}

          <div className="phoenix-showcase-grid mt-5">
            {featuredRest.map((app, index) => (
              <article
                key={app.id}
                className={`phoenix-showcase-card reveal reveal-delay-${index + 1}`}
              >
                <div className="phoenix-showcase-meta">
                  <span className="phoenix-band-title">{app.category}</span>
                  <span className="phoenix-chip phoenix-chip-soft">{app.status}</span>
                </div>
                <h3>{app.title}</h3>
                <p>{app.description}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <a href={app.pageUrl} className="btn btn-secondary">
                    直接打开
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Capabilities: 2x2 with index numbers */}
      <section className="phoenix-band">
        <div className="container">
          <div className="panel-heading phoenix-section-heading reveal">
            <div>
              <h2>产品即内容</h2>
            </div>
          </div>

          <div className="phoenix-band-grid">
            {capabilityCards.map((card, index) => (
              <article
                key={card.title}
                className={`phoenix-band-card reveal-roll reveal-delay-${index + 1}`}
              >
                <div className="band-card-index">{card.index}</div>
                <span className="phoenix-band-title">{card.title}</span>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Partners: wide horizontal strips */}
      <section className="phoenix-entry-section">
        <div className="container">
          <div className="panel-heading phoenix-section-heading reveal">
            <div>
              <h2>不同角色，看到不同的东西</h2>
            </div>
          </div>

          <div className="phoenix-partner-strips">
            {partnerItems.map((item, index) => (
              <article
                key={item.role}
                className={`phoenix-partner-strip reveal-skew reveal-delay-${index + 1}`}
              >
                <div className="partner-strip-role">{item.role}</div>
                <div className="partner-strip-line" />
                <p>{item.view}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Entries: index cards with decorative numbers */}
      <section className="phoenix-entry-section">
        <div className="container">
          <div className="panel-heading phoenix-section-heading reveal">
            <div>
              <div className="section-kicker">快速入口</div>
              <h2>四个入口</h2>
            </div>
          </div>

          <div className="phoenix-entry-stack">
            {entryCards.map((card, index) => (
              <article
                key={card.id}
                className={`home-entry-box phoenix-entry-card reveal-flip reveal-delay-${index + 1}`}
              >
                <span className="entry-deco-index">{card.id}</span>
                <div className="home-entry-box-head">
                  <div>
                    <span className="phoenix-entry-kicker">{card.id}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <span className="phoenix-entry-index">{card.code}</span>
                </div>

                <p>{card.description}</p>

                <div className="mt-5 flex flex-wrap gap-3 phoenix-entry-actions">
                  {card.external ? (
                    <a href={card.primaryHref} className="btn btn-primary">
                      {card.primaryCta}
                    </a>
                  ) : (
                    <Link to={card.primaryHref} className="btn btn-primary">
                      {card.primaryCta}
                    </Link>
                  )}
                  {'secondaryHref' in card && card.secondaryHref && 'secondaryCta' in card && card.secondaryCta ? (
                    <Link to={card.secondaryHref} className="btn btn-secondary">
                      {card.secondaryCta}
                    </Link>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
