import { Link } from 'react-router-dom';
import { showcaseApps } from '../data/showcaseApps';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

const desktopLoginUrl = resolveDesktopLoginUrl();

const featuredShowcase = showcaseApps.slice(0, 3);

const coreLines = [
  {
    id: 'desktop',
    label: '桌面产品',
    title: '完整入口',
    description: '登录、导入、本地联动和深度工作流，都放在桌面端。',
  },
  {
    id: 'workshops',
    label: '内容工坊',
    title: '持续生产',
    description: '小说工坊写长内容，剧本工坊推镜头表达，内容可以持续沉淀。',
  },
  {
    id: 'showcase',
    label: '作品展示',
    title: '对外门面',
    description: '代表作、应用和项目集中对外展示，方便传播，也方便合作。',
  },
];

const capabilityCards = [
  {
    title: '桌面软件',
    description: '做真正能跑起来、能承接完整流程的桌面产品。',
    tags: ['客户端', '工作流', '本地联动'],
  },
  {
    title: '小说与剧本',
    description: '从小说写作到漫剧剧本，再到分镜视频表达，形成完整内容链。',
    tags: ['小说', '剧本', '分镜视频'],
  },
  {
    title: '网页与游戏',
    description: '网页软件、互动产品、游戏开发，都可以纳入同一条产品线。',
    tags: ['Web App', 'Game', 'Interactive'],
  },
  {
    title: '共创合作',
    description: '品牌合作、内容共创、项目共建，都能直接进入执行。',
    tags: ['联名', '共创', '项目合作'],
  },
];

const partnerCards = [
  {
    title: '品牌方',
    description: '看见的是可联名的产品、可持续更新的内容和可长期运营的展示阵地。',
  },
  {
    title: '内容方',
    description: '看见的是从小说、剧本到分镜和视频化表达的一整条生产链。',
  },
  {
    title: '项目方',
    description: '看见的是桌面软件、网页软件、游戏开发和内容共创的执行能力。',
  },
  {
    title: '投资合作方',
    description: '看见的是已经开始成形的产品体系、内容资产和持续迭代能力。',
  },
];

const entryCards = [
  {
    id: '01',
    title: '桌面端',
    code: 'DESKTOP',
    description: '完整入口，直接承接深度工作流。',
    chips: ['桌面产品', '登录导入', '完整体验'],
    primaryCta: '打开桌面端',
    primaryHref: desktopLoginUrl,
    external: true,
  },
  {
    id: '02',
    title: '小说工坊 / 剧本工坊',
    code: 'WORKSHOPS',
    description: '内容生产线，从故事到镜头持续推进。',
    chips: ['小说', '剧本', '分镜'],
    primaryCta: '进入小说工坊',
    primaryHref: '/novels',
    secondaryCta: '进入剧本工坊',
    secondaryHref: '/writing?type=script',
  },
  {
    id: '03',
    title: '作品展示',
    code: 'SHOWCASE',
    description: '最能打的应用、项目和代表作，全部集中陈列。',
    chips: ['代表作', '应用', '项目展示'],
    primaryCta: '查看作品展示',
    primaryHref: '/showcase',
  },
  {
    id: '04',
    title: '联系合作',
    code: 'CONTACT',
    description: '品牌合作、内容共创、项目共建，从这里直接接通。',
    chips: ['品牌合作', '共创', '项目对接'],
    primaryCta: '联系合作',
    primaryHref: '#contact',
    external: true,
  },
];

export default function HomePage() {
  return (
    <div className="home-shell home-page phoenix-home">
      <section className="hero phoenix-hero" id="home">
        <div className="hero-background phoenix-hero-background">
          <div className="hero-overlay phoenix-hero-overlay" />
          <div className="phoenix-spotlight phoenix-spotlight-left" />
          <div className="phoenix-spotlight phoenix-spotlight-right" />
          <div className="phoenix-starfield" />
          <div className="phoenix-dust phoenix-dust-one" />
          <div className="phoenix-dust phoenix-dust-two" />
          <div className="phoenix-orb phoenix-orb-left" />
          <div className="phoenix-orb phoenix-orb-right" />
          <div className="phoenix-grid" />
        </div>

        <div className="container">
          <div className="home-entry-grid phoenix-hero-grid">
            <div className="hero-copy phoenix-hero-copy">
              <div className="section-kicker mb-6">凤煌科技</div>
              <h1 className="hero-title">
                <span className="title-line">做产品，</span>
                <span className="title-line">也做内容生产。</span>
              </h1>
              <p className="hero-subtitle">
                桌面软件是底座，小说与剧本工坊是内容引擎，作品展示负责把代表作推到台前。
              </p>

              <div className="phoenix-chip-row phoenix-home-signal-row">
                <span className="phoenix-chip">桌面软件</span>
                <span className="phoenix-chip">小说写作</span>
                <span className="phoenix-chip">漫剧剧本</span>
                <span className="phoenix-chip">分镜视频</span>
                <span className="phoenix-chip">网页软件</span>
                <span className="phoenix-chip">游戏开发</span>
                <span className="phoenix-chip">合作共创</span>
              </div>

              <div className="hero-buttons phoenix-hero-actions">
                <a href={desktopLoginUrl} className="btn btn-primary">
                  打开桌面端
                </a>
                <Link to="/showcase" className="btn btn-secondary">
                  查看作品展示
                </Link>
                <a href="#contact" className="btn btn-secondary">
                  联系合作
                </a>
              </div>
            </div>

            <div className="hero-panel glass-card phoenix-hero-panel premium-float">
              <div className="panel-heading">
                <div>
                  <div className="section-kicker">三件核心事</div>
                  <h2>入口、生产、展示。</h2>
                </div>
                <Link to="/showcase" className="hero-panel-link">
                  看代表作
                </Link>
              </div>

              <div className="phoenix-preview-stack">
                {coreLines.map((item, index) => (
                  <article key={item.id} className={`phoenix-preview-card${index % 2 ? ' phoenix-preview-card-alt' : ''}`}>
                    <span className="phoenix-preview-label">{item.label}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="phoenix-band">
        <div className="container">
          <div className="panel-heading phoenix-section-heading">
            <div>
              <div className="section-kicker">代表作</div>
              <h2>先看最值得被记住的三件。</h2>
            </div>
          </div>

          <div className="phoenix-showcase-grid">
            {featuredShowcase.map((app) => (
              <article key={app.id} className="phoenix-showcase-card">
                <div className="phoenix-showcase-meta">
                  <span className="phoenix-band-title">{app.category}</span>
                  <span className="phoenix-chip phoenix-chip-soft">{app.status}</span>
                </div>
                <h3>{app.title}</h3>
                <p>{app.description}</p>
                <div className="phoenix-chip-row">
                  {app.features.map((feature) => (
                    <span key={`${app.id}-${feature}`} className="phoenix-chip phoenix-chip-soft">
                      {feature}
                    </span>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap gap-3 phoenix-showcase-actions">
                  <Link to="/showcase" className="btn btn-download">
                    看全部作品
                  </Link>
                  <a href={app.pageUrl} className="btn btn-secondary">
                    直接打开
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="phoenix-band">
        <div className="container">
          <div className="panel-heading phoenix-section-heading">
            <div>
              <div className="section-kicker">我们在做什么</div>
              <h2>把产品能力和内容能力，做成同一套体系。</h2>
            </div>
          </div>

          <div className="phoenix-band-grid">
            {capabilityCards.map((card) => (
              <article key={card.title} className="phoenix-band-card">
                <span className="phoenix-band-title">{card.title}</span>
                <p>{card.description}</p>
                <div className="phoenix-chip-row">
                  {card.tags.map((tag) => (
                    <span key={`${card.title}-${tag}`} className="phoenix-chip phoenix-chip-soft">
                      {tag}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="phoenix-entry-section">
        <div className="container">
          <div className="panel-heading phoenix-section-heading">
            <div>
              <div className="section-kicker">合作视角</div>
              <h2>用户会继续看，合作方也能立刻看懂。</h2>
            </div>
          </div>

          <div className="phoenix-partner-grid">
            {partnerCards.map((card) => (
              <article key={card.title} className="phoenix-partner-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="phoenix-entry-section">
        <div className="container">
          <div className="panel-heading phoenix-section-heading">
            <div>
              <div className="section-kicker">快速入口</div>
              <h2>四个入口，直接进去。</h2>
            </div>
          </div>

          <div className="panel-stack phoenix-entry-stack">
            {entryCards.map((card) => (
              <article key={card.id} className="panel-box home-entry-box phoenix-entry-card">
                <div className="home-entry-box-head">
                  <div>
                    <span className="phoenix-entry-kicker">{card.id}</span>
                    <h3>{card.title}</h3>
                  </div>
                  <span className="phoenix-entry-index">{card.code}</span>
                </div>

                <p>{card.description}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {card.chips.map((item) => (
                    <span key={`${card.id}-${item}`} className="phoenix-chip phoenix-chip-soft">
                      {item}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3 phoenix-entry-actions">
                  {card.external ? (
                    <a href={card.primaryHref} className="btn btn-download">
                      {card.primaryCta}
                    </a>
                  ) : (
                    <Link to={card.primaryHref} className="btn btn-download">
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
