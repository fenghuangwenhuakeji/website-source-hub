import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import type { ThemeMode } from '../utils/themePreference';
import { resolveDesktopDownloadUrl } from '../utils/desktopAccess';

type HeaderProps = {
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
};

type NavItem = {
  label: string;
  title: string;
  to?: string;
  href?: string;
  hash?: string;
  active?: boolean;
};

const HEADER_OFFSET = 96;

export function Header(_props: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopDownloadHref = resolveDesktopDownloadUrl();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;
  const avatarSrc = typeof user?.avatar === 'string' && user.avatar.trim() ? user.avatar.trim() : '';
  const avatarFallback = user?.nickname?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || '凤';

  const closeMenu = () => setMenuOpen(false);

  const navItems: NavItem[] = [
    {
      label: '中短篇小说',
      href: '/novella/',
      title: '查看中短篇小说',
      active: location.pathname === '/novella' || location.pathname === '/novella/',
    },
    {
      label: '长篇下载',
      to: '/longbook-download',
      title: '下载长篇创作项目包',
      active: location.pathname === '/longbook-download' || location.pathname === '/longbook',
    },
    {
      label: '小说展示',
      to: '/novels',
      title: '查看小说展示',
      active: location.pathname === '/novels',
    },
    {
      label: '剧本展示',
      to: '/writing?type=script',
      title: '查看剧本展示',
      active: location.pathname === '/writing' && new URLSearchParams(location.search).get('type') === 'script',
    },
    {
      label: '作品展示',
      to: '/showcase',
      title: '查看作品展示',
      active: location.pathname === '/showcase',
    },
    ...(isAuthenticated
      ? [
          {
            label: '订阅与积分',
            to: '/recharge',
            title: '管理订阅与积分',
            active: location.pathname === '/recharge',
          },
        ]
      : []),
    {
      label: '联系我们',
      hash: '#contact',
      title: '联系合作',
      active: location.pathname === '/' && location.hash === '#contact',
    },
  ];

  const scrollToHash = (hash: string) => {
    const element = document.querySelector(hash);
    if (!element) {
      return;
    }

    const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  };

  const handleNavAction = (item: NavItem) => {
    closeMenu();

    if (item.to) {
      navigate(item.to);
      return;
    }

    if (item.href) {
      window.location.assign(item.href);
      return;
    }

    if (!item.hash) {
      return;
    }

    if (location.pathname !== '/') {
      navigate({ pathname: '/', hash: item.hash });
      return;
    }

    if (window.location.hash !== item.hash) {
      navigate({ pathname: '/', hash: item.hash });
      return;
    }

    requestAnimationFrame(() => scrollToHash(item.hash!));
  };

  const renderNavItem = (item: NavItem) => {
    const className = `nav-link brand-nav-link${item.active ? ' active' : ''}`;
    const content = <span className="brand-nav-link-text">{item.label}</span>;

    if (item.href) {
      return (
        <a className={className} href={item.href} onClick={closeMenu} title={item.title}>
          {content}
        </a>
      );
    }

    return (
      <button
        type="button"
        className={className}
        onClick={() => handleNavAction(item)}
        title={item.title}
      >
        {content}
      </button>
    );
  };

  useEffect(() => {
    closeMenu();
  }, [location.pathname, location.hash]);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  return (
    <>
      {menuOpen ? (
        <button
          type="button"
          className="nav-backdrop"
          aria-label="关闭导航菜单"
          onClick={closeMenu}
        />
      ) : null}

      <header className="navbar" id="navbar">
        <div className="container">
          <div className="nav-wrapper">
            <Link to="/" className="logo" onClick={closeMenu}>
              <img src={logoSrc} alt="凤煌科技" className="logo-img" />
              <span className="logo-text">
                <span className="logo-title">凤煌科技</span>
                <span className="logo-subtitle">创作科技品牌</span>
              </span>
            </Link>

            <nav aria-label="网站导航">
              <ul className={`nav-menu ${menuOpen ? 'active' : ''}`} id="navMenu">
                <li className="mobile-only nav-mobile-panel">
                  <div className="nav-mobile-label">导航</div>
                  <p className="fh-micro">小说、剧本、展示、合作</p>
                </li>
                {navItems.map((item) => (
                  <li key={item.label}>{renderNavItem(item)}</li>
                ))}
                <li className="mobile-only nav-mobile-panel">
                  <div className="nav-mobile-label">真实产品</div>
                  <Link to="/longbook-download" className="btn btn-primary nav-cta" onClick={closeMenu}>
                    长篇项目包
                  </Link>
                  <a href={desktopDownloadHref} className="btn btn-primary nav-cta" onClick={closeMenu}>
                    全部客户端
                  </a>
                </li>
                <li className="mobile-only nav-mobile-panel">
                  <div className="nav-mobile-label">官网账号</div>
                  <div className="flex flex-wrap gap-3">
                    {isAuthenticated ? (
                      <>
                        <Link to="/dashboard" className="btn btn-primary nav-cta" onClick={closeMenu}>
                          进入工作台
                        </Link>
                        <Link to="/profile" className="btn btn-secondary nav-cta" onClick={closeMenu}>
                          个人设置
                        </Link>
                        <Link to="/recharge" className="btn btn-secondary nav-cta" onClick={closeMenu}>
                          订阅与积分
                        </Link>
                        <button type="button" className="btn btn-secondary nav-cta" onClick={handleLogout}>
                          退出登录
                        </button>
                      </>
                    ) : (
                      <>
                        <Link to="/login" className="btn btn-primary nav-cta" onClick={closeMenu}>
                          登录
                        </Link>
                        <Link to="/register" className="btn btn-secondary nav-cta" onClick={closeMenu}>
                          注册
                        </Link>
                      </>
                    )}
                  </div>
                </li>
              </ul>
            </nav>

            <div className="nav-right nav-actions">
              <Link to="/longbook-download" className="btn btn-secondary nav-ghost" title="下载长篇创作项目包">
                长篇下载
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className={`btn ${location.pathname === '/dashboard' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    title="进入官网工作台"
                  >
                    工作台
                  </Link>
                  <Link
                    to="/recharge"
                    className={`btn ${location.pathname === '/recharge' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    title="进入订阅与积分"
                  >
                    充值
                  </Link>
                  <Link
                    to="/profile"
                    className={`nav-user-chip nav-user-link${location.pathname === '/profile' ? ' active' : ''}`}
                    title="进入个人设置"
                  >
                    <span className="nav-user-avatar" aria-hidden="true">
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      <span>{avatarFallback}</span>
                    </span>
                    {user?.nickname ?? '官网用户'}
                  </Link>
                  <button
                    type="button"
                    className="btn btn-secondary nav-ghost"
                    onClick={handleLogout}
                  >
                    退出
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className={`btn ${location.pathname === '/login' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    title="进入官网登录"
                  >
                    登录
                  </Link>
                  <Link
                    to="/register"
                    className={`btn ${location.pathname === '/register' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                    title="创建官网账号"
                  >
                    注册
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className={`hamburger ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen((value) => !value)}
              aria-label={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
              title={menuOpen ? '关闭导航菜单' : '打开导航菜单'}
              aria-expanded={menuOpen}
              aria-controls="navMenu"
              aria-haspopup="menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
