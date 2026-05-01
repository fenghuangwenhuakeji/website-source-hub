import { useEffect, useMemo, useState } from 'react';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AdminGlyph, type AdminGlyphName } from '../../components/AdminGlyph';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { resolveThemeMode, setPreferredThemeMode, subscribeThemeMode, type ThemeMode } from '../../themePreference';

interface MenuItem {
  key: string;
  icon: AdminGlyphName;
  label: string;
}

const menuItems: MenuItem[] = [
  { key: '/dashboard', icon: 'dashboard', label: '运营总览' },
  { key: '/users', icon: 'user', label: '用户管理' },
  { key: '/orders', icon: 'orders', label: '订单管理' },
  { key: '/packages', icon: 'packages', label: '套餐管理' },
  { key: '/exchange-products', icon: 'gift', label: '兑换商品' },
  { key: '/exchange-records', icon: 'gift', label: '兑换记录' },
  { key: '/experience-codes', icon: 'gift', label: '体验码管理' },
  { key: '/experience-code-records', icon: 'time', label: '体验码记录' },
  { key: '/referrals', icon: 'team', label: '邀请增长' },
  { key: '/durations', icon: 'time', label: '时长管理' },
];

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': {
    title: '凤煌科技运营总览',
    subtitle: '查看用户、订单、兑换、时长与收入的整体走势。',
  },
  '/users': {
    title: '用户管理',
    subtitle: '统一维护账号状态、积分、角色权限、累计充值与邀请关系。',
  },
  '/orders': {
    title: '订单管理',
    subtitle: '支持手动补单、编辑订单记录，并把支付补录和普通修改分开处理。',
  },
  '/packages': {
    title: '套餐管理',
    subtitle: '维护前台售卖套餐与积分到账规则。',
  },
  '/exchange-products': {
    title: '兑换商品',
    subtitle: '配置积分兑换时长的商品内容、成本与排序。',
  },
  '/exchange-records': {
    title: '兑换记录',
    subtitle: '管理用户积分兑换流水；若需同步实际时长，请配合时长管理一起调整。',
  },
  '/experience-codes': {
    title: '体验码管理',
    subtitle: '统一生成 7 天有效的积分体验码，支持单个与批量发放。',
  },
  '/experience-code-records': {
    title: '体验码记录',
    subtitle: '查看体验码的兑换、绑定用户、过期和激活时间，便于追踪发放效果。',
  },
  '/referrals': {
    title: '邀请增长',
    subtitle: '查看钻石返佣规则、邀请链路、提现审核与人工打款状态。',
  },
  '/durations': {
    title: '时长管理',
    subtitle: '直接维护用户剩余时长、永久状态与到期时间。',
  },
};

function getCurrentPageMeta(pathname: string) {
  const matchedKey =
    Object.keys(pageMeta).find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? '/dashboard';
  return pageMeta[matchedKey];
}

function getActiveMenuKey(pathname: string) {
  return menuItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key ?? '/dashboard';
}

function createThemeConfig(themeMode: ThemeMode) {
  return {
    algorithm: themeMode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: '#7c3aed',
      colorInfo: '#22d3ee',
      colorSuccess: '#34d399',
      colorWarning: '#f59e0b',
      colorError: '#fb7185',
      borderRadius: 18,
      fontFamily: '"PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif',
      colorBgBase: themeMode === 'dark' ? '#050814' : '#0b1220',
      colorTextBase: '#edf2ff',
    },
  };
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width: 1099px)');

  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState(resolveThemeMode());

  const currentMeta = useMemo(() => getCurrentPageMeta(location.pathname), [location.pathname]);
  const activeMenuKey = useMemo(() => getActiveMenuKey(location.pathname), [location.pathname]);
  const themeConfig = useMemo(() => createThemeConfig(themeMode), [themeMode]);

  useEffect(() => subscribeThemeMode(setThemeMode), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }

    setLoading(false);
  }, [navigate]);

  useEffect(() => {
    setDrawerOpen(false);
    if (isMobile) {
      setCollapsed(false);
    }
  }, [isMobile, location.pathname]);

  useEffect(() => {
    document.body.classList.toggle('admin-drawer-open', isMobile && drawerOpen);

    return () => {
      document.body.classList.remove('admin-drawer-open');
    };
  }, [drawerOpen, isMobile]);

  const handleNavigate = (key: string) => {
    navigate(key);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const handleToggleThemeMode = () => {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    setPreferredThemeMode(nextMode);
  };

  const displayName = (user?.nickname as string) || (user?.username as string) || '管理员';
  const displayAccount = (user?.username as string) || '已连接凤煌科技运营后台';

  const brandNode = (
    <div className={['admin-brand', collapsed && !isMobile ? 'admin-brand-collapsed' : ''].filter(Boolean).join(' ')}>
      <span className="admin-brand-badge">
        <img src="/favicon.png" alt="凤煌科技" className="admin-brand-logo" />
      </span>
      {(!collapsed || isMobile) && (
        <div className="admin-brand-copy">
          <span className="admin-brand-title">凤煌科技</span>
          <span className="admin-brand-subtitle">Fenghuang Technology</span>
        </div>
      )}
    </div>
  );

  const navNode = (
    <nav className="admin-nav" aria-label="后台导航">
      {menuItems.map((item) => {
        const active = item.key === activeMenuKey;
        return (
          <button
            key={item.key}
            type="button"
            className={['admin-nav-item', active ? 'admin-nav-item-active' : ''].filter(Boolean).join(' ')}
            onClick={() => handleNavigate(item.key)}
            aria-current={active ? 'page' : undefined}
            title={item.label}
          >
            <AdminGlyph name={item.icon} className="admin-nav-icon" />
            {(!collapsed || isMobile) && <span className="admin-nav-label">{item.label}</span>}
          </button>
        );
      })}
    </nav>
  );

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntdApp>
        {loading ? (
          <div className="admin-loading-shell">
            <div className="admin-loading-card">
              <div className="admin-loading-badge">凤煌科技</div>
              <div className="admin-loading-spinner" />
              <div className="admin-loading-title">正在进入管理后台</div>
              <div className="admin-loading-copy">正在校验登录状态并准备控制台资源。</div>
            </div>
          </div>
        ) : (
          <div className="admin-shell">
            {!isMobile ? (
              <aside className={['admin-sidebar', collapsed ? 'admin-sidebar-collapsed' : ''].filter(Boolean).join(' ')}>
                {brandNode}
                {navNode}
                <div className="admin-sidebar-footer">
                  <span className="admin-status-chip">
                    <span className="admin-status-dot" />
                    后台轻壳层已启用
                  </span>
                </div>
              </aside>
            ) : null}

            {isMobile && drawerOpen ? (
              <>
                <button
                  type="button"
                  className="admin-drawer-backdrop"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="关闭导航菜单"
                />
                <aside className="admin-drawer-panel">
                  <div className="admin-drawer-shell">
                    {brandNode}
                    <div className="admin-mobile-drawer-meta">
                      <span className="admin-mobile-drawer-title">{currentMeta.title}</span>
                      <span className="admin-mobile-drawer-copy">{currentMeta.subtitle}</span>
                    </div>
                    {navNode}
                    <div className="admin-sidebar-footer">
                      <span className="admin-status-chip">
                        <span className="admin-status-dot" />
                        手机端全屏控制台
                      </span>
                    </div>
                  </div>
                </aside>
              </>
            ) : null}

            <div
              className={[
                'admin-main',
                !isMobile ? 'admin-main-desktop' : '',
                !isMobile && collapsed ? 'admin-main-collapsed' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <header className="admin-header">
                <div className="admin-header-left">
                  <button
                    type="button"
                    className="admin-shell-button admin-shell-icon-button"
                    onClick={() => (isMobile ? setDrawerOpen(true) : setCollapsed((value) => !value))}
                    aria-label={isMobile ? '打开导航菜单' : collapsed ? '展开侧栏' : '收起侧栏'}
                  >
                    <AdminGlyph name={isMobile ? 'menu' : collapsed ? 'expand' : 'collapse'} />
                  </button>
                  <div className="admin-header-copy">
                    <span className="admin-header-title">{currentMeta.title}</span>
                    {!isMobile ? <span className="admin-header-subtitle">{currentMeta.subtitle}</span> : null}
                  </div>
                </div>

                <div className="admin-header-right">
                  {!isMobile ? <span className="admin-header-tag">轻壳层运营视图</span> : null}

                  <button type="button" className="admin-shell-button" onClick={handleToggleThemeMode}>
                    <AdminGlyph name={themeMode === 'dark' ? 'sun' : 'moon'} />
                    {!isMobile ? <span>{themeMode === 'dark' ? '浅色' : '深色'}</span> : null}
                  </button>

                  <div className="admin-user-card">
                    <span className="admin-user-avatar">{displayName.slice(0, 1)}</span>
                    {!isMobile ? (
                      <div className="admin-user-meta">
                        <span className="admin-user-name">{displayName}</span>
                        <span className="admin-user-copy">{displayAccount}</span>
                      </div>
                    ) : null}
                  </div>

                  <button type="button" className="admin-shell-button admin-shell-button-danger" onClick={handleLogout}>
                    <AdminGlyph name="logout" />
                    {!isMobile ? <span>退出</span> : null}
                  </button>
                </div>
              </header>

              <main className="admin-content">
                <div className="admin-content-shell">
                  <Outlet />
                </div>
              </main>
            </div>
          </div>
        )}
      </AntdApp>
    </ConfigProvider>
  );
}
