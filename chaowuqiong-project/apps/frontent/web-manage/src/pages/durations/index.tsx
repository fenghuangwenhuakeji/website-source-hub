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
  Popconfirm,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

interface DurationRecord {
  user_id: string;
  username?: string;
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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export default function Durations() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [durations, setDurations] = useState<DurationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DurationRecord | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    void loadDurations();
  }, [pagination.page, pagination.pageSize, keyword]);

  const summary = useMemo(() => {
    const totalRemaining = durations.reduce((sum, item) => sum + Number(item.remaining_hours || 0), 0);
    const activeCount = durations.filter((item) => Boolean(item.is_active)).length;
    const permanentCount = durations.filter((item) => Boolean(item.is_permanent)).length;
    return { totalRemaining, activeCount, permanentCount };
  }, [durations]);

  const loadDurations = async () => {
    setLoading(true);
    try {
      const res = (await api.durations.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword,
      })) as any;
      if (res?.success) {
        setDurations(res.data?.list || []);
        setPagination((current) => ({
          ...current,
          total: res.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('加载时长记录失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      total_hours: 8,
      remaining_hours: 8,
      is_active: true,
      is_permanent: false,
      activated_at: '',
      expires_at: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (record: DurationRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      user_id: record.user_id,
      total_hours: Number(record.total_hours || 0),
      remaining_hours: Number(record.remaining_hours || 0),
      is_active: Boolean(record.is_active),
      is_permanent: Boolean(record.is_permanent),
      activated_at: record.activated_at ? String(record.activated_at).slice(0, 16) : '',
      expires_at: record.expires_at ? String(record.expires_at).slice(0, 16) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: DurationRecord) => {
    try {
      const res = (await api.durations.delete(String(record.user_id))) as any;
      if (res?.success) {
        message.success('时长记录已删除');
        void loadDurations();
      }
    } catch (error) {
      message.error('删除时长记录失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        user_id: values.user_id,
        total_hours: Number(values.total_hours || 0),
        remaining_hours: Number(values.remaining_hours || 0),
        is_active: Boolean(values.is_active),
        is_permanent: Boolean(values.is_permanent),
        activated_at: values.activated_at || undefined,
        expires_at: values.is_permanent ? undefined : values.expires_at || undefined,
      };

      if (editingRecord) {
        const res = (await api.durations.update(String(editingRecord.user_id), payload)) as any;
        if (res?.success) {
          message.success('时长记录已更新');
          setModalVisible(false);
          void loadDurations();
        }
      } else {
        const res = (await api.durations.create(payload)) as any;
        if (res?.success) {
          message.success('时长记录已创建');
          setModalVisible(false);
          void loadDurations();
        }
      }
    } catch (error) {
      message.error('保存时长记录失败');
    }
  };

  const columns: ColumnsType<DurationRecord> = [
    {
      title: '用户',
      key: 'user',
      width: 180,
      render: (_, record) => (
        <div className="admin-detail-stack">
          <strong>{record.nickname || record.username || record.user_id}</strong>
          <span>{record.username || record.phone || record.user_id}</span>
        </div>
      ),
    },
    {
      title: '总时长',
      dataIndex: 'total_hours',
      width: 110,
      render: (value: number) => <Tag color="blue">{Number(value || 0)} 小时</Tag>,
    },
    {
      title: '剩余时长',
      dataIndex: 'remaining_hours',
      width: 110,
      render: (value: number) => <Tag color="processing">{Number(value || 0)} 小时</Tag>,
    },
    {
      title: '状态',
      key: 'status',
      width: 180,
      render: (_, record) => (
        <Space size={4} wrap>
          <Tag color={record.is_active ? 'success' : 'default'}>{record.is_active ? '启用中' : '未启用'}</Tag>
          {record.is_permanent ? <Tag color="gold">永久</Tag> : null}
        </Space>
      ),
    },
    {
      title: '到期时间',
      dataIndex: 'expires_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
      render: (_: string | null | undefined, record) =>
        record.is_permanent ? '永久' : record.expires_at ? new Date(record.expires_at).toLocaleString('zh-CN') : '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      responsive: ['lg', 'xl'],
      render: (value: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-'),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm title="确认删除这条时长记录？" onConfirm={() => void handleDelete(record)}>
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Typography.Title level={2} className="admin-page-title">
            时长管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里直接维护用户的总时长、剩余时长、永久状态与到期时间，用来补改兑换后的真实可用时长。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索用户ID、用户名或手机号"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
            onPressEnter={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(keywordInput.trim());
            }}
            className="admin-search"
          />
          <Button
            onClick={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(keywordInput.trim());
            }}
          >
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadDurations()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增时长
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页记录</div>
          <div className="admin-summary-value">{durations.length}</div>
          <div className="admin-summary-help">总计 {pagination.total} 条</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">剩余总时长</div>
          <div className="admin-summary-value">{summary.totalRemaining}</div>
          <div className="admin-summary-help">当前页剩余小时合计</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">启用中</div>
          <div className="admin-summary-value">{summary.activeCount}</div>
          <div className="admin-summary-help">当前页已启用用户</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">永久时长</div>
          <div className="admin-summary-value">{summary.permanentCount}</div>
          <div className="admin-summary-help">当前页永久用户数</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        {isMobile ? (
          <div className="admin-mobile-stack">
            {durations.map((record) => (
              <div key={record.user_id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{record.nickname || record.username || record.user_id}</div>
                    <div className="admin-mobile-card-subtitle admin-mono">{record.user_id}</div>
                  </div>
                  <Tag color="processing">{Number(record.remaining_hours || 0)} 小时</Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color={record.is_active ? 'success' : 'default'}>{record.is_active ? '启用中' : '未启用'}</Tag>
                  {record.is_permanent ? <Tag color="gold">永久</Tag> : null}
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">总时长</span>
                    <span className="admin-mobile-meta-value">{Number(record.total_hours || 0)} 小时</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">到期时间</span>
                    <span className="admin-mobile-meta-value">
                      {record.is_permanent ? '永久' : record.expires_at ? new Date(record.expires_at).toLocaleString('zh-CN') : '-'}
                    </span>
                  </div>
                </div>
                <div className="admin-mobile-actions">
                  <Button size="small" onClick={() => openEditModal(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确认删除这条时长记录？" onConfirm={() => void handleDelete(record)}>
                    <Button size="small" danger>
                      删除
                    </Button>
                  </Popconfirm>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Suspense fallback={<span className="admin-status-pill">正在加载桌面表格…</span>}>
            <DesktopAdminTable
              columns={columns}
              dataSource={durations}
              rowKey="user_id"
              loading={loading}
              scroll={{ x: 1120 }}
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
        title={editingRecord ? '编辑时长记录' : '新增时长记录'}
        open={modalVisible}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
            <Input placeholder="用户ID" disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="total_hours" label="总时长（小时）" rules={[{ required: true, message: '请输入总时长' }]} style={{ width: 180 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item
              name="remaining_hours"
              label="剩余时长（小时）"
              rules={[{ required: true, message: '请输入剩余时长' }]}
              style={{ width: 180 }}
            >
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="is_active" label="启用中" valuePropName="checked" style={{ width: 120 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="is_permanent" label="永久时长" valuePropName="checked" style={{ width: 120 }}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="activated_at" label="激活时间">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) =>
              getFieldValue('is_permanent') ? null : (
                <Form.Item name="expires_at" label="到期时间">
                  <Input type="datetime-local" />
                </Form.Item>
              )
            }
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
