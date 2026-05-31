import { Link } from 'react-router-dom';

const LONGBOOK_DOWNLOAD_URL = '/downloads/longbook/longbook-current.zip';
const RECHARGE_URL = '/recharge';

export default function LongBookDownloadPage() {
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
                下载长篇创作项目包
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/74 sm:text-lg">
                这里下载的是长篇项目本体，不是凤煌桌面客户端。解压后可直接打开使用，也附带 macOS 和 Windows 本地启动脚本。
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={LONGBOOK_DOWNLOAD_URL} className="btn bg-white text-[#141414] hover:bg-[#f4eadc]" title="下载长篇项目 ZIP 包">
                  下载长篇项目 ZIP
                </a>
                <Link to={RECHARGE_URL} className="btn border border-white/25 bg-white/10 text-white hover:bg-white/20">
                  先去充值
                </Link>
              </div>
            </div>

            <aside className="rounded-[24px] border border-white/16 bg-white/[0.94] p-6 text-[var(--fh-text)] shadow-2xl shadow-black/20">
              <div className="text-xs font-semibold tracking-[0.18em] text-[var(--fh-text-muted)]">当前版本</div>
              <h2 className="mt-3 text-3xl font-semibold">长篇项目包</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fh-text-secondary)]">
                内容来自当前长篇目录，已排除备份目录和原授权 zip 文件。下载后得到的是干净运行包，不附带桌面客户端壳。
              </p>
              <a href={LONGBOOK_DOWNLOAD_URL} className="btn btn-primary mt-6 w-full" title="下载长篇项目 ZIP 包">
                立即下载
              </a>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <a href={LONGBOOK_DOWNLOAD_URL} className="glass-card group p-5 transition hover:-translate-y-0.5 hover:shadow-[var(--fh-shadow-lg)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-base font-semibold text-[var(--fh-text)]">长篇项目文件</div>
                <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">解压后双击 index.html，或使用附带启动脚本。</p>
              </div>
              <span className="text-sm text-[var(--fh-text-muted)] transition group-hover:translate-x-1">下载</span>
            </div>
          </a>
          <div className="glass-card p-5">
            <div className="text-base font-semibold text-[var(--fh-text)]">不包含客户端</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">这个入口不再下载凤煌桌面安装包。</p>
          </div>
          <div className="glass-card p-5">
            <div className="text-base font-semibold text-[var(--fh-text)]">保留授权适配</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">包内保留官网账号和订阅权益的前端适配代码。</p>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[20px] border border-[var(--fh-border)] bg-[var(--fh-surface)] p-5">
            <div className="text-sm font-semibold text-[var(--fh-text)]">本地创作空间</div>
            <p className="mt-2 text-sm leading-7 text-[var(--fh-text-secondary)]">章节、人物、世界观和草稿优先在你的电脑里运行和保存。</p>
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
          <a href={LONGBOOK_DOWNLOAD_URL} className="btn btn-secondary">
            下载 ZIP 包
          </a>
        </div>
      </div>
    </div>
  );
}
