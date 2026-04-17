# 超无穹AI 项目规范文档 (SPEC)

## 1. 项目概述

### 1.1 项目名称
超无穹AI (Chaowuqiong AI)

### 1.2 项目描述
一个综合性的AI应用平台，提供文本生成、图像生成、视频生成、音频生成等多种AI服务，支持多端访问（Web、桌面客户端）。

### 1.3 技术栈
- **前端**: React 18 + TypeScript + Vite + SCSS
- **后端**: Node.js + Express + TypeScript
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **桌面客户端**: Electron 28
- **部署**: Nginx + PM2

## 2. 系统架构

### 2.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                        客户端层                               │
├─────────────┬─────────────┬─────────────┬──────────────────┤
│  Web浏览器   │  Electron   │   移动端     │    管理后台      │
└──────┬──────┴──────┬──────┴──────┬──────┴────────┬─────────┘
       │             │             │               │
       └─────────────┴──────┬──────┴───────────────┘
                            │
                     ┌──────▼──────┐
                     │    Nginx    │
                     │  反向代理    │
                     └──────┬──────┘
                            │
       ┌────────────────────┼────────────────────┐
       │                    │                    │
┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
│   静态资源   │      │   API服务   │      │   管理API   │
│   (前端)    │      │   (后端)    │      │   (后端)    │
└─────────────┘      └──────┬──────┘      └──────┬──────┘
                            │                    │
                     ┌──────▼──────┐      ┌──────▼──────┐
                     │    MySQL    │      │    Redis    │
                     │   数据库    │      │    缓存     │
                     └─────────────┘      └─────────────┘
```

### 2.2 目录结构
```
chaowuqiong-project/
├── apps/
│   ├── backend/           # 后端服务
│   │   ├── src/
│   │   │   ├── routes/    # API路由
│   │   │   ├── middleware/# 中间件
│   │   │   ├── utils/     # 工具函数
│   │   │   └── config/    # 配置
│   │   └── dist/          # 编译输出
│   │
│   ├── frontent/          # 前端应用
│   │   └── webuiapps/     # 主应用
│   │       ├── src/
│   │       │   ├── components/  # 组件
│   │       │   ├── pages/       # 页面
│   │       │   ├── hooks/       # Hooks
│   │       │   ├── lib/         # 工具库
│   │       │   └── styles/      # 样式
│   │       └── dist/            # 构建输出
│   │
│   └── desktop/           # 桌面客户端
│       ├── main.js        # 主进程
│       ├── preload.js     # 预加载脚本
│       └── package.json   # 配置
│
├── nginx/                 # Nginx配置
├── secrets/               # 密钥配置
└── docs/                  # 文档
```

## 3. API规范

### 3.1 基础URL
- 生产环境: `https://chaowuqiong.com/api`
- 开发环境: `http://localhost:3000/api`

### 3.2 认证方式
- JWT Token认证
- Header: `Authorization: Bearer <token>`

### 3.3 响应格式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
}
```

### 3.4 错误码
| 错误码 | 描述 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未授权 |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 4. 数据库规范

### 4.1 表命名
- 使用小写字母和下划线
- 复数形式: `users`, `orders`, `points_records`

### 4.2 字段命名
- 主键: `id` (UUID)
- 创建时间: `created_at`
- 更新时间: `updated_at`
- 软删除: `deleted_at`

### 4.3 核心表结构
```sql
-- 用户表
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
  points INT DEFAULT 0,
  membership_expires_at DATETIME,
  referral_code VARCHAR(20) UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 订单表
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  package_id VARCHAR(36),
  amount DECIMAL(10,2),
  status ENUM('pending', 'paid', 'failed', 'refunded'),
  payment_method ENUM('alipay', 'wechat'),
  trade_no VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 积分记录表
CREATE TABLE points_records (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  points INT,
  type ENUM('earn', 'spend', 'gift', 'refund'),
  description VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 5. 前端规范

### 5.1 组件命名
- PascalCase: `ChatPanel`, `RechargeCenter`
- 文件名: `index.tsx`, `index.module.scss`

### 5.2 样式规范
- 使用CSS Modules
- 响应式断点:
  - 移动端: `<= 768px`
  - 平板: `769px - 1023px`
  - 桌面: `>= 1024px`

### 5.3 状态管理
- React Context + useReducer
- 本地存储: localStorage

## 6. 安全规范

### 6.1 密码安全
- bcrypt加密 (12 rounds)
- 最小长度8位

### 6.2 JWT配置
- 过期时间: 24小时
- 刷新Token: 7天

### 6.3 API安全
- CORS白名单
- 请求频率限制
- SQL注入防护

## 7. 部署规范

### 7.1 服务器要求
- CPU: 2核+
- 内存: 4GB+
- 存储: 50GB+
- 系统: Ubuntu 22.04 / CentOS 8

### 7.2 服务配置
- Nginx: 反向代理 + 静态资源
- PM2: Node.js进程管理
- MySQL: 主数据库
- Redis: 缓存 + Session

### 7.3 域名配置
- 主域名: `chaowuqiong.com`
- API: `chaowuqiong.com/api`
- 管理后台: `chaowuqiong.com/admin`

## 8. 版本规范

### 8.1 版本号格式
- 主版本.次版本.修订版本
- 示例: `1.0.0`, `1.1.0`, `1.1.1`

### 8.2 发布流程
1. 开发分支开发
2. 测试环境验证
3. 生产环境部署
4. 版本标签发布
