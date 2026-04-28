import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CopyOutlined,
  GiftOutlined,
  LogoutOutlined,
  MobileOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WalletOutlined,
  WechatOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { buildAcceptanceAwarePath, isLocalAcceptanceMode } from '../lib/acceptanceMode';
import { writeSharedAuth } from '../lib/authStorage';
import { copyTextToClipboard } from '../lib/clipboard';
import { isLoggedIn, logout } from '../lib/permissionManager';
import {
  applyThemeMode,
  resolveThemeMode,
  setPreferredThemeMode,
  subscribeThemeMode,
  type ThemeMode,
} from '../lib/themePreference';
import { getWechatInitialMessage, normalizeWechatUiMessage } from '../lib/wechatUiMessage';
import AccessLoading from '../components/AccessLoading';
import styles from './authExperience.module.scss';

const { Title, Text, Paragraph } = Typography;

const phonePattern = /^1[3-9]\d{9}$/;
const inviteHost = 'https://fhwhkj.top';
const hardContrastHeadingStyle = { color: '#f8fafc', opacity: 1, fontWeight: 600 } as const;
const hardContrastTextStyle = { color: 'rgba(226, 232, 240, 0.88)', opacity: 1 } as const;
const hardContrastLabelStyle = { color: '#e2e8f0', opacity: 1 } as const;
const hardContrastTagStyle = {
  color: '#dbeafe',
  background: 'rgba(10, 16, 28, 0.82)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  opacity: 1,
} as const;
const hardContrastDisabledButtonStyle = {
  color: 'rgba(226, 232, 240, 0.78)',
  background: 'rgba(51, 65, 85, 0.42)',
  borderColor: 'rgba(148, 163, 184, 0.18)',
  opacity: 1,
  boxShadow: 'none',
} as const;

type WechatBindState = {
  authUrl: string;
  state: string;
  mode?: 'login' | 'bind';
};

type ProfileData = {
  username?: string;
  nickname?: string;
  phone?: string | null;
  points?: number;
  totalRecharge?: number;
  referralCode?: string | null;
  bindingStatus?: {
    phoneBound?: boolean;
    wechatBound?: boolean;
    wechatBoundAt?: string | null;
  };
  diamondAccount?: {
    availableAmount?: number;
    pendingAmount?: number;
    frozenAmount?: number;
    totalEarnedAmount?: number;
    totalWithdrawnAmount?: number;
  };
  payoutProfile?: {
    realName?: string | null;
    payoutMethod?: 'wechat' | 'alipay' | null;
    payoutAccount?: string | null;
    identityNo?: string | null;
    phone?: string | null;
    note?: string | null;
  };
  duration?: {
    isPermanent?: boolean;
    expiresAt?: string | null;
    canEnter?: boolean;
  };
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

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? '-' : next.toLocaleString('zh-CN', { hour12: false });
}

function formatDurationSummary(duration?: ProfileData['duration']) {
  if (!duration?.canEnter) {
    return '尚未兑换有效时长';
  }
  if (duration.isPermanent) {
    return '永久时长已开通';
  }
  if (duration.expiresAt) {
    return `有效至 ${formatDateTime(duration.expiresAt)}`;
  }
  return '已开通有效时长';
}

function maskAccount(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) {
    return '-';
  }
  return raw.length <= 6 ? raw : `${raw.slice(0, 3)}****${raw.slice(-3)}`;
}

function normalizePhone(value?: string) {
  return String(value || '').replace(/\D/g, '');
}

function moneyToDiamonds(amount: number) {
  return Math.max(0, Math.round(amount * 100));
}

function getWithdrawalStatusLabel(status?: string) {
  switch (status) {
    case 'paid':
      return '已打款';
    case 'approved':
      return '已审核';
    case 'rejected':
      return '已驳回';
    case 'cancelled':
      return '已取消';
    case 'pending_review':
    default:
      return '待审核';
  }
}

function renderAlertMessage(text: string) {
  return <span style={hardContrastHeadingStyle}>{text}</span>;
}

function renderAlertDescription(text?: string | null) {
  return <span style={hardContrastTextStyle}>{text || '-'}</span>;
}

function renderTagContent(content: ReactNode) {
  return <span style={hardContrastLabelStyle}>{content}</span>;
}

function renderLabel(text: string) {
  return <span style={hardContrastLabelStyle}>{text}</span>;
}

export default function ProfileCenter() {
  const navigate = useNavigate();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => resolveThemeMode());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingPayout, setSavingPayout] = useState(false);
  const [previewingWithdrawal, setPreviewingWithdrawal] = useState(false);
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [wechatBindingBusy, setWechatBindingBusy] = useState(false);
  const [wechatBindingMessage, setWechatBindingMessage] = useState('点击按钮，在新窗口完成微信绑定。');
  const [wechatBinding, setWechatBinding] = useState<WechatBindState | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [withdrawPreview, setWithdrawPreview] = useState<any | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const [phoneForm] = Form.useForm();
  const [payoutForm] = Form.useForm();
  const [withdrawForm] = Form.useForm();
  const [data, setData] = useState<{
    profile: ProfileData | null;
    payoutProfile: ProfileData['payoutProfile'] | null;
    stats: any;
    rules: any;
    records: any[];
    withdrawals: any[];
  }>({
    profile: null,
    payoutProfile: null,
    stats: {},
    rules: {},
    records: [],
    withdrawals: [],
  });

  const profile = data.profile || {};
  const payoutProfile = data.payoutProfile || profile.payoutProfile || {};
  const stats = data.stats || {};
  const rules = data.rules || {};
  const records = Array.isArray(data.records) ? data.records : [];
  const withdrawals = Array.isArray(data.withdrawals) ? data.withdrawals : [];

  const displayName = profile.nickname || profile.username || '未命名用户';
  const phoneBound = Boolean(profile.bindingStatus?.phoneBound || profile.phone);
  const wechatBound = Boolean(profile.bindingStatus?.wechatBound);
  const referralCode = profile.referralCode || stats.referralCode || '';
  const referralLink = referralCode ? `${inviteHost}/access/login?ref=${encodeURIComponent(referralCode)}` : '';
  const currentPoints = toNumber(profile.points);
  const totalRecharge = toNumber(profile.totalRecharge || stats.totalRecharge);
  const diamondAvailable = toNumber(profile.diamondAccount?.availableAmount ?? stats.diamondAccount?.availableAmount);
  const diamondPending = toNumber(profile.diamondAccount?.pendingAmount ?? stats.diamondAccount?.pendingAmount);
  const diamondFrozen = toNumber(profile.diamondAccount?.frozenAmount ?? stats.diamondAccount?.frozenAmount);
  const diamondTotalEarned = toNumber(
    profile.diamondAccount?.totalEarnedAmount ?? stats.diamondAccount?.totalEarnedAmount,
  );
  const diamondTotalWithdrawn = toNumber(
    profile.diamondAccount?.totalWithdrawnAmount ?? stats.diamondAccount?.totalWithdrawnAmount,
  );
  const totalInvites = toNumber(stats.totalInvites);
  const paidInvites = toNumber(stats.paidInvites);
  const recruitBoostPaidUsers = toNumber(stats.recruitBoostPaidUsers || rules.recruitBoostPaidUsers, 0);
  const nextBoostRemaining = toNumber(stats.nextBoostRemaining, Math.max(recruitBoostPaidUsers - paidInvites, 0));
  const settlementDays = Math.max(1, toNumber(rules.settlementDays, 3));
  const withdrawThresholdAmount = toNumber(rules.withdrawThresholdAmount, 100);
  const diamondToPointsRate = Math.max(1, toNumber(rules.diamondToPointsRate, 1));
  const commissionRules = Array.isArray(rules.commissionRules) ? rules.commissionRules : [];
  const payoutReady = Boolean(payoutProfile?.realName && payoutProfile?.payoutAccount);
  const canEnterMain = true;
  const isLocalWechatMock = Boolean(wechatBinding?.authUrl?.includes('/api/wechat/mock-login/'));

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
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => subscribeThemeMode(setThemeMode), []);

  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }
    const timer = window.setInterval(() => {
      setCountdown((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    return () => {
      if (pollTimerRef.current) {
        window.clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      navigate(buildAcceptanceAwarePath('/login?forceLogin=1'), { replace: true });
      return;
    }
    void refreshPage();
  }, [navigate]);

  const stopWechatPolling = () => {
    if (pollTimerRef.current) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  };

  const refreshPage = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [profileRes, payoutRes, statsRes, rulesRes, recordsRes, withdrawalsRes] =
        await Promise.allSettled([
          api.auth.profile(),
          api.auth.getPayoutProfile(),
          api.referral.getStats(),
          api.referral.getRules(),
          api.referral.getRecords(),
          api.referral.getWithdrawals(),
        ]);

      const maybeProfile = profileRes.status === 'fulfilled' ? profileRes.value : null;
      if (
        maybeProfile &&
        maybeProfile.success === false &&
        /unauthorized|log in|session expired/i.test(String(maybeProfile.message || ''))
      ) {
        logout();
        navigate(buildAcceptanceAwarePath('/login?forceLogin=1'), { replace: true });
        return;
      }

      const nextProfile =
        profileRes.status === 'fulfilled' && profileRes.value?.success ? profileRes.value.data : null;
      const payoutResponse =
        payoutRes.status === 'fulfilled' && payoutRes.value?.success ? payoutRes.value.data : null;
      const statsResponse =
        statsRes.status === 'fulfilled' && statsRes.value?.success ? statsRes.value.data : {};
      const rulesResponse =
        rulesRes.status === 'fulfilled' && rulesRes.value?.success ? rulesRes.value.data : {};
      const recordsResponse =
        recordsRes.status === 'fulfilled' && recordsRes.value?.success ? recordsRes.value.data : [];
      const withdrawalsResponse =
        withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value?.success ? withdrawalsRes.value.data : {};

      const nextPayout =
        withdrawalsResponse?.payoutProfile ||
        payoutResponse?.payoutProfile ||
        payoutResponse ||
        nextProfile?.payoutProfile ||
        null;

      setData({
        profile: nextProfile,
        payoutProfile: nextPayout,
        stats: statsResponse || {},
        rules: rulesResponse || {},
        records: Array.isArray(recordsResponse) ? recordsResponse : recordsResponse?.list || [],
        withdrawals: Array.isArray(withdrawalsResponse?.list) ? withdrawalsResponse.list : [],
      });

      phoneForm.setFieldsValue({
        phoneNumber: nextProfile?.phone || '',
        code: '',
      });

      payoutForm.setFieldsValue({
        realName: nextPayout?.realName || '',
        payoutAccount: nextPayout?.payoutAccount || '',
        identityNo: nextPayout?.identityNo || '',
        phone: nextPayout?.phone || nextProfile?.phone || '',
        note: nextPayout?.note || '',
      });

      if (nextProfile?.bindingStatus?.wechatBound) {
        setWechatBindingMessage('当前账号已完成微信绑定，可以继续申请提现。');
      }
    } catch (error: any) {
      message.error(error?.message || '用户中心加载失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const startWechatPolling = (state: string) => {
    stopWechatPolling();
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const response: any = await api.auth.wechatStatus(state);
        const payload = response?.data;
        if (!response?.success || !payload) {
          return;
        }

        setWechatBindingMessage(
          normalizeWechatUiMessage(payload.message, {
            mode: 'bind',
            status: payload.status === 'expired' ? 'expired' : payload.status === 'success' ? 'success' : 'pending',
          }),
        );

        if (payload.status === 'success') {
          stopWechatPolling();
          if (payload.token) {
            writeSharedAuth({
              token: payload.token,
              refreshToken: payload.refreshToken ?? null,
              user: payload.user ?? null,
            });
          } else if (payload.user) {
            writeSharedAuth({ user: payload.user });
          }
          message.success(payload.mode === 'bind' ? '微信绑定成功' : '微信登录成功');
          await refreshPage(true);
        }

        if (payload.status === 'expired' || payload.status === 'failed') {
          stopWechatPolling();
        }
      } catch {
        // Ignore transient polling failures.
      }
    }, 2000);
  };

  const loadWechatBindQrcode = async (): Promise<WechatBindState> => {
    const response: any = await api.wechat.getBindQrcode();
    if (!response?.success || !response?.data?.authUrl || !response?.data?.state) {
      throw new Error(response?.message || '获取微信绑定二维码失败');
    }

    setWechatBinding(response.data);
    setWechatBindingMessage(
      getWechatInitialMessage({
        isMock: response.data.authUrl?.includes('/api/wechat/mock-login/'),
        mode: 'bind',
      }),
    );
    startWechatPolling(response.data.state);
    return response.data as WechatBindState;
  };

  const openWechatBindWindow = async (forceRefresh = false) => {
    const popup = window.open('', '_blank');
    try {
      setWechatBindingBusy(true);
      const nextBinding =
        !forceRefresh && wechatBinding?.authUrl && wechatBinding?.state
          ? wechatBinding
          : await loadWechatBindQrcode();

      if (!nextBinding?.authUrl) {
        throw new Error('未获取到微信绑定地址');
      }

      if (popup) {
        popup.opener = null;
        popup.location.replace(nextBinding.authUrl);
      } else {
        window.open(nextBinding.authUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (error: any) {
      popup?.close();
      message.error(error?.message || '打开微信绑定窗口失败');
    } finally {
      setWechatBindingBusy(false);
    }
  };

  const sendBindCode = async () => {
    const phoneNumber = normalizePhone(phoneForm.getFieldValue('phoneNumber'));
    if (!phonePattern.test(phoneNumber)) {
      message.error('请输入正确的手机号');
      return;
    }

    try {
      setSendingCode(true);
      const response: any = await api.auth.sendSmsCode(phoneNumber, 'bind_phone');
      if (!response?.success) {
        throw new Error(response?.message || '验证码发送失败');
      }
      setCountdown(60);
      message.success(response?.message || '验证码已发送');
    } catch (error: any) {
      message.error(error?.message || '验证码发送失败');
    } finally {
      setSendingCode(false);
    }
  };

  const bindPhone = async () => {
    const values = await phoneForm.validateFields();
    const phoneNumber = normalizePhone(values.phoneNumber);
    if (!phonePattern.test(phoneNumber)) {
      message.error('请输入正确的手机号');
      return;
    }

    try {
      setSavingPhone(true);
      const response: any = await api.auth.bindPhone({
        phoneNumber,
        code: String(values.code || '').trim(),
      });
      if (!response?.success) {
        throw new Error(response?.message || '手机号绑定失败');
      }
      message.success(response?.message || '手机号已绑定');
      await refreshPage(true);
    } catch (error: any) {
      message.error(error?.message || '手机号绑定失败');
    } finally {
      setSavingPhone(false);
    }
  };

  const savePayoutProfile = async () => {
    const values = await payoutForm.validateFields();
    try {
      setSavingPayout(true);
      const response: any = await api.auth.savePayoutProfile({
        realName: values.realName,
        payoutMethod: 'wechat',
        payoutAccount: values.payoutAccount,
        identityNo: values.identityNo,
        phone: values.phone,
        note: values.note,
      });
      if (!response?.success) {
        throw new Error(response?.message || '提现资料保存失败');
      }
      message.success(response?.message || '提现资料已保存');
      await refreshPage(true);
    } catch (error: any) {
      message.error(error?.message || '提现资料保存失败');
    } finally {
      setSavingPayout(false);
    }
  };

  const resolveWithdrawalDiamonds = async () => {
    const values = await withdrawForm.validateFields();
    const amount = Number(values.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new Error('请输入正确的提现金额');
    }
    return moneyToDiamonds(amount);
  };

  const previewWithdrawal = async () => {
    try {
      const diamonds = await resolveWithdrawalDiamonds();
      setPreviewingWithdrawal(true);
      const response: any = await api.referral.previewWithdrawal({ diamonds });
      if (!response?.success) {
        throw new Error(response?.message || '提现试算失败');
      }
      setWithdrawPreview(response.data);
      message.success('税额试算完成');
    } catch (error: any) {
      message.error(error?.message || '提现试算失败');
    } finally {
      setPreviewingWithdrawal(false);
    }
  };

  const submitWithdrawal = async () => {
    if (!wechatBound) {
      message.error('请先绑定微信，再申请提现');
      return;
    }
    if (!payoutReady) {
      message.error('请先完善实名与微信收款资料');
      return;
    }

    try {
      const diamonds = await resolveWithdrawalDiamonds();
      setSubmittingWithdrawal(true);
      const response: any = await api.referral.submitWithdrawal({ diamonds });
      if (!response?.success) {
        throw new Error(response?.message || '提现申请失败');
      }
      message.success(response?.message || '提现申请已提交');
      withdrawForm.resetFields();
      setWithdrawPreview(null);
      await refreshPage(true);
    } catch (error: any) {
      message.error(error?.message || '提现申请失败');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  const copyText = async (value: string, successText: string) => {
    if (!value) {
      message.warning('当前还没有可复制的内容');
      return;
    }
    if (await copyTextToClipboard(value)) {
      message.success(successText);
      return;
    }

    message.error('复制失败，请手动复制');
  };

  if (loading) {
    return (
      <AccessLoading
        title="正在加载账号中心"
        description="正在同步你的账号资料、权益和绑定状态。"
        steps={['读取账号资料', '同步会员权益', '检查安全绑定']}
      />
    );
  }

  return (
    <div className={`${styles.shell} ${styles.rechargeShell} ${themeMode === 'dark' ? styles.themeDark : ''}`}>
      <div className={styles.inner}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 14 }}>
          <button
            type="button"
            className={styles.themeToggle}
            onClick={() => setPreferredThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
          >
            <span>{themeMode === 'dark' ? '切到浅色' : '切到深色'}</span>
          </button>
        </div>

        <div className={styles.hero}>
          <div>
            <Card className={styles.heroPanel} bordered={false}>
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Tag className={styles.chip} icon={<GiftOutlined />}>
                  用户中心
                </Tag>
                <Title level={2} className={styles.heroTitle} style={{ marginBottom: 0 }}>
                  {displayName}
                </Title>
                <Paragraph className={styles.heroText} style={{ marginBottom: 0 }}>
                  手机号、微信绑定、钻石账户、邀请记录和提现资料都放在这里。只有先绑定微信并完善实名收款资料，才可以提交提现申请。
                </Paragraph>
                <Space wrap>
                  <Tag className={styles.metaPill} icon={<MobileOutlined />}>
                    {phoneBound ? '手机号已绑定' : '手机号未绑定'}
                  </Tag>
                  <Tag className={styles.metaPill} icon={<WechatOutlined />}>
                    {wechatBound ? '微信已绑定' : '微信未绑定'}
                  </Tag>
                  <Tag className={styles.metaPill} icon={<SafetyCertificateOutlined />}>
                    {profile.duration?.canEnter || isLocalAcceptanceMode() ? '已兑换可用时长' : '可进入主程序'}
                  </Tag>
                </Space>
                <div className={styles.buttonRow}>
                  <Button type="primary" className={styles.primaryButton} icon={<WalletOutlined />} onClick={() => navigate(buildAcceptanceAwarePath('/recharge'))}>
                    返回充值中心
                  </Button>
                  <Button className={styles.secondaryButton} onClick={() => navigate(buildAcceptanceAwarePath('/main'))}>
                    进入主程序
                  </Button>
                  <Button className={styles.secondaryButton} icon={<ReloadOutlined />} onClick={() => void refreshPage(true)} loading={refreshing}>
                    刷新数据
                  </Button>
                  <Button
                    className={styles.secondaryButton}
                    icon={<LogoutOutlined />}
                    onClick={() => {
                      logout();
                      navigate(buildAcceptanceAwarePath('/login'), { replace: true });
                    }}
                  >
                    退出登录
                  </Button>
                </div>
              </Space>
            </Card>
          </div>
          <div>
            <Card className={styles.helperCard} bordered={false}>
              <div className={styles.helperIcon} aria-hidden="true">
                <SafetyCertificateOutlined />
              </div>
              <div className={styles.helperBody}>
                <div>
                  <div className={styles.helperTitle}>账号总览</div>
                  <div className={styles.helperText}>{formatDurationSummary(profile.duration)}</div>
                </div>
                <div className={styles.helperSummaryGrid}>
                  <div className={styles.helperMiniStat}>
                    <span className={styles.helperMiniLabel}>邀请码</span>
                    <span className={styles.helperMiniValue}>{referralCode || '待生成'}</span>
                    <span className={styles.helperMiniHint}>可复制给新用户注册使用</span>
                  </div>
                  <div className={styles.helperMiniStat}>
                    <span className={styles.helperMiniLabel}>邀请情况</span>
                    <span className={styles.helperMiniValue}>{`总邀请 ${totalInvites} · 付费 ${paidInvites}`}</span>
                    <span className={styles.helperMiniHint}>{`距离下一档加成还差 ${nextBoostRemaining} 人`}</span>
                  </div>
                  <div className={styles.helperMiniStat}>
                    <span className={styles.helperMiniLabel}>钻石账户</span>
                    <span className={styles.helperMiniValue}>{formatMoney(diamondAvailable)}</span>
                    <span className={styles.helperMiniHint}>{`冻结 ${formatMoney(diamondFrozen)} · 待结算 ${formatMoney(diamondPending)}`}</span>
                  </div>
                  <div className={styles.helperMiniStat}>
                    <span className={styles.helperMiniLabel}>提现条件</span>
                    <span className={styles.helperMiniValue}>{`门槛 ${formatMoney(withdrawThresholdAmount)}`}</span>
                    <span className={styles.helperMiniHint}>
                      {wechatBound
                        ? `微信已绑定 · T+${settlementDays} 结算`
                        : '需先绑定微信后才能提现'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.metricStrip}>
            <Card className={styles.metricCard} bordered={false}>
              <span className={styles.metricLabel}>当前积分</span>
              <span className={styles.metricValue}>{currentPoints.toLocaleString('zh-CN')}</span>
              <span className={styles.metricHint}>累计充值 {formatMoney(totalRecharge)}</span>
            </Card>
            <Card className={styles.metricCard} bordered={false}>
              <span className={styles.metricLabel}>可提现钻石</span>
              <span className={styles.metricValue}>{formatMoney(diamondAvailable)}</span>
              <span className={styles.metricHint}>冻结 {formatMoney(diamondFrozen)} · 待结算 {formatMoney(diamondPending)}</span>
            </Card>
            <Card className={styles.metricCard} bordered={false}>
              <span className={styles.metricLabel}>累计收益</span>
              <span className={styles.metricValue}>{formatMoney(diamondTotalEarned)}</span>
              <span className={styles.metricHint}>累计提现 {formatMoney(diamondTotalWithdrawn)} · 转积分比例 {diamondToPointsRate}:1</span>
            </Card>
          </div>

          <div className={styles.detailGrid} style={{ marginTop: 16 }}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>邀请码</span>
              <span className={styles.detailValue}>{referralCode || '待生成'}</span>
              <div className={styles.buttonRow} style={{ marginTop: 12 }}>
                <Button className={styles.secondaryButton} icon={<CopyOutlined />} onClick={() => void copyText(referralCode, '邀请码已复制')}>
                  复制邀请码
                </Button>
                <Button className={styles.secondaryButton} icon={<CopyOutlined />} onClick={() => void copyText(referralLink, '邀请链接已复制')}>
                  复制邀请链接
                </Button>
              </div>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>拉新进度</span>
              <span className={styles.detailValue}>{paidInvites}</span>
              <Text className={styles.helperText}>距离下一档加成还差 {nextBoostRemaining} 人。</Text>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card className={styles.surfaceCard} bordered={false}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div className={styles.helperTitle}>手机号绑定</div>
                  <Form form={phoneForm} layout="vertical">
                    <Form.Item
                      name="phoneNumber"
                      label="手机号"
                      rules={[
                        { required: true, message: '请输入手机号' },
                        {
                          validator: (_, value) =>
                            phonePattern.test(normalizePhone(value))
                              ? Promise.resolve()
                              : Promise.reject(new Error('请输入正确的手机号')),
                        },
                      ]}
                    >
                      <Input className={styles.softInput} prefix={<MobileOutlined />} placeholder="用于验证码登录" autoComplete="tel" />
                    </Form.Item>
                    <Form.Item name="code" label="短信验证码" rules={[{ required: true, message: '请输入验证码' }]}>
                      <Input className={styles.softInput} placeholder="短信验证码" autoComplete="one-time-code" />
                    </Form.Item>
                    <div className={styles.buttonRow}>
                      <Button className={styles.secondaryButton} onClick={() => void sendBindCode()} loading={sendingCode}>
                        {countdown > 0 ? `重新发送 ${countdown}s` : '发送验证码'}
                      </Button>
                      <Button type="primary" className={styles.primaryButton} onClick={() => void bindPhone()} loading={savingPhone}>
                        绑定手机号
                      </Button>
                    </div>
                  </Form>
                </Space>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card className={styles.surfaceCard} bordered={false}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <div className={styles.helperTitle}>微信绑定</div>
                  <Alert
                    className={styles.infoAlert}
                    type={wechatBound ? 'success' : 'warning'}
                    showIcon
                    message={renderAlertMessage(wechatBound ? '当前账号已绑定微信' : '当前账号尚未绑定微信')}
                    description={renderAlertDescription(wechatBindingMessage)}
                  />
                  <div className={styles.buttonRow}>
                    <Button
                      type="primary"
                      className={styles.primaryButton}
                      icon={<WechatOutlined />}
                      onClick={() => void openWechatBindWindow(false)}
                      loading={wechatBindingBusy}
                    >
                      打开微信绑定
                    </Button>
                    <Button
                      className={styles.secondaryButton}
                      icon={<ReloadOutlined />}
                      onClick={() => void openWechatBindWindow(true)}
                      disabled={wechatBindingBusy}
                      style={wechatBindingBusy ? hardContrastDisabledButtonStyle : undefined}
                    >
                      刷新二维码
                    </Button>
                  </div>
                  <Text className={styles.helperText} style={hardContrastTextStyle}>
                    {isLocalWechatMock ? '当前是本地调试绑定模式，新窗口确认后会回写到当前账号。' : '绑定成功后，微信提现审核会校验当前微信账号。'}
                  </Text>
                </Space>
              </Card>
            </Col>
          </Row>

          <Card className={styles.surfaceCard} bordered={false} style={{ marginTop: 16 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div className={styles.helperTitle}>实名认证与微信收款资料</div>
              <Alert
                className={styles.infoAlert}
                type={wechatBound && payoutReady ? 'success' : 'warning'}
                showIcon
                message={renderAlertMessage(wechatBound && payoutReady ? '提现资料已满足基础要求' : '提现前必须先完成微信绑定和收款资料')}
                description={renderAlertDescription('这里只支持微信提现，请填写与实名一致的微信收款账户。')}
              />
              <Form form={payoutForm} layout="vertical">
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="realName" label={renderLabel('真实姓名')} rules={[{ required: true, message: '请输入真实姓名' }]}>
                      <Input className={styles.softInput} placeholder="提现审核实名" autoComplete="name" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="payoutAccount" label={renderLabel('微信收款账号')} rules={[{ required: true, message: '请输入微信收款账号' }]}>
                      <Input className={styles.softInput} placeholder="微信号或收款标识" autoComplete="username" />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="identityNo" label={renderLabel('身份证号')}>
                      <Input className={styles.softInput} placeholder="选填，用于人工审核" autoComplete="off" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label={renderLabel('联系手机号')}>
                      <Input className={styles.softInput} placeholder="审核联系手机号" autoComplete="tel" />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item name="note" label={renderLabel('备注')}>
                  <Input.TextArea className={styles.softInput} rows={3} placeholder="例如：微信实名与账号一致" />
                </Form.Item>
                <div className={styles.buttonRow}>
                  <Button type="primary" className={styles.primaryButton} onClick={() => void savePayoutProfile()} loading={savingPayout}>
                    保存提现资料
                  </Button>
                  <Tag className={styles.metaPill} style={hardContrastTagStyle}>
                    {renderTagContent(`当前收款账号 ${maskAccount(payoutProfile?.payoutAccount)}`)}
                  </Tag>
                </div>
              </Form>
            </Space>
          </Card>
        </section>

        <section className={styles.section}>
          <Card className={styles.surfaceCard} bordered={false}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <div className={styles.helperTitle}>提现申请</div>
              <Alert
                className={styles.infoAlert}
                type={wechatBound && payoutReady ? 'success' : 'warning'}
                showIcon
                message={renderAlertMessage(wechatBound ? '微信提现条件已满足第一步' : '请先绑定微信')}
                description={renderAlertDescription(wechatBound ? '继续完善实名资料并达到门槛后，即可提交提现。' : '当前账号尚未绑定微信，暂时不能提交提现。')}
              />
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>当前可提现</span>
                  <span className={styles.detailValue}>{formatMoney(diamondAvailable)}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>当前门槛</span>
                  <span className={styles.detailValue}>{formatMoney(withdrawThresholdAmount)}</span>
                </div>
              </div>
              <Form form={withdrawForm} layout="vertical">
                <Form.Item
                  name="amount"
                  label={renderLabel('提现金额（元）')}
                  rules={[
                    { required: true, message: '请输入提现金额' },
                    {
                      validator: (_, value) => {
                        const next = Number(value);
                        return Number.isFinite(next) && next > 0
                          ? Promise.resolve()
                          : Promise.reject(new Error('请输入正确的提现金额'));
                      },
                    },
                  ]}
                >
                  <Input className={styles.softInput} placeholder="例如 100" inputMode="decimal" autoComplete="off" />
                </Form.Item>
                <div className={styles.buttonRow}>
                  <Button className={styles.secondaryButton} onClick={() => void previewWithdrawal()} loading={previewingWithdrawal}>
                    试算税额
                  </Button>
                  <Button
                    type="primary"
                    className={styles.primaryButton}
                    onClick={() => void submitWithdrawal()}
                    loading={submittingWithdrawal}
                    disabled={!wechatBound || !payoutReady}
                    style={!wechatBound || !payoutReady ? hardContrastDisabledButtonStyle : undefined}
                  >
                    提交提现
                  </Button>
                </div>
              </Form>
              {withdrawPreview ? (
                <div className={styles.detailGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>税前金额</span>
                    <span className={styles.detailValue}>{formatMoney(toNumber(withdrawPreview.grossAmount))}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>预扣税额</span>
                    <span className={styles.detailValue}>{formatMoney(toNumber(withdrawPreview.taxAmount))}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>税后到账</span>
                    <span className={styles.detailValue}>{formatMoney(toNumber(withdrawPreview.netAmount))}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>税基 / 税率</span>
                    <span className={styles.detailValue}>{formatMoney(toNumber(withdrawPreview.taxableBase))} / {(toNumber(withdrawPreview.taxRate) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ) : null}
            </Space>
          </Card>
        </section>

        <section className={styles.section}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card className={styles.surfaceCard} bordered={false}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className={styles.helperTitle}>最近邀请记录</div>
                  {records.length === 0 ? (
                    <Alert className={styles.infoAlert} type="info" showIcon message={renderAlertMessage('当前还没有邀请收益记录')} />
                  ) : (
                    records.slice(0, 6).map((record: any) => (
                      <div key={record.id} className={styles.detailItem}>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          <Space wrap>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(record.referee_name || '匿名用户')}</Tag>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(record.reward_status || 'pending')}</Tag>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(formatMoney(toNumber(record.rewardAmountDisplay)))}</Tag>
                          </Space>
                          <Text className={styles.helperText} style={hardContrastTextStyle}>{record.metadata?.productName || '订单返佣'} · {formatDateTime(record.created_at)}</Text>
                        </Space>
                      </div>
                    ))
                  )}
                </Space>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card className={styles.surfaceCard} bordered={false}>
                <Space direction="vertical" size={14} style={{ width: '100%' }}>
                  <div className={styles.helperTitle}>最近提现记录</div>
                  {withdrawals.length === 0 ? (
                    <Alert className={styles.infoAlert} type="info" showIcon message={renderAlertMessage('当前还没有提现记录')} />
                  ) : (
                    withdrawals.slice(0, 6).map((item: any) => (
                      <div key={item.id} className={styles.detailItem}>
                        <Space direction="vertical" size={6} style={{ width: '100%' }}>
                          <Space wrap>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(getWithdrawalStatusLabel(item.status))}</Tag>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(formatMoney(toNumber(item.gross_amount)))}</Tag>
                            <Tag className={styles.metaPill} style={hardContrastTagStyle}>{renderTagContent(`税后 ${formatMoney(toNumber(item.net_amount))}`)}</Tag>
                          </Space>
                          <Text className={styles.helperText} style={hardContrastTextStyle}>微信收款 {maskAccount(item.payout_account)} · {formatDateTime(item.created_at)}</Text>
                        </Space>
                      </div>
                    ))
                  )}
                </Space>
              </Card>
            </Col>
          </Row>

          {commissionRules.length > 0 ? (
            <Card className={styles.surfaceCard} bordered={false} style={{ marginTop: 16 }}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div className={styles.helperTitle}>当前返佣规则</div>
                {commissionRules.slice(0, 6).map((rule: any) => (
                  <div key={rule.code || rule.name} className={styles.detailItem}>
                    <Text className={styles.helperText} style={hardContrastTextStyle}>
                      {rule.name || rule.code} · 订单区间 {formatMoney(toNumber(rule.minAmount, 0))} - {rule.maxAmount ? formatMoney(toNumber(rule.maxAmount)) : '不限'} · 基础返佣{' '}
                      {rule.rewardMode === 'fixed' ? formatMoney(toNumber(rule.rewardAmount)) : `${toNumber(rule.rewardRate) * 100}%`}
                    </Text>
                  </div>
                ))}
              </Space>
            </Card>
          ) : null}
        </section>
      </div>
    </div>
  );
}
