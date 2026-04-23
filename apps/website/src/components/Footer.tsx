import { Link } from 'react-router-dom';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

const contactLinks = [
  { label: 'contact@fenghuangkeji.cn', href: 'mailto:contact@fenghuangkeji.cn' },
  { label: '188-8895-8787', href: 'tel:18888958787' },
  { label: '官方 QQ 群 702651146', href: 'https://qm.qq.com/' },
];

const navLinks = [
  { label: '首页', to: '/' },
  { label: '小说助手', to: '/novels' },
  { label: '剧本工坊', to: '/writing?type=script' },
  { label: '作品展示', to: '/showcase' },
  { label: '桌面端入口', href: resolveDesktopLoginUrl() },
];

export function Footer() {
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const icpCertSrc = `${import.meta.env.BASE_URL}images/ICP.jpg`;
  const webCultureCertSrc = `${import.meta.env.BASE_URL}images/wangluowenhua.png`;
  const publicSecurityHref = 'https://beian.mps.gov.cn/#/query/webSearch?code=32010402002406';

  const qrCodes = [
    { src: `${import.meta.env.BASE_URL}images/wechat-qr.jpg`, label: '微信公众号' },
    { src: `${import.meta.env.BASE_URL}images/xiaohongshu-qr.jpg`, label: '小红书' },
    { src: `${import.meta.env.BASE_URL}images/qq-qr.jpg`, label: '官方 QQ 群' },
    { src: `${import.meta.env.BASE_URL}images/bilibili-qr.jpg`, label: 'B站账号' },
    { src: `${import.meta.env.BASE_URL}images/fuwuhao.jpg`, label: '服务号' },
  ];

  return (
    <footer className="footer" id="contact">
      <div className="container">
        <div className="footer-main">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logoSrc} alt="凤煌科技" className="footer-logo-img" />
              <div className="footer-logo-text">
                <h3>凤煌科技</h3>
                <p>让产品、内容和合作，在同一个品牌里持续生长。</p>
              </div>
            </div>
            <p className="footer-brand-copy">
              桌面软件、小说写作、漫剧剧本、分镜视频、网页软件、游戏开发、联合共创。
            </p>
            <div className="footer-actions">
              <a href={resolveDesktopLoginUrl()} className="btn btn-primary btn-sm">
                打开桌面端
              </a>
              <Link to="/showcase" className="btn btn-secondary btn-sm">
                作品展示
              </Link>
            </div>
          </div>

          <div className="footer-nav">
            <div className="footer-nav-col">
              <h4>导航</h4>
              <ul>
                {navLinks.map((link) => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link to={link.to}>{link.label}</Link>
                    ) : (
                      <a href={link.href} target="_blank" rel="noreferrer">
                        {link.label}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>合作</h4>
              <ul>
                <li>
                  <span>品牌联名</span>
                </li>
                <li>
                  <span>项目共创</span>
                </li>
                <li>
                  <span>内容合作</span>
                </li>
              </ul>
            </div>
            <div className="footer-nav-col">
              <h4>联系方式</h4>
              <ul>
                {contactLinks.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} target={link.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-qrcodes">
          {qrCodes.map((qr) => (
            <div key={qr.label} className="qr-item">
              <div className="qr-img">
                <img src={qr.src} alt={qr.label} />
              </div>
              <span>{qr.label}</span>
            </div>
          ))}
        </div>

        <div className="footer-certs">
          <a href={icpCertSrc} target="_blank" rel="noreferrer">苏 ICP 备 2026008510 号-1</a>
          <span className="cert-dot" />
          <a href={webCultureCertSrc} target="_blank" rel="noreferrer">苏 ICP 备 2026008510 号-2</a>
          <span className="cert-dot" />
          <a href={publicSecurityHref} target="_blank" rel="noreferrer">苏公网安备 32010402002406 号</a>
        </div>

        <div className="footer-bottom">
          <p>Copyright © 2026 凤煌科技有限公司</p>
        </div>
      </div>
    </footer>
  );
}
