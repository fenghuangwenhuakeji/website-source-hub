import { Link } from 'react-router-dom';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

const contactLinks = [
  { label: 'contact@fenghuangkeji.cn', href: 'mailto:contact@fenghuangkeji.cn', meta: '邮箱' },
  { label: '188-8895-8787', href: 'tel:18888958787', meta: '电话' },
  { label: '官方 QQ 群 702651146', href: 'https://qm.qq.com/', meta: '社群' },
];

export function Footer() {
  const desktopLoginHref = resolveDesktopLoginUrl();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const wechatQrSrc = `${import.meta.env.BASE_URL}images/wechat-qr.jpg`;
  const xiaohongshuQrSrc = `${import.meta.env.BASE_URL}images/xiaohongshu-qr.jpg`;
  const qqQrSrc = `${import.meta.env.BASE_URL}images/qq-qr.jpg`;
  const bilibiliQrSrc = `${import.meta.env.BASE_URL}images/bilibili-qr.jpg`;
  const icpCertSrc = `${import.meta.env.BASE_URL}images/ICP.jpg`;
  const webCultureCertSrc = `${import.meta.env.BASE_URL}images/wangluowenhua.png`;
  const serviceCertSrc = `${import.meta.env.BASE_URL}images/fuwuhao.jpg`;
  const publicSecurityHref = 'https://beian.mps.gov.cn/#/query/webSearch?code=32010402002406';

  const quickLinks = [
    { label: '首页', to: '/' },
    { label: '小说助手', to: '/novels' },
    { label: '剧本工坊', to: '/writing?type=script' },
    { label: '作品展示', to: '/showcase' },
    { label: '联系我们', href: '/#contact' },
    { label: '桌面端入口', href: desktopLoginHref },
  ];

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand-panel">
            <div className="footer-logo">
              <img src={logoSrc} alt="凤煌科技" className="footer-logo-img" />
              <div className="footer-logo-text">
                <h3>凤煌科技</h3>
                <p>让产品、内容和合作，在同一个品牌里持续生长。</p>
              </div>
            </div>
            <p className="footer-brand-copy">
              桌面软件、小说写作、漫剧剧本、分镜视频、网页软件、游戏开发、联合共创，都在凤煌科技这一品牌之下向外生长。
            </p>
            <div className="footer-badges footer-brand-metadata">
              <span>桌面端</span>
              <span>小说助手</span>
              <span>剧本工坊</span>
              <span>作品展示</span>
            </div>
            <div className="footer-cta">
              <a href={desktopLoginHref} className="btn btn-primary footer-cta-button">
                打开桌面端
              </a>
              <Link to="/showcase" className="btn btn-secondary footer-cta-button">
                查看作品展示
              </Link>
              <a href="/#contact" className="btn btn-secondary footer-cta-button">
                联系合作
              </a>
            </div>
          </div>

          <div className="footer-link-grid">
            <div className="footer-column">
              <h4>导航</h4>
              <ul>
                {quickLinks.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to}>{link.label}</Link>
                    ) : link.href?.startsWith('http') ? (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <a href={link.href}>{link.label}</a>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="footer-column footer-contact-collection">
              <h4>合作入口</h4>
              <ul>
                <li>
                  <a href="/showcase">作品展示</a>
                </li>
                <li>
                  <a href="/#contact">联系合作</a>
                </li>
                <li>
                  <a href={desktopLoginHref}>桌面端入口</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>联系方式</h4>
              <ul>
                {contactLinks.map((link) => (
                  <li key={link.label} className="footer-contact-item">
                    <div className="text-xs opacity-70">{link.meta}</div>
                    <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-divider" aria-hidden="true" />

        <div className="footer-cta-panel">
          <div className="footer-cta-card">
            <p>如果你想了解凤煌科技最擅长打造的产品、内容和合作方向，就从这里开始。</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link to="/showcase" className="btn btn-ghost">
                进入作品展示
              </Link>
              <a href="/#contact" className="btn btn-secondary">
                联系合作
              </a>
            </div>
          </div>
          <div className="footer-cta-card footer-cta-card-light">
            <p>合作方式</p>
            <span>品牌联名 / 项目共创 / 内容合作</span>
            <span>邮箱 / 电话 / 社群</span>
          </div>
        </div>

        <div className="footer-qrcodes">
          <div className="qr-item">
            <div className="qr-img">
              <img src={wechatQrSrc} alt="微信" />
            </div>
            <span>微信公众号</span>
          </div>
          <div className="qr-item">
            <div className="qr-img">
              <img src={xiaohongshuQrSrc} alt="小红书" />
            </div>
            <span>小红书</span>
          </div>
          <div className="qr-item">
            <div className="qr-img">
              <img src={qqQrSrc} alt="QQ" />
            </div>
            <span>官方 QQ 群</span>
          </div>
          <div className="qr-item">
            <div className="qr-img">
              <img src={bilibiliQrSrc} alt="B站" />
            </div>
            <span>B站账号</span>
          </div>
          <div className="qr-item">
            <div className="qr-img">
              <img src={serviceCertSrc} alt="服务号二维码" />
            </div>
            <span>服务号</span>
          </div>
        </div>

        <div className="footer-cert-zone" aria-label="备案与资质展示">
          <div className="footer-cert-copy">
            <p className="footer-cert-kicker">备案与资质</p>
            <h4>官网公示信息</h4>
            <div className="footer-cert-meta">
              <a href={icpCertSrc} target="_blank" rel="noreferrer">
                苏 ICP 备 2026008510 号-1
              </a>
              <a href={webCultureCertSrc} target="_blank" rel="noreferrer">
                苏 ICP 备 2026008510 号-2
              </a>
              <a href={publicSecurityHref} target="_blank" rel="noreferrer">
                苏公网安备 32010402002406 号
              </a>
              <a href={icpCertSrc} target="_blank" rel="noreferrer">
                ICP 备案图
              </a>
              <a href={webCultureCertSrc} target="_blank" rel="noreferrer">
                网络文化资质图
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>Copyright © 2026 凤煌科技有限公司</p>
        </div>
      </div>
    </footer>
  );
}
