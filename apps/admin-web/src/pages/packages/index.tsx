import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Card, Col, Form, Grid, Input, InputNumber, Modal, Popconfirm, Row, Select, Space, Switch, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

const { TextArea } = Input;

interface PackageRecord {
  id: number;
  name: string;
  description: string;
  price: number;
  points: number;
  bonus_points: number;
  duration: number;
  duration_unit: string;
  recommended: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

const durationUnitOptions = [
  { value: 'hour', label: '小时' },
  { value: 'day', label: '天' },
  { value: 'month', label: '月' },
  { value: 'year', label: '年' },
  { value: 'permanent', label: '永久' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDuration(value: number, unit: string) {
  if (unit === 'permanent') {
    return '无限期';
  }
  const current = durationUnitOptions.find((item) => item.value === unit);
  return `${value} ${current?.label || unit}`;
}

export default function Packages() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { message } = AntdApp.useApp();
  const [packages, setPackages] = useState<PackageRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PackageRecord | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    void loadPackages();
  }, []);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const response = (await api.packages.list()) as any;
      if (response?.success) {
        setPackages(response.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const activeCount = packages.filter((item) => item.is_active).length;
    const recommendedCount = packages.filter((item) => item.recommended).length;
    const minPrice = packages.length ? Math.min(...packages.map((item) => Number(item.price || 0))) : 0;
    const maxPrice = packages.length ? Math.max(...packages.map((item) => Number(item.price || 0))) : 0;
    return { activeCount, recommendedCount, minPrice, maxPrice };
  }, [packages]);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      is_active: true,
      recommended: false,
      sort_order: packages.length + 1,
      duration_unit: 'day',
      bonus_points: 0,
      points: 0,
    });
    setOpen(true);
  };

  const handleEdit = (record: PackageRecord) => {
    setEditingRecord(record);
    form.setFieldsValue(record);
    setOpen(true);
  };

  const handleDelete = async (id: number) => {
    const response = (await api.packages.delete(String(id))) as any;
    if (response?.success) {
      message.success('套餐已删除。');
      await loadPackages();
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const response = editingRecord
      ? ((await api.packages.update(String(editingRecord.id), values)) as any)
      : ((await api.packages.create(values)) as any);

    if (!response?.success) {
      message.error(response?.message || '保存套餐失败。');
      return;
    }

    message.success(editingRecord ? '套餐已更新。' : '套餐已创建。');
    setOpen(false);
    await loadPackages();
  };

  const columns: ColumnsType<PackageRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 72,
      fixed: 'left',
    },
    {
      title: '名称',
      dataIndex: 'name',
      width: 160,
      render: (value: string, record) => (
        <div className="admin-detail-stack">
          <strong>{value}</strong>
          <span>{record.description || '未填写说明'}</span>
        </div>
      ),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 110,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '时长',
      key: 'duration',
      width: 120,
      render: (_, record) => <Tag color="processing">{formatDuration(record.duration, record.duration_unit)}</Tag>,
    },
    {
      title: '积分',
      dataIndex: 'points',
      width: 92,
      render: (value: number) => <Tag color="blue">{Number(value || 0)}</Tag>,
    },
    {
      title: '赠送',
      dataIndex: 'bonus_points',
      width: 92,
      render: (value: number) => (Number(value || 0) > 0 ? <Tag color="green">+{Number(value || 0)}</Tag> : '-'),
    },
    {
      title: '推荐',
      dataIndex: 'recommended',
      width: 90,
      render: (value: boolean) => (value ? <Tag color="gold">推荐</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 90,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '停用'}</Tag>,
    },
    {
      title: '排序',
      dataIndex: 'sort_order',
      width: 80,
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
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除这个套餐吗？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(record.id)}>
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
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
            套餐管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里维护正式套餐价格，当前会直接覆盖前台展示的体验卡、月卡、年卡和永久卡等价格来源。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Button icon={<ReloadOutlined />} onClick={() => void loadPackages()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建套餐
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">当前套餐数</div>
            <div className="admin-summary-value">{packages.length}</div>
            <div className="admin-summary-help">已启用 {summary.activeCount} 个</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">推荐套餐</div>
            <div className="admin-summary-value">{summary.recommendedCount}</div>
            <div className="admin-summary-help">用于前台高亮展示</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">最低价格</div>
            <div className="admin-summary-value">{formatCurrency(summary.minPrice)}</div>
            <div className="admin-summary-help">当前最低入门门槛</div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">最高价格</div>
            <div className="admin-summary-value">{formatCurrency(summary.maxPrice)}</div>
            <div className="admin-summary-help">长期权益方案</div>
          </Card>
        </Col>
      </Row>

      <Card className="admin-panel-card admin-table-card">
        {isMobile ? (
          <div className="admin-mobile-stack">
            {packages.map((item) => (
              <div key={item.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{item.name}</div>
                    <div className="admin-mobile-card-subtitle">{item.description || '未填写说明'}</div>
                  </div>
                  <Tag color={item.is_active ? 'success' : 'default'}>{item.is_active ? '启用' : '停用'}</Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="processing">{formatDuration(item.duration, item.duration_unit)}</Tag>
                  {item.recommended ? <Tag color="gold">推荐</Tag> : null}
                  <Tag color="blue">积分 {Number(item.points || 0)}</Tag>
                </div>
                <div className="admin-mobile-metrics">
                  <div className="admin-mobile-metric">
                    <div className="admin-mobile-metric-label">价格</div>
                    <div className="admin-mobile-metric-value">{formatCurrency(item.price)}</div>
                  </div>
                  <div className="admin-mobile-metric">
                    <div className="admin-mobile-metric-label">赠送积分</div>
                    <div className="admin-mobile-metric-value">{Number(item.bonus_points || 0)}</div>
                  </div>
                </div>
                <div className="admin-mobile-actions">
                  <Button size="small" onClick={() => handleEdit(item)}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除这个套餐吗？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(item.id)}>
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
              dataSource={packages}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 1160 }}
              pagination={false}
            />
          </Suspense>
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑套餐' : '新建套餐'}
        open={open}
        onOk={() => void handleSubmit()}
        onCancel={() => setOpen(false)}
        okText={editingRecord ? '保存修改' : '创建套餐'}
        cancelText="取消"
        destroyOnHidden
        width={isMobile ? '100%' : 720}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="name" label="套餐名称" rules={[{ required: true, message: '请输入套餐名称' }]}>
                <Input placeholder="例如：月卡" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="price" label="价格" rules={[{ required: true, message: '请输入价格' }]}>
                <InputNumber min={0} precision={2} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="说明文案">
            <TextArea rows={3} placeholder="前台展示说明" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item name="duration" label="时长数值" rules={[{ required: true, message: '请输入时长数值' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="duration_unit" label="时长单位" rules={[{ required: true, message: '请选择时长单位' }]}>
                <Select options={durationUnitOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="sort_order" label="排序">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="points" label="到账积分" rules={[{ required: true, message: '请输入积分' }]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="bonus_points" label="赠送积分">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="recommended" label="推荐套餐" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="is_active" label="启用状态" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
