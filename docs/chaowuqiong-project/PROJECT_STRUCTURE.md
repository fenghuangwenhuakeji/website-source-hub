# 超无穹项目结构说明

## 目录结构

```
chaowuqiong-project/
├── apps/                       # 应用目录
│   └── backend/               # 后端API服务 (TypeScript + Express)
│       ├── src/               # 源代码
│       │   ├── routes/        # API路由
│       │   ├── middleware/    # 中间件
│       │   ├── config/        # 配置文件
│       │   └── types/         # 类型定义
│       ├── dist/              # 编译输出
│       └── scripts/           # 脚本工具
│
├── fornt/                      # 前端项目集合
│   ├── web/                   # 用户端Web (React + Vite)
│   │   ├── src/
│   │   │   ├── pages/         # 页面组件
│   │   │   ├── layouts/       # 布局组件
│   │   │   └── store/         # 状态管理
│   │   └── dist/              # 构建输出
│   │
│   ├── web-manage/            # 管理后台 (React + Ant Design)
│   │   ├── src/
│   │   │   ├── pages/         # 管理页面
│   │   │   │   ├── dashboard/ # 仪表盘
│   │   │   │   ├── users/     # 用户管理
│   │   │   │   ├── orders/    # 订单管理
│   │   │   │   └── keys/      # 密钥管理
│   │   │   └── api/           # API接口
│   │   └── dist/              # 构建输出
│   │
│   └── webuiapps/             # 多应用WebUI (React + TypeScript)
│       ├── src/
│       │   ├── pages/         # 应用页面
│       │   │   ├── CodeEditor/# 代码编辑器
│       │   │   ├── MusicApp/  # 音乐应用
│       │   │   ├── Chess/     # 象棋游戏
│       │   │   └── ...        # 其他应用
│       │   ├── lib/           # 核心库
│       │   │   ├── agent/     # Agent引擎
│       │   │   ├── tools/     # 工具集
│       │   │   └── aiPanelCore.ts
│       │   └── components/    # 公共组件
│       └── dist/              # 构建输出
│
├── sql/                        # 数据库文件
│   ├── init-db.sql            # 数据库初始化
│   └── merge-tables.sql       # 表合并脚本
│
├── tools/                      # 开发工具
│   ├── fix/                   # 修复脚本
│   │   ├── fix-database-*.js  # 数据库修复
│   │   ├── fix-payment-*.js   # 支付修复
│   │   └── fix-nginx-*.js     # Nginx修复
│   │
│   ├── check/                 # 检查脚本
│   │   ├── check-db-*.js      # 数据库检查
│   │   ├── check-nginx-*.js   # Nginx检查
│   │   └── check-alipay-*.js  # 支付宝检查
│   │
│   └── cloud-database-guide.md # 云端数据库连接指南
│
├── nginx/                      # Nginx配置
│   ├── nginx.conf             # 主配置
│   ├── default.conf           # 默认配置
│   └── chaowuqiong.conf       # 项目配置
│
├── scripts/                    # 部署脚本
│   ├── deploy.sh              # 本地部署
│   └── deploy-to-server.sh    # 服务器部署
│
├── packages/                   # 共享包
│   └── shared/                # 共享代码
│       ├── src/
│       │   ├── types/         # 共享类型
│       │   ├── utils/         # 共享工具
│       │   └── constants/     # 共享常量
│       └── package.json
│
├── 长篇/                       # 长篇内容
├── 短篇/                       # 短篇内容
├── 小说漫剧/                    # 小说漫剧内容
│
├── package.json               # 根package.json (Monorepo)
├── turbo.json                 # Turbo配置
├── ecosystem.config.js        # PM2配置
└── README.md                  # 项目说明

```

## 技术栈

### 后端
- **框架**: Express.js + TypeScript
- **数据库**: MySQL 8.0
- **缓存**: Redis
- **认证**: JWT
- **部署**: PM2

### 前端
- **框架**: React 18 + TypeScript
- **构建**: Vite
- **样式**: Tailwind CSS / SCSS
- **UI库**: Ant Design (管理后台)
- **状态**: Zustand / Pinia

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动后端
```bash
cd apps/backend
npm run dev
```

### 3. 启动前端
```bash
cd fornt/web
npm run dev
```

## 部署

### 本地构建
```bash
npm run build
```

### 服务器部署
```bash
bash scripts/deploy-to-server.sh
```

## 数据库连接

详见: [tools/cloud-database-guide.md](tools/cloud-database-guide.md)

## 常用命令

```bash
# 检查服务状态
node tools/check/check-backend-status.js

# 修复数据库
node tools/fix/fix-database-mysql.js

# 部署前端
cd fornt/web && npm run build

# 部署后端
cd apps/backend && npm run build && pm2 restart chaowuqiong-api
```
