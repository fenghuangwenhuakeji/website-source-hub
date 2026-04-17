import { lazy, Suspense, useEffect, useState } from 'react';
import { DollarOutlined, ShoppingCartOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Card, Col, Grid, Row, Statistic, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

interface Stats {
  totalUsers: number;
  totalOrders: number;
  totalPoints: number;
  totalRevenue: number;
  activePackages: number;
  activeMembers: number;
  todayUsers: number;
  todayOrders: number;
}

interface RecentUser {
  id: string;
  username: string;
  nickname?: string;
  phone?: string;
  points: number;
  total_recharge: number;
  vip_level: number;
  status: string;
  created_at: string;
}

interface RecentOrder {
  id: string;
  order_no: string;
  username?: string;
  order_kind: 'recharge' | 'duration';
  product_name: string;
  amount: number;
  points: number;
  bonus_points: number;
  status: string;
  pay_method: string;
  created_at: string;
}

const defaultStats: Stats = {
  totalUsers: 0,
  totalOrders: 0,
  totalPoints: 0,
  totalRevenue: 0,
  activePackages: 0,
  activeMembers: 0,
  todayUsers: 0,
  todayOrders: 0,
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(Number(value || 0));

const formatDateTime = (value?: string) => (value ? new Date(value).toLocaleString('zh-CN') : '-');

const getUserStatusText = (value?: string) => (value === 'active' ? '正常' : '禁用');

const getOrderKindText = (value: RecentOrder['order_kind']) => (value === 'recharge' ? '充值单' : '时长单');

export default function Dashboard() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>(defaultStats);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes, ordersRes] = (await Promise.all([
        api.stats.overview(),
        api.users.list({ page: 1, pageSize: 6 }),
        api.orders.list({ page: 1, pageSize: 6 }),
      ])) as [any, any, any];

      if (statsRes?.success) {
        setStats({ ...defaultStats, ...statsRes.data });
      }
      if (usersRes?.success) {
        setRecentUsers(usersRes.data?.list || []);
      }
      if (ordersRes?.success) {
        setRecentOrders(ordersRes.data?.list || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const userColumns: ColumnsType<RecentUser> = [
    {
      title: '用户',
      dataIndex: 'username',
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (value: string, record) => (
        <div className="admin-detail-stack">
          <strong>{record.nickname || value || '-'}</strong>
          <span>{value || '-'}</span>
        </div>
      ),
    },
    {
      title: '手机',
      dataIndex: 'phone',
      width: 130,
      responsive: ['md', 'lg', 'xl'],
      render: (value?: string) => value || '-',
    },
    {
      title: '积分',
      dataIndex: 'points',
      width: 92,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (value: number) => <Tag color="blue">{Number(value || 0)}</Tag>,
    },
    {
      title: '累计付费',
      dataIndex: 'total_recharge',
      width: 110,
      responsive: ['md', 'lg', 'xl'],
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '会员',
      dataIndex: 'vip_level',
      width: 92,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (value: number) => (value ? <Tag color="gold">VIP {value}</Tag> : '-'),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (value: string) => <Tag color={value === 'active' ? 'success' : 'default'}>{getUserStatusText(value)}</Tag>,
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 160,
      responsive: ['lg', 'xl'],
      render: (value: string) => formatDateTime(value),
    },
  ];

  const orderColumns: ColumnsType<RecentOrder> = [
    {
      title: '订单号',
      dataIndex: 'order_no',
      width: 200,
      render: (value: string) => <span className="admin-mono">{value}</span>,
    },
    {
      title: '类型',
      dataIndex: 'order_kind',
      width: 92,
      render: (value: RecentOrder['order_kind']) => <Tag color={value === 'recharge' ? 'processing' : 'purple'}>{getOrderKindText(value)}</Tag>,
    },
    {
      title: '用户',
      dataIndex: 'username',
      width: 130,
      render: (value?: string) => value || '-',
    },
    {
      title: '商品',
      dataIndex: 'product_name',
      responsive: ['md', 'lg', 'xl'],
      render: (value: string) => value || '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 100,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (value: string) => {
        const colorMap: Record<string, string> = {
          pending: 'orange',
          paid: 'success',
          activated: 'blue',
          cancelled: 'default',
          expired: 'red',
        };
        return <Tag color={colorMap[value] || 'default'}>{value || '-'}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      width: 160,
      responsive: ['lg', 'xl'],
      render: (value: string) => formatDateTime(value),
    },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <Typography.Title level={2} className="admin-page-title">
            凤煌科技运营总览
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里优先展示你真正需要盯住的指标：用户增长、订单、收入、会员活跃和套餐状态。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <span className="admin-status-pill">实时运营视图</span>
          <Button onClick={() => void loadData()} loading={loading}>
            刷新数据
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <Statistic title="总用户数" value={stats.totalUsers} prefix={<UserOutlined />} valueStyle={{ color: '#2563eb' }} />
          <div className="admin-summary-help">今日新增 {stats.todayUsers} 位</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <Statistic title="总订单数" value={stats.totalOrders} prefix={<ShoppingCartOutlined />} valueStyle={{ color: '#059669' }} />
          <div className="admin-summary-help">今日新增 {stats.todayOrders} 单</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <Statistic title="累计收入" value={stats.totalRevenue} prefix={<DollarOutlined />} precision={2} valueStyle={{ color: '#d97706' }} />
          <div className="admin-summary-help">充值单与时长单合计</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <Statistic title="活跃会员" value={stats.activeMembers} prefix={<TeamOutlined />} valueStyle={{ color: '#7c3aed' }} />
          <div className="admin-summary-help">当前启用套餐 {stats.activePackages} 个</div>
        </Card>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={10}>
          <Card className="admin-panel-card">
            <Typography.Title level={4} style={{ marginTop: 0 }}>
              今日重点
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#475569', lineHeight: 1.8, marginBottom: 12 }}>
              今日新增用户 {stats.todayUsers} 位，新增订单 {stats.todayOrders} 单，当前活跃会员 {stats.activeMembers} 位。
              如果订单异常上涨，优先检查订单管理里的 `pending`、`expired` 和支付渠道状态。
            </Typography.Paragraph>
            <div className="admin-toolbar">
              <Tag color="processing">积分总量 {Number(stats.totalPoints || 0)}</Tag>
              <Tag color="gold">正式套餐 {stats.activePackages} 个</Tag>
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={14}>
          <Card className="admin-panel-card admin-table-card">
            <div className="admin-page-header" style={{ marginBottom: 14 }}>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  最近注册用户
                </Typography.Title>
                <Typography.Paragraph style={{ margin: '8px 0 0', color: '#64748b' }}>
                  快速查看最近进来的用户是谁、是否已付费、当前是否为 VIP。
                </Typography.Paragraph>
              </div>
              <Button type="link" onClick={() => navigate('/users')}>
                查看全部
              </Button>
            </div>
            {isMobile ? (
              <div className="admin-mobile-stack">
                {recentUsers.map((user) => (
                  <div key={user.id} className="admin-mobile-card">
                    <div className="admin-mobile-card-head">
                      <div>
                        <div className="admin-mobile-card-title">{user.nickname || user.username || '-'}</div>
                        <div className="admin-mobile-card-subtitle">{user.username || '-'}</div>
                      </div>
                      <Tag color={user.status === 'active' ? 'success' : 'default'}>{getUserStatusText(user.status)}</Tag>
                    </div>
                    <div className="admin-mobile-meta-list">
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">手机</span>
                        <span className="admin-mobile-meta-value">{user.phone || '-'}</span>
                      </div>
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">积分</span>
                        <span className="admin-mobile-meta-value">{Number(user.points || 0)}</span>
                      </div>
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">累计付费</span>
                        <span className="admin-mobile-meta-value">{formatCurrency(user.total_recharge)}</span>
                      </div>
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">会员</span>
                        <span className="admin-mobile-meta-value">{Number(user.vip_level || 0) > 0 ? `VIP ${user.vip_level}` : '-'}</span>
                      </div>
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">状态</span>
                        <span className="admin-mobile-meta-value">{getUserStatusText(user.status)}</span>
                      </div>
                      <div className="admin-mobile-meta-row">
                        <span className="admin-mobile-meta-label">注册时间</span>
                        <span className="admin-mobile-meta-value">{formatDateTime(user.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Suspense fallback={<span className="admin-status-pill">正在加载桌面表格...</span>}>
                <DesktopAdminTable
                  columns={userColumns}
                  dataSource={recentUsers}
                  rowKey="id"
                  loading={loading}
                  pagination={false}
                  size="middle"
                  scroll={{ x: 780 }}
                />
              </Suspense>
            )}
          </Card>
        </Col>
      </Row>

      <Card className="admin-panel-card admin-table-card">
        <div className="admin-page-header" style={{ marginBottom: 14 }}>
          <div>
            <Typography.Title level={4} style={{ margin: 0 }}>
              最近订单
            </Typography.Title>
            <Typography.Paragraph style={{ margin: '8px 0 0', color: '#64748b' }}>
              充值单和时长单已合并展示，方便你直接追踪成交链路。
            </Typography.Paragraph>
          </div>
          <Button type="link" onClick={() => navigate('/orders')}>
            查看全部
          </Button>
        </div>
        {isMobile ? (
          <div className="admin-mobile-stack">
            {recentOrders.map((order) => (
              <div key={order.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{order.product_name || '-'}</div>
                    <div className="admin-mobile-card-subtitle admin-mono">{order.order_no}</div>
                  </div>
                  <Tag color={order.order_kind === 'recharge' ? 'processing' : 'purple'}>
                    {getOrderKindText(order.order_kind)}
                  </Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="success">{formatCurrency(order.amount)}</Tag>
                  <Tag color="blue">积分 {Number(order.points || 0)}</Tag>
                  <Tag
                    color={
                      order.status === 'paid'
                        ? 'success'
                        : order.status === 'activated'
                          ? 'blue'
                          : order.status === 'pending'
                            ? 'orange'
                            : 'default'
                    }
                  >
                    {order.status || '-'}
                  </Tag>
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">用户</span>
                    <span className="admin-mobile-meta-value">{order.username || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">支付方式</span>
                    <span className="admin-mobile-meta-value">{order.pay_method || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">创建时间</span>
                    <span className="admin-mobile-meta-value">{formatDateTime(order.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Suspense fallback={<span className="admin-status-pill">正在加载桌面表格...</span>}>
            <DesktopAdminTable
              columns={orderColumns}
              dataSource={recentOrders}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              scroll={{ x: 980 }}
            />
          </Suspense>
        )}
      </Card>
    </div>
  );
}
