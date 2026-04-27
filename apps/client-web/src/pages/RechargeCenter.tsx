import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  Modal,
  QRCode,
  Row,
  Skeleton,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  AlipayCircleOutlined,
  ClockCircleOutlined,
  GiftOutlined,
  LogoutOutlined,
  UserOutlined,
  WalletOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { buildAcceptanceAwarePath, isLocalAcceptanceMode } from '../lib/acceptanceMode';
import { isLoggedIn, logout } from '../lib/permissionManager';
import {
  applyThemeMode,
  resolveThemeMode,
  setPreferredThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from '../lib/themePreference';
import styles from './authExperience.module.scss';

const { Title, Text } = Typography;

type PayMethod = 'wechat' | 'alipay';

type RechargePackage = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  points: number;
  bonusPoints: number;
  duration?: number | null;
  durationUnit?: string | null;
  recommended?: boolean;
};

type ExchangeOption = {
  id: string;
  name: string;
  description?: string | null;
  pointsCost: number;
  duration: number;
  durationUnit?: string | null;
};

type ReferralCommissionRule = {
  code: string;
  name: string;
  minAmount: number;
  maxAmount?: number | null;
  rewardRate?: number | null;
  rewardAmount?: number | null;
  boostRewardRate?: number | null;
  boostRewardAmount?: number | null;
};

type ReferralRulesData = {
  settlementDays?: number;
  withdrawThresholdAmount?: number;
  diamondToPointsRate?: number;
  recruitBoostPaidUsers?: number;
  withdrawalNotice?: string;
  commissionRules?: ReferralCommissionRule[];
};

type ProfileData = {
  username?: string;
  nickname?: string;
  phone?: string | null;
  referralCode?: string | null;
  points?: number;
  totalRecharge?: number;
  bindingStatus?: {
    phoneBound?: boolean;
    wechatBound?: boolean;
    wechatBoundAt?: string | null;
  };
  diamondAccount?: {
    availableAmount?: number;
    pendingAmount?: number;
    frozenAmount?: number;
  };
  payoutProfile?: {
    realName?: string | null;
    payoutMethod?: 'wechat' | 'alipay' | null;
    payoutAccount?: string | null;
  };
  duration?: {
    isPermanent?: boolean;
    expiresAt?: string | null;
    canEnter?: boolean;
    remainingSeconds?: number;
  };
};

type AccessData = {
  totalRecharge?: number;
  needsLogin?: boolean;
  hasActiveMembership?: boolean;
  membershipExpiry?: string | null;
};

type ActiveOrder = {
  orderId: string;
  orderNo: string;
  amount: number;
  points: number;
  bonusPoints: number;
  productName: string;
  payMethod: PayMethod;
  status: string;
  expireTime?: string | null;
  qrCode: string;
};

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatMoney(value: number) {
  return `¥${value.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function maskAccount(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '未绑定';
  return raw.length <= 6 ? raw : `${raw.slice(0, 3)}****${raw.slice(-3)}`;
}

function formatDuration(duration?: number | null, unit?: string | null) {
  const normalized = String(unit || '').toLowerCase();

  if (!duration && ['permanent', 'forever', 'lifetime', 'infinite'].includes(normalized)) {
    return '永久';
  }

  if (!duration) {
    return '待配置';
  }

  const unitMap: Record<string, string> = {
    hour: '小时',
    day: '天',
    week: '周',
    month: '个月',
    year: '年',
  };

  return `${duration}${unitMap[normalized] || normalized || '时长'}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const next = new Date(value);
  return Number.isNaN(next.getTime())
    ? '-'
    : next.toLocaleString('zh-CN', { hour12: false });
}

function formatRemainingDuration(totalSeconds: number) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return '已过期';
  }

  const daySeconds = 86400;
  const hourSeconds = 3600;
  const weekSeconds = daySeconds * 7;

  if (totalSeconds >= weekSeconds) {
    return `${Math.max(1, Math.floor(totalSeconds / daySeconds))}天`;
  }

  if (totalSeconds > daySeconds) {
    let days = Math.floor(totalSeconds / daySeconds);
    let hours = Math.ceil((totalSeconds % daySeconds) / hourSeconds);

    if (hours >= 24) {
      days += 1;
      hours = 0;
    }

    return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  }

  return `${Math.max(1, Math.ceil(totalSeconds / hourSeconds))}小时`;
}

function normalizeQrCode(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${value}`;
  }
  return value;
}

function formatCommissionReward(rule: ReferralCommissionRule, boosted = false) {
  const rewardRate = boosted ? toNumber(rule.boostRewardRate) : toNumber(rule.rewardRate);
  const rewardAmount = boosted ? toNumber(rule.boostRewardAmount) : toNumber(rule.rewardAmount);

  if (rewardRate > 0) {
    return `${(rewardRate * 100).toFixed(0)}%`;
  }

  return formatMoney(rewardAmount);
}

export default function RechargeCenter() {
  const navigate = useNavigate();
  const handledPaidOrderRef = useRef<string | null>(null);

  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveThemeMode());
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [access, setAccess] = useState<AccessData | null>(null);
  const [referralRules, setReferralRules] = useState<ReferralRulesData | null>(null);
  const [withdrawThresholdAmount, setWithdrawThresholdAmount] = useState(100);
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOption[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('alipay');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [redeemForm] = Form.useForm<{ code: string }>();
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [exchangeSubmittingId, setExchangeSubmittingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [pollingPayment, setPollingPayment] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(0);

  const localAcceptanceMode = isLocalAcceptanceMode();
  const displayName = profile?.nickname || profile?.username || '未命名用户';
  const currentPoints = toNumber(profile?.points);
  const totalRecharge = toNumber(profile?.totalRecharge ?? access?.totalRecharge);
  const diamondAvailableAmount = toNumber(profile?.diamondAccount?.availableAmount);
  const diamondPendingAmount = toNumber(profile?.diamondAccount?.pendingAmount);
  const diamondFrozenAmount = toNumber(profile?.diamondAccount?.frozenAmount);
  const phoneBound = Boolean(profile?.bindingStatus?.phoneBound || profile?.phone);
  const wechatBound = Boolean(profile?.bindingStatus?.wechatBound);
  const payoutReady = Boolean(profile?.payoutProfile?.realName && profile?.payoutProfile?.payoutAccount);
  const payoutMethodLabel =
    profile?.payoutProfile?.payoutMethod === 'alipay' ? '支付宝' : '微信';
  const backendRemainingSeconds = toNumber(profile?.duration?.remainingSeconds);
  const accessEnabled =
    localAcceptanceMode ||
    Boolean(profile?.duration?.isPermanent) ||
    countdownSeconds > 0 ||
    Boolean(
      backendRemainingSeconds <= 0 &&
        (profile?.duration?.canEnter || access?.hasActiveMembership),
    );
  const durationStatusText = localAcceptanceMode
    ? '本地验收模式已启用，可直接进入主程序。'
    : profile?.duration?.isPermanent
      ? '已开通永久时长'
      : countdownSeconds > 0
        ? `剩余 ${formatRemainingDuration(countdownSeconds)}`
        : profile?.duration?.expiresAt || access?.membershipExpiry
          ? `已于 ${formatDateTime(profile?.duration?.expiresAt || access?.membershipExpiry)} 到期`
          : '尚未兑换有效时长';
  const hasDurationRecord = Boolean(
    profile?.duration?.isPermanent || profile?.duration?.expiresAt || access?.membershipExpiry,
  );
  const isDurationExpired = !accessEnabled && hasDurationRecord;
  const accessStateLabel = localAcceptanceMode ? '本地验收' : accessEnabled ? '已开通' : isDurationExpired ? '已过期' : '待兑换';
  const entryButtonLabel = '进入主程序';
  const settlementDays = Math.max(1, toNumber(referralRules?.settlementDays, 3));
  const recruitBoostPaidUsers = Math.max(1, toNumber(referralRules?.recruitBoostPaidUsers, 5));
  const diamondToPointsRate = Math.max(1, toNumber(referralRules?.diamondToPointsRate, 1));
  const commissionRules: ReferralCommissionRule[] = Array.isArray(referralRules?.commissionRules)
    ? referralRules?.commissionRules || []
    : [];
  const withdrawalNotice =
    String(referralRules?.withdrawalNotice || '').trim() ||
    `钻石按 T+${settlementDays} 结算，达到 ${formatMoney(withdrawThresholdAmount)} 门槛后才能申请提现。`;

  useEffect(() => {
    if (profile?.duration?.isPermanent) {
      setCountdownSeconds(0);
      return;
    }

    setCountdownSeconds(Math.max(0, backendRemainingSeconds));
  }, [backendRemainingSeconds, profile?.duration?.isPermanent]);

  useEffect(() => {
    if (profile?.duration?.isPermanent || countdownSeconds <= 0) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [countdownSeconds > 0, profile?.duration?.isPermanent]);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => subscribeThemeMode(setThemeMode), []);

  useEffect(() => {
    const root = document.getElementById('root');
    document.documentElement.classList.add('route-scroll-page');
    document.body.classList.add('route-scroll-page');
    root?.classList.add('route-scroll-page');

    return () => {
      document.documentElement.classList.remove('route-scroll-page');
      document.body.classList.remove('route-scroll-page');
      root?.classList.remove('route-scroll-page');
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(buildAcceptanceAwarePath('/login?forceLogin=1'), { replace: true });
      return;
    }
    void refreshPage();
  }, [navigate]);

  useEffect(() => {
    if (!orderModalOpen || !activeOrder?.orderNo) return undefined;

    let disposed = false;

    const poll = async () => {
      try {
        setPollingPayment(true);
        const response: any = await api.payment.status(activeOrder.orderNo);
        const next = response?.data;
        if (!response?.success || !next || disposed) return;

        setActiveOrder((prev) =>
          prev
            ? {
                ...prev,
                status: next.status || prev.status,
                expireTime: next.expireTime ?? prev.expireTime,
              }
            : prev,
        );

        if (next.status === 'paid' && handledPaidOrderRef.current !== activeOrder.orderNo) {
          handledPaidOrderRef.current = activeOrder.orderNo;
          message.success('充值成功，积分已到账，请继续兑换时长。');
          setOrderModalOpen(false);
          await refreshPage(true);
        }
      } finally {
        if (!disposed) {
          setPollingPayment(false);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 3000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [activeOrder?.orderNo, orderModalOpen]);

  async function refreshPage(silent = false) {
    if (!silent) setLoading(true);

    try {
      const [profileRes, accessRes, packagesRes, exchangeRes, rulesRes] = await Promise.all([
        api.auth.profile() as Promise<any>,
        api.auth.checkRecharge() as Promise<any>,
        api.orders.packages() as Promise<any>,
        api.orders.pointsExchange() as Promise<any>,
        api.referral.getRules() as Promise<any>,
      ]);

      if (accessRes?.data?.needsLogin || accessRes?.message === 'Unauthorized') {
        logout();
        navigate(buildAcceptanceAwarePath('/login?forceLogin=1'), { replace: true });
        return;
      }

      setProfile(profileRes?.success ? profileRes.data : null);
      setAccess(accessRes?.success ? accessRes.data : null);
      setReferralRules(rulesRes?.success ? rulesRes.data || null : null);
      setWithdrawThresholdAmount(toNumber(rulesRes?.data?.withdrawThresholdAmount, 100));

      setPackages(
        Array.isArray(packagesRes?.data)
          ? packagesRes.data.map((item: any) => ({
              id: String(item.id),
              name: item.name,
              description: item.description,
              price: toNumber(item.price),
              points: toNumber(item.points),
              bonusPoints: toNumber(item.bonus_points ?? item.bonusPoints),
              duration: item.duration == null ? null : toNumber(item.duration),
              durationUnit: item.duration_unit || item.durationUnit || null,
              recommended:
                item.recommended === true ||
                item.recommended === 1 ||
                item.recommended === '1',
            }))
          : [],
      );

      setExchangeOptions(
        Array.isArray(exchangeRes?.data)
          ? exchangeRes.data.map((item: any) => ({
              id: String(item.id),
              name: item.name,
              description: item.description,
              pointsCost: toNumber(item.points_cost ?? item.pointsCost ?? item.points),
              duration: toNumber(item.duration),
              durationUnit: item.duration_unit || item.durationUnit || null,
            }))
          : [],
      );
    } catch (error: any) {
      message.error(error?.message || '充值页面加载失败。');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function handleCreateOrder() {
    if (!selectedPackage) return;

    try {
      setSubmittingId(selectedPackage.id);

      const orderRes: any = await api.orders.create({
        packageId: selectedPackage.id,
        payMethod,
      });

      if (!orderRes?.success || !orderRes?.data?.orderId) {
        throw new Error(orderRes?.message || '创建订单失败。');
      }

      if (orderRes.data.isAdmin || orderRes.data.status === 'paid') {
        message.success(orderRes?.message || '管理员直充成功，积分已到账。');
        setCheckoutOpen(false);
        handledPaidOrderRef.current = orderRes.data.orderNo || null;
        await refreshPage(true);
        return;
      }

      const paymentRes: any = await api.payment.create({
        orderId: orderRes.data.orderId,
        orderNo: orderRes.data.orderNo,
        payMethod,
      });

      if (!paymentRes?.success || !paymentRes?.data?.qrCode) {
        throw new Error(paymentRes?.message || '拉起支付失败。');
      }

      handledPaidOrderRef.current = null;
      setCheckoutOpen(false);
      setActiveOrder({
        orderId: orderRes.data.orderId,
        orderNo: orderRes.data.orderNo,
        amount: toNumber(orderRes.data.amount, selectedPackage.price),
        points: toNumber(orderRes.data.points, selectedPackage.points),
        bonusPoints: selectedPackage.bonusPoints,
        productName: orderRes.data.packageName || selectedPackage.name,
        payMethod,
        status: orderRes.data.status || 'pending',
        expireTime: paymentRes.data.expireTime || null,
        qrCode: normalizeQrCode(paymentRes.data.qrCode),
      });
      setOrderModalOpen(true);
    } catch (error: any) {
      message.error(error?.message || '创建订单失败。');
    } finally {
      setSubmittingId(null);
    }
  }

  async function handleExchange(option: ExchangeOption) {
    if (currentPoints < option.pointsCost) {
      message.error(`积分不足，还差 ${option.pointsCost - currentPoints} 积分。`);
      return;
    }

    try {
      setExchangeSubmittingId(option.id);
      const response: any = await api.orders.exchange({ exchangeId: option.id });

      if (!response?.success) {
        throw new Error(response?.message || '兑换时长失败。');
      }

      message.success('时长兑换成功，现在可以进入主程序。');
      await refreshPage(true);
    } catch (error: any) {
      message.error(error?.message || '兑换时长失败。');
    } finally {
      setExchangeSubmittingId(null);
    }
  }

  async function handleRedeemExperienceCode() {
    try {
      const values = await redeemForm.validateFields();
      setRedeemLoading(true);
      const response: any = await api.recharge.redeemExperienceCode({
        code: String(values.code || '').trim(),
      });

      if (!response?.success) {
        throw new Error(response?.message || '体验码激活失败。');
      }

      message.success(response?.message || '体验码激活成功，已同步更新权益。');
      redeemForm.resetFields();
      await refreshPage(true);
    } catch (error: any) {
      message.error(error?.message || error?.response?.data?.message || '体验码激活失败。');
    } finally {
      setRedeemLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate(buildAcceptanceAwarePath('/login?forceLogin=1'), { replace: true });
  }

  return (
    <div className={`${styles.shell} ${styles.rechargeShell} ${themeMode === 'dark' ? styles.themeDark : ''}`}>
      <div className={styles.inner}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={() => setPreferredThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
        >
          <span>{themeMode === 'dark' ? '切到浅色' : '切到深色'}</span>
        </button>

        {loading ? (
          <div className={styles.loadingState}>
            <Skeleton active paragraph={{ rows: 8 }} style={{ width: 'min(100%, 780px)' }} />
          </div>
        ) : (
          <div className={styles.rechargeLayout}>
            <section className={styles.compactHeader}>
              <div>
                <Title level={1} className={styles.pageTitle}>
                  充值
                </Title>
              </div>
            </section>

            <section className={styles.section}>
              <Card className={`${styles.surfaceCard} ${styles.summaryCard}`}>
                <div className={styles.cardTitleRow}>
                  <Title level={3} className={styles.cardTitle}>
                    状态
                  </Title>
                  <Tag color={accessEnabled ? 'success' : isDurationExpired ? 'error' : 'default'} style={{ marginInlineEnd: 0, borderRadius: 999 }}>
                    {accessStateLabel}
                  </Tag>
                </div>

                <div className={styles.summaryMeta}>
                  <span className={styles.metaPill}>
                    <UserOutlined /> {displayName}
                  </span>
                  <span className={styles.metaPill}>
                    <WalletOutlined /> {currentPoints} 积分
                  </span>
                  <span className={styles.metaPill}>
                    <ClockCircleOutlined /> {durationStatusText}
                  </span>
                </div>

                <div className={styles.summaryGrid}>
                  <div className={styles.summaryStat}>
                    <span className={styles.summaryLabel}>当前积分</span>
                    <span className={styles.summaryValue}>{currentPoints}</span>
                  </div>
                  <div className={styles.summaryStat}>
                    <span className={styles.summaryLabel}>累计充值</span>
                    <span className={styles.summaryValue}>{formatMoney(totalRecharge)}</span>
                  </div>
                  <div className={styles.summaryStat}>
                    <span className={styles.summaryLabel}>当前状态</span>
                    <span className={styles.summaryValue}>{accessStateLabel}</span>
                  </div>
                </div>

                <div className={styles.toolbarActions}>
                  <Button
                    type="primary"
                    size="large"
                    className={styles.primaryButton}
                    onClick={() => navigate(buildAcceptanceAwarePath('/main'))}
                  >
                    {entryButtonLabel}
                  </Button>
                  <Button
                    size="large"
                    icon={<UserOutlined />}
                    className={styles.secondaryButton}
                    onClick={() => navigate('/profile')}
                  >
                    用户中心
                  </Button>
                  <Button
                    size="large"
                    icon={<LogoutOutlined />}
                    className={styles.secondaryButton}
                    onClick={handleLogout}
                  >
                    退出登录
                  </Button>
                </div>
              </Card>
            </section>

            <section className={styles.section}>
              <Row gutter={[16, 16]}>
                <Col xs={24} xl={14}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          账号总览
                        </Title>
                        <Text className={styles.muted}>
                          手机绑定、邀请码、实名收款和提现资料都已经收进用户中心。
                        </Text>
                      </div>
                      <Button
                        className={styles.secondaryButton}
                        icon={<UserOutlined />}
                        onClick={() => navigate('/profile')}
                      >
                        去管理
                      </Button>
                    </div>

                    <div className={styles.summaryMeta}>
                      <span className={styles.metaPill}>
                        <UserOutlined /> 邀请码 {profile?.referralCode || '待生成'}
                      </span>
                      <span className={styles.metaPill}>
                        <WalletOutlined /> 可提现 {formatMoney(diamondAvailableAmount)}
                      </span>
                      <span className={styles.metaPill}>
                        <ClockCircleOutlined /> 待结算 {formatMoney(diamondPendingAmount)}
                      </span>
                    </div>

                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>手机号</span>
                        <span className={styles.detailValue}>{profile?.phone || '未绑定'}</span>
                        <Text className={styles.muted}>
                          {phoneBound ? '已完成绑定，可直接用于手机号登录和找回密码。' : '建议尽快绑定，后续可直接用手机号登录。'}
                        </Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>微信状态</span>
                        <span className={styles.detailValue}>{wechatBound ? '已绑定' : '未绑定'}</span>
                        <Text className={styles.muted}>
                          {wechatBound
                            ? `绑定时间 ${formatDateTime(profile?.bindingStatus?.wechatBoundAt)}`
                            : '当前版本支持扫码登录后自动绑定，独立绑定入口在用户中心持续完善。'}
                        </Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>实名收款</span>
                        <span className={styles.detailValue}>
                          {payoutReady ? profile?.payoutProfile?.realName : '未完善'}
                        </span>
                        <Text className={styles.muted}>
                          {payoutReady
                            ? `${payoutMethodLabel} · ${maskAccount(profile?.payoutProfile?.payoutAccount)}`
                            : '提现前需要先完善实名与同名收款账户。'}
                        </Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>钻石账户</span>
                        <span className={styles.detailValue}>{formatMoney(diamondAvailableAmount)}</span>
                        <Text className={styles.muted}>
                          冻结 {formatMoney(diamondFrozenAmount)} · 待结算 {formatMoney(diamondPendingAmount)}
                        </Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} xl={10}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          邀请与提现
                        </Title>
                        <Text className={styles.muted}>
                          邀请用户真实下单后，钻石按规则结算，提现时会先展示税额试算。
                        </Text>
                      </div>
                    </div>

                    <Alert
                      showIcon
                      type="info"
                      message="提现链路"
                      description="钻石先进入待结算，T+3 后转为可提现，达到门槛后由后台人工审核打款。"
                    />

                    <div style={{ height: 16 }} />

                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>当前可提现</span>
                        <span className={styles.detailValue}>{formatMoney(diamondAvailableAmount)}</span>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>当前门槛</span>
                        <span className={styles.detailValue}>{formatMoney(withdrawThresholdAmount)}</span>
                      </div>
                    </div>

                    <div style={{ height: 16 }} />

                    <div className={styles.toolbarActions}>
                      <Button
                        type="primary"
                        className={styles.primaryButton}
                        onClick={() => navigate('/profile')}
                      >
                        查看邀请增长
                      </Button>
                      <Button
                        className={styles.secondaryButton}
                        onClick={() => navigate('/profile')}
                      >
                        去提现设置
                      </Button>
                    </div>
                  </Card>
                </Col>
              </Row>
            </section>

            <section className={styles.section}>
              <div className={styles.compactHeader}>
                <div>
                  <Title level={2} className={styles.sectionTitle}>
                    充值套餐
                  </Title>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                {packages.length === 0 ? (
                  <Col span={24}>
                    <Card className={styles.surfaceCard}>
                      <Empty description="当前没有可用充值套餐" />
                    </Card>
                  </Col>
                ) : (
                  packages.map((item) => (
                    <Col xs={24} md={12} xl={8} key={item.id}>
                      <Card
                        className={`${styles.surfaceCard} ${styles.interactiveCard} ${
                          item.recommended ? styles.recommendedCard : ''
                        }`}
                      >
                        <div className={styles.cardTitleRow}>
                          <div>
                            <Title level={3} className={styles.cardTitle}>
                              {item.name}
                            </Title>
                            <Text className={styles.muted}>{item.description || '正式充值套餐'}</Text>
                          </div>
                          {item.recommended ? (
                            <Tag color="gold" style={{ marginInlineEnd: 0, borderRadius: 999 }}>
                              推荐
                            </Tag>
                          ) : null}
                        </div>

                        <div className={styles.packageSummary}>
                          <div>
                            <span className={styles.summaryLabel}>支付金额</span>
                            <span className={styles.packageValue}>{formatMoney(item.price)}</span>
                          </div>
                          <div className={styles.packageMeta}>
                            <span className={styles.metaPill}>
                              <GiftOutlined /> 基础 {item.points}
                            </span>
                            <span className={styles.metaPill}>
                              <GiftOutlined /> 赠送 {item.bonusPoints}
                            </span>
                            <span className={styles.metaPill}>
                              <WalletOutlined /> 到账 {item.points + item.bonusPoints}
                            </span>
                            {item.duration ? (
                              <span className={styles.metaPill}>
                                <ClockCircleOutlined /> {formatDuration(item.duration, item.durationUnit)}
                              </span>
                            ) : null}
                          </div>
                        </div>

                        <Button
                          type="primary"
                          size="large"
                          className={`${styles.primaryButton} ${styles.fullWidth}`}
                          onClick={() => {
                            setSelectedPackage(item);
                            setPayMethod('alipay');
                            setCheckoutOpen(true);
                          }}
                        >
                          充值
                        </Button>
                      </Card>
                    </Col>
                  ))
                )}
              </Row>
            </section>

            <section className={styles.section}>
              <div className={styles.compactHeader}>
                <div>
                  <Title level={2} className={styles.sectionTitle}>
                    积分兑换码
                  </Title>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          兑换规则
                        </Title>
                        <Text className={styles.muted}>
                          体验码仅能由后台生成，单码只能被一个账号激活一次，同一账号永久只能激活一次。
                        </Text>
                      </div>
                    </div>

                    <Alert
                      showIcon
                      type="info"
                      message="统一有效期 7 天"
                      description="当前支持两档体验码：75 积分（1 天）和 150 积分（7 天）。输入兑换码后，系统会自动识别并发放对应积分。"
                    />

                    <div style={{ height: 16 }} />

                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>生成方式</span>
                        <span className={styles.detailValue}>仅后台生成</span>
                        <Text className={styles.muted}>支持单个生成与批量生成。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>有效期</span>
                        <span className={styles.detailValue}>7 天</span>
                        <Text className={styles.muted}>未激活则到期失效，需要重新生成。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>面额</span>
                        <span className={styles.detailValue}>75 / 150</span>
                        <Text className={styles.muted}>分别对应 1 天与 7 天权益。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>激活规则</span>
                        <span className={styles.detailValue}>一码一号</span>
                        <Text className={styles.muted}>每个账号永久只能激活一次。</Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} xl={14}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          输入兑换码
                        </Title>
                        <Text className={styles.muted}>输入后提交即可激活，激活成功会自动刷新当前积分与权益状态。</Text>
                      </div>
                    </div>

                    <Form form={redeemForm} layout="vertical" style={{ marginTop: 12 }}>
                      <Form.Item
                        name="code"
                        label="体验码"
                        rules={[
                          { required: true, message: '请输入体验码' },
                          { min: 6, message: '请输入完整体验码' },
                        ]}
                        extra="体验码区分大小写，请直接复制后粘贴。"
                      >
                        <Input size="large" placeholder="请输入体验码" allowClear maxLength={64} />
                      </Form.Item>

                      <div className={styles.toolbarActions}>
                        <Button
                          type="primary"
                          size="large"
                          className={styles.primaryButton}
                          loading={redeemLoading}
                          onClick={() => void handleRedeemExperienceCode()}
                        >
                          激活体验码
                        </Button>
                        <Button
                          size="large"
                          className={styles.secondaryButton}
                          onClick={() => redeemForm.resetFields()}
                        >
                          清空
                        </Button>
                      </div>
                    </Form>
                  </Card>
                </Col>
              </Row>
            </section>

            <section className={styles.section}>
              <div className={styles.compactHeader}>
                <div>
                  <Title level={2} className={styles.sectionTitle}>
                    时长兑换
                  </Title>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                {exchangeOptions.length === 0 ? (
                  <Col span={24}>
                    <Card className={styles.surfaceCard}>
                      <Empty description="当前没有可用兑换项" />
                    </Card>
                  </Col>
                ) : (
                  exchangeOptions.map((item) => {
                    const shortfall = Math.max(0, item.pointsCost - currentPoints);

                    return (
                      <Col xs={24} md={12} xl={8} key={item.id}>
                        <Card className={`${styles.surfaceCard} ${styles.interactiveCard}`}>
                          <div className={styles.cardTitleRow}>
                            <div>
                              <Title level={3} className={styles.cardTitle}>
                                {item.name}
                              </Title>
                              <Text className={styles.muted}>{item.description || '使用积分兑换时长'}</Text>
                            </div>
                            <Tag
                              color={shortfall === 0 ? 'success' : 'default'}
                              style={{ marginInlineEnd: 0, borderRadius: 999 }}
                            >
                              {shortfall === 0 ? '可兑换' : '积分不足'}
                            </Tag>
                          </div>

                          <div className={styles.packageSummary}>
                            <div>
                              <span className={styles.summaryLabel}>兑换时长</span>
                              <span className={styles.packageValue}>
                                {formatDuration(item.duration, item.durationUnit)}
                              </span>
                            </div>
                            <div className={styles.packageMeta}>
                              <span className={styles.metaPill}>
                                <WalletOutlined /> 需要 {item.pointsCost}
                              </span>
                            </div>
                          </div>

                          <div className={styles.exchangeFooter}>
                            {shortfall === 0 ? (
                              <Text className={styles.readyHint}>积分充足。</Text>
                            ) : (
                              <Text className={styles.shortfall}>还差 {shortfall} 积分。</Text>
                            )}
                          </div>

                          <Button
                            type="primary"
                            size="large"
                            disabled={shortfall > 0}
                            loading={exchangeSubmittingId === item.id}
                            className={`${styles.primaryButton} ${styles.fullWidth}`}
                            onClick={() => void handleExchange(item)}
                          >
                            兑换
                          </Button>
                        </Card>
                      </Col>
                    );
                  })
                )}
              </Row>
            </section>

            <section className={styles.section}>
              <div className={styles.compactHeader}>
                <div>
                  <Title level={2} className={styles.sectionTitle}>
                    邀请钻石机制
                  </Title>
                </div>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} xl={10}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          结算与提现
                        </Title>
                        <Text className={styles.muted}>
                          直邀用户真实下单后，返佣先进入待结算钻石，再按规则转为可提现资产。
                        </Text>
                      </div>
                    </div>

                    <Alert
                      showIcon
                      type="info"
                      message={`T+${settlementDays} 结算，满 ${formatMoney(withdrawThresholdAmount)} 可提现`}
                      description={withdrawalNotice}
                    />

                    <div style={{ height: 16 }} />

                    <div className={styles.detailGrid}>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>结算周期</span>
                        <span className={styles.detailValue}>T+{settlementDays}</span>
                        <Text className={styles.muted}>到点后待结算钻石自动转为可提现钻石。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>提现门槛</span>
                        <span className={styles.detailValue}>{formatMoney(withdrawThresholdAmount)}</span>
                        <Text className={styles.muted}>达到门槛后，用户可在用户中心提交提现申请。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>钻石转积分</span>
                        <span className={styles.detailValue}>1 : {diamondToPointsRate}</span>
                        <Text className={styles.muted}>用户也可以把可提现钻石单向转成站内积分。</Text>
                      </div>
                      <div className={styles.detailItem}>
                        <span className={styles.detailLabel}>招募加成</span>
                        <span className={styles.detailValue}>满 {recruitBoostPaidUsers} 人</span>
                        <Text className={styles.muted}>达到有效付费邀请门槛后，命中的规则会启用加成返佣。</Text>
                      </div>
                    </div>
                  </Card>
                </Col>

                <Col xs={24} xl={14}>
                  <Card className={styles.surfaceCard}>
                    <div className={styles.cardTitleRow}>
                      <div>
                        <Title level={3} className={styles.cardTitle}>
                          当前返佣档位
                        </Title>
                        <Text className={styles.muted}>
                          返佣只认真实支付订单，不对注册行为直接发放可提现资产。
                        </Text>
                      </div>
                    </div>

                    <Row gutter={[16, 16]}>
                      {commissionRules.length === 0 ? (
                        <Col span={24}>
                          <Empty description="当前还没有可展示的返佣档位" />
                        </Col>
                      ) : (
                        commissionRules.map((rule) => (
                          <Col xs={24} md={12} key={rule.code}>
                            <Card className={`${styles.surfaceCard} ${styles.interactiveCard}`}>
                              <div className={styles.cardTitleRow}>
                                <div>
                                  <Title level={3} className={styles.cardTitle}>
                                    {rule.name}
                                  </Title>
                                  <Text className={styles.muted}>
                                    {formatMoney(rule.minAmount)}
                                    {rule.maxAmount == null ? ' 及以上' : ` - ${formatMoney(toNumber(rule.maxAmount))}`}
                                  </Text>
                                </div>
                                <Tag color={rule.boostRewardAmount || rule.boostRewardRate ? 'gold' : 'default'} style={{ marginInlineEnd: 0, borderRadius: 999 }}>
                                  {rule.boostRewardAmount || rule.boostRewardRate ? '带加成' : '基础档'}
                                </Tag>
                              </div>

                              <div className={styles.packageSummary}>
                                <div>
                                  <span className={styles.summaryLabel}>基础返佣</span>
                                  <span className={styles.packageValue}>{formatCommissionReward(rule)}</span>
                                </div>
                                <div className={styles.packageMeta}>
                                  {rule.boostEnabled && (toNumber(rule.boostRewardRate) > 0 || toNumber(rule.boostRewardAmount) > 0) ? (
                                    <span className={styles.metaPill}>
                                      <GiftOutlined /> 加成后 {formatCommissionReward(rule, true)}
                                    </span>
                                  ) : (
                                    <span className={styles.metaPill}>
                                      <GiftOutlined /> 当前只走基础返佣
                                    </span>
                                  )}
                                  <span className={styles.metaPill}>
                                    <WalletOutlined /> 提现前可转积分
                                  </span>
                                </div>
                              </div>
                            </Card>
                          </Col>
                        ))
                      )}
                    </Row>
                  </Card>
                </Col>
              </Row>
            </section>
          </div>
        )}
      </div>

      <Modal
        className={styles.paymentModal}
        title="支付订单"
        open={checkoutOpen}
        onCancel={() => setCheckoutOpen(false)}
        onOk={() => void handleCreateOrder()}
        okText="生成支付二维码"
        cancelText="取消"
        confirmLoading={Boolean(selectedPackage && submittingId === selectedPackage.id)}
      >
        {selectedPackage ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <div className={styles.paymentSummary}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>套餐</span>
                  <span className={styles.detailValue}>{selectedPackage.name}</span>
                  <span className={styles.muted}>{selectedPackage.description || '正式充值套餐'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>支付金额</span>
                  <span className={styles.detailValue}>{formatMoney(selectedPackage.price)}</span>
                  <span className={styles.muted}>到账 {selectedPackage.points + selectedPackage.bonusPoints} 积分</span>
                </div>
              </div>
            </div>

            <div className={styles.toolbarActions}>
              <Button
                size="large"
                type={payMethod === 'alipay' ? 'primary' : 'default'}
                className={payMethod === 'alipay' ? styles.primaryButton : styles.secondaryButton}
                icon={<AlipayCircleOutlined />}
                onClick={() => setPayMethod('alipay')}
              >
                支付宝
              </Button>
              <Button
                size="large"
                type={payMethod === 'wechat' ? 'primary' : 'default'}
                className={payMethod === 'wechat' ? styles.primaryButton : styles.secondaryButton}
                icon={<WechatOutlined />}
                onClick={() => setPayMethod('wechat')}
              >
                微信支付
              </Button>
            </div>
          </Space>
        ) : null}
      </Modal>

      <Modal
        className={styles.paymentModal}
        title="支付订单"
        open={orderModalOpen}
        onCancel={() => setOrderModalOpen(false)}
        footer={[
          <Button key="refresh" onClick={() => void refreshPage(true)}>
            刷新状态
          </Button>,
          <Button
            key="open"
            type="primary"
            disabled={!activeOrder?.qrCode}
            onClick={() =>
              activeOrder?.qrCode &&
              window.open(activeOrder.qrCode, '_blank', 'noopener,noreferrer')
            }
          >
            {activeOrder?.payMethod === 'wechat' ? '打开微信支付页' : '打开支付宝支付页'}
          </Button>,
        ]}
      >
        {activeOrder ? (
          <Space orientation="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              showIcon
              type="warning"
              title="请在有效期内完成支付"
              description={`订单有效期至 ${formatDateTime(activeOrder.expireTime)}`}
            />

            <div className={styles.qrPanel}>
              <QRCode value={activeOrder.qrCode} size={220} />
            </div>

            <div className={styles.paymentSummary}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>套餐</span>
                  <span className={styles.detailValue}>{activeOrder.productName}</span>
                  <span className={styles.muted}>订单号 {activeOrder.orderNo}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>支付金额</span>
                  <span className={styles.detailValue}>{formatMoney(activeOrder.amount)}</span>
                  <span className={styles.muted}>到账 {activeOrder.points + activeOrder.bonusPoints} 积分</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>支付方式</span>
                  <span className={styles.detailValue}>
                    {activeOrder.payMethod === 'wechat' ? '微信支付' : '支付宝'}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>当前状态</span>
                  <span className={styles.detailValue}>
                    {activeOrder.status === 'paid' ? '已支付' : '待支付'}
                  </span>
                  <span className={styles.muted}>
                    {pollingPayment ? '正在轮询订单状态...' : '支付成功后会自动刷新。'}
                  </span>
                </div>
              </div>
            </div>
          </Space>
        ) : null}
      </Modal>
    </div>
  );
}
