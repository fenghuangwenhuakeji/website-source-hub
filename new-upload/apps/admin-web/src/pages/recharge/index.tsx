import { CrownOutlined, ClockCircleOutlined, FireOutlined } from '@ant-design/icons';
import { App as AntdApp, Button, Card, Col, Grid, Modal, Row, Tag, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

type RechargePackage = {
  id: string;
  name: string;
  subtitle: string;
  points: number;
  bonus: number;
  price: number;
  durationLabel: string;
  highlight?: boolean;
};

const PACKAGES: RechargePackage[] = [
  { id: '8h', name: '8小时卡', subtitle: '短期体验与临时解锁', points: 100, bonus: 0, price: 9.9, durationLabel: '8 小时', highlight: true },
  { id: '1d', name: '日卡', subtitle: '适合单日连续使用', points: 180, bonus: 0, price: 14.9, durationLabel: '1 天' },
  { id: '7d', name: '周卡', subtitle: '一周稳定创作周期', points: 420, bonus: 30, price: 29.9, durationLabel: '7 天' },
  { id: '30d', name: '月卡', subtitle: '最常用的月度方案', points: 980, bonus: 80, price: 79.9, durationLabel: '30 天', highlight: true },
  { id: '90d', name: '季卡', subtitle: '长期连续使用更划算', points: 3200, bonus: 220, price: 299, durationLabel: '90 天' },
  { id: '180d', name: '半年卡', subtitle: '深度创作与管理场景', points: 6800, bonus: 500, price: 699, durationLabel: '180 天' },
  { id: '365d', name: '年卡', subtitle: '全年连续授权', points: 12000, bonus: 1200, price: 999, durationLabel: '365 天' },
  { id: 'forever', name: '永久卡', subtitle: '一次购买长期使用', points: 50000, bonus: 5000, price: 4999, durationLabel: '无限期', highlight: true },
];

export default function Recharge() {
  const screens = Grid.useBreakpoint();
  const isMobile = !screens.md;
  const { message } = AntdApp.useApp();
  const navigate = useNavigate();
  const [selectedPackage, setSelectedPackage] = useState<RechargePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  const handleRecharge = (pkg: RechargePackage) => {
    setSelectedPackage(pkg);
    setModalVisible(true);
  };

  const confirmRecharge = async () => {
    if (!selectedPackage) return;
    setLoading(true);
    try {
      const res = (await api.orders.create({
        package_name: selectedPackage.name,
        points: selectedPackage.points + selectedPackage.bonus,
        amount: selectedPackage.price,
      })) as any;

      if (res?.success) {
        const payRes = (await api.payment.create({
          orderId: res.data?.id || res.data?.orderId,
          method: 'admin_free',
        })) as any;

        if (payRes?.success && payRes.data?.autoPaid) {
          message.success('充值已完成，页面即将刷新。');
          setTimeout(() => {
            window.location.reload();
          }, 1200);
        } else {
          message.info('订单已创建，请联系管理员完成后续处理。');
        }
      } else {
        message.error(res?.message || '创建订单失败。');
      }
    } catch (error: any) {
      message.error(error?.response?.data?.message || '充值失败，请稍后重试。');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  return (
    <div className="admin-login-shell" style={{ alignItems: 'start', paddingTop: isMobile ? 24 : 40 }}>
      <div style={{ width: 'min(1200px, 100%)' }}>
        <div className="admin-page-header" style={{ marginBottom: 18 }}>
          <div>
            <span className="admin-status-pill" style={{ marginBottom: 14 }}>
              <CrownOutlined />
              凤煌科技充值中心
            </span>
            <Typography.Title level={2} className="admin-page-title" style={{ color: '#fff' }}>
              选择适合你的授权套餐
            </Typography.Title>
            <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.78)', maxWidth: 760, marginBottom: 0 }}>
              当前用户：{user?.username || '用户'}。你可以直接选择 8 小时卡、日卡、周卡、月卡、季卡、半年卡、年卡或永久卡。
            </Typography.Paragraph>
          </div>
          <Button type="primary" icon={<FireOutlined />} onClick={() => setModalVisible(false)} style={{ display: 'none' }}>
            隐藏
          </Button>
        </div>

        <Card className="admin-panel-card" style={{ marginBottom: 18 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ maxWidth: 820 }}>
              <Typography.Title level={4} style={{ marginTop: 0, marginBottom: 8, color: '#fff' }}>
                体验码管理中心
              </Typography.Title>
              <Typography.Paragraph style={{ color: 'rgba(255,255,255,0.78)', marginBottom: 12 }}>
                体验码只允许后台生成，支持单个或批量发放，统一有效期为 7 天。一个码只能被一个账号激活一次，
                同一账号永久只能激活一次。当前只开放两档面额：75 积分（1 天）和 150 积分（7 天）。
              </Typography.Paragraph>
              <div className="admin-toolbar">
                <Tag color="blue">仅后台生成</Tag>
                <Tag color="processing">单个 / 批量发放</Tag>
                <Tag color="gold">7 天有效期</Tag>
                <Tag color="success">75 / 150 积分</Tag>
              </div>
            </div>
            <div className="admin-toolbar" style={{ alignItems: 'start' }}>
              <Button onClick={() => navigate('/experience-codes')}>进入兑换码管理</Button>
              <Button type="primary" onClick={() => navigate('/experience-code-records')}>
                查看兑换记录
              </Button>
            </div>
          </div>
        </Card>

        <div className="admin-summary-grid" style={{ marginBottom: 18 }}>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">可选套餐</div>
            <div className="admin-summary-value">{PACKAGES.length}</div>
            <div className="admin-summary-help">已按正式价格更新</div>
          </Card>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">适合体验</div>
            <div className="admin-summary-value">8h / 1d</div>
            <div className="admin-summary-help">适合临时或快速测试</div>
          </Card>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">主力方案</div>
            <div className="admin-summary-value">30d</div>
            <div className="admin-summary-help">最常用的月度授权</div>
          </Card>
          <Card className="admin-panel-card admin-summary-card">
            <div className="admin-summary-label">长期方案</div>
            <div className="admin-summary-value">永久卡</div>
            <div className="admin-summary-help">一次购买长期可用</div>
          </Card>
        </div>

        <Row gutter={[16, 16]}>
          {PACKAGES.map((pkg) => (
            <Col xs={24} sm={12} xl={6} key={pkg.id}>
              <Card
                hoverable
                className="admin-panel-card"
                style={{
                  borderColor: pkg.highlight ? 'rgba(194, 65, 12, 0.32)' : undefined,
                }}
                styles={{ body: { padding: 22 } }}
              >
                <div className="admin-toolbar" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div className="admin-detail-stack">
                    <strong style={{ fontSize: 18 }}>{pkg.name}</strong>
                    <span>{pkg.subtitle}</span>
                  </div>
                  {pkg.highlight ? <Tag color="volcano">推荐</Tag> : null}
                </div>

                <div style={{ marginTop: 18, display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>¥{pkg.price}</span>
                    <span style={{ color: '#64748b' }}>/{pkg.durationLabel}</span>
                  </div>
                  <div className="admin-toolbar">
                    <Tag color="blue">{pkg.points} 积分</Tag>
                    {pkg.bonus > 0 ? <Tag color="green">赠送 {pkg.bonus}</Tag> : <Tag>无赠送</Tag>}
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  icon={<ClockCircleOutlined />}
                  onClick={() => handleRecharge(pkg)}
                  style={{
                    marginTop: 20,
                    width: '100%',
                    background: 'linear-gradient(135deg, #c2410c 0%, #dc2626 100%)',
                    border: 'none',
                    boxShadow: '0 16px 32px rgba(194, 65, 12, 0.22)',
                  }}
                >
                  选择这个套餐
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </div>

      <Modal
        title="确认充值"
        open={modalVisible}
        onOk={confirmRecharge}
        onCancel={() => setModalVisible(false)}
        confirmLoading={loading}
        okText="确认充值"
        cancelText="取消"
        destroyOnHidden
      >
        {selectedPackage && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ fontSize: 18 }}>
              您选择的是 <strong>{selectedPackage.name}</strong>
            </p>
            <p style={{ fontSize: 24, color: '#c2410c', fontWeight: 'bold' }}>¥{selectedPackage.price}</p>
            <p style={{ color: '#0f766e' }}>将获得 {selectedPackage.points + selectedPackage.bonus} 积分</p>
            <p style={{ color: '#64748b' }}>时长：{selectedPackage.durationLabel}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}
