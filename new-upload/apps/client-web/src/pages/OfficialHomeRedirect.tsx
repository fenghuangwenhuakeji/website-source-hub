import { Link } from 'react-router-dom';
import {
  ArrowRight,
  LibraryBig,
  MonitorSmartphone,
  PanelTop,
  Sparkles,
  Star,
  LayoutGrid,
  ShieldCheck,
  Wifi,
} from 'lucide-react';
import { buildAcceptanceAwarePath } from '../lib/acceptanceMode';
import styles from './OfficialHomeRedirect.module.scss';

const entryCards = [
  {
    id: 'showcase',
    icon: <LibraryBig size={22} />,
    title: '精选应用',
    description: '查看官网精选应用、本地静态展示页和已经整理好的演示入口。',
    cta: '进入官方展柜',
    to: '/main',
    accent: 'var(--phoenix-cyan)',
    chips: ['精选应用', '静态页', '统一入口'],
  },
  {
    id: 'desktop',
    icon: <MonitorSmartphone size={22} />,
    title: '桌面端',
    description: '打开本地桌面系统登录页，继续进入完整工作台。',
    cta: '桌面登录',
    to: '/login?forceLogin=1',
    accent: 'var(--phoenix-violet)',
    chips: ['桌面登录', '完整工作台', '本地联动'],
  },
  {
    id: 'safety',
    icon: <ShieldCheck size={22} />,
    title: '稳定访问',
    description: '所有入口保持同一套视觉语言和稳定路由，不再自我跳转刷新。',
    cta: '进入主程序',
    to: '/recharge',
    accent: 'var(--phoenix-amber)',
    chips: ['防刷新', '高对比', '清晰可读'],
  },
];

export default function OfficialHomeRedirect() {
  const acceptanceAwareEntryCards = entryCards.map((card) => ({
    ...card,
    to: buildAcceptanceAwarePath(card.to),
  }));

  return (
    <div className={styles.shell}>
      <div className={styles.stars} />
      <div className={styles.glowLeft} />
      <div className={styles.glowRight} />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroBadge}>
            <Sparkles size={16} />
            <span>官方节点</span>
          </div>
          <h1>把精选应用、静态页和统一入口收拢到一个稳定首页里</h1>
          <p>
            现在 `/home` 不再做自跳转，而是直接展示可停留的官方首页。无论是进入主程序，还是打开桌面端登录页，
            都会落到清晰、可读、不会刷新的入口上。
          </p>

          <div className={styles.heroChips}>
            <span>精选应用</span>
            <span>静态页</span>
            <span>统一入口</span>
            <span>桌面端</span>
          </div>

          <div className={styles.heroActions}>
            <Link className={styles.primaryAction} to={buildAcceptanceAwarePath('/main')}>
              进入官方展柜
              <ArrowRight size={18} />
            </Link>
            <Link className={styles.secondaryAction} to={buildAcceptanceAwarePath('/login?forceLogin=1')}>
              打开桌面登录
            </Link>
          </div>
        </section>

        <section className={styles.cards}>
          {acceptanceAwareEntryCards.map((card) => (
            <article key={card.id} className={styles.card} style={{ ['--card-accent' as never]: card.accent }}>
              <div className={styles.cardTop}>
                <div className={styles.cardIcon}>{card.icon}</div>
                <span className={styles.cardMark}>
                  <PanelTop size={14} />
                  <span>官方节点</span>
                </span>
              </div>

              <h2>{card.title}</h2>
              <p>{card.description}</p>

              <div className={styles.chipRow}>
                {card.chips.map((chip) => (
                  <span key={chip} className={styles.chip}>
                    {chip}
                  </span>
                ))}
              </div>

              <Link className={styles.cardAction} to={card.to}>
                {card.cta}
                <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </section>

        <section className={styles.footerPanel}>
          <div>
            <span className={styles.footerKicker}>
              <LayoutGrid size={14} />
              统一入口
            </span>
            <h3>看清楚字，别折叠，别刷新</h3>
            <p>这个首页现在只做展示和分流，不做任何自我重定向，所以移动端和桌面端都能稳定停留。</p>
          </div>
          <div className={styles.footerStats}>
            <div>
              <strong>3</strong>
              <span>入口卡片</span>
            </div>
            <div>
              <strong>2</strong>
              <span>主操作按钮</span>
            </div>
            <div>
              <strong>
                <Wifi size={16} />
              </strong>
              <span>稳定访问</span>
            </div>
          </div>
          <div className={styles.footerLink}>
            <Link to={buildAcceptanceAwarePath('/profile')}>
              进入用户中心
              <ArrowRight size={16} />
            </Link>
            <Link to={buildAcceptanceAwarePath('/recharge')}>
              前往充值页面
              <ArrowRight size={16} />
            </Link>
          </div>
          <div className={styles.sparkLine} />
          <div className={styles.sparkDot} />
        </section>
      </main>
    </div>
  );
}
