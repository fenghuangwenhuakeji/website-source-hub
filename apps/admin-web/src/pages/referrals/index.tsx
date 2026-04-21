import { useEffect, useMemo, useState } from 'react';
import {
  App as AntdApp,
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;

type RewardMode = 'fixed' | 'rate';
type WithdrawalAction = 'approve' | 'reject' | 'mark_paid';

interface ReferralRule {
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  rewardMode: RewardMode;
  rewardValue: number;
  boostEnabled: boolean;
  boostRewardMode?: RewardMode | null;
  boostRewardValue?: number | null;
}

interface ReferralSettings {
  settlementDays: number;
  withdrawThresholdDiamonds: number;
  diamondToPointsRate: number;
  recruitBoostPaidUsers: number;
  withdrawThresholdAmount: number;
  withdrawalNotice: string;
  commissionRules: ReferralRule[];
}

interface ReferralRecord {
  id: number;
  referrer_name?: string;
  referee_name?: string;
  referee_type: string;
  reward_type: string;
  reward_amount: number;
  reward_amount_display?: number;
  reward_status: string;
  order_id?: string | null;
  gross_order_amount?: number | null;
  available_at?: string | null;
  settled_at?: string | null;
  metadata?: string | null;
  created_at: string;
}

interface LeaderboardItem {
  referrer_id: string;
  referrer_name: string;
  invite_count: number;
}

interface WithdrawalRecord {
  id: string;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  diamonds: number;
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  payout_method: 'wechat' | 'alipay';
  payout_account: string;
  payout_name: string;
  status: 'pending_review' | 'approved' | 'paid' | 'rejected';
  note?: string | null;
  payment_reference?: string | null;
  created_at: string;
  reviewed_at?: string | null;
  paid_at?: string | null;
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

const defaultSettings: ReferralSettings = {
  settlementDays: 3,
  withdrawThresholdDiamonds: 10000,
  diamondToPointsRate: 1,
  recruitBoostPaidUsers: 5,
  withdrawThresholdAmount: 100,
  withdrawalNotice:
    '钻石按 T+3 结算，可用钻石满 100 元对应额度后才可申请提现。提现会按劳务报酬预扣预缴规则试算税费，后台人工审核并手工打款。',
  commissionRules: [
    {
      code: 'trial-8h',
      name: '8小时卡',
      minAmount: 0,
      maxAmount: 9.9,
      rewardMode: 'fixed',
      rewardValue: 0,
      boostEnabled: true,
      boostRewardMode: 'rate',
      boostRewardValue: 0.5,
    },
    {
      code: 'daily-1d',
      name: '日卡',
      minAmount: 14.9,
      maxAmount: 14.9,
      rewardMode: 'fixed',
      rewardValue: 0.2,
      boostEnabled: true,
      boostRewardMode: 'rate',
      boostRewardValue: 0.5,
    },
    {
      code: 'weekly-7d',
      name: '周卡',
      minAmount: 29.9,
      maxAmount: 29.9,
      rewardMode: 'fixed',
      rewardValue: 0.4,
      boostEnabled: true,
      boostRewardMode: 'rate',
      boostRewardValue: 0.5,
    },
    {
      code: 'monthly-plus',
      name: '月卡及以上',
      minAmount: 79.9,
      maxAmount: null,
      rewardMode: 'rate',
      rewardValue: 0.5,
      boostEnabled: false,
      boostRewardMode: null,
      boostRewardValue: null,
    },
  ],
};

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

function formatRate(value: number) {
  return `${(toNumber(value) * 100).toFixed(0)}%`;
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const next = new Date(value);
  return Number.isNaN(next.getTime()) ? '-' : next.toLocaleString('zh-CN', { hour12: false });
}

function maskAccount(value?: string | null) {
  const raw = String(value || '').trim();
  if (!raw) return '-';
  return raw.length <= 6 ? raw : `${raw.slice(0, 3)}****${raw.slice(-3)}`;
}

function formatReward(mode: RewardMode, value: number) {
  return mode === 'rate' ? formatRate(value) : formatMoney(value);
}

function getRewardStatusTag(status: string) {
  if (status === 'settled') return <Tag color="green">已结算</Tag>;
  if (status === 'pending') return <Tag color="gold">待结算</Tag>;
  return <Tag color="default">已完成</Tag>;
}

function getWithdrawalStatusTag(status: WithdrawalRecord['status']) {
  if (status === 'paid') return <Tag color="green">已打款</Tag>;
  if (status === 'approved') return <Tag color="blue">待打款</Tag>;
  if (status === 'rejected') return <Tag color="red">已驳回</Tag>;
  return <Tag color="gold">待审核</Tag>;
}

function extractMetadataName(raw?: string | null) {
  if (!raw) return '-';
  try {
    const parsed = JSON.parse(raw) as { productName?: string; ruleName?: string };
    return parsed.productName || parsed.ruleName || '-';
  } catch {
    return '-';
  }
}

export default function Referrals() {
  const { message } = AntdApp.useApp();
  const [settingsForm] = Form.useForm<ReferralSettings>();
  const [reviewForm] = Form.useForm<{ note?: string; paymentReference?: string }>();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [summary, setSummary] = useState<ReferralSummary | null>(null);
  const [settings, setSettings] = useState<ReferralSettings>(defaultSettings);
  const [records, setRecords] = useState<ReferralRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [withdrawalPagination, setWithdrawalPagination] = useState({ page: 1, pageSize: 10, total: 0 });
  const [withdrawalStatus, setWithdrawalStatus] = useState<string>('all');
  const [reviewTarget, setReviewTarget] = useState<WithdrawalRecord | null>(null);
  const [reviewAction, setReviewAction] = useState<WithdrawalAction>('approve');

  useEffect(() => {
    void loadAll();
  }, [pagination.page, pagination.pageSize, withdrawalPagination.page, withdrawalPagination.pageSize, withdrawalStatus]);

  const settingsDigest = useMemo(() => {
    return {
      thresholdAmount: toNumber(settings.withdrawThresholdAmount, 100),
      settlementDays: toNumber(settings.settlementDays, 3),
      convertRate: toNumber(settings.diamondToPointsRate, 1),
      boostUsers: toNumber(settings.recruitBoostPaidUsers, 5),
    };
  }, [settings]);

  async function loadAll() {
    setLoading(true);
    try {
      const [summaryRes, recordsRes, settingsRes, leaderboardRes, withdrawalsRes] = await Promise.all([
        api.referrals.summary() as Promise<any>,
        api.referrals.list({ page: pagination.page, pageSize: pagination.pageSize }) as Promise<any>,
        api.referrals.settings() as Promise<any>,
        api.referrals.leaderboard() as Promise<any>,
        api.referrals.withdrawals({
          page: withdrawalPagination.page,
          pageSize: withdrawalPagination.pageSize,
          status: withdrawalStatus === 'all' ? undefined : withdrawalStatus,
        }) as Promise<any>,
      ]);

      if (summaryRes?.success) {
        setSummary(summaryRes.data || null);
      }

      if (recordsRes?.success) {
        setRecords(recordsRes.data?.list || []);
        setPagination((prev) => ({
          ...prev,
          total: toNumber(recordsRes.data?.pagination?.total),
        }));
      }

      if (settingsRes?.success && settingsRes.data) {
        const nextSettings: ReferralSettings = {
          ...defaultSettings,
          ...settingsRes.data,
          withdrawThresholdAmount: Number(
            (toNumber(settingsRes.data.withdrawThresholdDiamonds, defaultSettings.withdrawThresholdDiamonds) / 100).toFixed(2),
          ),
          commissionRules:
            Array.isArray(settingsRes.data.commissionRules) && settingsRes.data.commissionRules.length > 0
              ? settingsRes.data.commissionRules
              : defaultSettings.commissionRules,
        };

        setSettings(nextSettings);
        settingsForm.setFieldsValue(nextSettings);
      }

      if (leaderboardRes?.success) {
        setLeaderboard(leaderboardRes.data?.list || []);
      }

      if (withdrawalsRes?.success) {
        setWithdrawals(withdrawalsRes.data?.list || []);
        setWithdrawalPagination((prev) => ({
          ...prev,
          total: toNumber(withdrawalsRes.data?.pagination?.total),
        }));
      }
    } catch (error) {
      console.error('Failed to load referral dashboard:', error);
      message.error('钻石邀请数据加载失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const values = await settingsForm.validateFields();
      setSaving(true);

      const payload = {
        settlementDays: Math.max(1, Math.floor(toNumber(values.settlementDays, 3))),
        withdrawThresholdDiamonds: Math.max(1, Math.round(toNumber(values.withdrawThresholdAmount, 100) * 100)),
        diamondToPointsRate: Math.max(1, Math.floor(toNumber(values.diamondToPointsRate, 1))),
        recruitBoostPaidUsers: Math.max(1, Math.floor(toNumber(values.recruitBoostPaidUsers, 5))),
        withdrawalNotice: String(values.withdrawalNotice || '').trim(),
        commissionRules: (values.commissionRules || []).map((item: ReferralRule) => ({
          code: String(item.code || '').trim(),
          name: String(item.name || '').trim(),
          minAmount: Number(toNumber(item.minAmount)),
          maxAmount:
            item.maxAmount === null || item.maxAmount === undefined || item.maxAmount === ''
              ? null
              : Number(toNumber(item.maxAmount)),
          rewardMode: item.rewardMode === 'rate' ? 'rate' : 'fixed',
          rewardValue: Number(toNumber(item.rewardValue)),
          boostEnabled: Boolean(item.boostEnabled),
          boostRewardMode: item.boostEnabled ? (item.boostRewardMode === 'fixed' ? 'fixed' : 'rate') : null,
          boostRewardValue: item.boostEnabled ? Number(toNumber(item.boostRewardValue)) : null,
        })),
      };

      if (payload.commissionRules.some((item) => !item.code || !item.name)) {
        throw new Error('每条返佣规则都需要编码和名称。');
      }

      const response = (await api.referrals.updateSettings(payload)) as any;
      if (!response?.success) {
        throw new Error(response?.message || '钻石邀请规则保存失败');
      }

      message.success('钻石邀请规则已保存');
      await loadAll();
    } catch (error: any) {
      console.error('Failed to save referral settings:', error);
      message.error(error?.message || '钻石邀请规则保存失败');
    } finally {
      setSaving(false);
    }
  }

  function openReview(record: WithdrawalRecord, action: WithdrawalAction) {
    setReviewTarget(record);
    setReviewAction(action);
    reviewForm.setFieldsValue({
      note: record.note || '',
      paymentReference: record.payment_reference || '',
    });
  }

  async function handleReview() {
    if (!reviewTarget) return;

    try {
      const values = await reviewForm.validateFields();
      setReviewing(true);
      const response = (await api.referrals.reviewWithdrawal(reviewTarget.id, {
        action: reviewAction,
        note: values.note,
        paymentReference: values.paymentReference,
      })) as any;

      if (!response?.success) {
        throw new Error(response?.message || '提现审核操作失败');
      }

      message.success('提现审核状态已更新');
      setReviewTarget(null);
      reviewForm.resetFields();
      await loadAll();
    } catch (error: any) {
      console.error('Failed to review withdrawal:', error);
      message.error(error?.message || '提现审核操作失败');
    } finally {
      setReviewing(false);
    }
  }

  const recordColumns: ColumnsType<ReferralRecord> = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '邀请人', dataIndex: 'referrer_name', width: 140, render: (value) => value || '-' },
    { title: '被邀请人', dataIndex: 'referee_name', width: 140, render: (value) => value || '-' },
    {
      title: '关系类型',
      dataIndex: 'referee_type',
      width: 120,
      render: (value: string) => (
        <Tag color={value === 'paid' ? 'green' : 'blue'}>
          {value === 'paid' ? '有效付费' : '注册绑定'}
        </Tag>
      ),
    },
    {
      title: '奖励类型',
      dataIndex: 'reward_type',
      width: 120,
      render: (value: string) => (
        <Tag color={value === 'diamond' ? 'purple' : 'gold'}>
          {value === 'diamond' ? '钻石' : value}
        </Tag>
      ),
    },
    {
      title: '奖励值',
      dataIndex: 'reward_amount_display',
      width: 120,
      render: (value: number, record) =>
        record.reward_type === 'diamond'
          ? formatMoney(toNumber(value))
          : toNumber(record.reward_amount).toLocaleString('zh-CN'),
    },
    {
      title: '订单金额',
      dataIndex: 'gross_order_amount',
      width: 120,
      render: (value: number | null | undefined) => (value ? formatMoney(value) : '-'),
    },
    {
      title: '规则/商品',
      dataIndex: 'metadata',
      width: 180,
      ellipsis: true,
      render: (value: string | null | undefined) => extractMetadataName(value),
    },
    {
      title: '状态',
      dataIndex: 'reward_status',
      width: 110,
      render: (value: string) => getRewardStatusTag(value),
    },
    {
      title: '可结算时间',
      dataIndex: 'available_at',
      width: 180,
      render: (value: string | null | undefined) => formatDateTime(value),
    },
    {
      title: '结算时间',
      dataIndex: 'settled_at',
      width: 180,
      render: (value: string | null | undefined) => formatDateTime(value),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
  ];

  const leaderboardColumns: ColumnsType<LeaderboardItem> = [
    { title: '排名', width: 80, render: (_v, _r, index) => index + 1 },
    { title: '邀请人', dataIndex: 'referrer_name', width: 180 },
    { title: '当月邀请人数', dataIndex: 'invite_count', width: 160 },
  ];

  const withdrawalColumns: ColumnsType<WithdrawalRecord> = [
    {
      title: '用户',
      dataIndex: 'username',
      width: 160,
      render: (_value, record) => record.nickname || record.username || record.user_id,
    },
    {
      title: '申请金额',
      dataIndex: 'gross_amount',
      width: 120,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '税额',
      dataIndex: 'tax_amount',
      width: 110,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '实到',
      dataIndex: 'net_amount',
      width: 110,
      render: (value: number) => formatMoney(value),
    },
    {
      title: '提现方式',
      dataIndex: 'payout_method',
      width: 140,
      render: (_value, record) =>
        `${record.payout_method === 'wechat' ? '微信' : '支付宝'} / ${maskAccount(record.payout_account)}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: WithdrawalRecord['status']) => getWithdrawalStatusTag(value),
    },
    {
      title: '申请时间',
      dataIndex: 'created_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 220,
      render: (_value, record) => (
        <Space wrap>
          {record.status === 'pending_review' ? (
            <>
              <Button size="small" type="primary" onClick={() => openReview(record, 'approve')}>
                通过
              </Button>
              <Button size="small" danger onClick={() => openReview(record, 'reject')}>
                驳回
              </Button>
            </>
          ) : null}
          {record.status === 'approved' ? (
            <>
              <Button size="small" type="primary" onClick={() => openReview(record, 'mark_paid')}>
                标记打款
              </Button>
              <Button size="small" danger onClick={() => openReview(record, 'reject')}>
                驳回
              </Button>
            </>
          ) : null}
          {record.status === 'paid' || record.status === 'rejected' ? <Text type="secondary">已完成</Text> : null}
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Alert
        showIcon
        type="info"
        message="钻石邀请机制"
        description="当前后台已经切到钻石返佣口径：直邀用户真实下单后进入待结算钻石，T+3 转可提现，提现申请会先试算税额，再由后台人工审核和手工打款。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="累计钻石返佣" value={summary?.referral.totalRewardAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="当前可提现钻石池" value={summary?.diamonds.availableAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="待结算钻石池" value={summary?.diamonds.pendingAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="待审核提现" value={summary?.withdrawals.pendingReviewAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="有效付费邀请单" value={summary?.referral.paidRecords || 0} />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="已结算钻石" value={summary?.referral.settledRewardAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="已打款提现" value={summary?.withdrawals.paidAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
        <Col xs={24} md={12} xl={6}>
          <Card loading={loading}>
            <Statistic title="累计代扣税额" value={summary?.withdrawals.paidTaxAmount || 0} precision={2} prefix="¥" />
          </Card>
        </Col>
      </Row>

      <Card
        title="钻石返佣规则"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void loadAll()}>
              刷新
            </Button>
            <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={() => void handleSave()}>
              保存规则
            </Button>
          </Space>
        }
      >
        <Form form={settingsForm} layout="vertical" initialValues={settings}>
          <Row gutter={16}>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="结算周期（天）" name="settlementDays" rules={[{ required: true }]}>
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="提现门槛（元）" name="withdrawThresholdAmount" rules={[{ required: true }]}>
                <InputNumber min={0.01} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="钻石转积分比例" name="diamondToPointsRate" rules={[{ required: true }]}>
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label="招募加成人数门槛" name="recruitBoostPaidUsers" rules={[{ required: true }]}>
                <InputNumber min={1} precision={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Alert
            showIcon
            type="warning"
            style={{ marginBottom: 16 }}
            message="当前规则摘要"
            description={`T+${settingsDigest.settlementDays} 结算，提现门槛 ${formatMoney(
              settingsDigest.thresholdAmount,
            )}，钻石转积分比例 1:${settingsDigest.convertRate}，直邀有效付费满 ${settingsDigest.boostUsers} 人后启用对应规则的加成。`}
          />

          <Form.Item label="提现说明" name="withdrawalNotice">
            <Input.TextArea rows={4} placeholder="这里写给用户看的提现规则说明" />
          </Form.Item>

          <Title level={5} style={{ marginTop: 8 }}>
            分档返佣规则
          </Title>
          <Form.List name="commissionRules">
            {(fields, operations) => (
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {fields.map((field) => (
                  <Card
                    key={field.key}
                    size="small"
                    title={`规则 ${field.name + 1}`}
                    extra={
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => operations.remove(field.name)}
                      >
                        删除
                      </Button>
                    }
                  >
                    <Row gutter={16}>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="规则编码" name={[field.name, 'code']} rules={[{ required: true, message: '请输入规则编码' }]}>
                          <Input placeholder="monthly-plus" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="规则名称" name={[field.name, 'name']} rules={[{ required: true, message: '请输入规则名称' }]}>
                          <Input placeholder="月卡及以上" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="最小金额（元）" name={[field.name, 'minAmount']} rules={[{ required: true, message: '请输入最小金额' }]}>
                          <InputNumber min={0} precision={2} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="最大金额（元）" name={[field.name, 'maxAmount']}>
                          <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="留空表示不封顶" />
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="基础返佣模式" name={[field.name, 'rewardMode']} rules={[{ required: true }]}>
                          <Select options={[{ label: '固定金额', value: 'fixed' }, { label: '按比例', value: 'rate' }]} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="基础返佣值" name={[field.name, 'rewardValue']} rules={[{ required: true }]}>
                          <InputNumber min={0} precision={4} style={{ width: '100%' }} />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item label="启用招募加成" name={[field.name, 'boostEnabled']} valuePropName="checked">
                          <Switch checkedChildren="启用" unCheckedChildren="关闭" />
                        </Form.Item>
                      </Col>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const boostEnabled = Boolean(getFieldValue(['commissionRules', field.name, 'boostEnabled']));
                            return (
                              <Form.Item label="加成返佣模式" name={[field.name, 'boostRewardMode']}>
                                <Select
                                  disabled={!boostEnabled}
                                  options={[{ label: '固定金额', value: 'fixed' }, { label: '按比例', value: 'rate' }]}
                                />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col xs={24} md={12} xl={6}>
                        <Form.Item shouldUpdate noStyle>
                          {({ getFieldValue }) => {
                            const boostEnabled = Boolean(getFieldValue(['commissionRules', field.name, 'boostEnabled']));
                            return (
                              <Form.Item label="加成返佣值" name={[field.name, 'boostRewardValue']}>
                                <InputNumber min={0} precision={4} disabled={!boostEnabled} style={{ width: '100%' }} />
                              </Form.Item>
                            );
                          }}
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                ))}

                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    operations.add({
                      code: '',
                      name: '',
                      minAmount: 0,
                      maxAmount: null,
                      rewardMode: 'fixed',
                      rewardValue: 0,
                      boostEnabled: false,
                      boostRewardMode: 'rate',
                      boostRewardValue: 0,
                    })
                  }
                >
                  新增返佣规则
                </Button>
              </Space>
            )}
          </Form.List>
        </Form>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={9}>
          <Card title="当前规则摘要" loading={loading}>
            <Space direction="vertical" size={8}>
              <Text>T+{settingsDigest.settlementDays} 结算后进入可提现钻石</Text>
              <Text>提现门槛：{formatMoney(settingsDigest.thresholdAmount)}</Text>
              <Text>钻石转积分：1 钻石 = {settingsDigest.convertRate} 积分</Text>
              <Text>招募加成门槛：有效付费满 {settingsDigest.boostUsers} 人</Text>
              <Text type="secondary">返佣以真实支付订单为准，不对注册行为发放可提现资产。</Text>
            </Space>
          </Card>
        </Col>
        <Col xs={24} xl={15}>
          <Card title="月度邀请榜" loading={loading}>
            <Table rowKey="referrer_id" columns={leaderboardColumns} dataSource={leaderboard} size="small" pagination={false} locale={{ emptyText: '本月暂时还没有邀请排行数据' }} />
          </Card>
        </Col>
      </Row>

      <Card title="邀请返佣记录" loading={loading}>
        <Table
          rowKey="id"
          columns={recordColumns}
          dataSource={records}
          scroll={{ x: 1600 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setPagination((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Card
        title="提现审核"
        extra={
          <Select
            value={withdrawalStatus}
            style={{ width: 180 }}
            onChange={(value) => {
              setWithdrawalStatus(value);
              setWithdrawalPagination((prev) => ({ ...prev, page: 1 }));
            }}
            options={[
              { label: '全部状态', value: 'all' },
              { label: '待审核', value: 'pending_review' },
              { label: '待打款', value: 'approved' },
              { label: '已打款', value: 'paid' },
              { label: '已驳回', value: 'rejected' },
            ]}
          />
        }
      >
        <Table
          rowKey="id"
          columns={withdrawalColumns}
          dataSource={withdrawals}
          scroll={{ x: 1400 }}
          locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="当前没有提现申请" /> }}
          pagination={{
            current: withdrawalPagination.page,
            pageSize: withdrawalPagination.pageSize,
            total: withdrawalPagination.total,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条`,
            onChange: (page, pageSize) => setWithdrawalPagination((prev) => ({ ...prev, page, pageSize })),
          }}
        />
      </Card>

      <Modal
        title={reviewAction === 'approve' ? '通过提现申请' : reviewAction === 'reject' ? '驳回提现申请' : '确认已打款'}
        open={Boolean(reviewTarget)}
        onCancel={() => {
          setReviewTarget(null);
          reviewForm.resetFields();
        }}
        onOk={() => void handleReview()}
        confirmLoading={reviewing}
        okText={reviewAction === 'approve' ? '确认通过' : reviewAction === 'reject' ? '确认驳回' : '确认已打款'}
      >
        {reviewTarget ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              showIcon
              type={reviewAction === 'reject' ? 'warning' : 'info'}
              message={`${reviewTarget.nickname || reviewTarget.username || reviewTarget.user_id} / ${formatMoney(reviewTarget.gross_amount)}`}
              description={`税额 ${formatMoney(reviewTarget.tax_amount)}，实到 ${formatMoney(reviewTarget.net_amount)}，提现方式 ${reviewTarget.payout_method === 'wechat' ? '微信' : '支付宝'} / ${maskAccount(reviewTarget.payout_account)}`}
            />
            <Form form={reviewForm} layout="vertical">
              <Form.Item label="审核备注" name="note">
                <Input.TextArea rows={3} placeholder="这里填写审核原因、补充说明或风控备注" />
              </Form.Item>
              {reviewAction === 'mark_paid' ? (
                <Form.Item label="打款流水号" name="paymentReference">
                  <Input placeholder="可填写微信/支付宝打款单号" />
                </Form.Item>
              ) : null}
            </Form>
          </Space>
        ) : null}
      </Modal>
    </Space>
  );
}
