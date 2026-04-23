import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

const desktopLoginUrl = resolveDesktopLoginUrl();

const workspaceCards = [
  {
    title: '小说助手',
    description: '继续处理长篇内容、卷章结构、角色资产与正文沉淀。',
    to: '/novels',
    cta: '进入小说助手',
  },
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
  {
    title: '桌面端',
    description: '进入 Access 主程序，承接更完整的本地与桌面工作流。',
    href: desktopLoginUrl,
    cta: '打开桌面端',
  },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const roleLabel =
    user?.role && ['admin', 'rootadmin', 'super_admin'].includes(String(user.role).toLowerCase())
      ? '管理账号'
      : '官网账号';
  const accountLabel = user?.email || user?.phone || user?.username || '官网账号已连接';
  const summaryCards = [
    {
      label: '当前身份',
      value: user?.nickname ?? '官网用户',
      hint: '登录后默认先回官网工作台',
    },
    {
      label: '账号角色',
      value: roleLabel,
      hint: '官网与 Access 共用同一套认证',
    },
    {
      label: '可用入口',
      value: '4',
      hint: '小说 / 剧本 / 展示 / 桌面',
    },
    {
      label: '工作台状态',
      value: '已连接',
      hint: '现在可以继续前往具体产品线',
    },
  ];

  return (
    <div className="page-shell dashboard-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="glass-card p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <div className="section-kicker">官网工作台</div>
              <h1 className="page-title mt-4">
                先在官网工作台定锚，再分发到凤煌的各条产品线
              </h1>
              <p className="page-lead mt-4">
                欢迎回来，{user?.nickname ?? '创作者'}。这里是官网认证后的第一落点，负责把你分发到小说助手、
                剧本工坊、作品展示和桌面端，而不是直接把你扔进某一条单独的工作流。
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/novels" className="btn btn-primary">
                  进入小说助手
                </Link>
                <Link to="/writing?type=script" className="btn btn-secondary">
                  进入剧本工坊
                </Link>
                <a href={desktopLoginUrl} className="btn btn-secondary">
                  打开桌面端
                </a>
              </div>
            </div>

            <div className="glass-card p-5">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fh-text-muted)]">
                当前账号
              </div>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                <p>{accountLabel}</p>
                <p>当前角色：{roleLabel}</p>
                <p>如果你要调整昵称、简介和资料信息，可以直接进入个人设置。</p>
                <div className="pt-2">
                  <Link to="/profile" className="btn btn-secondary btn-sm">
                    打开个人设置
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
                <div className="section-kicker">工作线分发</div>
                <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">从工作台继续进入具体产品线</h2>
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
                    <a href={card.href} className="btn btn-primary mt-5 inline-block">
                      {card.cta}
                    </a>
                  ) : (
                    <Link to={card.to} className="btn btn-primary mt-5 inline-block">
                      {card.cta}
                    </Link>
                  )}
                </article>
              ))}
            </div>
          </section>

          <aside className="glass-card p-6">
            <div className="section-kicker">账号与分发</div>
            <h2 className="mt-2 text-2xl font-bold text-[var(--fh-text)]">下一步</h2>
            <div className="mt-6 space-y-3">
              <Link
                to="/profile"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">01</span>
                <span>进入个人设置</span>
              </Link>
              <Link
                to="/showcase"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">02</span>
                <span>查看作品展示</span>
              </Link>
              <a
                href={desktopLoginUrl}
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">03</span>
                <span>打开桌面端</span>
              </a>
              <Link
                to="/"
                className="flex items-center rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-[var(--fh-text)] transition hover:bg-[var(--fh-surface-raised)]"
              >
                <span className="mr-3 text-sm font-bold text-[var(--fh-accent)]">04</span>
                <span>返回官网首页</span>
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
