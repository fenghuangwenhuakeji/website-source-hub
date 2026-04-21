import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Row,
  Select,
  Switch,
  Space,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import api from '../../api';

const DesktopAdminTable = lazy(() => import('../../components/DesktopAdminTable'));

interface UserRecord {
  id: string;
  username: string;
  email?: string;
  phone?: string;
  phone_verified_at?: string;
  nickname?: string;
  role: string;
  is_admin?: number | boolean;
  status: string;
  points: number;
  total_recharge: number;
  referral_code?: string;
  referred_by?: string;
  referrer_username?: string;
  vip_level: number;
  vip_expire_time?: string;
  last_login?: string;
  created_at: string;
  recharge_order_count: number;
  duration_order_count: number;
  paid_recharge_count: number;
  paid_recharge_amount: number;
  wechat_openid?: string;
  wechat_bound_at?: string;
  must_bind_contact?: number | boolean;
  password_updated_at?: string;
  password_reset_requested_at?: string;
  last_password_reset_at?: string;
}

interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

type UserFormValues = {
  username?: string;
  password?: string;
  nickname?: string;
  phone?: string;
  email?: string;
  role?: string;
  is_admin?: boolean | number;
  status?: string;
  points?: number;
  total_recharge?: number;
  vip_level?: number;
  vip_expire_time?: string;
  wechat_openid?: string;
  must_bind_contact?: boolean | number;
};

const roleOptions = [
  { value: 'user', label: '普通用户' },
  { value: 'admin', label: '管理员' },
  { value: 'rootadmin', label: 'Root 管理员' },
  { value: 'super_admin', label: '超级管理员' },
];

const statusOptions = [
  { value: 'active', label: '正常' },
  { value: 'banned', label: '封禁' },
  { value: 'inactive', label: '停用' },
];

function formatDateTime(value?: string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

function formatBoolean(value?: number | boolean) {
  return value ? '是' : '否';
}

export default function Users() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { message } = AntdApp.useApp();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<UserRecord | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: 20,
    total: 0,
  });
  const [form] = Form.useForm<UserFormValues>();

  useEffect(() => {
    void loadUsers();
  }, [pagination.page, pagination.pageSize, keyword]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response: any = await api.users.list({
        page: pagination.page,
        pageSize: pagination.pageSize,
        keyword,
      });

      if (response?.success) {
        setUsers(response.data?.list || []);
        setPagination((current) => ({
          ...current,
          total: response.data?.pagination?.total || 0,
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const summary = useMemo(() => {
    const activeCount = users.filter((user) => user.status === 'active').length;
    const vipCount = users.filter((user) => Number(user.vip_level || 0) > 0).length;
    const adminCount = users.filter((user) => Boolean(user.is_admin) || user.role !== 'user').length;
    const rootAdminCount = users.filter((user) => user.role === 'rootadmin').length;
    const totalRevenue = users.reduce((sum, user) => sum + Number(user.paid_recharge_amount || 0), 0);
    return { activeCount, vipCount, adminCount, rootAdminCount, totalRevenue };
  }, [users]);

  const handleCreate = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({
      role: 'user',
      is_admin: false,
      status: 'active',
      points: 0,
      vip_level: 0,
      must_bind_contact: true,
    });
    setOpen(true);
  };

  const handleEdit = (record: UserRecord) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      is_admin: Boolean(record.is_admin ?? (record.role && record.role !== 'user')),
      must_bind_contact: Boolean(record.must_bind_contact),
    });
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    const response: any = await api.users.delete(String(id));
    if (response?.success) {
      message.success('用户已删除。');
      await loadUsers();
    } else {
      message.error(response?.message || '删除失败。');
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      is_admin: values.is_admin ? 1 : 0,
      must_bind_contact: values.must_bind_contact ? 1 : 0,
    };

    const response: any = editingRecord
      ? await api.users.update(String(editingRecord.id), payload)
      : await api.users.create(payload);

    if (!response?.success) {
      message.error(response?.message || '保存用户失败。');
      return;
    }

    message.success(editingRecord ? '用户资料已更新。' : '用户已创建。');
    setOpen(false);
    await loadUsers();
  };

  const columns: ColumnsType<UserRecord> = [
    {
      title: '用户',
      key: 'user',
      width: 180,
      fixed: 'left',
      render: (_, record) => (
        <div className="admin-detail-stack">
          <strong>{record.nickname || record.username}</strong>
          <span>{record.username}</span>
        </div>
      ),
    },
    {
      title: '联系方式',
      key: 'contact',
      width: 220,
      responsive: ['md', 'lg', 'xl'],
      render: (_, record) => (
        <div className="admin-detail-stack">
          <span>{record.phone || '-'}</span>
          <span>{record.email || '-'}</span>
        </div>
      ),
    },
    {
      title: '绑定状态',
      key: 'binding',
      width: 180,
      responsive: ['lg', 'xl'],
      render: (_, record) => (
        <div className="admin-detail-stack">
          <span>手机号：{formatDateTime(record.phone_verified_at)}</span>
          <span>微信：{record.wechat_openid ? '已绑定' : '未绑定'}</span>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 120,
      render: (value: string) => {
        const labelMap: Record<string, { color: string; text: string }> = {
          user: { color: 'green', text: '普通用户' },
          admin: { color: 'red', text: '管理员' },
          rootadmin: { color: 'purple', text: 'Root 管理员' },
          super_admin: { color: 'gold', text: '超级管理员' },
        };
        const current = labelMap[value] || { color: 'default', text: value || '-' };
        return <Tag color={current.color}>{current.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 92,
      render: (value: string) => <Tag color={value === 'active' ? 'success' : 'default'}>{value === 'active' ? '正常' : '停用'}</Tag>,
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
      dataIndex: 'paid_recharge_amount',
      width: 120,
      responsive: ['md', 'lg', 'xl'],
      render: (value: number) => `¥${Number(value || 0).toFixed(2)}`,
    },
    {
      title: '充值 / 时长',
      width: 130,
      responsive: ['lg', 'xl'],
      render: (_, record) => `${Number(record.recharge_order_count || 0)} / ${Number(record.duration_order_count || 0)}`,
    },
    {
      title: 'VIP',
      dataIndex: 'vip_level',
      width: 100,
      responsive: ['sm', 'md', 'lg', 'xl'],
      render: (value: number) => (value ? <Tag color="gold">VIP {value}</Tag> : '-'),
    },
    {
      title: '安全信息',
      width: 200,
      responsive: ['xl'],
      render: (_, record) => (
        <div className="admin-detail-stack">
          <span>必须绑定：{formatBoolean(record.must_bind_contact)}</span>
          <span>密码更新：{formatDateTime(record.password_updated_at)}</span>
          <span>找回请求：{formatDateTime(record.password_reset_requested_at)}</span>
        </div>
      ),
    },
    {
      title: '微信信息',
      width: 170,
      responsive: ['xl'],
      render: (_, record) => (
        <div className="admin-detail-stack">
          <span>{record.wechat_openid ? '已绑定' : '未绑定'}</span>
          <span>绑定时间：{formatDateTime(record.wechat_bound_at)}</span>
          <span>最后重置：{formatDateTime(record.last_password_reset_at)}</span>
        </div>
      ),
    },
    {
      title: '推荐关系',
      width: 160,
      responsive: ['xl'],
      render: (_, record) => (
        <div className="admin-detail-stack">
          <span>邀请码：{record.referral_code || '-'}</span>
          <span>推荐人：{record.referrer_username || '-'}</span>
        </div>
      ),
    },
    {
      title: '最近登录',
      dataIndex: 'last_login',
      width: 170,
      responsive: ['lg', 'xl'],
      render: (value?: string) => formatDateTime(value),
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      width: 170,
      responsive: ['md', 'lg', 'xl'],
      render: (value: string) => formatDateTime(value),
    },
    {
      title: '操作',
      key: 'action',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm title="确定删除这个用户吗？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(record.id)}>
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
            用户管理
          </Typography.Title>
          <Typography.Paragraph className="admin-page-copy">
            这里统一查看账号、手机号、微信绑定、安全状态和会员数据，方便直接判断用户是否可以进入主程序。
          </Typography.Paragraph>
        </div>
        <div className="admin-toolbar">
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索用户名、昵称、邮箱或手机号"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onPressEnter={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(searchInput.trim());
            }}
            className="admin-search"
          />
          <Button
            onClick={() => {
              setPagination((current) => ({ ...current, page: 1 }));
              setKeyword(searchInput.trim());
            }}
          >
            搜索
          </Button>
          <Button icon={<ReloadOutlined />} onClick={() => void loadUsers()} loading={loading}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            新建用户
          </Button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">当前页用户</div>
          <div className="admin-summary-value">{users.length}</div>
          <div className="admin-summary-help">总计 {pagination.total} 位</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">正常用户</div>
          <div className="admin-summary-value">{summary.activeCount}</div>
          <div className="admin-summary-help">按当前筛选统计</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">VIP 用户</div>
          <div className="admin-summary-value">{summary.vipCount}</div>
          <div className="admin-summary-help">含已设置等级的账号</div>
        </Card>
        <Card className="admin-panel-card admin-summary-card">
          <div className="admin-summary-label">管理员账号</div>
          <div className="admin-summary-value">{summary.adminCount}</div>
          <div className="admin-summary-help">含 rootadmin / super_admin</div>
        </Card>
      </div>

      <Card className="admin-panel-card admin-table-card">
        <div className="admin-toolbar" style={{ marginBottom: 16 }}>
          <span className="admin-status-pill">当前页累计付费 ¥{summary.totalRevenue.toFixed(2)}</span>
          <span className="admin-status-pill">Root 管理员 {summary.rootAdminCount} 位</span>
        </div>
        {isMobile ? (
          <div className="admin-mobile-stack">
            {users.map((record) => (
              <div key={record.id} className="admin-mobile-card">
                <div className="admin-mobile-card-head">
                  <div>
                    <div className="admin-mobile-card-title">{record.nickname || record.username}</div>
                    <div className="admin-mobile-card-subtitle">{record.username}</div>
                  </div>
                  <Tag color={record.status === 'active' ? 'success' : 'default'}>
                    {record.status === 'active' ? '正常' : '停用'}
                  </Tag>
                </div>
                <div className="admin-mobile-inline-tags">
                  <Tag color="blue">积分 {Number(record.points || 0)}</Tag>
                  {Number(record.vip_level || 0) > 0 ? <Tag color="gold">VIP {record.vip_level}</Tag> : null}
                  <Tag color={record.role === 'user' ? 'green' : 'red'}>{record.role || 'user'}</Tag>
                </div>
                <div className="admin-mobile-metrics">
                  <div className="admin-mobile-metric">
                    <div className="admin-mobile-metric-label">累计付费</div>
                    <div className="admin-mobile-metric-value">￥{Number(record.paid_recharge_amount || 0).toFixed(2)}</div>
                  </div>
                  <div className="admin-mobile-metric">
                    <div className="admin-mobile-metric-label">充值 / 时长</div>
                    <div className="admin-mobile-metric-value">
                      {Number(record.recharge_order_count || 0)} / {Number(record.duration_order_count || 0)}
                    </div>
                  </div>
                </div>
                <div className="admin-mobile-meta-list">
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">手机</span>
                    <span className="admin-mobile-meta-value">{record.phone || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">邮箱</span>
                    <span className="admin-mobile-meta-value">{record.email || '-'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">微信</span>
                    <span className="admin-mobile-meta-value">{record.wechat_openid ? '已绑定' : '未绑定'}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">管理员</span>
                    <span className="admin-mobile-meta-value">{formatBoolean(record.is_admin)}</span>
                  </div>
                  <div className="admin-mobile-meta-row">
                    <span className="admin-mobile-meta-label">注册时间</span>
                    <span className="admin-mobile-meta-value">{formatDateTime(record.created_at)}</span>
                  </div>
                </div>
                <div className="admin-mobile-actions">
                  <Button size="small" onClick={() => handleEdit(record)}>
                    编辑
                  </Button>
                  <Popconfirm title="确定删除这个用户吗？" okText="删除" cancelText="取消" onConfirm={() => void handleDelete(record.id)}>
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
              dataSource={users}
              rowKey="id"
              loading={loading}
              size="middle"
              scroll={{ x: 2200 }}
              pagination={{
                current: pagination.page,
                pageSize: pagination.pageSize,
                total: pagination.total,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 位用户`,
                onChange: (page, pageSize) => setPagination((current) => ({ ...current, page, pageSize })),
              }}
            />
          </Suspense>
        )}
      </Card>

      <Modal
        title={editingRecord ? '编辑用户' : '新建用户'}
        open={open}
        onOk={() => void handleSubmit()}
        onCancel={() => setOpen(false)}
        okText={editingRecord ? '保存修改' : '创建用户'}
        cancelText="取消"
        destroyOnHidden
        width={isMobile ? '100%' : 760}
      >
        <Form form={form} layout="vertical">
          {!editingRecord ? (
            <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input placeholder="请输入用户名" />
            </Form.Item>
          ) : null}

          {!editingRecord ? (
            <Form.Item name="password" label="初始密码" rules={[{ required: true, message: '请输入初始密码' }]}>
              <Input.Password placeholder="请输入初始密码" />
            </Form.Item>
          ) : (
            <Form.Item name="password" label="重置密码">
              <Input.Password placeholder="留空则不修改密码" />
            </Form.Item>
          )}

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="nickname" label="昵称">
                <Input placeholder="请输入昵称" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="role" label="角色">
                <Select options={roleOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="is_admin"
            label="管理员权限"
            valuePropName="checked"
            extra="开启后，该账号才具备上传和管理应用的权限。"
          >
            <Switch checkedChildren="管理员" unCheckedChildren="普通用户" />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="phone" label="手机号">
                <Input placeholder="请输入手机号" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="email" label="邮箱">
                <Input placeholder="请输入邮箱" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="wechat_openid" label="微信 OpenID">
                <Input placeholder="请输入微信 OpenID" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="status" label="状态">
                <Select options={statusOptions} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="points" label="积分">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="vip_level" label="会员等级">
                <InputNumber min={0} max={10} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item name="total_recharge" label="累计充值金额">
                <InputNumber min={0} precision={2} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="vip_expire_time" label="会员到期时间">
                <Input placeholder="例如：2026-12-31 23:59:59" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="must_bind_contact" valuePropName="checked" initialValue={true} label="绑定要求">
            <Switch checkedChildren="必须绑定" unCheckedChildren="可选绑定" />
          </Form.Item>

          {editingRecord ? (
            <div className="admin-detail-stack" style={{ marginTop: 8 }}>
              <span>手机号验证：{formatDateTime(editingRecord.phone_verified_at)}</span>
              <span>微信绑定：{formatDateTime(editingRecord.wechat_bound_at)}</span>
              <span>密码更新时间：{formatDateTime(editingRecord.password_updated_at)}</span>
              <span>找回请求时间：{formatDateTime(editingRecord.password_reset_requested_at)}</span>
              <span>最后重置时间：{formatDateTime(editingRecord.last_password_reset_at)}</span>
            </div>
          ) : null}
        </Form>
      </Modal>
    </div>
  );
}
