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
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

interface ExchangeRecord {
  id: number;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  points: number;
  description?: string;
  created_at: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

export default function ExchangeRecords() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [records, setRecords] = useState<ExchangeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ExchangeRecord | null>(null);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    void loadRecords();
  }, [pagination.page, pagination.pageSize, keyword]);

  const summary = useMemo(() => {
    const totalCost = records.reduce((sum, item) => sum + Math.abs(Number(item.points || 0)), 0);
    const uniqueUsers = new Set(records.map((item) => item.user_id)).size;
    return { totalCost, uniqueUsers };
  }, [records]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const res = (await api.exchangeRecords.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword,
      })) as any;
      if (res?.success) {
        setRecords(res.data?.list || []);
        setPagination((current) => ({
          ...current,
          total: res.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('加载兑换记录失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      points_cost: 50,
      created_at: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (record: ExchangeRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      user_id: record.user_id,
      points_cost: Math.abs(Number(record.points || 0)),
      description: record.description || '',
      created_at: record.created_at ? String(record.created_at).slice(0, 16) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: ExchangeRecord) => {
    try {
      const res = (await api.exchangeRecords.delete(String(record.id))) as any;
      if (res?.success) {
        message.success('兑换记录已删除，积分余额已同步回滚');
        void loadRecords();
      }
    } catch (error) {
      message.error('删除兑换记录失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        user_id: values.user_id,
        points: -Math.abs(Number(values.points_cost || 0)),
        description: values.description,
        created_at: values.created_at || undefined,
      };

      if (editingRecord) {
        const res = (await api.exchangeRecords.update(String(editingRecord.id), payload)) as any;
        if (res?.success) {
          message.success('兑换记录已更新');
          setModalVisible(false);
          void loadRecords();
        }
      } else {
        const res = (await api.exchangeRecords.create(payload)) as any;
        if (res?.success) {
          message.success('兑换记录已创建');
          setModalVisible(false);
          void loadRecords();
        }
      }
    } catch (error) {
      message.error('保存兑换记录失败');
    }
  };

  const columns: ColumnsType<ExchangeRecord> = [
    {
      title: '记录ID',
      dataIndex: 'id',
      width: 92,
      responsive: ['md', 'lg', 'xl'],
      render: (value: number) => <span className="admin-mono">{value}</span>,
    },
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
      title: '扣减积分',
      dataIndex: 'points',
      width: 120,
      render: (value: number) => <Tag color="orange">{Math.abs(Number(value || 0))}</Tag>,
    },
    {
      title: '说明',
      dataIndex: 'description',
      width: 280,
      render: (value?: string) => value || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
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
          <Popconfirm
            title="删除后会同步回滚这笔积分扣减，实际时长请记得去时长管理页核对。"
            onConfirm={() => void handleDelete(record)}
          >
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
            兑换记录
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里管理用户的积分兑换流水。编辑或删除会同步修正用户积分；实际时长如需补改，请到时长管理页继续调整。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索用户ID、用户名、手机号或说明"
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
          <Button icon={<ReloadOutlined />} onClick={() => void loadRecords()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增记录
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页记录</div>
          <div className="admin-summary-value">{records.length}</div>
          <div className="admin-summary-help">总计 {pagination.total} 条</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页扣减</div>
          <div className="admin-summary-value">{summary.totalCost}</div>
          <div className="admin-summary-help">按积分绝对值统计</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">涉及用户</div>
          <div className="admin-summary-value">{summary.uniqueUsers}</div>
          <div className="admin-summary-help">当前页去重用户数</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">手工修正</div>
          <div className="admin-summary-value">已启用</div>
          <div className="admin-summary-help">积分与流水同步调整</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        {isMobile ? (
          <div className="admin-mobile-stack">
            {records.map((record) => (
              <div key={record.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{record.nickname || record.username || record.user_id}</div>
                    <div className="admin-mobile-card-subtitle admin-mono">#{record.id}</div>
                  </div>
                  <Tag color="orange">扣减 {Math.abs(Number(record.points || 0))}</Tag>
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">用户ID</span>
                    <span className="admin-mobile-meta-value admin-mono">{record.user_id}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">说明</span>
                    <span className="admin-mobile-meta-value">{record.description || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">创建时间</span>
                    <span className="admin-mobile-meta-value">
                      {record.created_at ? new Date(record.created_at).toLocaleString('zh-CN') : '-'}
                    </span>
                  </div>
                </div>
                <div className="admin-mobile-actions">
                  <Button size="small" onClick={() => openEditModal(record)}>
                    编辑
                  </Button>
                  <Popconfirm
                    title="删除后会同步回滚积分，实际时长请到时长管理页检查。"
                    onConfirm={() => void handleDelete(record)}
                  >
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
              dataSource={records}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1080 }}
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
        title={editingRecord ? '编辑兑换记录' : '新增兑换记录'}
        open={modalVisible}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 560}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
            <Input placeholder="用户ID" />
          </Form.Item>
          <Form.Item name="points_cost" label="扣减积分" rules={[{ required: true, message: '请输入扣减积分' }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="description" label="说明">
            <Input placeholder="例如：后台补录 8 小时兑换" />
          </Form.Item>
          <Form.Item name="created_at" label="创建时间">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
