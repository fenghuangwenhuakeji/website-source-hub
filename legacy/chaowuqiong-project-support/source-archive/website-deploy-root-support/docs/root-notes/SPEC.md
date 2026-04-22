# 凤煌科技平台 - 项目规格说明书

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | 2026-03-20 |
| 最后更新 | 2026-03-20 |
| 文档状态 | 初始版本 |
| 项目名称 | 凤煌科技内容创作平台 |

---

## 1. 项目概述

### 1.1 背景

凤煌科技需要一个集用户登录系统、微信扫码登录、写作专区和中短篇小说阅读功能于一体的现代化Web平台。平台将基于React + TypeScript构建，采用Turbo Monorepo架构，实现代码共享和高效构建。

### 1.2 目标

- 构建完整的用户认证系统（支持微信扫码登录）
- 创建现代化的写作专区
- 整合现有中短篇小说内容
- 采用React + TypeScript + Turbo Monorepo架构
- 确保平台安全性、性能和用户体验

### 1.3 核心理念

**"创作即生活，平台即服务"** - 打造一个让创作者能够专注于创作，同时为读者提供优质阅读体验的一站式平台。

---

## 2. 功能需求

### 2.1 用户系统模块

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|--------|----------|--------|----------|
| REQ-USER-001 | 用户注册功能 | P0 | 支持邮箱/手机号注册，包含密码强度验证 |
| REQ-USER-002 | 用户登录功能 | P0 | 支持账号密码登录，JWT token认证 |
| REQ-USER-003 | 微信扫码登录 | P0 | 生成微信登录二维码，扫码后自动注册/登录 |
| REQ-USER-004 | 找回密码 | P1 | 支持邮箱验证码找回密码 |
| REQ-USER-005 | 用户信息管理 | P1 | 查看/编辑个人资料、修改密码 |
| REQ-USER-006 | 会话管理 | P0 | Token刷新机制、登录状态持久化 |

### 2.2 写作专区模块

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|--------|----------|--------|----------|
| REQ-WRITE-001 | 写作编辑器 | P0 | 富文本编辑器，支持Markdown，提供良好写作体验 |
| REQ-WRITE-002 | 文章管理 | P0 | 创建、编辑、删除、发布文章 |
| REQ-WRITE-003 | 文章分类 | P1 | 支持将文章分类（短篇小说/中篇小说/随笔等） |
| REQ-WRITE-004 | 草稿箱 | P1 | 自动保存草稿，支持版本历史 |
| REQ-WRITE-005 | 发布管理 | P0 | 发布/下架文章，设置阅读权限 |

### 2.3 阅读专区模块

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|--------|----------|--------|----------|
| REQ-READ-001 | 小说展示 | P0 | 展示中短篇小说列表，支持分类筛选 |
| REQ-READ-002 | 阅读器 | P0 | 舒适的阅读界面，支持夜间模式 |
| REQ-READ-003 | 书架功能 | P1 | 用户可收藏书籍到书架 |
| REQ-READ-004 | 阅读进度 | P1 | 记录并同步用户阅读进度 |
| REQ-READ-005 | 点赞评论 | P2 | 支持点赞和评论功能 |

### 2.4 内容管理模块

| 需求ID | 需求描述 | 优先级 | 验收标准 |
|--------|----------|--------|----------|
| REQ-CONTENT-001 | 现有内容整合 | P0 | 将现有中短篇小说内容迁移到新平台 |
| REQ-CONTENT-002 | 内容分类 | P0 | 按照预设分类整理内容 |
| REQ-CONTENT-003 | 内容搜索 | P1 | 支持按标题、作者、内容搜索 |

---

## 3. 技术架构

### 3.1 Monorepo结构

```
fenghuang-platform/
├── package.json              # 根目录workspace配置
├── turbo.json                # Turbo构建配置
├── tsconfig.json             # TypeScript根配置
├── .env                      # 环境变量
├── apps/
│   ├── web/                 # 主网站（React）
│   │   ├── package.json
│   │   ├── src/
│   │   └── turbo.json
│   ├── admin/               # 管理后台（React）
│   │   ├── package.json
│   │   └── src/
│   └── api/                # 后端API（Node.js）
│       ├── package.json
│       └── src/
├── packages/
│   ├── ui/                 # 共享UI组件
│   │   ├── package.json
│   │   └── src/
│   ├── utils/              # 工具函数
│   │   ├── package.json
│   │   └── src/
│   ├── types/              # 共享类型定义
│   │   ├── package.json
│   │   └── src/
│   ├── config/             # 共享配置
│   │   ├── package.json
│   │   └── src/
│   └── auth/               # 认证相关
│       ├── package.json
│       └── src/
└── scripts/                # 构建脚本
```

### 3.2 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 | UI框架 |
| 开发语言 | TypeScript 5 | 类型安全 |
| 状态管理 | Zustand / Context | 轻量级状态 |
| 样式方案 | Tailwind CSS | 原子化CSS |
| 构建工具 | Turborepo | Monorepo构建 |
| 后端框架 | Express.js | Node.js API |
| 数据库 | MySQL 8 | 关系型数据库 |
| 缓存 | Redis | Session/缓存 |
| ORM | Prisma | 数据库ORM |
| 认证 | JWT + 微信OAuth | 多方式认证 |

### 3.3 数据库设计

#### 用户表 (users)

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255),
    wechat_openid VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(500),
    role ENUM('user', 'author', 'admin') DEFAULT 'user',
    status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_wechat (wechat_openid)
);
```

#### 小说表 (novels)

```sql
CREATE TABLE novels (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(200) NOT NULL,
    author_id BIGINT NOT NULL,
    category ENUM('short', 'medium', 'essay', 'other') DEFAULT 'short',
    cover_url VARCHAR(500),
    description TEXT,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    word_count INT DEFAULT 0,
    view_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id),
    INDEX idx_category (category),
    INDEX idx_status (status)
);
```

#### 章节表 (chapters)

```sql
CREATE TABLE chapters (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    novel_id BIGINT NOT NULL,
    chapter_number INT NOT NULL,
    title VARCHAR(200),
    content TEXT,
    word_count INT DEFAULT 0,
    status ENUM('draft', 'published') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at TIMESTAMP,
    FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE,
    INDEX idx_novel_chapter (novel_id, chapter_number)
);
```

### 3.4 API设计

#### 认证接口

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/wechat/qrcode | 获取微信登录二维码 |
| POST | /api/auth/wechat/callback | 微信登录回调 |
| POST | /api/auth/refresh | 刷新Token |
| POST | /api/auth/logout | 退出登录 |

#### 用户接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/users/me | 获取当前用户信息 |
| PUT | /api/users/me | 更新用户信息 |
| GET | /api/users/:id | 获取用户公开信息 |

#### 小说接口

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/novels | 获取小说列表 |
| GET | /api/novels/:id | 获取小说详情 |
| POST | /api/novels | 创建小说 |
| PUT | /api/novels/:id | 更新小说 |
| DELETE | /api/novels/:id | 删除小说 |
| GET | /api/novels/:id/chapters | 获取章节列表 |
| GET | /api/novels/:id/chapters/:chapterId | 获取章节内容 |

---

## 4. 安全设计

### 4.1 认证安全

- [ ] JWT Token使用HS256签名，24小时过期
- [ ] Refresh Token使用单独的Token，7天过期
- [ ] 密码使用bcrypt加密（cost factor 12）
- [ ] 微信OAuth使用官方SDK，state参数防止CSRF
- [ ] 登录失败锁定：连续5次失败后锁定30分钟

### 4.2 接口安全

- [ ] 所有POST/PUT/DELETE请求需要认证
- [ ] 敏感操作需要重新验证密码
- [ ] 请求频率限制：100次/分钟
- [ ] CORS配置只允许指定域名
- [ ] Helmet.js设置安全响应头

### 4.3 数据安全

- [ ] SQL注入防护：使用Prisma参数化查询
- [ ] XSS防护：输入过滤 + 输出转义
- [ ] CSRF防护：Token验证
- [ ] 敏感数据加密存储

---

## 5. 性能设计

### 5.1 前端性能

- [ ] Code Splitting：按路由懒加载
- [ ] 组件懒加载：减少首屏加载时间
- [ ] 图片优化：WebP格式、懒加载
- [ ] CDN加速：静态资源分发
- [ ] 浏览器缓存：Service Worker

### 5.2 后端性能

- [ ] Redis缓存：热点数据缓存
- [ ] 数据库索引：优化查询
- [ ] 连接池：数据库连接复用
- [ ] 异步处理：非核心逻辑异步化

---

## 6. 部署架构

### 6.1 服务器配置

| 服务 | 规格 | 说明 |
|------|------|------|
| Web | 2核4G | 前端静态资源/Nginx |
| API | 2核4G | Node.js API服务 |
| Database | 2核4G | MySQL |
| Cache | 1核2G | Redis |

### 6.2 域名规划

| 域名 | 指向 | 说明 |
|------|------|------|
| njfhwh.top | Web服务器 | 主网站 |
| api.njfhwh.top | API服务器 | API服务 |
| admin.njfhwh.top | Web服务器 | 管理后台 |
| writer.njfhwh.top | Web服务器 | 写作专区 |

---

## 7. 开发里程碑

| 阶段 | 任务 | 预计周期 |
|------|------|----------|
| Phase 1 | 项目初始化 + 架构搭建 | 2天 |
| Phase 2 | 用户认证系统 | 3天 |
| Phase 3 | 微信扫码登录 | 2天 |
| Phase 4 | 写作专区开发 | 5天 |
| Phase 5 | 阅读专区开发 | 3天 |
| Phase 6 | 内容迁移与部署 | 2天 |
| Phase 7 | 测试与优化 | 2天 |

---

## 8. 验收标准

### 8.1 功能验收

- [ ] 用户可以正常注册和登录
- [ ] 微信扫码登录成功
- [ ] 写作专区文章创建/编辑/发布正常
- [ ] 中短篇小说正常展示和阅读
- [ ] 用户可以收藏书籍到书架

### 8.2 性能验收

- [ ] 首屏加载时间 < 3秒
- [ ] API响应时间 < 500ms
- [ ] 支持100并发用户

### 8.3 安全验收

- [ ] 无SQL注入漏洞
- [ ] 无XSS漏洞
- [ ] Token机制正常工作
- [ ] 敏感数据加密存储

---

## 9. 附录

### 9.1 环境变量清单

```env
# 数据库
DATABASE_URL="mysql://user:password@host:3306/fenghuang"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="24h"
REFRESH_TOKEN_EXPIRES_IN="7d"

# 微信登录
WECHAT_APPID="your-appid"
WECHAT_SECRET="your-secret"
WECHAT_CALLBACK_URL="http://api.njfhwh.top/auth/wechat/callback"

# CORS
ALLOWED_ORIGINS="http://njfhwh.top,http://admin.njfhwh.top"
```

### 9.2 第三方服务

- 微信公众平台：https://developers.weixin.qq.com/
- 微信开放平台：https://open.weixin.qq.com/