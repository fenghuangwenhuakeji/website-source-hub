import { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Modal, message, Tabs, Badge, Tag, QRCode, Space, Typography, Divider, Tooltip } from 'antd';
import { 
  CrownOutlined, 
  UserOutlined, 
  ClockCircleOutlined, 
  CalendarOutlined,
  RocketOutlined,
  WechatOutlined,
  AlipayCircleOutlined,
  GiftOutlined,
  CopyOutlined,
  MobileOutlined,
  DesktopOutlined
} from '@ant-design/icons';
import api from '../../api';
import styles from './index.module.scss';

const { Title, Text, Paragraph } = Typography;

interface Package {
  id: string;
  name: string;
  description: string;
  duration: number;
  durationUnit: string;
  price: number;
  points: number;
  type: string;
  recommended?: boolean;
  icon: string;
  disabled?: boolean;
  remainingPurchases?: number;
}

interface ExchangeOption {
  id: string;
  name: string;
  points_cost: number;
  points?: number;
  duration: number;
  duration_unit: string;
  durationUnit?: string;
  type: string;
  description?: string;
  recommended?: boolean;
  maxPurchases?: number;
}

interface RechargeCenterProps {
  onEnterMain: () => void;
  onLogout: () => void;
}

export default function RechargeCenter({ onEnterMain, onLogout }: RechargeCenterProps) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOption[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedExchange, setSelectedExchange] = useState<ExchangeOption | null>(null);
  const [loading, setLoading] = useState(false);
  const [payModalVisible, setPayModalVisible] = useState(false);
  const [exchangeModalVisible, setExchangeModalVisible] = useState(false);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [payMethod, setPayMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [userPoints, setUserPoints] = useState(0);
  const [membershipExpiry, setMembershipExpiry] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [activeTab, setActiveTab] = useState('packages');
  const [payStatus, setPayStatus] = useState<'pending' | 'success' | 'failed'>('pending');
  const [currentOrderNo, setCurrentOrderNo] = useState('');
  const [wechatLoginModalVisible, setWechatLoginModalVisible] = useState(false);
  const [wechatLoginUrl, setWechatLoginUrl] = useState('');
  const [wechatOpenId, setWechatOpenId] = useState('');

  useEffect(() => {
    loadUserInfo();
    loadPackages();
    loadExchangeOptions();
    generateReferralCode();
  }, []);

  // 轮询支付状态
  useEffect(() => {
    if (!currentOrderNo || payStatus !== 'pending') return;
    
    const interval = setInterval(async () => {
      try {
        const res = await api.payment.status(currentOrderNo) as any;
        if (res.success && res.data?.status === 'paid') {
          setPayStatus('success');
          message.success('支付成功！');
          loadUserInfo();
          setQrModalVisible(false);
          clearInterval(interval);
        }
      } catch (error) {
        console.error('查询支付状态失败:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentOrderNo, payStatus]);

  // 30秒自动刷新二维码
  useEffect(() => {
    if (!qrModalVisible || !currentOrderNo || payStatus !== 'pending') return;
    
    let refreshCount = 0;
    const maxRefreshCount = 10; // 最多刷新10次（5分钟）
    
    const interval = setInterval(async () => {
      refreshCount++;
      if (refreshCount > maxRefreshCount) {
        clearInterval(interval);
        message.warning('二维码已过期，请重新发起支付');
        setQrModalVisible(false);
        return;
      }
      
      try {
        // 重新获取支付二维码
        const res = await api.payment.refreshQrCode(currentOrderNo) as any;
        if (res.success && res.data?.qrCode) {
          setQrCode(res.data.qrCode);
          message.info('二维码已刷新');
        }
      } catch (error) {
        console.error('刷新二维码失败:', error);
      }
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [qrModalVisible, currentOrderNo, payStatus]);

  const loadUserInfo = async () => {
    try {
      const res = await api.auth.profile() as any;
      if (res.success) {
        setUserPoints(res.data.points || 0);
        const duration = res.data.duration;
        if (duration) {
          setMembershipExpiry(duration.expiresAt);
          if (duration.isPermanent) {
            setHasValidDuration(true);
          } else if (duration.expiresAt) {
            setHasValidDuration(new Date(duration.expiresAt) > new Date());
          } else if (duration.remainingSeconds && duration.remainingSeconds > 0) {
            setHasValidDuration(true);
          } else {
            setHasValidDuration(false);
          }
        } else {
          setHasValidDuration(false);
        }
      }
    } catch {
      console.error('Failed to load user info');
    }
  };

  const loadPackages = async () => {
    try {
      const res = await api.orders.packages() as any;
      if (res.success) {
        setPackages(res.data);
      }
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadExchangeOptions = async () => {
    try {
      const res = await api.orders.pointsExchange() as any;
      if (res.success) {
        setExchangeOptions(res.data);
      }
    } catch (error) {
      console.error('Failed to load exchange options:', error);
    }
  };

  const generateReferralCode = () => {
    // 生成推荐码
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    setReferralCode(code);
  };

  const handlePackageSelect = (pkg: Package) => {
    if (pkg.disabled) {
      message.warning('该套餐已达到购买次数上限');
      return;
    }
    setSelectedPackage(pkg);
    if (pkg.price === 0) {
      handleFreeTrial(pkg);
    } else {
      setPayModalVisible(true);
    }
  };

  const handleFreeTrial = async (pkg: Package) => {
    setLoading(true);
    try {
      const res = await api.orders.create({
        packageId: pkg.id,
        payMethod: 'free'
      }) as any;
      if (res.success) {
        message.success('领取成功！');
        loadUserInfo();
      } else {
        message.error(res.message || '领取失败');
      }
    } catch {
      message.error('领取请求失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeSelect = (option: ExchangeOption) => {
    const pointsCost = option.points_cost || option.points || 0;
    if (userPoints < pointsCost) {
      message.error('积分不足');
      return;
    }
    setSelectedExchange(option);
    setExchangeModalVisible(true);
  };

  const confirmExchange = async () => {
    if (!selectedExchange) return;
    setLoading(true);
    try {
      const res = await api.orders.exchange({ exchangeId: selectedExchange.id }) as any;
      if (res.success) {
        message.success('兑换成功！');
        await loadUserInfo(); // 重新加载用户信息
        setExchangeModalVisible(false);
      } else {
        message.error(res.message || '兑换失败');
      }
    } catch {
      message.error('兑换请求失败');
    } finally {
      setLoading(false);
    }
  };

  const createOrderAndPay = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      // 创建订单
      const orderRes = await api.orders.create({
        packageId: selectedPackage.id,
        payMethod: payMethod
      }) as any;

      if (!orderRes.success) {
        message.error(orderRes.message || '创建订单失败');
        return;
      }

      const orderId = orderRes.data.orderId;
      const orderNo = orderRes.data.orderNo;
      setCurrentOrderNo(orderNo);

      // 创建支付
      const payRes = await api.payment.create({
        orderId: orderId,
        method: payMethod,
        openid: payMethod === 'wechat' ? wechatOpenId : undefined
      }) as any;

      if (payRes.success) {
        if (payRes.data?.autoPaid) {
          // 管理员免费
          message.success('支付成功！');
          loadUserInfo();
          setPayModalVisible(false);
        } else if (payRes.data?.qrCode) {
          // 检查是否需要微信登录
          if (payRes.data.qrCode === 'WECHAT_LOGIN_REQUIRED') {
            // 需要微信登录获取openid
            message.info('请使用微信扫码登录以完成支付');
            setPayModalVisible(false);
            await handleWechatLogin(orderNo);
            return;
          }
          // 显示二维码
          setQrCode(payRes.data.qrCode);
          setPayStatus('pending');
          setPayModalVisible(false);
          setQrModalVisible(true);
        }
      } else {
        message.error(payRes.message || '创建支付失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      message.error('支付请求失败');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    message.success('推荐码已复制');
  };

  // 处理微信登录
  const handleWechatLogin = async (orderNo: string) => {
    try {
      // 获取微信登录二维码URL
      const res = await api.wechat.getLoginQrcode(orderNo) as any;
      if (res.success && res.data?.qrcodeUrl) {
        setWechatLoginUrl(res.data.qrcodeUrl);
        setWechatLoginModalVisible(true);
        
        // 开始轮询检查是否已获取openid
        const checkInterval = setInterval(async () => {
          // 检查URL参数中是否有openid（用户扫码授权后会重定向回来）
          const urlParams = new URLSearchParams(window.location.search);
          const openid = urlParams.get('openid');
          const returnedOrderNo = urlParams.get('orderNo');
          
          if (openid && returnedOrderNo === orderNo) {
            clearInterval(checkInterval);
            setWechatOpenId(openid);
            setWechatLoginModalVisible(false);
            message.success('微信登录成功，正在发起支付...');
            
            // 清除URL参数
            window.history.replaceState({}, document.title, window.location.pathname);
            
            // 重新发起支付
            await retryPaymentWithOpenId(orderNo, openid);
          }
        }, 2000);
        
        // 5分钟后停止轮询
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 5 * 60 * 1000);
      } else {
        message.error('获取微信登录二维码失败');
      }
    } catch (error) {
      console.error('微信登录失败:', error);
      message.error('微信登录请求失败');
    }
  };

  // 使用openid重新发起支付
  const retryPaymentWithOpenId = async (orderNo: string, openid: string) => {
    setLoading(true);
    try {
      const payRes = await api.payment.create({
        orderNo: orderNo,
        method: 'wechat',
        openid: openid
      }) as any;

      if (payRes.success && payRes.data?.qrCode) {
        setQrCode(payRes.data.qrCode);
        setPayStatus('pending');
        setQrModalVisible(true);
      } else {
        message.error(payRes.message || '创建支付失败');
      }
    } catch (error) {
      console.error('支付失败:', error);
      message.error('支付请求失败');
    } finally {
      setLoading(false);
    }
  };

  const getDurationText = (duration: number, unit: string) => {
    if (!unit || unit === 'undefined') return `${duration}天`;
    if (unit === 'permanent') return '永久';
    if (unit === 'hour') return `${duration}小时`;
    if (unit === 'day') return `${duration}天`;
    if (unit === 'week') return `${duration}周`;
    if (unit === 'month') return `${duration}个月`;
    if (unit === 'year') return `${duration}年`;
    return `${duration}${unit}`;
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case '⏱️': return <ClockCircleOutlined />;
      case '⏰': return <ClockCircleOutlined />;
      case '📅': return <CalendarOutlined />;
      case '📆': return <CalendarOutlined />;
      case '🌙': return <CrownOutlined />;
      case '🌸': return <CrownOutlined />;
      case '☀️': return <CrownOutlined />;
      case '🎆': return <CrownOutlined />;
      case '👑': return <CrownOutlined />;
      default: return <GiftOutlined />;
    }
  };

  const hasValidMembership = membershipExpiry && new Date(membershipExpiry) > new Date();
  const [hasValidDuration, setHasValidDuration] = useState(false);

  // 检查是否有有效时长（包括积分兑换的）
  useEffect(() => {
    const checkDuration = async () => {
      try {
        const res = await api.auth.profile() as any;
        if (res.success) {
          const duration = res.data.duration;
          if (duration) {
            if (duration.isPermanent) {
              setHasValidDuration(true);
            } else if (duration.expiresAt) {
              const expiresAt = new Date(duration.expiresAt);
              setHasValidDuration(expiresAt > new Date());
            } else {
              setHasValidDuration(false);
            }
          } else {
            setHasValidDuration(false);
          }
        }
      } catch {
        console.error('Failed to check duration');
      }
    };
    checkDuration();
    const interval = setInterval(checkDuration, 30000);
    return () => clearInterval(interval);
  }, []);

  const canEnterMain = hasValidMembership || hasValidDuration;

  return (
    <div className={styles.rechargeCenter}>
      <div className={styles.backgroundEffects}>
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>
      <div className={styles.container}>
        {/* 头部信息 */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Title level={2} className={styles.title}>会员充值中心</Title>
            <Text className={styles.subtitle}>选择适合您的会员套餐，解锁全部功能</Text>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.pointsDisplay}>
                <Text className={styles.pointsLabel}>当前积分</Text>
                <div className={styles.pointsValue}>{userPoints}</div>
              </div>
              {hasValidMembership && (
                <div className={styles.membershipInfo}>
                  <Text className={styles.membershipLabel}>会员到期</Text>
                  <div className={styles.membershipValue}>
                    {new Date(membershipExpiry!).toLocaleDateString()}
                  </div>
                </div>
              )}
              <Button onClick={onLogout}>退出登录</Button>
            </div>
          </div>
        </div>

        {/* 主内容区 */}
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          className={styles.mainTabs}
          items={[
            {
              key: 'packages',
              label: '选择套餐',
              children: (
                <div className={styles.packagesSection}>
                  <Row gutter={[24, 24]}>
                    {packages.map((pkg) => (
                      <Col xs={24} sm={12} lg={8} key={pkg.id}>
                        <Card
                          hoverable={!pkg.disabled}
                          className={`${styles.packageCard} ${pkg.recommended ? styles.recommended : ''} ${pkg.disabled ? styles.disabled : ''}`}
                          onClick={() => handlePackageSelect(pkg)}
                        >
                          {pkg.recommended && (
                            <Badge.Ribbon text="推荐" color="#ff4d4f" className={styles.recommendedBadge}>
                              <div className={styles.cardContent}>
                                <div className={styles.iconWrapper} style={{ color: pkg.type === 'trial' ? '#52c41a' : '#1890ff' }}>
                                  {getIconComponent(pkg.icon)}
                                </div>
                                <Title level={4} className={styles.packageName}>{pkg.name}</Title>
                                <Text className={styles.packageDesc}>{pkg.description}</Text>
                                <div className={styles.duration}>
                                  <ClockCircleOutlined /> {getDurationText(pkg.duration, pkg.duration_unit || pkg.durationUnit)}
                                </div>
                                <div className={styles.priceWrapper}>
                                  {pkg.price === 0 ? (
                                    <span className={styles.freePrice}>免费</span>
                                  ) : (
                                    <>
                                      <span className={styles.priceSymbol}>¥</span>
                                      <span className={styles.priceValue}>{pkg.price}</span>
                                    </>
                                  )}
                                </div>
                                {pkg.points > 0 && (
                                  <div className={styles.pointsWrapper}>
                                    <GiftOutlined /> 送 {pkg.points} 积分
                                  </div>
                                )}
                                {pkg.disabled && (
                                  <Tag color="default" className={styles.disabledTag}>已达上限</Tag>
                                )}
                                {pkg.remainingPurchases !== undefined && pkg.remainingPurchases > 0 && (
                                  <Tag color="warning" className={styles.remainingTag}>剩余 {pkg.remainingPurchases} 次</Tag>
                                )}
                              </div>
                            </Badge.Ribbon>
                          )}
                          {!pkg.recommended && (
                            <div className={styles.cardContent}>
                              <div className={styles.iconWrapper} style={{ color: pkg.type === 'trial' ? '#52c41a' : '#1890ff' }}>
                                {getIconComponent(pkg.icon)}
                              </div>
                              <Title level={4} className={styles.packageName}>{pkg.name}</Title>
                              <Text className={styles.packageDesc}>{pkg.description}</Text>
                              <div className={styles.duration}>
                                <ClockCircleOutlined /> {getDurationText(pkg.duration, pkg.duration_unit || pkg.durationUnit)}
                              </div>
                              <div className={styles.priceWrapper}>
                                {pkg.price === 0 ? (
                                  <span className={styles.freePrice}>免费</span>
                                ) : (
                                  <>
                                    <span className={styles.priceSymbol}>¥</span>
                                    <span className={styles.priceValue}>{pkg.price}</span>
                                  </>
                                )}
                              </div>
                              {pkg.points > 0 && (
                                <div className={styles.pointsWrapper}>
                                  <GiftOutlined /> 送 {pkg.points} 积分
                                </div>
                              )}
                              {pkg.disabled && (
                                <Tag color="default" className={styles.disabledTag}>已达上限</Tag>
                              )}
                              {pkg.remainingPurchases !== undefined && pkg.remainingPurchases > 0 && (
                                <Tag color="warning" className={styles.remainingTag}>剩余 {pkg.remainingPurchases} 次</Tag>
                              )}
                            </div>
                          )}
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </div>
              )
            },
            {
              key: 'exchange',
              label: '积分兑换',
              children: (
                <div className={styles.exchangeSection}>
                  <div className={styles.exchangeHeader}>
                    <Title level={4}>积分兑换时长</Title>
                    <Text>使用积分直接兑换使用时长。时长到期后将无法进入主程序。</Text>
                  </div>
                  <Row gutter={[24, 24]}>
                    {exchangeOptions.map((option) => {
                      const pointsCost = option.points_cost || option.points || 0;
                      const durationUnit = option.duration_unit || option.durationUnit || 'day';
                      const canExchange = pointsCost === 0 ? true : userPoints >= pointsCost;
                      const isPermanent = durationUnit === 'permanent';
                      
                      return (
                        <Col xs={24} sm={12} lg={8} key={option.id}>
                          <Card
                            hoverable={canExchange}
                            className={`${styles.packageCard} ${option.recommended ? styles.recommended : ''} ${!canExchange ? styles.disabled : ''}`}
                            onClick={() => canExchange && handleExchangeSelect(option)}
                          >
                            {option.recommended && (
                              <Badge.Ribbon text="推荐" color="#ff4d4f">
                                <div className={styles.cardContent}>
                                  <div className={styles.iconWrapper} style={{ color: isPermanent ? '#ff4d4f' : '#faad14' }}>
                                    {getIconComponent(isPermanent ? '👑' : '⏰')}
                                  </div>
                                  <Title level={4} className={styles.packageName}>{option.name}</Title>
                                  <Text className={styles.packageDesc}>{option.description}</Text>
                                  <div className={styles.duration}>
                                    <ClockCircleOutlined /> {getDurationText(option.duration, durationUnit)}
                                  </div>
                                  <div className={styles.priceWrapper}>
                                    {pointsCost === 0 ? (
                                      <span className={styles.freePrice}>免费</span>
                                    ) : isPermanent ? (
                                      <span className={styles.freePrice}>无限积分</span>
                                    ) : (
                                      <>
                                        <span className={styles.priceSymbol} style={{ color: '#faad14' }}>🎁</span>
                                        <span className={styles.priceValue} style={{ color: '#faad14', fontSize: '28px' }}>{pointsCost}</span>
                                        <span style={{ color: '#faad14' }}> 积分</span>
                                      </>
                                    )}
                                  </div>
                                  {!canExchange && (
                                    <Tag color="default" className={styles.disabledTag}>积分不足</Tag>
                                  )}
                                </div>
                              </Badge.Ribbon>
                            )}
                            {!option.recommended && (
                              <div className={styles.cardContent}>
                                <div className={styles.iconWrapper} style={{ color: isPermanent ? '#ff4d4f' : '#faad14' }}>
                                  {getIconComponent(isPermanent ? '👑' : '⏰')}
                                </div>
                                <Title level={4} className={styles.packageName}>{option.name}</Title>
                                <Text className={styles.packageDesc}>{option.description}</Text>
                                <div className={styles.duration}>
                                  <ClockCircleOutlined /> {getDurationText(option.duration, durationUnit)}
                                </div>
                                <div className={styles.priceWrapper}>
                                  {pointsCost === 0 ? (
                                    <span className={styles.freePrice}>免费</span>
                                  ) : isPermanent ? (
                                    <span className={styles.freePrice}>无限积分</span>
                                  ) : (
                                    <>
                                      <span className={styles.priceSymbol} style={{ color: '#faad14' }}>🎁</span>
                                      <span className={styles.priceValue} style={{ color: '#faad14', fontSize: '28px' }}>{pointsCost}</span>
                                      <span style={{ color: '#faad14' }}> 积分</span>
                                    </>
                                  )}
                                </div>
                                {!canExchange && (
                                  <Tag color="default" className={styles.disabledTag}>积分不足</Tag>
                                )}
                              </div>
                            )}
                          </Card>
                        </Col>
                      );
                    })}
                  </Row>
                </div>
              )
            },
            {
              key: 'referral',
              label: '邀请好友',
              children: (
                <div className={styles.referralSection}>
                  <Card className={styles.referralCard}>
                    <Title level={4}>邀请好友，赚取奖励</Title>
                    <div className={styles.referralRules}>
                      <div className={styles.ruleItem}>
                        <GiftOutlined className={styles.ruleIcon} />
                        <div className={styles.ruleContent}>
                          <Text strong>邀请体验用户</Text>
                          <Paragraph>好友注册并激活，您获得 75 积分（可兑换周卡）</Paragraph>
                        </div>
                      </div>
                      <div className={styles.ruleItem}>
                        <CrownOutlined className={styles.ruleIcon} />
                        <div className={styles.ruleContent}>
                          <Text strong>邀请付费用户</Text>
                          <Paragraph>好友首次付费，您获得 25% 返现奖励</Paragraph>
                        </div>
                      </div>
                    </div>
                    <Divider />
                    <div className={styles.referralCodeSection}>
                      <Text>您的专属推荐码</Text>
                      <div className={styles.codeWrapper}>
                        <code className={styles.referralCode}>{referralCode}</code>
                        <Button icon={<CopyOutlined />} onClick={copyReferralCode}>
                          复制
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              )
            }
          ]}
        />

        {/* 进入主程序按钮 */}
        <div className={styles.enterSection}>
          <Button
            type="primary"
            size="large"
            icon={<RocketOutlined />}
            onClick={onEnterMain}
            disabled={!canEnterMain}
            className={styles.enterButton}
          >
            {canEnterMain ? '进入主程序' : '请先购买会员或兑换时长'}
          </Button>
        </div>
      </div>

      {/* 支付确认弹窗 */}
      <Modal
        title="确认支付"
        open={payModalVisible}
        onOk={createOrderAndPay}
        onCancel={() => setPayModalVisible(false)}
        confirmLoading={loading}
        okText="确认支付"
        cancelText="取消"
        width={500}
      >
        {selectedPackage && (
          <div className={styles.payModalContent}>
            <div className={styles.selectedPackage}>
              <Title level={4}>{selectedPackage.name}</Title>
              <Text>{selectedPackage.description}</Text>
              <div className={styles.selectedPrice}>
                {selectedPackage.price === 0 ? '免费' : `¥${selectedPackage.price}`}
              </div>
            </div>
            <Divider />
            <div className={styles.payMethodSection}>
              <Text strong>选择支付方式</Text>
              <Space className={styles.payMethods}>
                <Button
                  type={payMethod === 'wechat' ? 'primary' : 'default'}
                  icon={<WechatOutlined />}
                  onClick={() => setPayMethod('wechat')}
                  size="large"
                >
                  微信支付
                </Button>
                <Button
                  type={payMethod === 'alipay' ? 'primary' : 'default'}
                  icon={<AlipayCircleOutlined />}
                  onClick={() => setPayMethod('alipay')}
                  size="large"
                >
                  支付宝
                </Button>
              </Space>
            </div>
          </div>
        )}
      </Modal>

      {/* 积分兑换确认弹窗 */}
      <Modal
        title="确认兑换"
        open={exchangeModalVisible}
        onOk={confirmExchange}
        onCancel={() => setExchangeModalVisible(false)}
        confirmLoading={loading}
        okText="确认兑换"
        cancelText="取消"
      >
        {selectedExchange && (() => {
          const pointsCost = selectedExchange.points_cost || selectedExchange.points || 0;
          const durationUnit = selectedExchange.duration_unit || selectedExchange.durationUnit || 'day';
          return (
            <div className={styles.exchangeModalContent}>
              <p>您将兑换: <strong style={{ color: '#4ecca3', fontSize: '18px' }}>{selectedExchange.name}</strong></p>
              <p>使用时长: <strong>{getDurationText(selectedExchange.duration, durationUnit)}</strong></p>
              {pointsCost > 0 ? (
                <>
                  <p>消耗积分: <strong style={{ color: '#faad14' }}>{pointsCost}</strong></p>
                  <p>兑换后剩余: <strong>{userPoints - pointsCost}</strong> 积分</p>
                </>
              ) : (
                <p style={{ color: '#52c41a' }}>免费兑换</p>
              )}
              <p style={{ color: '#999', fontSize: '12px', marginTop: '16px' }}>
                兑换成功后即可进入主程序，时长到期后将无法继续使用。
              </p>
            </div>
          );
        })()}
      </Modal>

      {/* 二维码支付弹窗 */}
      <Modal
        title="扫码支付"
        open={qrModalVisible}
        onCancel={() => setQrModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setQrModalVisible(false)}>
            取消支付
          </Button>
        ]}
        width={400}
      >
        <div className={styles.qrModalContent}>
          <div className={styles.qrWrapper}>
            {qrCode ? (
              <QRCode value={qrCode} size={200} />
            ) : (
              <div className={styles.qrPlaceholder}>加载中...</div>
            )}
          </div>
          <div className={styles.qrHint}>
            <Text>请使用{payMethod === 'wechat' ? '微信' : '支付宝'}扫一扫</Text>
            <Text type="secondary">支付完成后将自动跳转</Text>
          </div>
          {payStatus === 'success' && (
            <div className={styles.paySuccess}>
              <Text type="success">支付成功！</Text>
            </div>
          )}
        </div>
      </Modal>

      {/* 微信登录弹窗 */}
      <Modal
        title="微信登录"
        open={wechatLoginModalVisible}
        onCancel={() => setWechatLoginModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setWechatLoginModalVisible(false)}>
            取消
          </Button>
        ]}
        width={400}
      >
        <div className={styles.qrModalContent}>
          <div className={styles.qrHint}>
            <Text>请使用微信扫码登录</Text>
            <Text type="secondary">登录后即可完成支付</Text>
          </div>
          <div className={styles.qrWrapper} style={{ marginTop: '20px' }}>
            {wechatLoginUrl ? (
              <QRCode value={wechatLoginUrl} size={200} />
            ) : (
              <div className={styles.qrPlaceholder}>加载中...</div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
