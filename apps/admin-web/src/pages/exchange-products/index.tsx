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
  Select,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

const { Option } = Select;
const { TextArea } = Input;

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

function formatDuration(duration: number, unit: string) {
  if (!duration || !unit) {
    return '-';
  }

  const unitMap: Record<string, string> = {
    hour: '小时',
    day: '天',
    month: '月',
    year: '年',
  };

  return `${duration} ${unitMap[unit] || unit}`;
}

export default function ExchangeProducts() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [products, setProducts] = useState<ExchangeProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ExchangeProduct | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    void loadProducts();
  }, []);

  const summary = useMemo(() => {
    const activeCount = products.filter((item) => item.is_active).length;
    const rewardCount = products.filter((item) => Number(item.points_reward || 0) > 0).length;
    const cheapest = products.length ? Math.min(...products.map((item) => Number(item.points_cost || 0))) : 0;
    const highest = products.length ? Math.max(...products.map((item) => Number(item.points_cost || 0))) : 0;
    return { activeCount, rewardCount, cheapest, highest };
  }, [products]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = (await api.exchangeProducts.list()) as any;
      if (res.success) {
        setProducts(res.data || []);
      }
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ is_active: true, sort_order: 0, duration_unit: 'day', points_reward: 0 });
    setModalVisible(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const res = (await api.exchangeProducts.delete(String(id))) as any;
      if (res.success) {
        message.success('删除成功');
        void loadProducts();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (editingProduct) {
        const res = (await api.exchangeProducts.update(String(editingProduct.id), values)) as any;
        if (res.success) {
          message.success('更新成功');
          setModalVisible(false);
          void loadProducts();
        }
      } else {
        const res = (await api.exchangeProducts.create(values)) as any;
        if (res.success) {
          message.success('创建成功');
          setModalVisible(false);
          void loadProducts();
        }
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const columns: ColumnsType<ExchangeProduct> = [
    { title: 'ID', dataIndex: 'id', width: 72, responsive: ['md', 'lg', 'xl'] },
    {
      title: '名称',
      dataIndex: 'name',
      width: 180,
      render: (value: string, record) => (
        <div className="admin-detail-stack">
          <strong>{value}</strong>
          <span>{record.description || '未填写说明'}</span>
        </div>
      ),
    },
    {
      title: '消耗积分',
      dataIndex: 'points_cost',
      width: 110,
      render: (value: number) => <Tag color="orange">{Number(value || 0)}</Tag>,
    },
    {
      title: '奖励积分',
      dataIndex: 'points_reward',
      width: 110,
      render: (value: number) => (Number(value || 0) > 0 ? <Tag color="green">+{Number(value || 0)}</Tag> : '-'),
    },
    {
      title: '时长',
      width: 120,
      render: (_, record) => <Tag color="processing">{formatDuration(record.duration, record.duration_unit)}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      width: 90,
      render: (value: boolean) => <Tag color={value ? 'success' : 'default'}>{value ? '启用' : '停用'}</Tag>,
    },
    { title: '排序', dataIndex: 'sort_order', width: 80, responsive: ['md', 'lg', 'xl'] },
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
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditingProduct(record);
              form.setFieldsValue(record);
              setModalVisible(true);
            }}
          >
            编辑
          </Button>
          <Popconfirm title="确定删除？" onConfirm={() => void handleDelete(record.id)}>
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
            积分兑换管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里统一维护前台可见的积分兑换时长商品，手机端会优先展示最关键的消耗、奖励和启用状态。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Button icon={<ReloadOutlined />} onClick={() => void loadProducts()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            添加商品
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前商品数</div>
          <div className="admin-summary-value">{products.length}</div>
          <div className="admin-summary-help">已启用 {summary.activeCount} 个</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">带奖励商品</div>
          <div className="admin-summary-value">{summary.rewardCount}</div>
          <div className="admin-summary-help">会额外返还积分</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">最低消耗</div>
          <div className="admin-summary-value">{summary.cheapest}</div>
          <div className="admin-summary-help">积分门槛最低商品</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">最高消耗</div>
          <div className="admin-summary-value">{summary.highest}</div>
          <div className="admin-summary-help">高价值兑换方案</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        {isMobile ? (
          <div className="admin-mobile-stack">
            {products.map((item) => (
              <div key={item.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{item.name}</div>
                    <div className="admin-mobile-card-subtitle">{item.description || '未填写说明'}</div>
                  </div>
                  <Tag color={item.is_active ? 'success' : 'default'}>{item.is_active ? '启用' : '停用'}</Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="orange">消耗 {Number(item.points_cost || 0)}</Tag>
                  {Number(item.points_reward || 0) > 0 ? <Tag color="green">奖励 +{Number(item.points_reward || 0)}</Tag> : null}
                  <Tag color="processing">{formatDuration(item.duration, item.duration_unit)}</Tag>
                </div>
                <div className="admin-mobile-actions">
                  <Button
                    size="small"
                    onClick={() => {
                      setEditingProduct(item);
                      form.setFieldsValue(item);
                      setModalVisible(true);
                    }}
                  >
                    编辑
                  </Button>
                  <Popconfirm title="确定删除？" onConfirm={() => void handleDelete(item.id)}>
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
              dataSource={products}
              rowKey="id"
              loading={loading}
              scroll={{ x: 1200 }}
            />
          </Suspense>
        )}
      </Card>

      <Modal
        title={editingProduct ? '编辑商品' : '添加商品'}
        open={modalVisible}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 600}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入产品名称' }]}>
            <Input placeholder="产品名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={2} placeholder="产品描述" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="points_cost" label="消耗积分" rules={[{ required: true, message: '请输入消耗积分' }]} style={{ width: 150 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="points_reward" label="奖励积分" style={{ width: 150 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="duration" label="时长数值" style={{ width: 150 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="duration_unit" label="时长单位" style={{ width: 150 }}>
              <Select>
                <Option value="hour">小时</Option>
                <Option value="day">天</Option>
                <Option value="month">月</Option>
                <Option value="year">年</Option>
              </Select>
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="is_active" label="启用" valuePropName="checked" style={{ width: 100 }}>
              <Switch />
            </Form.Item>
            <Form.Item name="sort_order" label="排序" style={{ width: 100 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </div>
  );
}
