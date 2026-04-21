# 超无穹系统全面升级规格文档

## 项目概述

### 目标
对超无穹桌面系统进行全面升级，包括：
1. 移动端适配 - 所有APP和页面支持移动端
2. 桌面客户端 - 开发可下载的EXE客户端
3. 登录系统重构 - 支持微信扫码、手机号、邮箱
4. 充值系统改版 - 优化支付体验

### 技术栈
- **前端**: React 18 + TypeScript + Vite
- **桌面端**: Electron (推荐) 或 Tauri
- **后端**: Node.js + Express
- **数据库**: MySQL
- **支付**: 微信支付 + 支付宝

---

## 1. 移动端适配

### 1.1 适配范围

| 模块 | 优先级 | 说明 |
|------|--------|------|
| LoginGate | P0 | 登录注册页面 |
| RechargeCenter | P0 | 充值中心 |
| Shell/Desktop | P0 | 主桌面 |
| ChatPanel | P0 | AI对话面板 |
| 所有内置APP | P1 | 音乐、日记、棋类等 |
| 外部项目 | P1 | 短篇、长篇、小说漫剧 |

### 1.2 响应式断点

```scss
// 移动端优先
$breakpoints: (
  'xs': 0,      // 手机竖屏
  'sm': 576px,  // 手机横屏/小平板
  'md': 768px,  // 平板
  'lg': 992px,  // 小桌面
  'xl': 1200px, // 桌面
  'xxl': 1400px // 大桌面
);
```

### 1.3 移动端设计规范

- **触摸目标**: 最小44x44px
- **字体大小**: 最小16px（避免iOS缩放）
- **间距**: 使用相对单位（rem/vw）
- **导航**: 底部Tab栏替代侧边栏
- **手势**: 支持滑动、捏合等手势

---

## 2. 桌面客户端

### 2.1 技术选型

**推荐: Electron**
- 成熟稳定
- 完整的Node.js API访问
- 丰富的生态
- 易于调试

**备选: Tauri**
- 更小的包体积
- 更好的性能
- Rust后端

### 2.2 功能需求

| 功能 | 说明 |
|------|------|
| 自动更新 | 检测新版本并自动下载安装 |
| 系统托盘 | 最小化到托盘，快速启动 |
| 离线支持 | 缓存数据，支持离线查看 |
| 桌面通知 | 新消息桌面通知 |
| 快捷键 | 全局快捷键支持 |
| 数据同步 | 与云端数据实时同步 |

### 2.3 窗口配置

```javascript
// 主窗口配置
{
  width: 1280,
  height: 800,
  minWidth: 800,
  minHeight: 600,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    preload: 'preload.js'
  }
}
```

---

## 3. 登录系统重构

### 3.1 登录方式

| 方式 | 优先级 | 说明 |
|------|--------|------|
| 微信扫码登录 | P0 | 网页端+桌面端 |
| 手机号+验证码 | P0 | 注册/登录/找回密码 |
| 邮箱+密码 | P0 | 注册/登录/找回密码 |
| 账号密码 | P1 | 保留兼容 |

### 3.2 注册流程

```
方式1: 手机号注册
输入手机号 → 发送验证码 → 输入验证码 → 设置密码 → 完成注册

方式2: 邮箱注册
输入邮箱 → 发送验证邮件 → 点击验证链接 → 设置密码 → 完成注册

方式3: 微信注册
微信扫码 → 授权 → 绑定手机号/邮箱 → 完成注册
```

### 3.3 找回密码

```
方式1: 手机号找回
输入手机号 → 发送验证码 → 验证 → 重置密码

方式2: 邮箱找回
输入邮箱 → 发送重置链接 → 点击链接 → 重置密码
```

### 3.4 微信扫码登录实现

```typescript
// 微信OAuth2流程
interface WechatLoginFlow {
  // 1. 获取二维码
  getQRCode(): Promise<{ ticket: string; url: string }>;
  
  // 2. 轮询扫码状态
  pollStatus(ticket: string): Promise<{
    status: 'waiting' | 'scanned' | 'confirmed' | 'expired';
    userInfo?: WechatUserInfo;
  }>;
  
  // 3. 确认登录
  confirmLogin(ticket: string): Promise<{ token: string; user: User }>;
}
```

---

## 4. 充值系统改版

### 4.1 充值方式

| 方式 | 优先级 | 说明 |
|------|--------|------|
| 微信支付 | P0 | 扫码支付 |
| 支付宝 | P0 | 扫码支付 |
| 积分兑换 | P0 | 使用积分兑换时长 |

### 4.2 会员套餐

```typescript
interface MembershipPackage {
  id: string;
  name: string;
  duration: number;        // 时长
  durationUnit: 'hour' | 'day' | 'month' | 'year' | 'permanent';
  price: number;           // 价格（元）
  points: number;          // 赠送积分
  features: string[];      // 包含功能
  isPopular?: boolean;     // 是否推荐
}

// 套餐列表
const packages: MembershipPackage[] = [
  { id: '2h', name: '2小时体验', duration: 2, durationUnit: 'hour', price: 0, points: 0 },
  { id: '8h', name: '8小时', duration: 8, durationUnit: 'hour', price: 9.9, points: 50 },
  { id: '1d', name: '日卡', duration: 1, durationUnit: 'day', price: 14.9, points: 75 },
  { id: '7d', name: '周卡', duration: 7, durationUnit: 'day', price: 29.9, points: 150, isPopular: true },
  { id: '30d', name: '月卡', duration: 30, durationUnit: 'day', price: 79.9, points: 400 },
  { id: '90d', name: '季卡', duration: 90, durationUnit: 'day', price: 199, points: 1000 },
  { id: '365d', name: '年卡', duration: 365, durationUnit: 'day', price: 599, points: 3000 },
  { id: 'permanent', name: '永久', duration: -1, durationUnit: 'permanent', price: 1999, points: 10000 },
];
```

### 4.3 积分系统

```typescript
interface PointsSystem {
  // 获取积分
  earnPoints: {
    recharge: (amount: number) => number;  // 充值赠送
    dailyCheckIn: () => number;            // 每日签到
    inviteFriend: () => number;            // 邀请好友
    completeTask: (taskId: string) => number; // 完成任务
  };
  
  // 使用积分
  usePoints: {
    exchangeTime: (hours: number) => boolean;  // 兑换时长
    buyItem: (itemId: string) => boolean;      // 购买道具
  };
}
```

---

## 5. 数据库设计

### 5.1 用户表扩展

```sql
-- 用户表新增字段
ALTER TABLE users ADD COLUMN phone VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN email VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN wechat_openid VARCHAR(100) UNIQUE;
ALTER TABLE users ADD COLUMN wechat_unionid VARCHAR(100);
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_login_method VARCHAR(20);
```

### 5.2 验证码表

```sql
CREATE TABLE verification_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  target VARCHAR(100) NOT NULL,        -- 手机号或邮箱
  type ENUM('phone', 'email') NOT NULL,
  code VARCHAR(10) NOT NULL,
  purpose ENUM('register', 'login', 'reset_password') NOT NULL,
  expires_at DATETIME NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_target_type (target, type),
  INDEX idx_expires (expires_at)
);
```

---

## 6. API设计

### 6.1 登录相关

```typescript
// 发送验证码
POST /api/auth/send-code
Body: { target: string; type: 'phone' | 'email'; purpose: string }

// 手机号注册
POST /api/auth/register-phone
Body: { phone: string; code: string; password: string }

// 邮箱注册
POST /api/auth/register-email
Body: { email: string; code: string; password: string }

// 手机号登录
POST /api/auth/login-phone
Body: { phone: string; code: string } | { phone: string; password: string }

// 邮箱登录
POST /api/auth/login-email
Body: { email: string; password: string }

// 微信扫码登录
GET /api/auth/wechat/qrcode      // 获取二维码
GET /api/auth/wechat/poll/:ticket // 轮询状态
POST /api/auth/wechat/confirm    // 确认登录

// 找回密码
POST /api/auth/forgot-password
Body: { target: string; type: 'phone' | 'email' }

// 重置密码
POST /api/auth/reset-password
Body: { token: string; newPassword: string }
```

### 6.2 支付相关

```typescript
// 创建订单
POST /api/orders/create
Body: { packageId: string; paymentMethod: 'wechat' | 'alipay' }
Response: { orderId: string; qrCode: string; payUrl: string }

// 查询订单状态
GET /api/orders/:id/status
Response: { status: 'pending' | 'paid' | 'failed'; paidAt?: Date }

// 支付回调
POST /api/payment/callback/wechat
POST /api/payment/callback/alipay
```

---

## 7. 项目结构

```
chaowuqiong-project/
├── apps/
│   ├── webuiapps/          # Web端 (React)
│   ├── desktop/            # 桌面端 (Electron)
│   ├── license-backend/    # 后端API
│   └── react-admin/        # 管理后台
├── agents/                 # Agent文档
├── 短篇/                   # 外部项目
├── 长篇/
├── 小说漫剧/
└── packages/
    ├── shared/             # 共享代码
    └── ui-components/      # UI组件库
```

---

## 8. 开发计划

### Phase 1: 基础架构 (Week 1)
- [ ] 移动端响应式框架搭建
- [ ] 桌面端Electron项目初始化
- [ ] 数据库表结构更新

### Phase 2: 登录系统 (Week 2)
- [ ] 手机号登录/注册
- [ ] 邮箱登录/注册
- [ ] 微信扫码登录
- [ ] 找回密码

### Phase 3: 移动端适配 (Week 3-4)
- [ ] 登录注册页适配
- [ ] 充值中心适配
- [ ] 主桌面适配
- [ ] 所有APP适配

### Phase 4: 桌面客户端 (Week 4-5)
- [ ] 基础窗口框架
- [ ] 自动更新
- [ ] 系统托盘
- [ ] 离线缓存

### Phase 5: 充值系统 (Week 5)
- [ ] 新套餐设计
- [ ] 积分系统
- [ ] 支付优化

### Phase 6: 测试部署 (Week 6)
- [ ] 功能测试
- [ ] 移动端测试
- [ ] 桌面端测试
- [ ] 生产部署

---

## 9. 验收标准

### 功能验收
- [ ] 支持手机号注册/登录
- [ ] 支持邮箱注册/登录
- [ ] 支持微信扫码登录
- [ ] 支持找回密码
- [ ] 所有页面移动端适配
- [ ] 桌面客户端可正常运行
- [ ] 支付功能正常

### 性能验收
- [ ] 移动端首屏加载 < 3s
- [ ] 桌面端启动 < 5s
- [ ] 接口响应 < 500ms

### 兼容性验收
- [ ] iOS Safari 正常
- [ ] Android Chrome 正常
- [ ] Windows 桌面端正常
- [ ] macOS 桌面端正常
