# 超无穹AI 设计文档 (Design)

## 1. 系统设计

### 1.1 系统架构图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              客户端层                                     │
├─────────────────┬─────────────────┬─────────────────┬──────────────────┤
│    Web Browser  │    Electron     │   Mobile Web    │    Admin Panel   │
│   (React SPA)   │   (Desktop)     │   (Responsive)  │   (React SPA)    │
└────────┬────────┴────────┬────────┴────────┬────────┴────────┬─────────┘
         │                 │                 │                 │
         └─────────────────┴────────┬────────┴─────────────────┘
                                      │
                              ┌───────▼───────┐
                              │     Nginx     │
                              │  (反向代理)    │
                              └───────┬───────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
  ┌──────▼──────┐              ┌──────▼──────┐              ┌──────▼──────┐
  │  静态资源    │              │  API服务    │              │  WebSocket  │
  │  (前端)     │              │  (Express)  │              │   (实时)    │
  └─────────────┘              └──────┬──────┘              └──────┬──────┘
                                      │                            │
         ┌────────────────────────────┼────────────────────────────┤
         │                            │                            │
  ┌──────▼──────┐              ┌──────▼──────┐              ┌──────▼──────┐
  │    MySQL    │              │    Redis    │              │  第三方API  │
  │   (主数据库) │              │   (缓存)    │              │ (AI/支付等) │
  └─────────────┘              └─────────────┘              └─────────────┘
```

### 1.2 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | 组件化开发 |
| 构建工具 | Vite | 快速构建 |
| 状态管理 | Context + Hooks | 轻量级方案 |
| 样式方案 | SCSS Modules | CSS隔离 |
| 后端框架 | Express | Node.js框架 |
| 数据库 | MySQL 8.0 | 关系型数据库 |
| 缓存 | Redis | 会话/缓存 |
| 桌面端 | Electron | 跨平台客户端 |

## 2. 数据库设计

### 2.1 ER图

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │   orders    │       │   packages  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ id (PK)     │
│ username    │   │   │ user_id(FK) │───┘   │ name        │
│ email       │   │   │ package_id  │───┐   │ price       │
│ password    │   │   │ amount      │   │   │ duration    │
│ points      │   │   │ status      │   │   │ points      │
│ role        │   │   │ trade_no    │   │   └─────────────┘
│ referral_   │   │   │ created_at  │   │
│ code        │   │   └─────────────┘   │
│ created_at  │   │                     │
└─────────────┘   │                     │
      │           │                     │
      │     ┌─────▼─────────┐           │
      │     │points_records │           │
      │     ├───────────────┤           │
      └────►│ id (PK)       │           │
            │ user_id (FK)  │           │
            │ points        │           │
            │ type          │           │
            │ description   │           │
            │ created_at    │           │
            └───────────────┘           │
                                        │
      ┌─────────────┐                   │
      │  referrals  │                   │
      ├─────────────┤                   │
      │ id (PK)     │                   │
      │ referrer_id │◄──────────────────┘
      │ referee_id  │
      │ reward_pts  │
      │ created_at  │
      └─────────────┘
```

### 2.2 表结构详情

#### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | VARCHAR(36) | UUID主键 |
| username | VARCHAR(50) | 用户名 |
| email | VARCHAR(100) | 邮箱 |
| password | VARCHAR(255) | bcrypt加密密码 |
| points | INT | 积分余额 |
| role | ENUM | 角色: user/admin/super_admin |
| membership_expires_at | DATETIME | 会员到期时间 |
| referral_code | VARCHAR(20) | 邀请码 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 3. API设计

### 3.1 API列表

#### 认证相关
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 用户登出 |
| GET | /api/auth/me | 获取当前用户 |
| POST | /api/auth/refresh | 刷新Token |

#### 用户相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/user/profile | 获取用户信息 |
| PUT | /api/user/profile | 更新用户信息 |
| PUT | /api/user/password | 修改密码 |

#### 支付相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/packages | 获取套餐列表 |
| POST | /api/payment/create | 创建支付订单 |
| POST | /api/payment/alipay/callback | 支付宝回调 |
| POST | /api/payment/wechat/callback | 微信回调 |

#### 邀请相关
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/referral/stats | 邀请统计 |
| GET | /api/referral/records | 邀请记录 |
| POST | /api/referral/enter | 填写邀请码 |

### 3.2 请求/响应示例

```typescript
// 创建支付请求
POST /api/payment/create
Request: {
  packageId: string;
  paymentMethod: 'alipay' | 'wechat';
}
Response: {
  success: boolean;
  data: {
    orderId: string;
    qrCode: string;
    amount: number;
  }
}

// 支付回调
POST /api/payment/alipay/callback
Request: {
  out_trade_no: string;
  trade_no: string;
  trade_status: string;
  // ... 支付宝回调参数
}
Response: 'success' | 'fail'
```

## 4. 前端设计

### 4.1 页面结构

```
App
├── LoginGate          # 登录/注册页
├── Shell              # 主框架
│   ├── Desktop        # 桌面图标区
│   ├── ChatPanel      # 聊天面板
│   ├── BottomBar      # 底部工具栏
│   └── MobileTabBar   # 移动端标签栏
├── RechargeCenter     # 充值中心
└── Settings           # 设置页面
```

### 4.2 组件设计

#### ChatPanel 组件
```typescript
interface ChatPanelProps {
  characterId?: string;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  emotion?: string;
}
```

#### RechargeCenter 组件
```typescript
interface Package {
  id: string;
  name: string;
  price: number;
  duration: number;
  durationUnit: 'hour' | 'day' | 'week' | 'month' | 'year' | 'permanent';
  points: number;
  recommended?: boolean;
}
```

### 4.3 状态管理

```typescript
// AuthContext
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// PointsContext
interface PointsState {
  balance: number;
  history: PointsRecord[];
}
```

## 5. 安全设计

### 5.1 认证流程

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Client │     │  Server │     │  MySQL  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ POST /login   │               │
     │──────────────►│               │
     │               │  Query user   │
     │               │──────────────►│
     │               │◄──────────────│
     │               │               │
     │               │ bcrypt.compare│
     │               │               │
     │  JWT Token    │               │
     │◄──────────────│               │
     │               │               │
     │ API Request   │               │
     │ + Bearer Token│               │
     │──────────────►│               │
     │               │ verify JWT    │
     │               │──────────────►│
     │  Response     │               │
     │◄──────────────│               │
```

### 5.2 安全措施

| 威胁 | 防护措施 |
|------|----------|
| 密码泄露 | bcrypt加密存储 |
| Token劫持 | HTTPS + HttpOnly Cookie |
| SQL注入 | 参数化查询 |
| XSS攻击 | 输入过滤 + CSP |
| CSRF攻击 | SameSite Cookie |
| 暴力破解 | 频率限制 |

## 6. 部署设计

### 6.1 服务器架构

```
┌─────────────────────────────────────────────────────────┐
│                    115.190.158.182                       │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Nginx     │  │   Node.js   │  │   MySQL     │     │
│  │   :80/443   │  │   :3000     │  │   :3306     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Redis     │  │    PM2      │  │   SSL证书   │     │
│  │   :6379     │  │  进程管理   │  │  Let's Encrypt│    │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Nginx配置

```nginx
server {
    listen 80;
    server_name chaowuqiong.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chaowuqiong.com;

    ssl_certificate /etc/letsencrypt/live/chaowuqiong.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/chaowuqiong.com/privkey.pem;

    # 前端静态资源
    location / {
        root /var/www/chaowuqiong/apps/webuiapps/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
