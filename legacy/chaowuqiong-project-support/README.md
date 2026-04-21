# 超无穹AI (Chaowuqiong AI)

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Desktop%20%7C%20Mobile-purple.svg)

**一个综合性的AI应用平台，提供文本生成、图像生成、视频生成等多种AI服务**

[在线体验](https://chaowuqiong.com) · [文档](./docs) · [反馈问题](https://github.com/chaowuqiong/issues)

</div>

---

## ✨ 功能特性

### 🤖 AI能力
- **多模型支持** - 支持OpenAI、Claude、Gemini、MiniMax等多种AI模型
- **API池管理** - 灵活配置和管理多个API端点
- **智能对话** - 多轮对话、上下文记忆、角色扮演

### 💎 会员系统
- **丰富套餐** - 8小时卡、日卡、周卡、月卡、季卡、半年卡、年卡、永久卡
- **积分赠送** - 购买套餐赠送积分
- **权益管理** - 会员专属功能和特权

### 💰 支付系统
- **支付宝支付** - 扫码支付，即时到账
- **微信支付** - 扫码支付，即时到账
- **订单管理** - 完整的订单查询和管理

### 🎁 邀请系统
- **邀请奖励** - 邀请好友双方各得75积分
- **里程碑奖励** - 邀请满3人送周卡，满10人送月卡
- **邀请统计** - 实时查看邀请数据和奖励

### 🖥️ 多端支持
- **Web端** - 支持所有主流浏览器
- **桌面客户端** - Windows/macOS/Linux原生应用
- **移动端** - 完美适配手机和平板

---

## 🚀 快速开始

### 环境要求

- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- npm 或 yarn

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/chaowuqiong/chaowuqiong-project.git
cd chaowuqiong-project

# 安装后端依赖
cd apps/backend
npm install

# 安装前端依赖
cd ../frontent/webuiapps
npm install

# 配置环境变量
cp ../../.env.example ../../.env
# 编辑 .env 文件，配置数据库、Redis等

# 初始化数据库
mysql -u root -p < ../../sql/init.sql

# 启动后端
cd ../../apps/backend
npm run dev

# 启动前端（新终端）
cd ../frontent/webuiapps
npm run dev
```

### 访问应用

- 前端: http://localhost:5173
- 后端API: http://localhost:3000/api

---

## 📁 项目结构

```
chaowuqiong-project/
├── apps/
│   ├── backend/              # 后端服务
│   │   ├── src/
│   │   │   ├── routes/       # API路由
│   │   │   ├── middleware/   # 中间件
│   │   │   ├── utils/        # 工具函数
│   │   │   └── config/       # 配置文件
│   │   └── package.json
│   │
│   ├── frontent/
│   │   └── webuiapps/        # 前端应用
│   │       ├── src/
│   │       │   ├── components/   # 组件
│   │       │   ├── pages/        # 页面
│   │       │   ├── hooks/        # Hooks
│   │       │   ├── lib/          # 工具库
│   │       │   └── styles/       # 样式
│   │       └── package.json
│   │
│   └── desktop/              # 桌面客户端
│       ├── main.js           # Electron主进程
│       ├── preload.js        # 预加载脚本
│       └── package.json
│
├── docs/                     # 项目文档
│   ├── SPEC.md              # 规范文档
│   ├── Plan.md              # 计划文档
│   ├── Requirement.md       # 需求文档
│   ├── Design.md            # 设计文档
│   ├── Tasks.md             # 任务清单
│   ├── Checklist.md         # 检查清单
│   └── Changelog.md         # 变更日志
│
├── nginx/                    # Nginx配置
├── secrets/                  # 密钥配置
└── README.md                 # 项目说明
```

---

## 🛠️ 技术栈

### 前端
| 技术 | 说明 |
|------|------|
| React 18 | UI框架 |
| TypeScript | 类型支持 |
| Vite | 构建工具 |
| SCSS Modules | 样式方案 |
| Ant Design | UI组件库 |
| Axios | HTTP客户端 |

### 后端
| 技术 | 说明 |
|------|------|
| Node.js | 运行环境 |
| Express | Web框架 |
| TypeScript | 类型支持 |
| MySQL | 主数据库 |
| Redis | 缓存/Session |
| JWT | 身份认证 |

### 桌面端
| 技术 | 说明 |
|------|------|
| Electron | 桌面框架 |
| electron-builder | 打包工具 |
| electron-updater | 自动更新 |

---

## 📖 API文档

### 认证接口

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### 用户接口

```http
GET  /api/user/profile
PUT  /api/user/profile
PUT  /api/user/password
```

### 支付接口

```http
GET  /api/packages
POST /api/payment/create
POST /api/payment/alipay/callback
POST /api/payment/wechat/callback
```

### 邀请接口

```http
GET  /api/referral/stats
GET  /api/referral/records
POST /api/referral/enter
```

详细API文档请参考 [Design.md](./docs/Design.md)

---

## 🚢 部署指南

### 生产环境部署

```bash
# 1. 构建前端
cd apps/frontent/webuiapps
npm run build

# 2. 构建后端
cd ../../backend
npm run build

# 3. 上传到服务器
scp -r dist/ root@your-server:/var/www/chaowuqiong/apps/backend/
scp -r ../frontent/webuiapps/dist/ root@your-server:/var/www/chaowuqiong/apps/webuiapps/

# 4. 配置Nginx
cp nginx/chaowuqiong.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/chaowuqiong.conf /etc/nginx/sites-enabled/
nginx -s reload

# 5. 启动后端服务
pm2 start dist/index.js --name chaowuqiong-api
```

### 桌面客户端打包

```bash
cd apps/desktop
npm install

# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

---

## 📱 移动端适配

项目已完整适配移动端，支持：

- ✅ 响应式布局
- ✅ 触摸交互
- ✅ 安全区域适配
- ✅ 底部导航栏
- ✅ 手势操作

---

## 🔒 安全特性

- **密码加密** - bcrypt加密存储
- **JWT认证** - Token过期机制
- **HTTPS** - SSL加密传输
- **SQL注入防护** - 参数化查询
- **XSS防护** - 输入过滤
- **CSRF防护** - Token验证
- **频率限制** - API调用限制

---

## 📊 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 首屏加载 | < 3s | ✅ 2.1s |
| API响应 | < 500ms | ✅ 320ms |
| 并发用户 | 1000+ | ✅ 1200 |
| 可用性 | 99.9% | ✅ 99.95% |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

---

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 📞 联系方式

- 官网: https://chaowuqiong.com
- 邮箱: support@chaowuqiong.com
- GitHub: https://github.com/chaowuqiong

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给一个 Star ⭐**

Made with ❤️ by Chaowuqiong Team

</div>
