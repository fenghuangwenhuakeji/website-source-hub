# 超无穹后端合并整合计划

## 一、现状分析

### 现有后端项目（4个）

#### 1. backend (TypeScript) - 主项目 ⭐
- **位置**: `apps/backend/`
- **端口**: 3000
- **状态**: 正在运行 (chaowuqiong-api)
- **技术栈**: Node.js + TypeScript + Express + MySQL
- **已有路由**:
  - `/api/auth` - 认证
  - `/api/user` - 用户
  - `/api/vip` - VIP
  - `/api/recharge` - 充值
  - `/api/payment` - 支付
  - `/api/novels` - 小说
  - `/api/gacha` - 抽卡
  - `/api/election` - 选举

#### 2. backend_original (JavaScript)
- **位置**: `apps/backend_original/`
- **端口**: 未运行
- **技术栈**: Node.js + JavaScript + Express
- **需要合并的路由**:
  - `/api/orders` - 订单管理
  - `/api/admin` - 管理后台
  - `/api/announcement` - 公告
  - `/api/gacha` - 抽卡(扩展)

#### 3. license-backend (JavaScript)
- **位置**: `apps/license-backend/`
- **端口**: 3001 (正在运行)
- **技术栈**: Node.js + JavaScript + Express
- **需要合并的路由**:
  - `/api/orders` - 订单
  - `/api/points` - 积分
  - `/api/keys` - API密钥
  - `/api/stats` - 统计
  - `/api/admin` - 管理(扩展)

#### 4. backend (旧版本)
- **位置**: `D:\网站部署\chaowuqiong-project\apps\backend`
- **状态**: 未使用

---

## 二、合并策略

### 目标
将所有后端功能合并到 `apps/backend/` (TypeScript主项目)，删除其他3个后端项目。

### 合并步骤

#### Phase 1: 路由合并

将其他后端的路由迁移到主 backend：

```
apps/backend/src/routes/
├── auth.ts          ✅ 已有
├── user.ts          ✅ 已有
├── vip.ts           ✅ 已有
├── recharge.ts      ✅ 已有
├── payment.ts       ✅ 已有
├── novels.ts        ✅ 已有
├── gacha.ts         ✅ 已有 (需要扩展)
├── election.ts      ✅ 已有
├── orders.ts        🆕 新增 (合并 license-backend + backend_original)
├── points.ts        🆕 新增 (从 license-backend)
├── keys.ts          🆕 新增 (从 license-backend)
├── stats.ts         🆕 新增 (从 license-backend)
├── announcement.ts  🆕 新增 (从 backend_original)
└── admin/
    ├── index.ts     🆕 新增 (合并管理功能)
    ├── users.ts     🆕 新增
    ├── orders.ts    🆕 新增
    └── dashboard.ts 🆕 新增
```

#### Phase 2: 数据库合并

统一使用 `chaowuqiong_db`，添加缺失的表：

```sql
-- 需要添加的表
1. orders - 订单表
2. points_records - 积分记录
3. api_keys - API密钥
4. announcements - 公告
5. gacha_pools - 抽卡池(扩展)
6. gacha_items - 抽卡物品(扩展)
7. admin_logs - 管理员日志

-- 需要添加的字段到 users 表
- points (积分)
- balance (余额)
- referral_code (推荐码)
- referred_by (推荐人)
```

#### Phase 3: 配置合并

统一环境变量配置：

```env
# 数据库
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=gong134135
DB_NAME=chaowuqiong_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=chaowuqiong-secret-key
JWT_EXPIRES_IN=24h

# 支付宝
ALIPAY_APP_ID=2021006140607225
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...

# 微信支付
WECHAT_APP_ID=...
WECHAT_MCH_ID=...
WECHAT_API_KEY=...

# 其他配置
PORT=3000
NODE_ENV=production
```

#### Phase 4: 中间件合并

统一中间件：
- 认证中间件 (auth)
- 错误处理 (errorHandler)
- 限流 (rateLimiter)
- 日志 (logger)

---

## 三、实施计划

### 第1步：备份当前环境
```bash
# 备份数据库
mysqldump -u root -p chaowuqiong_db > backup_$(date +%Y%m%d).sql

# 备份 backend 代码
cp -r apps/backend apps/backend.backup
```

### 第2步：创建新路由文件

#### 2.1 创建 orders.ts
- 合并 license-backend 和 backend_original 的订单功能
- 支持创建订单、查询订单、取消订单
- 支持订单支付回调

#### 2.2 创建 points.ts
- 从 license-backend 迁移
- 积分查询、兑换、记录

#### 2.3 创建 keys.ts
- API密钥管理
- 密钥生成、验证、吊销

#### 2.4 创建 stats.ts
- 统计数据接口
- 用户统计、订单统计、收入统计

#### 2.5 创建 announcement.ts
- 公告管理
- 发布公告、编辑、删除

### 第3步：更新 app.ts

注册新路由：
```typescript
import ordersRouter from './routes/orders.js';
import pointsRouter from './routes/points.js';
import keysRouter from './routes/keys.js';
import statsRouter from './routes/stats.js';
import announcementRouter from './routes/announcement.js';

app.use('/api/orders', ordersRouter);
app.use('/api/points', pointsRouter);
app.use('/api/keys', keysRouter);
app.use('/api/stats', statsRouter);
app.use('/api/announcement', announcementRouter);
```

### 第4步：执行数据库迁移

执行 SQL 文件添加新表和字段。

### 第5步：构建和测试

```bash
cd apps/backend
npm install
npm run build
npm start
```

### 第6步：更新 Nginx 配置

确保所有 `/api/` 请求都路由到 3000 端口。

### 第7步：删除旧项目

删除以下目录：
- `apps/backend_original/`
- `apps/license-backend/`
- `D:\网站部署\chaowuqiong-project\apps\backend`

停止旧服务：
```bash
pm2 delete license-backend
```

---

## 四、API 接口映射

### 订单接口
```
GET    /api/orders/packages      # 获取套餐列表
POST   /api/orders/create        # 创建订单
GET    /api/orders/list          # 订单列表
GET    /api/orders/detail/:id    # 订单详情
POST   /api/orders/cancel/:id    # 取消订单
```

### 积分接口
```
GET    /api/points/balance       # 积分余额
POST   /api/points/exchange      # 积分兑换
GET    /api/points/records       # 积分记录
```

### 其他接口
```
GET    /api/keys/list            # API密钥列表
POST   /api/keys/create          # 创建密钥
DELETE /api/keys/:id             # 删除密钥

GET    /api/stats/dashboard      # 仪表盘统计
GET    /api/stats/users          # 用户统计
GET    /api/stats/orders         # 订单统计

GET    /api/announcement/list    # 公告列表
GET    /api/announcement/:id     # 公告详情
```

---

## 五、风险与注意事项

1. **数据迁移风险**
   - 确保数据库备份完整
   - 测试环境先验证

2. **服务中断**
   - 选择低峰期执行
   - 准备回滚方案

3. **API 兼容性**
   - 保持原有接口不变
   - 前端无需修改

4. **环境变量**
   - 统一配置管理
   - 避免敏感信息泄露

---

## 六、时间估算

- 路由开发: 2-3小时
- 数据库迁移: 30分钟
- 测试验证: 1小时
- 部署上线: 30分钟
- **总计: 4-5小时**

---

## 七、执行命令汇总

```bash
# 1. 备份
cp -r apps/backend apps/backend.backup.$(date +%Y%m%d)
mysqldump -u root -p chaowuqiong_db > db_backup_$(date +%Y%m%d).sql

# 2. 创建新路由文件
# (手动创建 orders.ts, points.ts, keys.ts, stats.ts, announcement.ts)

# 3. 更新 app.ts
# (添加新路由导入和注册)

# 4. 数据库迁移
mysql -u root -p chaowuqiong_db < scripts/merge_tables.sql

# 5. 构建
cd apps/backend
npm install
npm run build

# 6. 重启服务
pm2 restart chaowuqiong-api

# 7. 验证
pm2 logs chaowuqiong-api

# 8. 删除旧项目
rm -rf apps/backend_original
rm -rf apps/license-backend
pm2 delete license-backend
```
