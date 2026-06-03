import { Link } from 'react-router-dom';

const WINDOWS_DOWNLOAD_URL = '/downloads/longbook/longbook-windows-setup-1.0.5.exe';
const MAC_DOWNLOAD_URL = '/downloads/longbook/longbook-mac-latest.dmg';
const MAC_ZIP_DOWNLOAD_URL = '/downloads/longbook/longbook-mac-app-latest.zip';
const APP_PROTOCOL_URL = 'fenghuang-longbook://open';
const RECHARGE_URL = '/recharge';

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

export default function LongBookDownloadPage() {
  const platform = detectPlatform();
  const primaryDownloadUrl = platform === 'mac' ? MAC_DOWNLOAD_URL : WINDOWS_DOWNLOAD_URL;
  const primaryDownloadLabel = platform === 'mac' ? '下载 macOS 版' : '下载 Windows 版';
  const primaryPlatformLabel = platform === 'mac' ? 'macOS DMG 安装包' : 'Windows 安装版';

  return (
    <div className="page-shell">
      <div className="container py-8 sm:py-12">
        <section className="relative overflow-hidden rounded-[28px] border border-[var(--fh-border)] bg-[#161512] p-6 text-white shadow-[var(--fh-shadow-xl)] sm:p-10 lg:p-12">
          <div className="absolute inset-x-0 top-0 h-1 bg-[#faea5f]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-white/18 bg-white/8 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-white/78">
                LONGBOOK PROJECT
              </div>
              <h1
                className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl"
                style={{ fontFamily: 'var(--fh-font-serif)' }}
              >
                下载长篇创作安装包
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                这里下载的是可直接安装的长篇创作应用。Windows 下载 .exe，macOS 下载 .dmg，安装后从桌面或应用程序里打开即可使用。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={primaryDownloadUrl} className="btn bg-white text-[#141414] hover:bg-[#f4eadc]" title={primaryDownloadLabel}>
                  {primaryDownloadLabel}
                </a>
                <a href={APP_PROTOCOL_URL} className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  打开已安装应用
                </a>
                <Link to={RECHARGE_URL} className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  先去充值
                </Link>
              </div>
            </div>

            <aside className="rounded-[24px] border border-white/16 bg-white/[0.94] p-6 text-[var(--fh-text)] shadow-2xl shadow-black/20">
              <div className="text-xs font-semibold tracking-[0.18em] text-[var(--fh-text-muted)]">推荐下载</div>
              <h2 className="mt-3 text-3xl font-semibold">{primaryPlatformLabel}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                这是长篇创作专用桌面应用，已内置当前长篇项目页面。下载安装后直接打开，不需要手动解压项目文件。
              </p>
              <a href={primaryDownloadUrl} className="btn btn-primary mt-6 w-full" title={primaryDownloadLabel}>
                立即下载
              </a>
              <div className="mt-4 rounded-2xl bg-[var(--fh-bg-elevated)] p-4 text-xs leading-6 text-[var(--fh-text-muted)]">
                首次打开如遇安全提醒，请确认来源为 fhwhkj.top，并按系统提示允许打开。
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-2">
          <a href={WINDOWS_DOWNLOAD_URL} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">Windows 安装版</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">下载 .exe 后按提示安装，适合日常使用。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
          <a href={MAC_DOWNLOAD_URL} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">macOS DMG 安装包</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">同时支持 Apple 芯片和 Intel 芯片。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[var(--fh-border)] bg-[var(--fh-surface)] p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">直接打开使用</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">安装完成后从桌面图标或应用程序启动，不需要再找 HTML 文件。</p>
          </div>
          <div className="rounded-[20px] border border-[var(--fh-border)] bg-[var(--fh-surface)] p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">官网账号通用</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">使用同一个凤煌账号登录，订阅、续费和设备授权统一管理。</p>
          </div>
          <div className="rounded-[20px] border border-[var(--fh-border)] bg-[var(--fh-surface)] p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">充值后直接开通</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">微信或支付宝支付成功后，权益直接进入账号，无需等待人工发码。</p>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/" className="btn btn-secondary">
            返回官网首页
          </Link>
          <a href={MAC_ZIP_DOWNLOAD_URL} className="btn btn-secondary">
            macOS App ZIP 备用下载
          </a>
        </div>
      </div>
    </div>
  );
}
