import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import type { ThemeMode } from '../utils/themePreference';
import { resolveDesktopLoginUrl } from '../utils/desktopAccess';

type HeaderProps = {
  themeMode: ThemeMode;
  onToggleThemeMode: () => void;
};

type NavItem = {
  label: string;
  title: string;
  to?: string;
  hash?: string;
  active?: boolean;
};

const HEADER_OFFSET = 96;

export function Header({ themeMode, onToggleThemeMode }: HeaderProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const desktopLoginHref = resolveDesktopLoginUrl();
  const logoSrc = `${import.meta.env.BASE_URL}images/logo.png`;

  const closeMenu = () => setMenuOpen(false);

  const navItems: NavItem[] = [
    {
      label: '小说助手',
      to: '/novels',
      title: '进入小说助手',
      active: location.pathname === '/novels',
    },
    {
      label: '剧本工坊',
      to: '/writing?type=script',
      title: '进入剧本工坊',
      active: location.pathname === '/writing' && new URLSearchParams(location.search).get('type') === 'script',
    },
    {
      label: '作品展示',
      to: '/showcase',
      title: '查看作品展示',
      active: location.pathname === '/showcase',
    },
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

  const renderNavItem = (item: NavItem) => (
    <button
      type="button"
      className={`nav-link brand-nav-link${item.active ? ' active' : ''}`}
      onClick={() => handleNavAction(item)}
      title={item.title}
    >
      <span className="brand-nav-link-text">{item.label}</span>
    </button>
  );

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
                <span className="logo-subtitle">Creative Tech Brand</span>
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
                  <div className="nav-mobile-label">主题</div>
                  <button
                    type="button"
                    className="theme-toggle-button nav-ghost-button"
                    onClick={onToggleThemeMode}
                    aria-label="切换主题模式"
                  >
                    {themeMode === 'dark' ? '切换浅色' : '切换深色'}
                  </button>
                </li>
                <li className="mobile-only nav-mobile-panel">
                  <div className="nav-mobile-label">桌面端</div>
                  <a href={desktopLoginHref} className="btn btn-primary nav-cta" onClick={closeMenu}>
                    打开桌面端
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
              <button
                type="button"
                className="theme-toggle-button nav-ghost-button"
                onClick={onToggleThemeMode}
                aria-label="切换主题模式"
              >
                {themeMode === 'dark' ? '切换浅色' : '切换深色'}
              </button>
              <a href={desktopLoginHref} className="btn btn-secondary nav-ghost" title="打开桌面端">
                桌面端
              </a>
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
                    to="/profile"
                    className={`nav-user-chip nav-user-link${location.pathname === '/profile' ? ' active' : ''}`}
                    title="进入个人设置"
                  >
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
