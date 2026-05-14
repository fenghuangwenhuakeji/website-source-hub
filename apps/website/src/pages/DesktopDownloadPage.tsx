import { Link } from 'react-router-dom';
import { resolveDesktopWebUrl } from '../utils/desktopAccess';
import { resolveDesktopDownloadUrls } from '../utils/desktopDownloads';

const APP_PROTOCOL_URL = 'fenghuang://open';

function detectPlatform() {
  if (typeof navigator === 'undefined') {
    return 'unknown';
  }

  const platform = `${navigator.platform || ''} ${navigator.userAgent || ''}`.toLowerCase();

  if (platform.includes('mac')) {
    return 'mac';
  }

  if (platform.includes('win')) {
    return 'windows';
  }

  return 'unknown';
}

export default function DesktopDownloadPage() {
  const platform = detectPlatform();
  const webUrl = resolveDesktopWebUrl();
  const downloadUrls = resolveDesktopDownloadUrls();
  const primaryDownloadUrl = platform === 'mac' ? downloadUrls.macDmg : downloadUrls.windowsInstaller;
  const primaryDownloadLabel = platform === 'mac' ? '下载 macOS 版' : '下载 Windows 版';
  const primaryPlatformLabel = platform === 'mac' ? 'macOS 通用版' : 'Windows 安装版';

  return (
    <div className="page-shell">
      <div className="container py-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[32px] border border-[var(--fh-border)] bg-[linear-gradient(135deg,#141414_0%,#26211c_52%,#8c6b4a_100%)] p-6 text-white shadow-[var(--fh-shadow-xl)] sm:p-10 lg:p-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-80 -translate-x-1/2 rounded-full bg-[#d8b987]/20 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/80">
                FENGHUANG DESKTOP
              </div>
              <h1
                className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.05] tracking-[-0.05em] sm:text-6xl lg:text-7xl"
                style={{ fontFamily: 'var(--fh-font-serif)' }}
              >
                把凤煌工作台装进电脑
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/72 sm:text-lg">
                桌面端才是真实产品形态。写作、代码编辑、Agent 工具和项目管理都在客户端里完整展开；网页端仅为展示和入口分发。
              </p>
              <div className="mt-5 max-w-2xl rounded-[24px] border border-white/14 bg-white/8 px-4 py-4 text-sm leading-7 text-white/80 backdrop-blur">
                如果你需要完整体验，请直接下载客户端。网页端适合看展示、看作品、看入口，但不代表完整能力。
              </div>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={primaryDownloadUrl} className="btn bg-white text-[#141414] hover:bg-[#f4eadc]" title={primaryDownloadLabel}>
                  {primaryDownloadLabel}
                </a>
                <a href={APP_PROTOCOL_URL} className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  打开已安装客户端
                </a>
                <a href={webUrl} className="btn border border-white/20 bg-transparent text-white/86 hover:bg-white/10">
                  查看网页展示
                </a>
              </div>
            </div>

            <aside className="rounded-[28px] border border-white/16 bg-white/[0.94] p-6 text-[var(--fh-text)] shadow-2xl shadow-black/20 backdrop-blur">
              <div className="text-xs font-semibold tracking-[0.18em] text-[var(--fh-text-muted)]">推荐下载</div>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em]">{primaryPlatformLabel}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                下载后按系统提示安装。安装完成后，可从桌面图标启动，也可以回到这里一键打开客户端；完整功能以客户端为准。
              </p>
              <a href={primaryDownloadUrl} className="btn btn-primary mt-6 w-full" title={primaryDownloadLabel}>
                立即下载
              </a>
              <div className="mt-4 rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-xs leading-6 text-[var(--fh-text-muted)]">
                首次打开如遇安全提醒，请确认来源为 fhwhkj.top，并按照系统提示允许打开。
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <a href={downloadUrls.windowsInstaller} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">Windows 安装版</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">适合日常使用，会创建桌面快捷方式。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
          <a href={downloadUrls.macDmg} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">macOS 通用版</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">同时支持 Apple 芯片和 Intel 芯片。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
          <a href={downloadUrls.windowsPortable} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">Windows 免安装版</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">不想安装时可直接打开，适合临时体验。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-card p-6 sm:p-7">
            <div className="section-kicker">开始使用</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--fh-text)]">第一次使用，按这三步就够了</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                <div className="text-sm font-semibold text-[var(--fh-text)]">下载安装</div>
                <p className="mt-2 text-sm leading-6 text-[var(--fh-text-secondary)]">选择与你电脑一致的版本。</p>
              </div>
              <div className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                <div className="text-sm font-semibold text-[var(--fh-text)]">登录账号</div>
                <p className="mt-2 text-sm leading-6 text-[var(--fh-text-secondary)]">使用官网同一个凤煌账号。</p>
              </div>
              <div className="rounded-2xl bg-[var(--fh-bg-elevated)] p-4">
                <div className="text-sm font-semibold text-[var(--fh-text)]">进入工作台</div>
                <p className="mt-2 text-sm leading-6 text-[var(--fh-text-secondary)]">打开应用，继续创作和管理项目。</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6 sm:p-7">
            <div className="section-kicker">网页版</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] text-[var(--fh-text)]">网页版仅供展示</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
              网页端更适合查看展示页、作品资料和账号入口，不等同于完整产品。需要完整体验、完整工作流和真实使用，请安装客户端。
            </p>
            <a href={webUrl} className="btn btn-secondary mt-5 w-full">
              打开网页展示页
            </a>
            <a href={downloadUrls.macZip} className="mt-3 inline-flex text-sm text-[var(--fh-text-muted)] hover:text-[var(--fh-text)]">
              macOS ZIP 备用下载
            </a>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-secondary">
            返回官网首页
          </Link>
          <Link to="/showcase" className="btn btn-secondary">
            查看作品展示
          </Link>
        </div>
      </div>
    </div>
  );
}
