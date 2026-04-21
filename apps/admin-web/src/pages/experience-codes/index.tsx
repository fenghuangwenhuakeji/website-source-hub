import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, DownloadOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

type ExperienceCodePlanKey = 'points_75_day_1' | 'points_150_day_7';
type ExperienceCodeStatus = 'unused' | 'activated' | 'expired' | 'revoked';

interface ExperienceCodeItem {
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

interface GenerateFormValues {
  batch_name: string;
  plan_key: ExperienceCodePlanKey;
  quantity: number;
  prefix?: string;
  note?: string;
}

const PLAN_OPTIONS: Array<{
  key: ExperienceCodePlanKey;
  label: string;
  points: number;
  durationDays: number;
  helper: string;
}> = [
  { key: 'points_75_day_1', label: '75 积分（1天）', points: 75, durationDays: 1, helper: '适合单日体验' },
  { key: 'points_150_day_7', label: '150 积分（7天）', points: 150, durationDays: 7, helper: '适合一周体验' },
];

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : '-';
}

function formatPlanLabel(planKey?: ExperienceCodePlanKey, points?: number, durationDays?: number) {
  if (planKey === 'points_75_day_1') return '75 积分（1天）';
  if (planKey === 'points_150_day_7') return '150 积分（7天）';
  if (!points && !durationDays) return '-';
  return `${points || 0} 积分（${durationDays || 0}天）`;
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

function normalizeGeneratedCodes(raw: any): string[] {
  const source = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.codes)
      ? raw.codes
      : Array.isArray(raw?.list)
        ? raw.list
        : [];

  return source
    .map((item: any) => {
      if (typeof item === 'string') return item;
      return item?.code || item?.value || item?.experience_code || '';
    })
    .filter(Boolean);
}

function buildBatchExportText(payload: any) {
  const list = Array.isArray(payload?.list) ? payload.list : [];
  const lines = [
    '体验码批次导出',
    `批次名称：${payload?.batch_name || payload?.batch_no || '-'}`,
    `批次编号：${payload?.batch_no || '-'}`,
    `导出时间：${formatDateTime(payload?.exported_at || new Date().toISOString())}`,
    `总数量：${list.length}`,
    '',
    '明细列表',
    ...list.map((item: any, index: number) => {
      const userLabel = item?.bound_nickname || item?.bound_username || item?.bound_user_id || '-';
      return [
        `${index + 1}. 兑换码：${item?.code || '-'}`,
        `   面额：${formatPlanLabel(item?.plan_key, item?.points, item?.duration_days)}`,
        `   状态：${item?.status || 'unused'}`,
        `   绑定用户：${userLabel}`,
        `   创建时间：${formatDateTime(item?.created_at)}`,
        `   过期时间：${formatDateTime(item?.expired_at)}`,
        `   激活时间：${formatDateTime(item?.activated_at || item?.redeemed_at)}`,
        `   备注：${item?.note || '-'}`,
      ].join('\n');
    }),
  ];

  return lines.join('\n');
}

function triggerTextDownload(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename || 'experience-codes.txt';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
}

export default function ExperienceCodes() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;

  const [records, setRecords] = useState<ExperienceCodeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generatedBatchNo, setGeneratedBatchNo] = useState('');
  const [generatedBatchName, setGeneratedBatchName] = useState('');
  const [exportingBatchNo, setExportingBatchNo] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | ExperienceCodeStatus>('all');
  const [planKey, setPlanKey] = useState<'all' | ExperienceCodePlanKey>('all');
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm<GenerateFormValues>();

  useEffect(() => {
    void loadRecords();
  }, [pagination.page, pagination.pageSize, keyword, status, planKey]);

  const summary = useMemo(() => {
    const total = records.length;
    const available = records.filter((item) => item.status === 'unused').length;
    const activated = records.filter((item) => item.status === 'activated').length;
    const expired = records.filter((item) => item.status === 'expired').length;
    return { total, available, activated, expired };
  }, [records]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = (await api.experienceCodes.list({
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
      message.error('加载体验码列表失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    form.resetFields();
    form.setFieldsValue({
      batch_name: '',
      plan_key: 'points_75_day_1',
      quantity: 1,
      prefix: '',
      note: '',
    });
    setModalVisible(true);
  };

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleExportBatch = async (batchNo?: string | null, batchName?: string | null) => {
    if (!batchNo) {
      message.error('当前批次编号缺失，无法导出');
      return;
    }

    try {
      setExportingBatchNo(batchNo);
      const res = (await api.experienceCodes.exportBatch(batchNo)) as any;
      if (!res?.success) {
        message.error(res?.message || '导出批次失败');
        return;
      }

      const payload = res.data || {};
      const filename = payload.filename || `${batchName || batchNo}.txt`;
      triggerTextDownload(filename, buildBatchExportText(payload));
      message.success(`批次 ${batchName || batchNo} 已导出为 txt`);
    } catch (error) {
      message.error('导出批次失败');
    } finally {
      setExportingBatchNo('');
    }
  };

  const handleGenerate = async () => {
    try {
      const values = await form.validateFields();
      const plan = PLAN_OPTIONS.find((item) => item.key === values.plan_key) || PLAN_OPTIONS[0];
      const payload = {
        batch_name: values.batch_name.trim(),
        plan_key: values.plan_key,
        quantity: Math.max(1, Number(values.quantity || 1)),
        points: plan.points,
        duration_days: plan.durationDays,
        validity_days: 7,
        prefix: values.prefix?.trim() || undefined,
        note: values.note?.trim() || undefined,
      };

      setGenerating(true);
      const request = payload.quantity > 1 ? api.experienceCodes.batchCreate(payload) : api.experienceCodes.create(payload);
      const res = (await request) as any;

      if (res?.success) {
        const codes = normalizeGeneratedCodes(res.data);
        setGeneratedCodes(codes);
        setGeneratedBatchNo(String(res.data?.batch_no || ''));
        setGeneratedBatchName(String(res.data?.batch_name || ''));
        setModalVisible(false);
        setResultVisible(true);
        message.success(codes.length > 1 ? `已生成 ${codes.length} 个体验码` : '体验码已生成');
        await loadRecords();
        return;
      }

      message.error(res?.message || '生成体验码失败');
    } catch (error) {
      message.error('生成体验码失败');
    } finally {
      setGenerating(false);
    }
  };

  const columns: ColumnsType<ExperienceCodeItem> = [
    {
      title: '兑换码',
      dataIndex: 'code',
      width: 220,
      render: (value: string) => (
        <Space size={8}>
          <span className="admin-mono">{value}</span>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => void handleCopy(value)}>
            复制
          </Button>
        </Space>
      ),
    },
    {
      title: '批次',
      dataIndex: 'batch_no',
      width: 180,
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
    {
      title: '操作',
      width: 220,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap>
          <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => void handleCopy(record.code)}>
            复制
          </Button>
          <Button
            type="link"
            size="small"
            icon={<DownloadOutlined />}
            loading={exportingBatchNo === record.batch_no}
            onClick={() => void handleExportBatch(record.batch_no, record.batch_name)}
          >
            导出本批次
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Typography.Title level={2} className="admin-page-title">
            体验码管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里只管理后台生成的积分体验码。当前开放两档：75 积分（1天）和 150 积分（7天），统一 7 天有效，
            且单个账号永久只能激活一次。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索兑换码、批次或绑定用户"
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
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            生成体验码
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">体验码总数</div>
          <div className="admin-summary-value">{summary.total}</div>
          <div className="admin-summary-help">当前分页内展示 {records.length} 条</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">可用码</div>
          <div className="admin-summary-value">{summary.available}</div>
          <div className="admin-summary-help">尚未被任何账号激活</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">已激活</div>
          <div className="admin-summary-value">{summary.activated}</div>
          <div className="admin-summary-help">已经成功发放到账号</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">已过期</div>
          <div className="admin-summary-value">{summary.expired}</div>
          <div className="admin-summary-help">超过 7 天未激活的体验码</div>
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
                <div className="admin-mobile-actions">
                  <Button size="small" icon={<CopyOutlined />} onClick={() => void handleCopy(record.code)}>
                    复制
                  </Button>
                  <Button
                    size="small"
                    icon={<DownloadOutlined />}
                    loading={exportingBatchNo === record.batch_no}
                    onClick={() => void handleExportBatch(record.batch_no, record.batch_name)}
                  >
                    导出本批次
                  </Button>
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
              scroll={{ x: 1420 }}
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

      <Modal
        title="生成体验码"
        open={modalVisible}
        onOk={() => void handleGenerate()}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 620}
        confirmLoading={generating}
        okText="开始生成"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="batch_name" label="批次名称" rules={[{ required: true, message: '请输入批次名称' }]}>
            <Input placeholder="例如：2026 年 4 月体验码" />
          </Form.Item>
          <Form.Item name="plan_key" label="面额类型" rules={[{ required: true, message: '请选择面额类型' }]}>
            <Select
              options={PLAN_OPTIONS.map((item) => ({
                value: item.key,
                label: item.label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="quantity"
            label="生成数量"
            rules={[{ required: true, message: '请输入生成数量' }]}
            extra="填 1 表示单个生成，填大于 1 的数字表示批量生成。"
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="prefix" label="码前缀" extra="可选，用于区分渠道或批次。">
            <Input placeholder="例如：FH26" maxLength={16} />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input.TextArea rows={3} placeholder="可填写发放说明、渠道来源等信息" />
          </Form.Item>
        </Form>
        <Tag color="gold">统一有效期 7 天</Tag>
        <Tag color="processing" style={{ marginInlineStart: 8 }}>
          同一账号永久只能激活一次
        </Tag>
      </Modal>

      <Modal
        title="生成结果"
        open={resultVisible}
        onCancel={() => setResultVisible(false)}
        footer={[
          <Button key="close" onClick={() => setResultVisible(false)}>
            关闭
          </Button>,
          <Button
            key="export"
            icon={<DownloadOutlined />}
            disabled={!generatedBatchNo}
            loading={exportingBatchNo === generatedBatchNo}
            onClick={() => void handleExportBatch(generatedBatchNo, generatedBatchName)}
          >
            导出本批次
          </Button>,
          <Button
            key="copy"
            type="primary"
            disabled={generatedCodes.length === 0}
            onClick={() => void handleCopy(generatedCodes.join('\n'))}
          >
            复制全部
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            已生成 {generatedCodes.length} 个体验码。你可以直接复制发给用户，也可以导出整个批次为 txt。
          </Typography.Paragraph>
          <div style={{ maxHeight: 360, overflow: 'auto', display: 'grid', gap: 8 }}>
            {generatedCodes.length > 0 ? (
              generatedCodes.map((code) => (
                <Card key={code} size="small" style={{ borderRadius: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                    <span className="admin-mono">{code}</span>
                    <Button type="link" size="small" icon={<CopyOutlined />} onClick={() => void handleCopy(code)}>
                      复制
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <Typography.Text type="secondary">接口返回成功后，这里会展示本批次的全部兑换码。</Typography.Text>
            )}
          </div>
        </Space>
      </Modal>
    </div>
  );
}
