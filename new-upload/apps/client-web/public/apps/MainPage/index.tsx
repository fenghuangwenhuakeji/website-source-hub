import React, { useState, useEffect } from 'react';
import { Button, Card, Row, Col, Statistic, Drawer, Menu } from 'antd';
import { CrownOutlined, UserOutlined, MenuOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import api from '../../api';
import { useMobile, useViewportHeight } from '../../hooks/useMobile';
import styles from './index.module.scss';

interface MainPageProps {
  onLogout: () => void;
}

export default function MainPage({ onLogout }: MainPageProps) {
  const [points, setPoints] = useState(0);
  const [role, setRole] = useState('normal');
  const [username, setUsername] = useState('');
  const [drawerVisible, setDrawerVisible] = useState(false);
  
  const device = useMobile();
  useViewportHeight();

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const res = await api.auth.profile() as any;
      if (res.success) {
        setPoints(res.data.points || 0);
        setRole(res.data.role || 'normal');
        setUsername(res.data.username || '');
      }
    } catch {
      console.error('Failed to load user info');
    }
  };

  const getRoleText = () => {
    switch (role) {
      case 'rootadmin':
        return '超级管理员';
      case 'admin':
        return '管理员';
      default:
        return '尊贵用户';
    }
  };

  const getRoleColor = () => {
    switch (role) {
      case 'rootadmin':
        return '#ff4d4f';
      case 'admin':
        return '#faad14';
      default:
        return '#52c41a';
    }
  };

  if (device.isMobile) {
    return (
      <div className={styles.mobileMainPage}>
        <div className={styles.mobileHeader}>
          <Button 
            type="text" 
            icon={<MenuOutlined />} 
            onClick={() => setDrawerVisible(true)}
            className={styles.menuButton}
          />
          <h1 className={styles.mobileTitle}>超无穹</h1>
          <div className={styles.mobileUserInfo}>
            <CrownOutlined style={{ color: getRoleColor() }} />
          </div>
        </div>

        <div className={styles.mobileWelcome}>
          <div className={styles.welcomeText}>
            <h2>欢迎，{username}</h2>
            <span style={{ color: getRoleColor() }}>{getRoleText()}</span>
          </div>
        </div>

        <div className={styles.mobileStats}>
          <Card className={styles.statCard}>
            <Statistic
              title="当前积分"
              value={points}
              prefix={<CrownOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontSize: '28px' }}
            />
          </Card>
          <Card className={styles.statCard}>
            <Statistic
              title="账户状态"
              value={points > 0 ? '已激活' : '未激活'}
              prefix={<UserOutlined style={{ color: points > 0 ? '#52c41a' : '#ff4d4f' }} />}
              valueStyle={{ color: points > 0 ? '#52c41a' : '#ff4d4f', fontSize: '18px' }}
            />
          </Card>
        </div>

        <div className={styles.mobileContent}>
          <Card className={styles.infoCard}>
            <div className={styles.infoContent}>
              <h3>您已成功登录主程序</h3>
              <p>欢迎使用超无穹系统</p>
            </div>
          </Card>
        </div>

        <Drawer
          title="菜单"
          placement="right"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          className={styles.mobileDrawer}
        >
          <Menu mode="vertical" className={styles.drawerMenu}>
            <Menu.Item key="profile" icon={<UserOutlined />}>
              个人中心
            </Menu.Item>
            <Menu.Item key="settings" icon={<SettingOutlined />}>
              设置
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item 
              key="logout" 
              icon={<LogoutOutlined />} 
              onClick={onLogout}
              danger
            >
              退出登录
            </Menu.Item>
          </Menu>
        </Drawer>
      </div>
    );
  }

  return (
    <div className={styles.mainPage}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>欢迎，{username}</h1>
            <p>
              {role === 'rootadmin' && '超级管理员'}
              {role === 'admin' && '管理员'}
              {(role === 'normal' || !role) && '尊贵用户'}
            </p>
          </div>
          <Button onClick={onLogout}>退出登录</Button>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="当前积分"
                value={points}
                prefix={<CrownOutlined style={{ color: '#faad14' }} />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="账户状态"
                value={points > 0 ? '已激活' : '未激活'}
                prefix={<UserOutlined style={{ color: points > 0 ? '#52c41a' : '#ff4d4f' }} />}
                valueStyle={{ color: points > 0 ? '#52c41a' : '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="用户角色"
                value={role === 'rootadmin' ? '超级管理员' : role === 'admin' ? '管理员' : '普通用户'}
                prefix={<CrownOutlined style={{ color: '#667eea' }} />}
              />
            </Card>
          </Col>
        </Row>

        <div className={styles.welcomeCard}>
          <h2>您已成功登录主程序</h2>
          <p>欢迎使用超无穹系统</p>
        </div>
      </div>
    </div>
  );
}
