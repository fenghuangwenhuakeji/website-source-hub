import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Button, message, Tabs, Divider, QRCode, Modal, Checkbox, Tooltip } from 'antd';
import { 
  CrownOutlined, 
  UserOutlined, 
  LockOutlined, 
  MobileOutlined,
  MailOutlined,
  WechatOutlined,
  SafetyCertificateOutlined,
  GiftOutlined,
  TeamOutlined,
  StarOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  FireOutlined
} from '@ant-design/icons';
import api from '../../api';
import ParticleBackground from '../../components/ParticleBackground';
import styles from './index.module.scss';

const { TabPane } = Tabs;

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  const [loginMethod, setLoginMethod] = useState<'password' | 'phone'>('password');
  const [form] = Form.useForm();
  const [registerForm] = Form.useForm();
  const [phoneForm] = Form.useForm();
  const [forgotForm] = Form.useForm();
  const [countdown, setCountdown] = useState(0);
  const [wxQrVisible, setWxQrVisible] = useState(false);
  const [wxQrCode, setWxQrCode] = useState('');
  const [wxState, setWxState] = useState('');
  const [wxPolling, setWxPolling] = useState(false);
  const [forgotVisible, setForgotVisible] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleLogin = async (values: { username: string; password: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.login(values) as any;
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success('登录成功');
        onLoginSuccess();
      } else {
        message.error(res.message || '登录失败');
      }
    } catch {
      message.error('登录请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async (values: { phone: string; code: string }) => {
    setLoading(true);
    try {
      // 使用新的短信登录接口
      const res = await api.auth.smsLogin({
        phoneNumber: values.phone,
        code: values.code,
      }) as any;
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        message.success(res.data.user.isNewUser ? '注册成功' : '登录成功');
        onLoginSuccess();
      } else {
        message.error(res.message || '登录失败');
      }
    } catch {
      message.error('登录请求失败');
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneCode = async () => {
    let phone = phoneForm.getFieldValue('phone');
    // 自动去除空格和特殊字符
    phone = phone?.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    if (!phone) {
      message.error('请输入手机号');
      return;
    }
    
    if (phone.length !== 11) {
      message.error('手机号必须是11位数字');
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.error('手机号格式不正确，请输入正确的中国大陆手机号（1开头，第二位3-9）');
      return;
    }
    
    try {
      // 使用新的短信发送接口
      const res = await api.auth.sendSmsCode(phone) as any;
      if (res.success) {
        message.success('验证码已发送');
        setCountdown(60);
        // 开发环境显示验证码
        if (res.code) {
          message.info(`验证码: ${res.code}`);
        }
      } else {
        message.error(res.message || '发送失败');
      }
    } catch {
      message.error('发送请求失败');
    }
  };

  const sendRegisterPhoneCode = async () => {
    let phone = registerForm.getFieldValue('phone');
    // 自动去除空格和特殊字符
    phone = phone?.toString().replace(/\s+/g, '').replace(/[^0-9]/g, '');
    
    if (!phone) {
      message.error('请输入手机号');
      return;
    }
    
    if (phone.length !== 11) {
      message.error('手机号必须是11位数字');
      return;
    }
    
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      message.error('手机号格式不正确，请输入正确的中国大陆手机号（1开头，第二位3-9）');
      return;
    }
    
    try {
      // 使用新的短信发送接口
      const res = await api.auth.sendSmsCode(phone) as any;
      if (res.success) {
        message.success('验证码已发送');
        setCountdown(60);
        if (res.code) {
          message.info(`验证码: ${res.code}`);
        }
      } else {
        message.error(res.message || '发送失败');
      }
    } catch {
      message.error('发送请求失败');
    }
  };

  const handleRegister = async (values: { 
    username: string; 
    password: string; 
    confirmPassword: string;
    phone?: string;
    email?: string;
    referralCode?: string;
    phoneCode?: string;
  }) => {
    if (values.password !== values.confirmPassword) {
      message.error('两次密码不一致');
      return;
    }
    
    if (!agreed) {
      message.error('请阅读并同意用户协议');
      return;
    }
    
    if (values.phone && !values.phoneCode) {
      message.error('请输入手机验证码');
      return;
    }
    
    setLoading(true);
    try {
      const res = await api.auth.register({
        username: values.username,
        password: values.password,
        phone: values.phone,
        email: values.email,
        referralCode: values.referralCode,
        phoneCode: values.phoneCode,
      }) as any;
      if (res.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        const bonus = res.data.welcomeBonus;
        message.success(`注册成功！获得 ${bonus?.totalPoints || 550} 积分 + ${bonus?.durationDays || 5}天会员时长！`);
        onLoginSuccess();
      } else {
        message.error(res.message || res.error || '注册失败');
      }
    } catch {
      message.error('注册请求失败');
    } finally {
      setLoading(false);
    }
  };

  // 微信扫码登录
  const handleWechatLogin = async () => {
    try {
      const res = await api.wechat.getLoginQrcode('') as any;
      if (res.success) {
        setWxQrCode(res.data.qrCode);
        setWxState(res.data.state);
        setWxQrVisible(true);
        // 开始轮询登录状态
        startWxPolling(res.data.state);
      } else {
        message.error(res.message || '获取微信登录二维码失败');
      }
    } catch {
      message.error('请求失败');
    }
  };

  // 轮询微信登录状态
  const startWxPolling = (state: string) => {
    setWxPolling(true);
    let attempts = 0;
    const maxAttempts = 60; // 最多轮询60次（5分钟）
    
    const poll = async () => {
      if (!wxPolling || attempts >= maxAttempts) {
        setWxPolling(false);
        return;
      }
      
      try {
        const res = await api.auth.wechatStatus(state) as any;
        if (res.success) {
          const { status, user, token } = res.data;
          
          if (status === 'success' && user && token) {
            // 登录成功
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            message.success(user.isNewUser ? '微信注册成功' : '微信登录成功');
            setWxQrVisible(false);
            setWxPolling(false);
            onLoginSuccess();
            return;
          } else if (status === 'expired') {
            message.error('二维码已过期，请重新获取');
            setWxPolling(false);
            setWxQrVisible(false);
            return;
          }
        }
      } catch (error) {
        console.error('轮询失败:', error);
      }
      
      attempts++;
      if (wxPolling && attempts < maxAttempts) {
        setTimeout(poll, 5000); // 每5秒轮询一次
      }
    };
    
    poll();
  };

  // 关闭微信登录弹窗时停止轮询
  const handleWxModalClose = () => {
    setWxQrVisible(false);
    setWxPolling(false);
  };

  const handleForgotPassword = async (values: { email: string; code: string; newPassword: string }) => {
    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(values) as any;
      if (res.success) {
        message.success('密码重置成功，请登录');
        setForgotVisible(false);
        forgotForm.resetFields();
      } else {
        message.error(res.message || '重置失败');
      }
    } catch {
      message.error('请求失败');
    } finally {
      setLoading(false);
    }
  };

  const sendEmailCode = async (type: 'bind' | 'reset') => {
    const email = forgotForm.getFieldValue('email');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      message.error('请输入正确的邮箱');
      return;
    }
    
    try {
      const res = await api.auth.sendEmailCode(email, type) as any;
      if (res.success) {
        message.success('验证码已发送');
        setCountdown(60);
        if (res.data?.demoCode) {
          message.info(`演示验证码: ${res.data.demoCode}`);
        }
      } else {
        message.error(res.message || '发送失败');
      }
    } catch {
      message.error('发送请求失败');
    }
  };

  return (
    <div className={styles.loginContainer}>
      <ParticleBackground />

      <div className={styles.logoSection}>
        <div className={styles.logoWrapper}>
          <CrownOutlined />
        </div>
        <h1 className={styles.brandName}>超无穹系统</h1>
        <p className={styles.brandSlogan}>开启您的无限可能</p>
        
        <div className={styles.features}>
          <div className={styles.featureItem}>
            <RocketOutlined />
            <span>极速体验</span>
          </div>
          <div className={styles.featureItem}>
            <ThunderboltOutlined />
            <span>稳定可靠</span>
          </div>
          <div className={styles.featureItem}>
            <FireOutlined />
            <span>持续更新</span>
          </div>
        </div>
        
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>10万+</span>
            <span className={styles.statLabel}>活跃用户</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>99.9%</span>
            <span className={styles.statLabel}>稳定运行</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>24/7</span>
            <span className={styles.statLabel}>技术支持</span>
          </div>
        </div>
      </div>

      <Card className={styles.loginCard} bordered={false}>
          <div className={styles.cardHeader}>
            <div className={styles.headerDecor} />
            <h2 className={styles.cardTitle}>
              {activeTab === 'login' ? '欢迎回来' : '创建账户'}
            </h2>
            <p className={styles.cardSubtitle}>
              {activeTab === 'login' ? '登录您的账户继续使用' : '注册即享新用户专属福利'}
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            centered
            className={styles.tabs}
          >
            <TabPane tab="登录" key="login" />
            <TabPane tab="注册" key="register" />
          </Tabs>

          {activeTab === 'login' ? (
            <>
              <div className={styles.methodSwitch}>
                <Button 
                  className={`${styles.methodBtn} ${loginMethod === 'password' ? styles.active : ''}`}
                  onClick={() => setLoginMethod('password')}
                >
                  密码登录
                </Button>
                <Button 
                  className={`${styles.methodBtn} ${loginMethod === 'phone' ? styles.active : ''}`}
                  onClick={() => setLoginMethod('phone')}
                >
                  手机登录
                </Button>
              </div>

              {loginMethod === 'password' ? (
                <Form
                  form={form}
                  onFinish={handleLogin}
                  layout="vertical"
                  size="large"
                  className={styles.form}
                >
                  <Form.Item
                    name="username"
                    rules={[{ required: true, message: '请输入用户名/手机号/邮箱' }]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="用户名/手机号/邮箱" />
                  </Form.Item>
                  <Form.Item
                    name="password"
                    rules={[{ required: true, message: '请输入密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                  </Form.Item>
                  <div className={styles.formActions}>
                    <Checkbox>记住我</Checkbox>
                    <Button type="link" onClick={() => setForgotVisible(true)}>
                      忘记密码？
                    </Button>
                  </div>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className={styles.submitBtn}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              ) : (
                <Form
                  form={phoneForm}
                  onFinish={handlePhoneLogin}
                  layout="vertical"
                  size="large"
                  className={styles.form}
                >
                  <Form.Item
                    name="phone"
                    rules={[
                      { required: true, message: '请输入手机号' },
                      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                    ]}
                  >
                    <Input prefix={<MobileOutlined />} placeholder="手机号" maxLength={11} />
                  </Form.Item>
                  <Form.Item
                    name="code"
                    rules={[{ required: true, message: '请输入验证码' }]}
                  >
                    <Input
                      prefix={<SafetyCertificateOutlined />}
                      placeholder="验证码"
                      maxLength={6}
                      suffix={
                        <Button
                          type="link"
                          disabled={countdown > 0}
                          onClick={sendPhoneCode}
                        >
                          {countdown > 0 ? `${countdown}s` : '获取验证码'}
                        </Button>
                      }
                    />
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      block
                      className={styles.submitBtn}
                    >
                      登录
                    </Button>
                  </Form.Item>
                </Form>
              )}

              <Divider className={styles.divider}>其他登录方式</Divider>

              <div className={styles.socialLogin}>
                <Tooltip title="微信登录">
                  <Button
                    icon={<WechatOutlined />}
                    className={styles.socialBtn}
                    onClick={handleWechatLogin}
                  />
                </Tooltip>
              </div>
            </>
          ) : (
            <Form
              form={registerForm}
              onFinish={handleRegister}
              layout="vertical"
              size="large"
              className={styles.form}
            >
              <div className={styles.registerBonus}>
                <GiftOutlined className={styles.bonusIcon} />
                <div className={styles.bonusContent}>
                  <span className={styles.bonusTitle}>新用户专享福利</span>
                  <span className={styles.bonusValue}>注册即送 550积分 + 5天会员</span>
                </div>
              </div>

              <Form.Item
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 3, message: '用户名至少3位' }
                ]}
              >
                <Input prefix={<UserOutlined />} placeholder="用户名" />
              </Form.Item>
              <Form.Item
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6位' }
                ]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="密码" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                rules={[{ required: true, message: '请确认密码' }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
              </Form.Item>
              
              <Form.Item
                name="phone"
                rules={[
                  { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确' }
                ]}
              >
                <Input 
                  prefix={<MobileOutlined />} 
                  placeholder="手机号（选填，可获额外积分）" 
                  maxLength={11}
                  suffix={
                    <Button
                      type="link"
                      disabled={countdown > 0}
                      onClick={() => sendRegisterPhoneCode()}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  }
                />
              </Form.Item>
              
              <Form.Item name="phoneCode">
                <Input 
                  prefix={<SafetyCertificateOutlined />} 
                  placeholder="手机验证码（选填）" 
                  maxLength={6}
                />
              </Form.Item>
              
              <Form.Item
                name="email"
                rules={[
                  { type: 'email', message: '邮箱格式不正确' }
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="邮箱（选填）" />
              </Form.Item>
              
              <div className={styles.referralSection}>
                <div className={styles.referralHeader}>
                  <TeamOutlined /> 邀请好友，双方获益
                </div>
                <Form.Item name="referralCode" className={styles.referralInput}>
                  <Input 
                    prefix={<GiftOutlined />} 
                    placeholder="填写好友邀请码（选填）" 
                  />
                </Form.Item>
                <div className={styles.referralBenefits}>
                  <div className={styles.benefitItem}>
                    <StarOutlined className={styles.benefitIcon} />
                    <span>好友注册：双方各得 <strong>75积分</strong></span>
                  </div>
                  <div className={styles.benefitItem}>
                    <StarOutlined className={styles.benefitIcon} />
                    <span>好友充值：双方各得 <strong>100积分</strong></span>
                  </div>
                  <div className={styles.benefitItem}>
                    <StarOutlined className={styles.benefitIcon} />
                    <span>邀请满3人：额外送 <strong>700积分(周卡)</strong></span>
                  </div>
                  <div className={styles.benefitItem}>
                    <StarOutlined className={styles.benefitIcon} />
                    <span>邀请满10人：额外送 <strong>2800积分(月卡)</strong></span>
                  </div>
                </div>
              </div>
              
              <div className={styles.agreementSection}>
                <Checkbox checked={agreed} onChange={(e) => setAgreed(e.target.checked)}>
                  我已阅读并同意 <a href="#">用户协议</a> 和 <a href="#">隐私政策</a>
                </Checkbox>
              </div>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  className={styles.submitBtn}
                >
                  立即注册
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>

      <Modal
        title="微信登录"
        open={wxQrVisible}
        onCancel={handleWxModalClose}
        footer={null}
        width={400}
        className={styles.wxModal}
      >
        <div className={styles.wxQrContent}>
          {wxQrCode ? (
            <>
              <img src={wxQrCode} alt="微信登录二维码" style={{ width: 200, height: 200 }} />
              <p className={styles.wxQrHint}>请使用微信扫一扫登录</p>
              <p className={styles.wxQrSubHint}>二维码有效期5分钟</p>
            </>
          ) : (
            <p>加载中...</p>
          )}
        </div>
      </Modal>

      <Modal
        title="找回密码"
        open={forgotVisible}
        onCancel={() => setForgotVisible(false)}
        footer={null}
        width={400}
      >
        <Form
          form={forgotForm}
          onFinish={handleForgotPassword}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '邮箱格式不正确' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="绑定邮箱" />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[{ required: true, message: '请输入验证码' }]}
          >
            <Input
              prefix={<SafetyCertificateOutlined />}
              placeholder="验证码"
              maxLength={6}
              suffix={
                <Button
                  type="link"
                  disabled={countdown > 0}
                  onClick={() => sendEmailCode('reset')}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </Button>
              }
            />
          </Form.Item>
          <Form.Item
            name="newPassword"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6位' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="新密码" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              className={styles.submitBtn}
            >
              重置密码
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
