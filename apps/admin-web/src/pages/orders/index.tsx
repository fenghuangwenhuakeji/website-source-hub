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
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

interface OrderRecord {
  id: string;
  source_table?: 'orders' | 'recharge_orders';
  order_no: string;
  user_id: string;
  username?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  order_kind?: 'recharge' | 'duration';
  product_name?: string;
  package_name?: string;
  amount: number;
  points: number;
  bonus_points?: number;
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

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'activated', label: '已激活' },
  { value: 'expired', label: '已过期' },
  { value: 'cancelled', label: '已取消' },
];

const orderKindOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'recharge', label: '充值单' },
  { value: 'duration', label: '时长记录单' },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDuration(duration?: number | null, unit?: string | null) {
  if (!duration || !unit) {
    return '-';
  }

  if (unit === 'permanent') {
    return '永久';
  }

  const labelMap: Record<string, string> = {
    hour: '小时',
    day: '天',
    month: '月',
    year: '年',
  };

  return `${duration} ${labelMap[unit] || unit}`;
}

function renderPayMethod(value?: string | null) {
  const labelMap: Record<string, string> = {
    wechat: '微信',
    alipay: '支付宝',
    points: '积分',
    admin: '后台',
  };

  return labelMap[String(value || '')] || value || '-';
}

function getErrorMessage(error: any, fallback: string) {
  return error?.response?.data?.message || fallback;
}

export default function Orders() {
  const { message } = AntdApp.useApp();
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('all');
  const [orderKind, setOrderKind] = useState('all');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRecord | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, pageSize: 20, total: 0 });
  const [form] = Form.useForm();

  useEffect(() => {
    void loadOrders();
  }, [pagination.page, pagination.pageSize, status, orderKind, keyword]);

  const summary = useMemo(() => {
    const totalAmount = orders.reduce((sum, order) => sum + Number(order.amount || 0), 0);
    const pendingCount = orders.filter((order) => order.status === 'pending').length;
    const settledCount = orders.filter((order) => ['paid', 'activated'].includes(order.status)).length;
    return { totalAmount, pendingCount, settledCount };
  }, [orders]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const response = (await api.orders.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        status,
        orderKind,
        keyword,
      })) as any;

      if (response?.success) {
        setOrders(response.data?.list || []);
        setPagination((current) => ({
          ...current,
          total: response.data?.pagination?.total || 0,
        }));
      }
    } catch (error) {
      message.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingOrder(null);
    form.resetFields();
    form.setFieldsValue({
      pay_method: 'alipay',
      status: 'pending',
      points: 50,
      bonus_points: 0,
      amount: 9.9,
      created_at: '',
      paid_at: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (order: OrderRecord) => {
    setEditingOrder(order);
    form.setFieldsValue({
      user_id: order.user_id,
      order_no: order.order_no,
      product_name: order.product_name || order.package_name || '',
      amount: Number(order.amount || 0),
      points: Number(order.points || 0),
      bonus_points: Number(order.bonus_points || 0),
      pay_method: order.pay_method || 'alipay',
      status: order.status || 'pending',
      provider_transaction_id: order.provider_transaction_id || '',
      provider_status: order.provider_status || '',
      payment_scene: order.payment_scene || '',
      created_at: order.created_at ? String(order.created_at).slice(0, 16) : '',
      paid_at: order.paid_at ? String(order.paid_at).slice(0, 16) : '',
    });
    setModalVisible(true);
  };

  const handleDelete = async (order: OrderRecord) => {
    try {
      const res = (await api.orders.delete(order.id)) as any;
      if (res?.success) {
        message.success('订单已删除');
        void loadOrders();
      }
    } catch (error) {
      message.error(getErrorMessage(error, '删除订单失败'));
    }
  };

  const handleSettle = async (order: OrderRecord) => {
    try {
      const res = (await api.orders.settle(order.id, {
        pay_method: order.pay_method || 'alipay',
        payment_scene: order.payment_scene || 'ADMIN_MANUAL',
      })) as any;
      if (res?.success) {
        message.success('补单成功，积分已到账');
        void loadOrders();
      }
    } catch (error) {
      message.error(getErrorMessage(error, '补单失败'));
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        user_id: values.user_id,
        order_no: values.order_no || undefined,
        product_name: values.product_name,
        amount: Number(values.amount || 0),
        points: Number(values.points || 0),
        bonus_points: Number(values.bonus_points || 0),
        pay_method: values.pay_method,
        status: values.status,
        provider_transaction_id: values.provider_transaction_id || undefined,
        provider_status: values.provider_status || undefined,
        payment_scene: values.payment_scene || undefined,
        created_at: values.created_at || undefined,
        paid_at: values.paid_at || undefined,
      };

      if (editingOrder) {
        const res = (await api.orders.update(editingOrder.id, payload)) as any;
        if (res?.success) {
          message.success('订单已更新');
          setModalVisible(false);
          void loadOrders();
        }
      } else {
        const res = (await api.orders.create(payload)) as any;
        if (res?.success) {
          message.success('订单记录已创建，如需给用户入账请使用补单按钮');
          setModalVisible(false);
          void loadOrders();
        }
      }
    } catch (error) {
      message.error('保存订单失败');
    }
  };

  const columns: ColumnsType<OrderRecord> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      width: 220,
      fixed: 'left',
      render: (value: string) => <span className="admin-mono">{value}</span>,
    },
    {
      title: '类型',
      dataIndex: 'order_kind',
      width: 96,
      render: (value?: string) => (
        <Tag color={value === 'duration' ? 'purple' : 'processing'}>{value === 'duration' ? '时长记录单' : '充值单'}</Tag>
      ),
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
      title: '商品',
      dataIndex: 'product_name',
      width: 180,
      render: (value: string, record) => value || record.package_name || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 110,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '到账积分',
      key: 'points',
      width: 130,
      render: (_, record) => (
        <Space size={4}>
          <Tag color="blue">{Number(record.points || 0)}</Tag>
          {Number(record.bonus_points || 0) > 0 ? <Tag color="green">+{Number(record.bonus_points || 0)}</Tag> : null}
        </Space>
      ),
    },
    {
      title: '关联时长',
      key: 'duration',
      width: 120,
      responsive: ['lg', 'xl'],
      render: (_, record) => formatDuration(record.duration, record.duration_unit),
    },
    {
      title: '支付方式',
      dataIndex: 'pay_method',
      width: 100,
      render: (value: string) => renderPayMethod(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 96,
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          paid: 'success',
          activated: 'blue',
          expired: 'red',
          cancelled: 'default',
        };
        const labelMap: Record<string, string> = {
          pending: '待支付',
          paid: '已支付',
          activated: '已激活',
          expired: '已过期',
          cancelled: '已取消',
        };
        return <Tag color={colorMap[value] || 'default'}>{labelMap[value] || value || '-'}</Tag>;
      },
    },
    {
      title: '流水号',
      dataIndex: 'provider_transaction_id',
      width: 180,
      responsive: ['lg', 'xl'],
      render: (value?: string | null) => (value ? <span className="admin-mono">{value}</span> : '-'),
    },
    {
      title: '支付时间',
      dataIndex: 'paid_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
      render: (value?: string | null) => (value ? new Date(value).toLocaleString('zh-CN') : '-'),
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
      width: 210,
      fixed: 'right',
      render: (_, record) => (
        <Space wrap>
          <Button type="link" size="small" onClick={() => openEditModal(record)}>
            编辑
          </Button>
          {record.status === 'pending' ? (
            <Popconfirm title="确认手动补单并给用户入账积分？" onConfirm={() => void handleSettle(record)}>
              <Button type="link" size="small">
                补单
              </Button>
            </Popconfirm>
          ) : null}
          {!['paid', 'activated'].includes(record.status) ? (
            <Popconfirm title="确认删除这条未结算订单记录？" onConfirm={() => void handleDelete(record)}>
              <Button type="link" size="small" danger>
                删除
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Typography.Title level={2} className="admin-page-title">
            订单管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            支付成功后订单只发积分，不会自动发时长。这里支持新增订单记录、编辑字段、未支付单删除，以及对漏回调订单手动补单入账。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索订单号、用户、手机号或商品"
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
          <Button icon={<ReloadOutlined />} onClick={() => void loadOrders()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
            新增订单
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页订单</div>
          <div className="admin-summary-value">{orders.length}</div>
          <div className="admin-summary-help">总计 {pagination.total} 单</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">待补单</div>
          <div className="admin-summary-value">{summary.pendingCount}</div>
          <div className="admin-summary-help">待支付或待人工确认</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">已结算</div>
          <div className="admin-summary-value">{summary.settledCount}</div>
          <div className="admin-summary-help">已支付或已激活</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页金额</div>
          <div className="admin-summary-value">{formatCurrency(summary.totalAmount)}</div>
          <div className="admin-summary-help">便于核对后台修单</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        <div className="admin-toolbar" style={{ marginBottom: 16 }}>
          <Select
            value={status}
            options={statusOptions}
            style={{ minWidth: 132 }}
            onChange={(value) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setStatus(value);
            }}
          />
          <Select
            value={orderKind}
            options={orderKindOptions}
            style={{ minWidth: 132 }}
            onChange={(value) => {
              setPagination((current) => ({ ...current, page: 1 }));
              setOrderKind(value);
            }}
          />
          <span className="admin-status-pill">{isMobile ? '手机端已切换为卡片修单模式' : '桌面端支持整表编辑与补单'}</span>
        </div>

        {isMobile ? (
          <div className="admin-mobile-stack">
            {orders.map((record) => (
              <div key={record.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{record.product_name || record.package_name || '-'}</div>
                    <div className="admin-mobile-card-subtitle admin-mono">{record.order_no}</div>
                  </div>
                  <Tag color={record.order_kind === 'duration' ? 'purple' : 'processing'}>
                    {record.order_kind === 'duration' ? '时长记录单' : '充值单'}
                  </Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="success">{formatCurrency(record.amount)}</Tag>
                  <Tag color="blue">到账 {Number(record.points || 0)}</Tag>
                  {Number(record.bonus_points || 0) > 0 ? <Tag color="green">+{Number(record.bonus_points || 0)}</Tag> : null}
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">用户</span>
                    <span className="admin-mobile-meta-value">{record.nickname || record.username || record.user_id}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">状态</span>
                    <span className="admin-mobile-meta-value">{record.status || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">支付方式</span>
                    <span className="admin-mobile-meta-value">{renderPayMethod(record.pay_method)}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">支付时间</span>
                    <span className="admin-mobile-meta-value">
                      {record.paid_at ? new Date(record.paid_at).toLocaleString('zh-CN') : '-'}
                    </span>
                  </div>
                </div>
                <div className="admin-mobile-actions">
                  <Button size="small" onClick={() => openEditModal(record)}>
                    编辑
                  </Button>
                  {record.status === 'pending' ? (
                    <Popconfirm title="确认手动补单并给用户入账积分？" onConfirm={() => void handleSettle(record)}>
                      <Button size="small">补单</Button>
                    </Popconfirm>
                  ) : null}
                  {!['paid', 'activated'].includes(record.status) ? (
                    <Popconfirm title="确认删除这条未结算订单？" onConfirm={() => void handleDelete(record)}>
                      <Button size="small" danger>
                        删除
                      </Button>
                    </Popconfirm>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Suspense fallback={<span className="admin-status-pill">正在加载桌面表格…</span>}>
            <DesktopAdminTable
              columns={columns}
              dataSource={orders}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 1760 }}
              pagination={{
                current: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 单`,
                onChange: (page, pageSize) => setPagination((current) => ({ ...current, page, pageSize })),
              }}
            />
          </Suspense>
        )}
      </Card>

      <Modal
        title={editingOrder ? '编辑订单' : '新增订单'}
        open={modalVisible}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalVisible(false)}
        width={isMobile ? '100%' : 640}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="user_id" label="用户ID" rules={[{ required: true, message: '请输入用户ID' }]}>
            <Input placeholder="用户ID" />
          </Form.Item>
          <Form.Item name="order_no" label="订单号">
            <Input placeholder="留空则自动生成" />
          </Form.Item>
          <Form.Item name="product_name" label="商品名称" rules={[{ required: true, message: '请输入商品名称' }]}>
            <Input placeholder="例如：8小时卡" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]} style={{ width: 150 }}>
              <InputNumber min={0} step={0.01} precision={2} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="points" label="基础积分" rules={[{ required: true, message: '请输入积分' }]} style={{ width: 150 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="bonus_points" label="奖励积分" style={{ width: 150 }}>
              <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="pay_method" label="支付方式" style={{ width: 150 }}>
              <Select
                options={[
                  { value: 'alipay', label: '支付宝' },
                  { value: 'wechat', label: '微信' },
                  { value: 'admin', label: '后台' },
                  { value: 'points', label: '积分' },
                ]}
              />
            </Form.Item>
            <Form.Item name="status" label="状态" style={{ width: 150 }}>
              <Select options={statusOptions.filter((item) => item.value !== 'all')} />
            </Form.Item>
          </Space>
          <Form.Item name="provider_transaction_id" label="流水号">
            <Input placeholder="第三方交易流水号" />
          </Form.Item>
          <Space style={{ width: '100%' }} size="large" wrap>
            <Form.Item name="provider_status" label="渠道状态" style={{ width: 180 }}>
              <Input placeholder="例如：SUCCESS" />
            </Form.Item>
            <Form.Item name="payment_scene" label="支付场景" style={{ width: 180 }}>
              <Input placeholder="例如：NATIVE / FACE_TO_FACE_PAYMENT" />
            </Form.Item>
          </Space>
          <Form.Item name="created_at" label="创建时间">
            <Input type="datetime-local" />
          </Form.Item>
          <Form.Item name="paid_at" label="支付时间">
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
