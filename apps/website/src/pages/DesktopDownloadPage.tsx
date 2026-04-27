import { Link } from 'react-router-dom';
import { resolveDesktopWebUrl } from '../utils/desktopAccess';

const WINDOWS_DOWNLOAD_URL = '/downloads/fenghuang/windows-latest.exe';
const MAC_DOWNLOAD_URL = '/downloads/fenghuang/mac-latest.dmg';
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
  const primaryDownloadUrl = platform === 'mac' ? MAC_DOWNLOAD_URL : WINDOWS_DOWNLOAD_URL;
  const primaryDownloadLabel = platform === 'mac' ? '下载 macOS 客户端' : '下载 Windows 客户端';

  return (
    <div className="page-shell">
      <div className="container py-10 sm:py-14">
        <section className="glass-card p-6 sm:p-10">
          <div className="section-kicker">桌面端</div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <h1 className="page-title">下载或打开凤煌客户端</h1>
              <p className="page-lead mt-4">
                桌面端是本地客户端，不等同于浏览器里的网页版工作台。客户端发布后，这里会提供对应系统的安装包，并支持从浏览器直接尝试唤起已安装应用。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={APP_PROTOCOL_URL} className="btn btn-primary">
                  尝试打开已安装客户端
                </a>
                <a href={webUrl} className="btn btn-secondary">
                  打开网页版工作台
                </a>
              </div>
              <div className="mt-5 rounded-[24px] border border-[var(--fh-border)] bg-[var(--fh-bg-elevated)] p-5 text-sm leading-7 text-[var(--fh-text-secondary)]">
                如果点击“打开客户端”没有反应，说明当前设备还没有安装凤煌客户端，或当前安装包还未支持协议唤起。这不是 Mac/Windows 的浏览器问题。
              </div>
            </div>

            <aside className="glass-card p-5">
              <div className="section-kicker">安装包</div>
              <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]">客户端发布状态</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                目前正式域名已接入新版官网和网页版工作台，但生产安装包还没有发布到服务器下载目录。
              </p>
              <div className="mt-5 grid gap-3">
                <a
                  href={primaryDownloadUrl}
                  className="btn btn-secondary"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                  title="安装包发布后会开启下载"
                >
                  {primaryDownloadLabel}（准备中）
                </a>
                <a
                  href={WINDOWS_DOWNLOAD_URL}
                  className="btn btn-secondary btn-sm"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                >
                  Windows 安装包待发布
                </a>
                <a
                  href={MAC_DOWNLOAD_URL}
                  className="btn btn-secondary btn-sm"
                  aria-disabled="true"
                  onClick={(event) => event.preventDefault()}
                >
                  macOS 安装包待发布
                </a>
              </div>
              <div className="mt-5 text-xs leading-6 text-[var(--fh-text-muted)]">
                临时体验请使用网页版工作台；正式客户端需要单独打包、上传和验收。
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">1. 现在可用</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">网页版工作台已上线，可直接进入账号、充值和应用生态。</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">2. 后续补齐</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">Windows/macOS 客户端需要打包后上传到下载目录。</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">3. 协议唤起</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">新版客户端将注册 `fenghuang://`，安装后可从官网尝试打开。</p>
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
