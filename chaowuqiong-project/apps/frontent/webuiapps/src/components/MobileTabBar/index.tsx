import React from 'react';
import { Bot, Crown, Grid3X3, Home, MessageCircle, User } from 'lucide-react';
import styles from './index.module.scss';

interface TabItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  path?: string;
}

interface MobileTabBarProps {
  activeTab: string;
  onTabChange: (key: string) => void;
  showAgent?: boolean;
}

const ACCENT_MAP: Record<string, string> = {
  home: '#22d3ee',
  chat: '#34d399',
  agent: '#f59e0b',
  apps: '#a78bfa',
  vip: '#fb7185',
  profile: '#38bdf8',
};

const MobileTabBar: React.FC<MobileTabBarProps> = ({ activeTab, onTabChange, showAgent = true }) => {
  const tabs: TabItem[] = [
    { key: 'home', icon: <Home size={20} />, label: '首页', path: '/main' },
    { key: 'chat', icon: <MessageCircle size={20} />, label: '聊天', path: '/main' },
    { key: 'apps', icon: <Grid3X3 size={20} />, label: '应用', path: '/main' },
    { key: 'vip', icon: <Crown size={20} />, label: '充值', path: '/recharge' },
    { key: 'profile', icon: <User size={20} />, label: '我的', path: '/profile' },
  ];

  if (showAgent) {
    tabs.splice(2, 0, { key: 'agent', icon: <Bot size={20} />, label: 'AI', path: '/main' });
  }

  const handleTabClick = (tab: TabItem) => {
    onTabChange(tab.key);

    if (tab.key === 'home' || tab.key === 'apps' || tab.key === 'agent') {
      window.location.hash = '';
      return;
    }

    if (tab.path) {
      window.location.assign(tab.path);
    }
  };

  return (
    <div className={styles.tabBar}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`${styles.tabItem} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => handleTabClick(tab)}
          aria-pressed={activeTab === tab.key}
          style={
            {
              '--tab-accent': ACCENT_MAP[tab.key] || '#38bdf8',
            } as React.CSSProperties
          }
        >
          <span className={styles.icon}>{tab.icon}</span>
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default MobileTabBar;
