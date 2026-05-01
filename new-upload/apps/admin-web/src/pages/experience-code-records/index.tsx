import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { App as AntdApp, Button, Card, Grid, Input, Select, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

type ExperienceCodePlanKey = 'points_75_day_1' | 'points_150_day_7';
type ExperienceCodeStatus = 'unused' | 'activated' | 'expired' | 'revoked';

interface ExperienceCodeRecord {
  id: number;
  code: string;
  batch_no: string;
  batch_name?: string | null;
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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

const PLAN_OPTIONS: Array<{ key: ExperienceCodePlanKey; label: string }> = [
  { key: 'points_75_day_1', label: '75 积分（1 天）' },
  { key: 'points_150_day_7', label: '150 积分（7 天）' },
];

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';
}

function formatPlanLabel(planKey?: ExperienceCodePlanKey, points?: number, durationDays?: number) {
  if (planKey === 'points_75_day_1') return '75 积分（1 天）';
  if (planKey === 'points_150_day_7') return '150 积分（7 天）';
  if (!points && !durationDays) return '-';
  return `${points || 0} 积分（${durationDays || 0} 天）`;
}

function getStatusTag(status?: ExperienceCodeStatus) {
  const colorMap: Record<ExperienceCodeStatus, string> = {
    unused: 'processing',
    activated: 'success',
    expired: 'default',
    revoked: 'error',
  };

  const textMap: Record<ExperienceCodeStatus, string> = {
    unused: '未激活',
    activated: '已激活',
    expired: '已过期',
    revoked: '已作废',
  };

  const value = status || 'unused';
  return <Tag color={colorMap[value]}>{textMap[value]}</Tag>;
}

export default function ExperienceCodeRecords() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [records, setRecords] = useState<ExperienceCodeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | ExperienceCodeStatus>('all');
  const [planKey, setPlanKey] = useState<'all' | ExperienceCodePlanKey>('all');
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });

  useEffect(() => {
    void loadRecords();
  }, [pagination.page, pagination.pageSize, keyword, status, planKey]);

  const summary = useMemo(() => {
    const total = records.length;
    const activated = records.filter((item) => item.status === 'activated').length;
    const expired = records.filter((item) => item.status === 'expired').length;
    const points = records.reduce((sum, item) => sum + Number(item.points || 0), 0);
    return { total, activated, expired, points };
  }, [records]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = (await api.experienceCodeRecords.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword,
        status,
        plan_key: planKey,
      })) as any;

      if (res?.success) {
        const list = Array.isArray(res.data?.list) ? res.data.list : Array.isArray(res.data) ? res.data : [];
        setRecords(list);
        setPagination((current) => ({
          ...current,
          total: res.data?.pagination?.total || list.length || 0,
        }));
      }
    } catch (error) {
      message.error('加载体验码记录失败');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<ExperienceCodeRecord> = [
    {
      title: '码值',
      dataIndex: 'code',
      width: 220,
      render: (value: string) => <span className="admin-mono">{value}</span>,
    },
    {
      title: '批次',
      dataIndex: 'batch_no',
      width: 150,
      render: (value: string, record) => (
        <div className="admin-detail-stack">
          <strong>{record.batch_name || value}</strong>
          <span className="admin-mono">{value}</span>
        </div>
      ),
    },
    {
      title: '面额类型',
      width: 150,
      render: (_, record) => <Tag color="processing">{formatPlanLabel(record.plan_key, record.points, record.duration_days)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 110,
      render: (value: ExperienceCodeStatus) => getStatusTag(value),
    },
    {
      title: '绑定用户',
      width: 190,
      render: (_, record) => (
        <div className="admin-detail-stack">
          <strong>{record.bound_nickname || record.bound_username || '-'}</strong>
          <span>{record.bound_user_id || record.bound_username || '-'}</span>
        </div>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '过期时间',
      dataIndex: 'expired_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '兑换时间',
      dataIndex: 'redeemed_at',
      width: 170,
      responsive: ['lg', 'xl'],
      render: (value?: string) => formatDateTime(value),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Typography.Title level={2} className="admin-page-title">
            体验码兑换积分记录
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里追踪体验码的实际兑换记录、绑定账号和到期状态，便于核对发放效果与用户领取情况。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索码值、批次或绑定用户"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(keywordInput.trim());
            }}
            className="admin-search"
          />
          <Select
            value={status}
            style={{ width: 132 }}
            onChange={(value) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setStatus(value);
            }}
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'unused', label: '未激活' },
              { value: 'activated', label: '已激活' },
              { value: 'expired', label: '已过期' },
              { value: 'revoked', label: '已作废' },
            ]}
          />
          <Select
            value={planKey}
            style={{ width: 168 }}
            onChange={(value) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setPlanKey(value);
            }}
            options={[
              { value: 'all', label: '全部面额' },
              ...PLAN_OPTIONS.map((item) => ({ value: item.key, label: item.label })),
            ]}
          />
          <Button
            onClick={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(keywordInput.trim());
            }}
          >
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadRecords()} loading={loading}>
            刷新
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">记录总数</div>
          <div className="admin-summary-value">{summary.total}</div>
          <div className="admin-summary-help">当前分页内展示 {records.length} 条</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">已激活</div>
          <div className="admin-summary-value">{summary.activated}</div>
          <div className="admin-summary-help">已成功绑定到账户</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">已过期</div>
          <div className="admin-summary-value">{summary.expired}</div>
          <div className="admin-summary-help">超出 7 天未激活的体验码</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">累计积分</div>
          <div className="admin-summary-value">{summary.points}</div>
          <div className="admin-summary-help">按记录面额汇总展示</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        {isMobile ? (
          <div className="admin-mobile-stack">
            {records.map((record) => (
              <div key={record.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div className="admin-detail-stack">
                    <div className="admin-mobile-card-title admin-mono">{record.code}</div>
                    <div className="admin-mobile-card-subtitle">{record.batch_name || record.batch_no}</div>
                  </div>
                  {getStatusTag(record.status)}
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="processing">{formatPlanLabel(record.plan_key, record.points, record.duration_days)}</Tag>
                  <Tag color="default">有效期 {record.validity_days || 7} 天</Tag>
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">绑定用户</span>
                    <span className="admin-mobile-meta-value">{record.bound_nickname || record.bound_username || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">创建时间</span>
                    <span className="admin-mobile-meta-value">{formatDateTime(record.created_at)}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">过期时间</span>
                    <span className="admin-mobile-meta-value">{formatDateTime(record.expired_at)}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">兑换时间</span>
                    <span className="admin-mobile-meta-value">{formatDateTime(record.redeemed_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Suspense fallback={<span className="admin-status-pill">正在加载桌面表格...</span>}>
            <DesktopAdminTable
              columns={columns}
              dataSource={records}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1180 }}
              pagination={{
                current: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条`,
                onChange: (page, pageSize) => setPagination((current) => ({ ...current, page, pageSize })),
              }}
            />
          </Suspense>
        )}
      </Card>
    </div>
  );
}
