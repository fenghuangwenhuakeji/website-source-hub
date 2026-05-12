import { useState } from 'react';
import {
  App as AntdApp,
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import { CopyOutlined, KeyOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../api';

const { Text, Title } = Typography;

type LicenseStatus = {
  productId: string;
  accessType: string;
  isTrial: boolean;
  isPermanent: boolean;
  expiresAt?: string | null;
  remainingSeconds: number;
  canEnter: boolean;
  requiresPurchase: boolean;
  seatLimit: number;
  deviceLimit: number;
  activeDeviceCount: number;
  activeSessionCount: number;
};

function formatRemaining(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0 分钟';
  }

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return days > 0 ? `${days} 天 ${hours} 小时` : `${hours} 小时 ${minutes} 分钟`;
}

export default function LicenseCenter() {
  const { message } = AntdApp.useApp();
  const [generateForm] = Form.useForm();
  const [queryForm] = Form.useForm();
  const [generating, setGenerating] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [codes, setCodes] = useState<string[]>([]);
  const [status, setStatus] = useState<LicenseStatus | null>(null);

  const handleGenerate = async () => {
    try {
      const values = await generateForm.validateFields();
      setGenerating(true);
      const res = (await api.licenseCenter.generateCodes({
        productId: values.productId || 'fenghuang',
        planName: values.planName,
        durationDays: Number(values.durationDays || 30),
        seatLimit: Number(values.seatLimit || 1),
        deviceLimit: Number(values.deviceLimit || 1),
        quantity: Number(values.quantity || 1),
        prefix: values.prefix,
        note: values.note,
        expiresInDays: values.expiresInDays ? Number(values.expiresInDays) : undefined,
        isPermanent: Boolean(values.isPermanent),
      })) as any;

      if (!res?.success) {
        throw new Error(res?.message || '生成卡密失败');
      }

      setCodes(res.data?.codes || []);
      message.success('卡密已生成');
    } catch (error: any) {
      message.error(error?.message || '生成卡密失败');
    } finally {
      setGenerating(false);
    }
  };

  const handleQuery = async () => {
    try {
      const values = await queryForm.validateFields();
      setQuerying(true);
      const res = (await api.licenseCenter.userStatus(values.productId || 'fenghuang', values.userId)) as any;
      if (!res?.success) {
        throw new Error(res?.message || '查询授权失败');
      }
      setStatus(res.data);
    } catch (error: any) {
      message.error(error?.message || '查询授权失败');
    } finally {
      setQuerying(false);
    }
  };

  const copyCodes = async () => {
    await navigator.clipboard.writeText(codes.join('\n'));
    message.success('已复制卡密');
  };

  return (
    <div className="admin-page">
      <Row gutter={[16, 16]}>
        <Col xs={24} xl={12}>
          <Card className="admin-surface-card">
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div className="admin-section-heading">
                <div>
                  <Title level={3}>生成产品卡密</Title>
                  <Text type="secondary">默认产品为 fenghuang，卡密兑换后发放时长、席位和设备额度。</Text>
                </div>
                <KeyOutlined />
              </div>

              <Form
                form={generateForm}
                layout="vertical"
                initialValues={{
                  productId: 'fenghuang',
                  durationDays: 30,
                  seatLimit: 1,
                  deviceLimit: 1,
                  quantity: 10,
                  expiresInDays: 30,
                }}
              >
                <Row gutter={12}>
                  <Col xs={24} md={12}>
                    <Form.Item name="productId" label="产品 ID" rules={[{ required: true, message: '请输入产品 ID' }]}>
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="planName" label="套餐名称">
                      <Input placeholder="例如 30 天工作室卡" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="durationDays" label="天数">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="seatLimit" label="席位">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="deviceLimit" label="设备">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="quantity" label="数量">
                      <InputNumber min={1} max={500} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="prefix" label="前缀">
                      <Input placeholder="FH" maxLength={8} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={8}>
                    <Form.Item name="expiresInDays" label="卡密有效期">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="note" label="备注">
                      <Input />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="isPermanent" label="永久授权" valuePropName="checked">
                      <Switch />
                    </Form.Item>
                  </Col>
                </Row>
                <Button type="primary" icon={<KeyOutlined />} loading={generating} onClick={() => void handleGenerate()}>
                  生成卡密
                </Button>
              </Form>

              {codes.length > 0 ? (
                <Card size="small">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button icon={<CopyOutlined />} onClick={() => void copyCodes()}>
                      复制全部
                    </Button>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{codes.join('\n')}</pre>
                  </Space>
                </Card>
              ) : null}
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={12}>
          <Card className="admin-surface-card">
            <Space direction="vertical" size={18} style={{ width: '100%' }}>
              <div className="admin-section-heading">
                <div>
                  <Title level={3}>查询用户授权</Title>
                  <Text type="secondary">用于客服验收账号是否可进入、是否试用、席位和设备是否超限。</Text>
                </div>
                <SearchOutlined />
              </div>

              <Form form={queryForm} layout="vertical" initialValues={{ productId: 'fenghuang' }}>
                <Form.Item name="productId" label="产品 ID" rules={[{ required: true, message: '请输入产品 ID' }]}>
                  <Input />
                </Form.Item>
                <Form.Item name="userId" label="用户 ID" rules={[{ required: true, message: '请输入用户 ID' }]}>
                  <Input />
                </Form.Item>
                <Button icon={<ReloadOutlined />} loading={querying} onClick={() => void handleQuery()}>
                  查询授权
                </Button>
              </Form>

              {status ? (
                <Card size="small">
                  <Space direction="vertical" size={10}>
                    <Space wrap>
                      <Tag color={status.canEnter ? 'success' : 'error'}>{status.canEnter ? '可进入' : '需购买'}</Tag>
                      <Tag color={status.isTrial ? 'blue' : 'purple'}>{status.accessType}</Tag>
                      {status.isPermanent ? <Tag color="gold">永久</Tag> : null}
                    </Space>
                    <Text>剩余：{formatRemaining(Number(status.remainingSeconds || 0))}</Text>
                    <Text>到期：{status.expiresAt ? new Date(status.expiresAt).toLocaleString('zh-CN') : '永久或未配置'}</Text>
                    <Text>席位：{status.activeSessionCount} / {status.seatLimit}</Text>
                    <Text>设备：{status.activeDeviceCount} / {status.deviceLimit}</Text>
                  </Space>
                </Card>
              ) : null}
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
