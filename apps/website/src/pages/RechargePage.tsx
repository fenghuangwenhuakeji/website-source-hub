import QRCode from 'qrcode';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { apiClient } from '../utils/api';

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

type OrderItem = {
  id?: string;
  orderNo: string;
  packageName: string;
  amount: number;
  points: number;
  status: string;
  payMethod?: PayMethod | string | null;
  createdAt?: string | null;
  paidAt?: string | null;
};

type ActiveOrder = {
  orderId: string;
  orderNo: string;
  amount: number;
  productName: string;
  points: number;
  bonusPoints: number;
  payMethod: PayMethod;
  status: string;
  expireTime?: string | null;
  qrCode: string;
};

function unwrap<T = any>(response: any): T {
  return response?.data?.data ?? response?.data ?? response;
}

function toNumber(value: unknown, fallback = 0) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function formatMoney(value: number) {
  return `¥${toNumber(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) {
    return '-';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false });
}

function formatDuration(value?: number | null, unit?: string | null) {
  const normalized = String(unit || '').toLowerCase();
  if (!value && ['permanent', 'forever', 'lifetime', 'infinite'].includes(normalized)) {
    return '永久';
  }
  if (!value) {
    return '未配置';
  }

  const unitMap: Record<string, string> = {
    hour: '小时',
    day: '天',
    week: '周',
    month: '个月',
    year: '年',
  };
  return `${value}${unitMap[normalized] || normalized || '时长'}`;
}

function formatRemainingDuration(seconds?: number) {
  if (!Number.isFinite(Number(seconds)) || Number(seconds) <= 0) {
    return '未订阅';
  }
  const total = Number(seconds);
  const days = Math.floor(total / 86400);
  const hours = Math.ceil((total % 86400) / 3600);
  if (days > 0) {
    return hours > 0 ? `${days}天${hours}小时` : `${days}天`;
  }
  return `${Math.max(1, hours)}小时`;
}

function normalizeQrCode(value: string) {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${value}`;
  }
  return value;
}

function statusLabel(status?: string) {
  switch (status) {
    case 'paid':
      return '已支付';
    case 'expired':
      return '已过期';
    case 'cancelled':
    case 'canceled':
      return '已取消';
    default:
      return '待支付';
  }
}

export default function RechargePage() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [packages, setPackages] = useState<RechargePackage[]>([]);
  const [exchangeOptions, setExchangeOptions] = useState<ExchangeOption[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [access, setAccess] = useState<any>(null);
  const [payMethod, setPayMethod] = useState<PayMethod>('wechat');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [exchangeSubmittingId, setExchangeSubmittingId] = useState<string | null>(null);
  const [activeOrder, setActiveOrder] = useState<ActiveOrder | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [polling, setPolling] = useState(false);

  const points = toNumber(user?.points);
  const totalRecharge = toNumber((user as any)?.totalRecharge ?? access?.totalRecharge);
  const duration = user?.duration;
  const durationValue = duration?.isPermanent
    ? '永久'
    : duration?.isActive || duration?.canEnter
      ? formatRemainingDuration(duration.remainingSeconds)
      : '未订阅';
  const durationHint = duration?.isPermanent
    ? '账号已开通永久权益'
    : duration?.expiresAt
      ? `到期 ${formatDateTime(duration.expiresAt)}`
      : access?.membershipExpiry
        ? `到期 ${formatDateTime(access.membershipExpiry)}`
        : '充值积分后可兑换订阅时长';

  const accountCards = useMemo(
    () => [
      { label: '当前积分', value: String(points), hint: '充值和兑换记录实时计入' },
      { label: '订阅状态', value: durationValue, hint: durationHint },
      { label: '累计充值', value: formatMoney(totalRecharge), hint: '已完成订单的累计金额' },
      {
        label: '手机号',
        value: user?.bindingStatus?.phoneBound ? '已绑定' : '未绑定',
        hint: user?.phone || '绑定后支持短信登录',
      },
    ],
    [durationHint, durationValue, points, totalRecharge, user?.bindingStatus?.phoneBound, user?.phone],
  );

  async function refreshPage(silent = false) {
    if (!silent) {
      setLoading(true);
    }
    setMessage('');

    try {
      const [profileRes, accessRes, packagesRes, exchangeRes, ordersRes] = await Promise.all([
        apiClient.get('/api/auth/profile'),
        apiClient.get('/api/auth/check-recharge'),
        apiClient.get('/api/orders/packages'),
        apiClient.get('/api/orders/points-exchange'),
        apiClient.get('/api/orders/list', { params: { limit: 8 } }),
      ]);

      const profile = unwrap<any>(profileRes);
      const accessPayload = unwrap<any>(accessRes);
      const packagePayload = unwrap<any[]>(packagesRes);
      const exchangePayload = unwrap<any[]>(exchangeRes);
      const orderPayload = unwrap<any>(ordersRes);

      if (profile) {
        updateUser(profile);
      }
      setAccess(accessPayload || null);
      setPackages(
        (Array.isArray(packagePayload) ? packagePayload : []).map((item) => ({
          id: String(item.id),
          name: item.name || '充值套餐',
          description: item.description || '',
          price: toNumber(item.price ?? item.amount),
          points: toNumber(item.points),
          bonusPoints: toNumber(item.bonus_points ?? item.bonusPoints),
          duration: item.duration == null ? null : toNumber(item.duration),
          durationUnit: item.duration_unit || item.durationUnit || null,
          recommended: item.recommended === true || item.recommended === 1 || item.recommended === '1',
        })),
      );
      setExchangeOptions(
        (Array.isArray(exchangePayload) ? exchangePayload : []).map((item) => ({
          id: String(item.id),
          name: item.name || '时长兑换',
          description: item.description || '',
          pointsCost: toNumber(item.points_cost ?? item.pointsCost ?? item.points),
          duration: toNumber(item.duration),
          durationUnit: item.duration_unit || item.durationUnit || null,
        })),
      );
      setOrders(
        (Array.isArray(orderPayload?.list) ? orderPayload.list : []).map((item: any) => ({
          id: item.id,
          orderNo: item.order_no || item.orderNo || '-',
          packageName: item.package_name || item.packageName || item.product_name || '充值订单',
          amount: toNumber(item.amount),
          points: toNumber(item.points),
          status: item.status || 'pending',
          payMethod: item.pay_method || item.payMethod || null,
          createdAt: item.created_at || item.createdAt || null,
          paidAt: item.paid_at || item.paidAt || null,
        })),
      );
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.response?.data?.error || '数据加载失败，请刷新页面。');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    void refreshPage();
  }, []);

  useEffect(() => {
    let disposed = false;

    async function renderQr() {
      if (!activeOrder?.qrCode) {
        setQrDataUrl('');
        return;
      }
      try {
        const dataUrl = await QRCode.toDataURL(activeOrder.qrCode, {
          width: 224,
          margin: 2,
          color: {
            dark: '#141414',
            light: '#ffffff',
          },
        });
        if (!disposed) {
          setQrDataUrl(dataUrl);
        }
      } catch {
        if (!disposed) {
          setQrDataUrl('');
        }
      }
    }

    void renderQr();

    return () => {
      disposed = true;
    };
  }, [activeOrder?.qrCode]);

  useEffect(() => {
    if (!activeOrder || activeOrder.status === 'paid') {
      return undefined;
    }

    let disposed = false;

    const poll = async () => {
      try {
        setPolling(true);
        const response = await apiClient.get(`/api/payment/status/${activeOrder.orderNo}`);
        const payload = unwrap<any>(response);

        if (disposed || !payload) {
          return;
        }

        const nextStatus = payload.status || activeOrder.status;
        setActiveOrder((current) =>
          current
            ? {
                ...current,
                status: nextStatus,
                expireTime: payload.expireTime ?? current.expireTime,
              }
            : current,
        );

        if (nextStatus === 'paid') {
          setMessage('支付成功，积分已到账。');
          await refreshPage(true);
        }
      } catch {
        // Polling failures are transient; the user can also refresh manually.
      } finally {
        if (!disposed) {
          setPolling(false);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => void poll(), 3000);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [activeOrder?.orderNo, activeOrder?.status]);

  async function createOrder(pkg: RechargePackage) {
    setSubmittingId(pkg.id);
    setMessage('');

    try {
      const orderRes = await apiClient.post('/api/orders/create', {
        packageId: pkg.id,
        payMethod,
      });
      const order = unwrap<any>(orderRes);

      if (!order?.orderId) {
        throw new Error('创建订单失败。');
      }

      if (order.status === 'paid' || order.isAdmin) {
        setMessage(orderRes.data?.message || '充值成功，积分已到账。');
        await refreshPage(true);
        return;
      }

      const paymentRes = await apiClient.post('/api/payment/create', {
        orderId: order.orderId,
        orderNo: order.orderNo,
        payMethod,
      });
      const payment = unwrap<any>(paymentRes);

      if (!payment?.qrCode) {
        throw new Error('支付二维码生成失败。');
      }

      setActiveOrder({
        orderId: order.orderId,
        orderNo: order.orderNo,
        amount: toNumber(order.amount, pkg.price),
        productName: order.packageName || pkg.name,
        points: pkg.points,
        bonusPoints: pkg.bonusPoints,
        payMethod,
        status: order.status || 'pending',
        expireTime: payment.expireTime || null,
        qrCode: normalizeQrCode(String(payment.qrCode)),
      });
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.response?.data?.error || error.message || '创建订单失败。');
    } finally {
      setSubmittingId(null);
    }
  }

  async function exchangeDuration(option: ExchangeOption) {
    setMessage('');
    if (points < option.pointsCost) {
      setMessage(`积分不足，还差 ${option.pointsCost - points} 积分。`);
      return;
    }

    setExchangeSubmittingId(option.id);
    try {
      const response = await apiClient.post('/api/orders/exchange', { exchangeId: option.id });
      setMessage(response.data?.message || '订阅时长兑换成功。');
      await refreshPage(true);
    } catch (error: any) {
      setMessage(error.response?.data?.message || error.response?.data?.error || '兑换失败，请核对积分余额后重试。');
    } finally {
      setExchangeSubmittingId(null);
    }
  }

  return (
    <div className="page-shell recharge-shell">
      <div className="container py-10 sm:py-14 space-y-8">
        <section className="recharge-hero">
          <div>
            <div className="section-kicker">充值与订阅</div>
            <h1 className="recharge-title">订阅与积分管理</h1>
            <p className="recharge-lead">
              用于开通订阅、补充积分与查询充值记录。支付完成后，积分和权益将计入当前账号。
            </p>
          </div>
          <div className="recharge-hero-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => void refreshPage()}>
              刷新状态
            </button>
            <Link to="/profile" className="btn btn-secondary btn-sm">
              个人设置
            </Link>
          </div>
        </section>

        <div className="recharge-stats">
          {accountCards.map((item) => (
            <section className="recharge-stat" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <small>{item.hint}</small>
            </section>
          ))}
        </div>

        {message ? (
          <div className="profile-alert" role="status" aria-live="polite">
            {message}
          </div>
        ) : null}

        {loading ? (
          <section className="glass-card p-6">
            <div className="recharge-loading">
              <span />
              <span />
              <span />
            </div>
          </section>
        ) : (
          <div className="recharge-layout">
            <main className="recharge-main">
              <section className="recharge-panel">
                <div className="recharge-panel-heading">
                  <div>
                    <div className="section-kicker">充值积分</div>
                    <h2>选择充值套餐</h2>
                  </div>
                  <div className="pay-method-switch" aria-label="支付方式">
                    <button
                      type="button"
                      className={payMethod === 'wechat' ? 'active' : ''}
                      onClick={() => setPayMethod('wechat')}
                    >
                      微信支付
                    </button>
                    <button
                      type="button"
                      className={payMethod === 'alipay' ? 'active' : ''}
                      onClick={() => setPayMethod('alipay')}
                    >
                      支付宝
                    </button>
                  </div>
                </div>

                <div className="recharge-package-grid">
                  {packages.length > 0 ? (
                    packages.map((pkg) => (
                      <article className={`recharge-package${pkg.recommended ? ' is-recommended' : ''}`} key={pkg.id}>
                        {pkg.recommended ? <span className="recharge-badge">推荐</span> : null}
                        <h3>{pkg.name}</h3>
                        <p>{pkg.description || '支付完成后积分计入当前账号。'}</p>
                        <strong>{formatMoney(pkg.price)}</strong>
                        <div className="recharge-package-meta">
                          <span>基础 {pkg.points} 积分</span>
                          <span>到账 {pkg.points + pkg.bonusPoints} 积分</span>
                          {pkg.duration ? <span>{formatDuration(pkg.duration, pkg.durationUnit)}</span> : null}
                        </div>
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={submittingId === pkg.id}
                          onClick={() => void createOrder(pkg)}
                        >
                          {submittingId === pkg.id ? '生成中...' : '充值'}
                        </button>
                      </article>
                    ))
                  ) : (
                    <div className="recharge-empty">暂无可用充值套餐。</div>
                  )}
                </div>
              </section>

              <section className="recharge-panel">
                <div className="recharge-panel-heading">
                  <div>
                    <div className="section-kicker">订阅时长</div>
                    <h2>用积分兑换订阅</h2>
                  </div>
                </div>

                <div className="exchange-grid">
                  {exchangeOptions.length > 0 ? (
                    exchangeOptions.map((option) => (
                      <article className="exchange-card" key={option.id}>
                        <div>
                          <h3>{option.name}</h3>
                          <p>{option.description || '兑换后权益计入当前账号。'}</p>
                        </div>
                        <div className="exchange-card-footer">
                          <span>{formatDuration(option.duration, option.durationUnit)}</span>
                          <strong>{option.pointsCost} 积分</strong>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            disabled={exchangeSubmittingId === option.id}
                            onClick={() => void exchangeDuration(option)}
                          >
                            {exchangeSubmittingId === option.id ? '兑换中...' : '兑换'}
                          </button>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="recharge-empty">暂无可兑换订阅。</div>
                  )}
                </div>
              </section>
            </main>

            <aside className="recharge-side">
              <section className="recharge-panel">
                <div className="recharge-panel-heading">
                  <div>
                    <div className="section-kicker">充值订单</div>
                    <h2>充值记录</h2>
                  </div>
                </div>
                <div className="order-list">
                  {orders.length > 0 ? (
                    orders.map((order) => (
                      <article className="order-row" key={order.orderNo}>
                        <div>
                          <strong>{order.packageName}</strong>
                          <span>{formatDateTime(order.createdAt)}</span>
                        </div>
                        <div>
                          <strong>{formatMoney(order.amount)}</strong>
                          <span>{statusLabel(order.status)}</span>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="recharge-empty">还没有充值订单。</div>
                  )}
                </div>
              </section>

              <section className="recharge-panel">
                <div className="section-kicker">说明</div>
                <p className="recharge-note">
                  充值所得积分可兑换订阅时长。使用微信或手机号登录时，余额与权益保持一致。
                </p>
              </section>
            </aside>
          </div>
        )}
      </div>

      {activeOrder ? (
        <div className="recharge-modal-backdrop" role="presentation">
          <section className="recharge-modal" role="dialog" aria-modal="true" aria-label="支付订单">
            <div className="recharge-modal-heading">
              <div>
                <div className="section-kicker">支付订单</div>
                <h2>{activeOrder.productName}</h2>
              </div>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveOrder(null)}>
                关闭
              </button>
            </div>

            <div className="qr-panel">
              {qrDataUrl ? <img src={qrDataUrl} alt="支付二维码" /> : <div className="qr-fallback">二维码生成中</div>}
              <p>{activeOrder.payMethod === 'wechat' ? '使用微信扫码支付' : '使用支付宝扫码支付'}</p>
            </div>

            <div className="payment-detail-grid">
              <div>
                <span>订单号</span>
                <strong>{activeOrder.orderNo}</strong>
              </div>
              <div>
                <span>支付金额</span>
                <strong>{formatMoney(activeOrder.amount)}</strong>
              </div>
              <div>
                <span>到账积分</span>
                <strong>{activeOrder.points + activeOrder.bonusPoints}</strong>
              </div>
              <div>
                <span>订单状态</span>
                <strong>{statusLabel(activeOrder.status)}</strong>
              </div>
            </div>

            <div className="recharge-modal-footer">
              <span>{polling ? '正在检查支付状态...' : `有效期至 ${formatDateTime(activeOrder.expireTime)}`}</span>
              <a className="btn btn-primary btn-sm" href={activeOrder.qrCode} target="_blank" rel="noreferrer">
                打开支付链接
              </a>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
