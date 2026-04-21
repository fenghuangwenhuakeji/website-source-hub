# 超无穹项目重构 - 架构设计文档

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-23 |
| 项目名称 | 超无穹 - AI创作平台 |
| 云平台 | 火山引擎 |

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              用户端 (Browser/Electron)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   Web UI (React) │  │ Desktop Client  │  │   Mobile Web    │          │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘          │
│           │                    │                    │                     │
│           └────────────────────┼────────────────────┘                   │
│                                │ Election Client                          │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          Nginx 反向代理 (端口 80/443)                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │   /api/*       │  │   /static/*     │  │   /*            │          │
│  │   -> Backend   │  │   -> CDN/OSS    │  │   -> Frontend   │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  火山云 ECS      │    │  火山云 RDS     │    │  火山云 Redis    │
│  (后端服务)      │    │  (MySQL 8.0)    │    │  (缓存)          │
│  端口: 3000     │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘

                          Election Cluster (云端)
```

### 1.2 Election 分布式架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      Election Cluster (云端)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │
│  │   Leader    │◄─│  Follower   │  │  Follower   │              │
│  │  (主节点)   │  │  (从节点1)  │  │  (从节点2)  │              │
│  └──────┬──────┘  └─────────────┘  └─────────────┘              │
│         │                                                        │
│         │ Raft Protocol                                          │
│         ▼                                                        │
│  ┌─────────────────────────────────────────┐                    │
│  │           Election State Machine         │                    │
│  │  - 领袖选举    - 日志复制    - 状态同步   │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Election Client (客户端)                     │
│  ┌─────────────────────────────────────────┐                    │
│  │           Election Engine               │                    │
│  │  - 本地状态机  - 命令队列    - 共识同步   │                    │
│  └─────────────────────────────────────────┘                    │
│                                                                 │
│  本地Election → 云端Election → 状态同步                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 技术栈

### 2.1 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.x | UI框架 |
| TypeScript | 5.4.x | 类型安全 |
| Vite | 5.4.x | 构建工具 |
| TailwindCSS | 3.4.x | 样式框架 |
| Zustand | 4.5.x | 状态管理 |
| React Router | 6.22.x | 路由管理 |
| React Query | 5.x | 数据获取 |
| Zod | 3.22.x | 数据验证 |
| i18next | 23.x | 国际化 |

### 2.2 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 20.x LTS | 运行时 |
| Express | 4.18.x | Web框架 |
| TypeScript | 5.4.x | 开发语言 |
| MySQL | 8.0 | 主数据库 |
| Redis | 7.x | 缓存/会话 |
| JWT | 9.x | 认证 |
| bcrypt | 2.4.x | 密码加密 |

### 2.3 支付集成

| 技术 | 用途 |
|------|------|
| 微信支付 Native | 扫码支付 |
| 支付宝当面付 | 扫码支付 |
| 火山云OSS | 凭证存储 |

---

## 3. 项目结构

```
d:\网站部署\chaowuqiong-project/
├── apps/
│   ├── web/                      # 前端 (React + TypeScript)
│   │   ├── src/
│   │   │   ├── components/       # 通用组件
│   │   │   ├── pages/           # 页面
│   │   │   ├── layouts/         # 布局
│   │   │   ├── store/           # 状态管理
│   │   │   ├── hooks/           # 自定义hooks
│   │   │   ├── services/        # API服务
│   │   │   ├── types/          # 类型定义
│   │   │   ├── utils/          # 工具函数
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tsconfig.json
│   │
│   └── backend/                  # 后端 (Node.js + TypeScript)
│       ├── src/
│       │   ├── config/          # 配置
│       │   ├── middleware/      # 中间件
│       │   ├── routes/         # 路由
│       │   ├── services/       # 业务逻辑
│       │   ├── models/         # 数据模型
│       │   ├── types/          # 类型定义
│       │   ├── utils/          # 工具函数
│       │   ├── election/       # Election分布式
│       │   ├── payment/        # 支付集成
│       │   ├── app.ts
│       │   └── admin-app.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                   # 共享代码
│       ├── src/
│       │   ├── types/
│       │   ├── utils/
│       │   └── constants/
│       └── package.json
│
├── docker/                       # Docker配置
├── nginx/                        # Nginx配置
├── scripts/                      # 部署脚本
│
├── package.json                  # Workspace配置
├── turbo.json                    # Turborepo配置
└── README.md
```

---

## 4. 核心功能模块

### 4.1 认证系统

```
┌─────────────────────────────────────────────────┐
│                   认证流程                        │
├─────────────────────────────────────────────────┤
│  登录 ──┬── 用户名/密码 ──→ JWT Token            │
│         │                                        │
│         ├── 微信扫码 ──→ OpenID ──→ 绑定账号      │
│         │                                        │
│         └── 邮箱验证 ──→ 重置密码                │
└─────────────────────────────────────────────────┘
```

### 4.2 充值系统

```
┌─────────────────────────────────────────────────┐
│                   充值流程                        │
├─────────────────────────────────────────────────┤
│  选择套餐 ──→ 选择支付方式 ──→ 生成订单          │
│     │           │             │                  │
│     │           │             ▼                  │
│     │           │      ┌─────────────┐           │
│     │           │      │  微信/支付宝 │           │
│     │           │      │   二维码    │           │
│     │           │      └──────┬──────┘           │
│     │           │             │                  │
│     ▼           ▼             ▼                  │
│  积分到账    支付回调    订单状态查询              │
└─────────────────────────────────────────────────┘
```

### 4.3 积分系统

```
┌─────────────────────────────────────────────────┐
│                   积分系统                        │
├─────────────────────────────────────────────────┤
│  积分来源:                                        │
│  ├── 充值获得 (1元 = 10积分)                     │
│  ├── 邀请奖励 (新用户首充10%返利)                │
│  └── 活动奖励 (限时翻倍等)                       │
│                                                  │
│  积分消耗:                                        │
│  ├── AI生成 (按token计费)                       │
│  ├── 高级功能解锁                                │
│  └── 商城兑换                                    │
└─────────────────────────────────────────────────┘
```

### 4.4 Election 分布式系统

```
┌─────────────────────────────────────────────────┐
│                   Election 设计                  │
├─────────────────────────────────────────────────┤
│  云端 Election Cluster:                          │
│  ├── Leader节点 (处理写请求)                    │
│  ├── Follower节点 (投票 + 读请求)               │
│  └── 状态同步 (Raft协议)                        │
│                                                  │
│  客户端 Election Engine:                         │
│  ├── 本地命令队列                               │
│  ├── 乐观更新                                   │
│  └── 与云端同步                                 │
│                                                  │
│  数据一致性:                                      │
│  ├── 强一致性 (关键操作: 充值、扣费)            │
│  └── 最终一致性 (普通操作: 阅读、收藏)           │
└─────────────────────────────────────────────────┘
```

---

## 5. 数据库设计

### 5.1 核心表结构

```sql
-- 用户表
users
├── id (PK, BIGINT)
├── username (VARCHAR 50, UNIQUE)
├── email (VARCHAR 100, UNIQUE)
├── phone (VARCHAR 20, UNIQUE)
├── password_hash (VARCHAR 255)
├── nickname (VARCHAR 50)
├── avatar_url (VARCHAR 500)
├── role (ENUM: user, admin)
├── status (ENUM: active, banned, inactive)
├── points (BIGINT, DEFAULT 0)        -- 积分余额
├── total_recharge (DECIMAL 10,2)     -- 累计充值
├── wechat_openid (VARCHAR 100)
├── wechat_unionid (VARCHAR 100)
├── email_verified (BOOLEAN)
├── locked_until (DATETIME)
├── login_attempts (INT)
├── created_at (DATETIME)
└── last_login_at (DATETIME)

-- 充值订单表
recharge_orders
├── id (PK, VARCHAR 36)              -- UUID
├── order_no (VARCHAR 50, UNIQUE)    -- 订单号
├── user_id (FK -> users.id)
├── amount (DECIMAL 10,2)            -- 充值金额(元)
├── points (BIGINT)                   -- 获得积分
├── bonus_points (BIGINT)             -- 赠送积分
├── product_name (VARCHAR 100)        -- 产品名称
├── status (ENUM: pending, paid, expired, refunded)
├── pay_method (ENUM: wechat, alipay)
├── pay_time (DATETIME)
├── expire_time (DATETIME)
├── created_at (DATETIME)
└── updated_at (DATETIME)

-- 积分变动表
points_log
├── id (PK, BIGINT)
├── user_id (FK -> users.id)
├── type (ENUM: recharge, consume, refund, reward)
├── amount (BIGINT)                  -- 变动数量(正/负)
├── balance_before (BIGINT)          -- 变动前余额
├── balance_after (BIGINT)           -- 变动后余额
├── order_id (VARCHAR 36, NULL)       -- 关联订单
├── description (VARCHAR 255)         -- 说明
├── created_at (DATETIME)
└── election_id (VARCHAR 36)          -- Election事务ID

-- 作品表
novels
├── id (PK, BIGINT)
├── author_id (FK -> users.id)
├── title (VARCHAR 200)
├── cover_url (VARCHAR 500)
├── description (TEXT)
├── genre (VARCHAR 50)
├── tags (JSON)
├── status (ENUM: ongoing, completed, paused)
├── word_count (INT)
├── view_count (BIGINT)
├── like_count (BIGINT)
├── chapter_count (INT)
├── is_published (BOOLEAN)
├── created_at (DATETIME)
└── updated_at (DATETIME)

-- 章节表
chapters
├── id (PK, BIGINT)
├── novel_id (FK -> novels.id)
├── chapter_number (INT)
├── title (VARCHAR 200)
├── content (LONGTEXT)
├── word_count (INT)
├── status (ENUM: draft, published)
├── created_at (DATETIME)
└── updated_at (DATETIME)

-- AI生成记录表
generation_logs
├── id (PK, BIGINT)
├── user_id (FK -> users.id)
├── type (ENUM: image, text, audio, video)
├── input_tokens (INT)
├── output_tokens (INT)
├── points_cost (BIGINT)
├── model (VARCHAR 50)
├── prompt (TEXT)
├── result_url (VARCHAR 500)
├── status (ENUM: success, failed)
├── created_at (DATETIME)
└── election_id (VARCHAR 36)
```

### 5.2 Election 相关表

```sql
-- Election 事务日志
election_log
├── id (PK, VARCHAR 36)
├── term (BIGINT)                     -- Raft Term
├── type (ENUM: write, read)
├── key (VARCHAR 100)
├── value (TEXT)
├── client_id (VARCHAR 36)
├── status (ENUM: pending, committed, applied)
├── created_at (DATETIME)
└── committed_at (DATETIME)

-- Election 集群节点
election_nodes
├── id (PK, BIGINT)
├── node_id (VARCHAR 36, UNIQUE)
├── host (VARCHAR 255)
├── port (INT)
├── role (ENUM: leader, follower, candidate)
├── last_active_at (DATETIME)
├── vote_count (INT)
└── created_at (DATETIME)
```

---

## 6. API 设计

### 6.1 认证接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/auth/register | 用户注册 | 否 |
| POST | /api/auth/login | 用户登录 | 否 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/auth/me | 获取当前用户 | 是 |
| POST | /api/auth/refresh | 刷新Token | 是 |
| POST | /api/auth/wechat/login | 微信登录 | 否 |
| POST | /api/auth/wechat/bind | 微信绑定账号 | 是 |

### 6.2 用户接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/user/profile | 获取用户资料 | 是 |
| PUT | /api/user/profile | 更新用户资料 | 是 |
| PUT | /api/user/password | 修改密码 | 是 |
| GET | /api/user/points | 获取积分余额 | 是 |
| GET | /api/user/points/log | 获取积分变动记录 | 是 |

### 6.3 充值接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/recharge/products | 获取充值套餐 | 否 |
| POST | /api/recharge/create | 创建充值订单 | 是 |
| GET | /api/recharge/orders | 获取充值记录 | 是 |
| GET | /api/recharge/order/:id | 获取订单详情 | 是 |
| GET | /api/recharge/qr/:orderId | 获取支付二维码 | 是 |

### 6.4 支付回调

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| POST | /api/payment/wechat/callback | 微信支付回调 | 签名 |
| POST | /api/payment/alipay/callback | 支付宝回调 | 签名 |
| GET | /api/payment/query/:orderNo | 查询订单状态 | 是 |

### 6.5 Election 接口

| 方法 | 路径 | 描述 | 认证 |
|------|------|------|------|
| GET | /api/election/status | 获取集群状态 | 是 |
| POST | /api/election/submit | 提交操作 | 是 |
| GET | /api/election/sync/:clientId | 同步客户端状态 | 是 |
| GET | /api/election/leader | 获取Leader节点 | 是 |

---

## 7. 部署架构

### 7.1 火山云服务器配置

| 配置项 | 规格 |
|--------|------|
| 云平台 | 火山引擎 ECS |
| 实例规格 | 4vCPU / 8GB |
| 系统盘 | 100GB SSD |
| 公网带宽 | 10Mbps |
| 操作系统 | Ubuntu 22.04 LTS |
| 数据库 | 火山云 RDS MySQL 8.0 |
| 缓存 | 火山云 Redis 7.0 |

### 7.2 目录结构

```
/var/www/chaowuqiong/
├── apps/
│   ├── web/
│   │   └── dist/                  # 前端构建产物
│   └── backend/
│       ├── dist/                  # 后端编译产物
│       └── node_modules/
├── logs/
│   ├── nginx/
│   └── pm2/
├── backup/
├── scripts/
└── .env
```

### 7.3 Nginx 配置

```nginx
server {
    listen 80;
    server_name chaowuqiong.com www.chaowuqiong.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name chaowuqiong.com www.chaowuqiong.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /var/www/chaowuqiong/apps/web/dist;
    index index.html;

    # 前端路由
    location / {
        try_files $uri $uri/ /index.html;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }

    # API 反向代理
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket 支持 (Election)
    location /ws {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 8. 性能优化

### 8.1 前端优化

- 代码分割 (Code Splitting)
- 懒加载 (Lazy Loading)
- 资源压缩 (Terser)
- CDN加速
- 缓存策略 (Service Worker)

### 8.2 后端优化

- 数据库连接池
- Redis缓存
- 请求限流
- 日志优化
- Cluster模式

### 8.3 Election 优化

- 批量提交
- 读写分离
- 增量同步
- 本地缓存

---

## 9. 安全设计

### 9.1 认证

- JWT Token (24h有效期)
- Refresh Token (7天有效期)
- 密码加盐 (bcrypt, 12轮)

### 9.2 支付安全

- 微信/支付宝签名验证
- 回调IP白名单
- 订单超时机制 (30分钟)

### 9.3 接口安全

- CORS配置
- 请求限流
- 输入验证 (Zod)
- SQL注入防护

---

**文档版本**: v1.0.0
**创建日期**: 2026-03-23
