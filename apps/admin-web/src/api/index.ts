import axios from 'axios';

function resolveApiBaseUrl() {
  const envBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '').trim();

  if (!envBaseUrl) {
    return window.location.origin;
  }

  const isLocalhostTarget = /^https?:\/\/localhost(?::\d+)?$/i.test(envBaseUrl);
  const isRemotePage = typeof window !== 'undefined' && window.location.hostname !== 'localhost';

  // Prevent production deployments from accidentally pointing the admin app
  // at the viewer's own localhost when a dev-only build variable leaks in.
  if (isLocalhostTarget && isRemotePage) {
    return window.location.origin;
  }

  return envBaseUrl;
}

const API_BASE_URL = resolveApiBaseUrl().replace(/\/$/, '');

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

interface User {
  id: number;
  username: string;
  email: string;
  phone: string;
  phone_verified_at?: string;
  nickname: string;
  role: string;
  status: string;
  points: number;
  total_recharge: number;
  referral_code: string;
  referred_by: number;
  referrer_username?: string;
  vip_level: number;
  vip_expire_time: string;
  last_login: string;
  created_at: string;
  wechat_openid?: string;
  wechat_bound_at?: string;
  is_admin?: number | boolean;
  must_bind_contact?: number | boolean;
  password_updated_at?: string;
  password_reset_requested_at?: string;
  last_password_reset_at?: string;
}

interface Package {
  id: number;
  name: string;
  description: string;
  price: number;
  points: number;
  bonus_points: number;
  duration: number;
  duration_unit: string;
  icon: string;
  recommended: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface ExchangeProduct {
  id: number;
  name: string;
  description: string;
  points_cost: number;
  points_reward: number;
  duration: number;
  duration_unit: string;
  icon: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

interface Referral {
  id: number;
  referrer_id: number;
  referrer_name: string;
  referee_id: number;
  referee_name: string;
  referee_type: string;
  reward_type: string;
  reward_amount: number;
  reward_amount_display?: number;
  gross_order_amount?: number;
  commission_mode?: 'fixed' | 'rate' | null;
  commission_value?: number | null;
  available_at?: string | null;
  settled_at?: string | null;
  metadata?: string | null;
  order_id: string;
  reward_status: string;
  created_at: string;
}

interface ReferralCommissionRule {
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  rewardMode: 'fixed' | 'rate';
  rewardValue: number;
  boostEnabled: boolean;
  boostRewardMode?: 'fixed' | 'rate' | null;
  boostRewardValue?: number | null;
}

interface ReferralSettings {
  settlementDays: number;
  withdrawThresholdDiamonds: number;
  diamondToPointsRate: number;
  recruitBoostPaidUsers: number;
  recruitBoostRate: number;
  withdrawalNotice: string;
  commissionRules: ReferralCommissionRule[];
}

interface ReferralWithdrawal {
  id: string;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  diamonds: number;
  gross_amount: number;
  taxable_base: number;
  tax_rate: number;
  quick_deduction: number;
  tax_amount: number;
  net_amount: number;
  payout_method: 'wechat' | 'alipay';
  payout_account: string;
  payout_name: string;
  status: 'pending_review' | 'approved' | 'paid' | 'rejected';
  note?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  paid_at?: string | null;
  payment_reference?: string | null;
  created_at: string;
  updated_at: string;
}

interface ReferralSummary {
  referral: {
    totalRecords: number;
    totalReferrers: number;
    totalReferees: number;
    paidRecords: number;
    totalRewardDiamonds: number;
    pendingRewardDiamonds: number;
    settledRewardDiamonds: number;
    completedRewardDiamonds: number;
    totalRewardPoints: number;
    totalRewardAmount: number;
    pendingRewardAmount: number;
    settledRewardAmount: number;
    completedRewardAmount: number;
  };
  diamonds: {
    availableDiamonds: number;
    pendingDiamonds: number;
    frozenDiamonds: number;
    totalEarnedDiamonds: number;
    totalWithdrawnDiamonds: number;
    availableAmount: number;
    pendingAmount: number;
    frozenAmount: number;
    totalEarnedAmount: number;
    totalWithdrawnAmount: number;
  };
  withdrawals: {
    totalRequests: number;
    pendingReviewCount: number;
    approvedCount: number;
    paidCount: number;
    rejectedCount: number;
    pendingReviewAmount: number;
    approvedAmount: number;
    paidAmount: number;
    paidTaxAmount: number;
    paidNetAmount: number;
  };
}

interface Duration {
  user_id: string;
  username: string;
  nickname?: string;
  phone?: string;
  total_duration: number;
  remaining_duration: number;
  total_hours: number;
  remaining_hours: number;
  is_active: number | boolean;
  is_permanent: number | boolean;
  activated_at?: string | null;
  expires_at?: string | null;
  created_at: string;
}

interface Order {
  id: string;
  source_table?: 'orders' | 'recharge_orders';
  order_no: string;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  package_id?: number | null;
  package_name?: string;
  product_name?: string;
  order_kind?: 'recharge' | 'duration';
  points: number;
  bonus_points?: number;
  amount: number;
  duration?: number | null;
  duration_unit?: string | null;
  pay_method: string;
  status: string;
  paid_at?: string | null;
  provider_transaction_id?: string | null;
  provider_status?: string | null;
  payment_scene?: string | null;
  created_at: string;
}

interface ExchangeRecord {
  id: number;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  points: number;
  type: string;
  description?: string;
  created_at: string;
}

export type ExperienceCodePlanKey = 'points_75_day_1' | 'points_150_day_7';

export type ExperienceCodeStatus = 'unused' | 'activated' | 'expired' | 'revoked';

export interface ExperienceCodeItem {
  id: number;
  code: string;
  batch_no: string;
  batch_name?: string;
  plan_key: ExperienceCodePlanKey;
  points: number;
  duration_days: number;
  validity_days: number;
  status: ExperienceCodeStatus;
  bound_user_id?: string | null;
  bound_username?: string | null;
  bound_nickname?: string | null;
  created_at: string;
  expired_at: string;
  redeemed_at?: string | null;
  activated_at?: string | null;
  note?: string | null;
}

export interface ExperienceCodeGenerateInput {
  batch_name: string;
  plan_key: ExperienceCodePlanKey;
  quantity: number;
  points: number;
  duration_days: number;
  validity_days: number;
  prefix?: string;
  note?: string;
}

export interface ExperienceCodeListParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: ExperienceCodeStatus | 'all';
  plan_key?: ExperienceCodePlanKey | 'all';
  batch_no?: string;
}

const apiClient = {
  auth: {
    login: (data: { username: string; password: string }) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    profile: () => api.get('/auth/profile'),
  },
  users: {
    list: (params?: { page?: number; pageSize?: number; keyword?: string }) => api.get('/users', { params }),
    create: (data: Partial<User> & { password?: string; wechat_openid?: string; is_admin?: boolean | number; must_bind_contact?: boolean | number }) => api.post('/users', data),
    update: (id: string, data: Partial<User> & { password?: string; wechat_openid?: string; is_admin?: boolean | number; must_bind_contact?: boolean | number }) => api.put(`/users/${id}`, data),
    delete: (id: string) => api.delete(`/users/${id}`),
  },
  packages: {
    list: () => api.get('/packages'),
    create: (data: Partial<Package>) => api.post('/packages', data),
    update: (id: string, data: Partial<Package>) => api.put(`/packages/${id}`, data),
    delete: (id: string) => api.delete(`/packages/${id}`),
  },
  exchangeProducts: {
    list: () => api.get('/exchange-products'),
    create: (data: Partial<ExchangeProduct>) => api.post('/exchange-products', data),
    update: (id: string, data: Partial<ExchangeProduct>) => api.put(`/exchange-products/${id}`, data),
    delete: (id: string) => api.delete(`/exchange-products/${id}`),
  },
  referrals: {
    summary: () => api.get('/referrals/summary'),
    list: (params?: { page?: number; pageSize?: number }) => api.get('/referrals', { params }),
    settings: () => api.get('/referral-settings'),
    updateSettings: (data: Partial<ReferralSettings>) => api.put('/referral-settings', data),
    leaderboard: (params?: { month?: string }) => api.get('/referrals/leaderboard', { params }),
    withdrawals: (params?: { page?: number; pageSize?: number; status?: string }) =>
      api.get('/referrals/withdrawals', { params }),
    reviewWithdrawal: (
      id: string,
      data: { action: 'approve' | 'reject' | 'mark_paid'; note?: string; paymentReference?: string }
    ) => api.post(`/referrals/withdrawals/${id}/review`, data),
  },
  durations: {
    list: (params?: { page?: number; pageSize?: number; keyword?: string }) => api.get('/durations', { params }),
    create: (data: Partial<Duration>) => api.post('/durations', data),
    update: (userId: string, data: Partial<Duration>) => api.put(`/durations/${userId}`, data),
    delete: (userId: string) => api.delete(`/durations/${userId}`),
  },
  exchangeRecords: {
    list: (params?: { page?: number; pageSize?: number; keyword?: string }) => api.get('/exchange-records', { params }),
    create: (data: Partial<ExchangeRecord>) => api.post('/exchange-records', data),
    update: (id: string, data: Partial<ExchangeRecord>) => api.put(`/exchange-records/${id}`, data),
    delete: (id: string) => api.delete(`/exchange-records/${id}`),
  },
  experienceCodes: {
    list: (params?: ExperienceCodeListParams) => api.get('/experience-codes', { params }),
    exportBatch: (batchNo: string) => api.get('/experience-codes/export', { params: { batch_no: batchNo } }),
    create: (data: ExperienceCodeGenerateInput) => api.post('/experience-codes', data),
    batchCreate: (data: ExperienceCodeGenerateInput) => api.post('/experience-codes/batch', data),
    revoke: (id: string) => api.post(`/experience-codes/${id}/revoke`),
  },
  experienceCodeRecords: {
    list: (params?: ExperienceCodeListParams) => api.get('/experience-code-records', { params }),
  },
  licenseCenter: {
    generateCodes: (data: {
      productId?: string;
      planName?: string;
      durationDays?: number;
      seatLimit?: number;
      deviceLimit?: number;
      quantity?: number;
      prefix?: string;
      note?: string;
      expiresInDays?: number;
      isPermanent?: boolean;
    }) => api.post('/license/admin/license-codes', data),
    userStatus: (productId: string, userId: string) =>
      api.get(`/license/admin/products/${encodeURIComponent(productId)}/status/${encodeURIComponent(userId)}`),
  },
  orders: {
    list: (params?: { page?: number; pageSize?: number; status?: string; orderKind?: string; keyword?: string }) =>
      api.get('/orders', { params }),
    create: (data: Partial<Order> & { source_table?: 'orders' | 'recharge_orders' }) => api.post('/orders', data),
    update: (id: string, data: Partial<Order>) => api.put(`/orders/${id}`, data),
    delete: (id: string) => api.delete(`/orders/${id}`),
    settle: (id: string, data?: Partial<Order>) => api.post(`/orders/${id}/settle`, data || {}),
  },
  payment: {
    create: (data: { orderId: string; method: string }) => api.post('/payment/create', data),
  },
  stats: {
    overview: () => api.get('/stats/overview'),
  },
  checkRecharge: () => api.get('/check-recharge'),
};

export default apiClient;
