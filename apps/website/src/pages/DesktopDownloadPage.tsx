import { Link } from 'react-router-dom';
import { resolveDesktopWebUrl } from '../utils/desktopAccess';

const WINDOWS_DOWNLOAD_URL = '/downloads/fenghuang/windows-latest.exe';
const MAC_DOWNLOAD_URL = '/downloads/fenghuang/mac-latest.dmg';
const MAC_ZIP_DOWNLOAD_URL = '/downloads/fenghuang/mac-latest.zip';
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
  const isMac = platform === 'mac';

  return (
    <div className="page-shell">
      <div className="container py-10 sm:py-14">
        <section className="glass-card p-6 sm:p-10">
          <div className="section-kicker">桌面端</div>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              <h1 className="page-title">下载或打开凤煌客户端</h1>
              <p className="page-lead mt-4">
                凤煌客户端适合长期创作和管理项目。安装后，可以从电脑桌面进入工作区；如果你只是临时体验，也可以直接使用网页版工作台。
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <a href={APP_PROTOCOL_URL} className="btn btn-primary">
                  打开已安装的客户端
                </a>
                <a href={webUrl} className="btn btn-secondary">
                  打开网页版工作台
                </a>
              </div>
              <div className="mt-5 rounded-[24px] border border-[var(--fh-border)] bg-[var(--fh-bg-elevated)] p-5 text-sm leading-7 text-[var(--fh-text-secondary)]">
                如果点击“打开客户端”没有反应，通常说明这台电脑还没有安装凤煌客户端。你可以先下载对应系统的安装包，或继续使用网页版工作台。
              </div>
            </div>

            <aside className="glass-card p-5">
              <div className="section-kicker">安装包</div>
              <h2 className="mt-3 text-2xl font-bold text-[var(--fh-text)]">选择你的系统</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                建议下载和当前电脑系统一致的版本。安装完成后，再回到这里点击“打开已安装的客户端”即可进入凤煌。
              </p>
              <div className="mt-5 grid gap-3">
                <a
                  href={primaryDownloadUrl}
                  className="btn btn-secondary"
                  title={primaryDownloadLabel}
                >
                  {primaryDownloadLabel}
                </a>
                <a
                  href={WINDOWS_DOWNLOAD_URL}
                  className="btn btn-secondary btn-sm"
                >
                  Windows 客户端
                </a>
                <a
                  href={MAC_DOWNLOAD_URL}
                  className="btn btn-secondary btn-sm"
                >
                  macOS 客户端
                </a>
                {isMac ? (
                  <a href={MAC_ZIP_DOWNLOAD_URL} className="btn btn-secondary btn-sm">
                    macOS 备用下载
                  </a>
                ) : null}
              </div>
              <div className="mt-5 text-xs leading-6 text-[var(--fh-text-muted)]">
                如浏览器或系统弹出安全提醒，请先确认下载来源为 fhwhkj.top。首次安装时，可能需要按照系统提示手动允许打开。
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">1. 快速体验</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">不想安装时，可以直接打开网页版工作台，账号和权益保持一致。</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">2. 本地使用</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">安装客户端后，可以从桌面启动，适合更稳定的长期创作。</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">3. 同一账号</div>
            <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">官网、网页版工作台和客户端共用凤煌账号，登录后可继续使用同一套权益。</p>
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
