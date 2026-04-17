# 超无穹系统升级项目规划

## 项目概述

### 目标
将超无穹系统升级为全平台支持的应用，包括：
- 移动端适配（响应式设计）
- 桌面客户端（Electron）
- 多登录方式（微信扫码/手机号/邮箱）
- 新充值套餐体系
- 拉新机制（积分奖励+返现）
- 支付系统集成（微信/支付宝）

---

## 一、充值套餐体系

### 时长套餐

| 套餐名称 | 时长 | 价格 | 积分 | 备注 |
|---------|------|------|------|------|
| 体验卡 | 2小时 | 免费 | 0 | 新用户限2次，每天1次 |
| 8小时卡 | 8小时 | ¥9.9 | 50 | - |
| 日卡 | 1天 | ¥14.9 | 75 | - |
| 周卡 | 7天 | ¥29.9 | 150 | - |
| 月卡 | 30天 | ¥79.9 | 400 | - |
| 季卡 | 90天 | ¥299 | 1500 | - |
| 半年卡 | 180天 | ¥699 | 3500 | - |
| 年卡 | 365天 | ¥999 | 5000 | - |
| 永久卡 | 无限期 | ¥4999 | 9999999 | - |

### 积分兑换时长
- 75积分 = 日卡 (1天)
- 150积分 = 周卡 (7天)
- 400积分 = 月卡 (30天)

---

## 二、拉新机制

### A用户拉新奖励

| 被拉用户类型 | A用户奖励 |
|-------------|----------|
| 体验用户 | 75积分（相当于周卡积分，可兑换日卡/8小时卡） |
| 付费用户 | 返现25%（不支持退款） |

### 体验卡规则
- 每个新用户仅限2次体验卡
- 每天只能使用1次
- 共2天体验时间

---

## 三、登录系统

### 支持的登录方式
1. **微信扫码登录** - 扫码后自动注册/登录
2. **手机号注册/登录** - 短信验证码
3. **邮箱注册/登录** - 邮箱验证码，可找回密码
4. **账号密码登录** - 传统方式

### 账号绑定
- 支持绑定微信/手机/邮箱
- 绑定后可通过任意方式登录
- 支持找回密码

---

## 四、支付系统

### 支付方式
1. **微信扫码支付** - 生成二维码，用户扫码支付
2. **支付宝支付** - 生成二维码，用户扫码支付

### 支付流程
1. 用户选择套餐
2. 选择支付方式
3. 生成支付二维码
4. 轮询支付状态
5. 支付成功后自动激活时长

---

## 五、技术架构

### 前端
- React 18 + TypeScript
- Vite 构建
- 响应式设计（Mobile First）
- Electron 桌面端打包

### 后端
- Node.js + Express + TypeScript
- MySQL 数据库
- Redis 缓存
- 微信/支付宝 API 集成

### 桌面客户端
- Electron
- 自动更新
- 本地缓存

---

## 六、模块分解

### Phase 1: 基础设施
- [ ] 数据库表设计更新
- [ ] 后端API重构
- [ ] 套餐数据迁移

### Phase 2: 登录系统
- [ ] 微信扫码登录
- [ ] 手机号验证码
- [ ] 邮箱验证码
- [ ] 账号绑定

### Phase 3: 充值系统
- [ ] 新套餐展示
- [ ] 体验卡逻辑
- [ ] 积分兑换
- [ ] 时长统计

### Phase 4: 拉新机制
- [ ] 邀请码系统
- [ ] 积分奖励
- [ ] 返现逻辑

### Phase 5: 支付系统
- [ ] 微信支付集成
- [ ] 支付宝支付集成
- [ ] 支付回调处理

### Phase 6: 多端适配
- [ ] 移动端响应式
- [ ] Electron桌面端
- [ ] 打包发布

---

## 七、数据库设计

### recharge_packages (充值套餐表)
```sql
CREATE TABLE recharge_packages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type ENUM('hours', 'days', 'permanent') NOT NULL,
    duration INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    points INT NOT NULL,
    is_trial BOOLEAN DEFAULT FALSE,
    trial_limit INT DEFAULT 0,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE
);
```

### user_invitations (邀请记录表)
```sql
CREATE TABLE user_invitations (
    id VARCHAR(36) PRIMARY KEY,
    inviter_id VARCHAR(36) NOT NULL,
    invitee_id VARCHAR(36),
    invite_code VARCHAR(20) NOT NULL,
    status ENUM('pending', 'registered', 'paid') DEFAULT 'pending',
    reward_points INT DEFAULT 0,
    reward_cash DECIMAL(10,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### user_durations (用户时长表)
```sql
CREATE TABLE user_durations (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    package_id INT,
    duration_seconds BIGINT NOT NULL,
    remaining_seconds BIGINT NOT NULL,
    started_at DATETIME,
    expires_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE
);
```

### user_trial_usage (体验卡使用记录)
```sql
CREATE TABLE user_trial_usage (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    used_at DATE NOT NULL,
    UNIQUE KEY uk_user_date (user_id, used_at)
);
```
