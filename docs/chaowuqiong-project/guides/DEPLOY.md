# 超无穹 - 火山引擎云服务器部署指南

## 服务器信息

| 项目 | 配置 |
|------|------|
| 公网IP | 115.190.158.182 |
| 规格 | 4vCPU 4GiB |
| 系统盘 | 40GiB 极速型SSD |
| 系统 | Ubuntu 22.04 LTS |

---

## 部署方式一：一键部署 (推荐新手)

### 步骤1: 连接服务器

使用SSH连接服务器：

```bash
ssh -i your_key.pem root@115.190.158.182
```

### 步骤2: 下载并运行部署脚本

```bash
# 下载部署脚本
cd /root

# 创建部署目录
mkdir -p /var/www

# 本地执行: 将项目上传到服务器
# 在本地项目目录执行:
scp -r ./chaowuqiong-project/* root@115.190.158.182:/var/www/chaowuqiong/

# 或者在服务器上下载
cd /var/www
git clone https://your-repo-url.git chaowuqiong
```

### 步骤3: 运行部署脚本

```bash
chmod +x /var/www/chaowuqiong/scripts/deploy-to-server.sh
cd /var/www/chaowuqiong
./scripts/deploy-to-server.sh
```

---

## 部署方式二：手动部署

### 步骤1: 安装基础软件

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version  # 应显示 v20.x.x

# 安装 PM2
npm install -g pm2

# 安装 Nginx
apt install -y nginx

# 安装 MySQL 8.0
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

# 安装 Redis
apt install -y redis-server
systemctl enable redis
systemctl start redis
```

### 步骤2: 配置MySQL

```bash
# 设置root密码
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Chaowuqiong@2026!';"
mysql -e "FLUSH PRIVILEGES;"

# 创建数据库
mysql -uroot -p'Chaowuqiong@2026!' -e "CREATE DATABASE IF NOT EXISTS chaowuqiong_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 步骤3: 上传项目文件

```bash
# 在本地执行
scp -r ./chaowuqiong-project root@115.190.158.182:/var/www/
```

### 步骤4: 安装依赖

```bash
cd /var/www/chaowuqiong
npm install
```

### 步骤5: 配置环境变量

```bash
cat > /var/www/chaowuqiong/apps/backend/.env << 'EOF'
PORT=3000
NODE_ENV=production
JWT_SECRET=chaowuqiong-production-secret-key-2026-change-this
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Chaowuqiong@2026!
DB_NAME=chaowuqiong_db
REDIS_HOST=localhost
REDIS_PORT=6379
CORS_ORIGIN=http://115.190.158.182,http://localhost:5173
EOF
```

### 步骤6: 初始化数据库

```bash
mysql -uroot -p'Chaowuqiong@2026!' chaowuqiong_db < /var/www/chaowuqiong/apps/backend/scripts/init-db.sql
```

### 步骤7: 构建项目

```bash
# 构建后端
cd /var/www/chaowuqiong/apps/backend
npm run build

# 构建前端
cd /var/www/chaowuqiong/apps/web
npm run build
```

### 步骤8: 配置Nginx

```bash
cp /var/www/chaowuqiong/nginx/server.conf /etc/nginx/sites-available/chaowuqiong
ln -sf /etc/nginx/sites-available/chaowuqiong /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 步骤9: 启动服务

```bash
# 使用PM2启动后端
cd /var/www/chaowuqiong
pm2 start ecosystem.config.js

# 保存PM2进程列表
pm2 save

# 设置开机自启
pm2 startup
```

---

## 防火墙配置

```bash
# 开放端口
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 3000/tcp   # 后端API (仅开发环境开放)

# 启用防火墙
ufw enable
```

---

## 验证部署

### 检查服务状态

```bash
# 检查PM2
pm2 status

# 检查Nginx
systemctl status nginx

# 检查MySQL
systemctl status mysql

# 检查Redis
systemctl status redis
```

### 测试API

```bash
curl http://localhost:3000/health
```

应该返回:
```json
{"status":"ok","timestamp":"...","uptime":...,"version":"1.0.0"}
```

### 访问前端

在浏览器中访问: http://115.190.158.182

---

## SSL证书配置 (可选但推荐)

### 使用Let's Encrypt

```bash
# 安装Certbot
apt install -y certbot python3-certbot-nginx

# 申请证书 (需要域名)
certbot --nginx -d chaowuqiong.com -d www.chaowuqiong.com

# 自动续期测试
certbot renew --dry-run
```

---

## 微信/支付宝配置

在 `.env` 文件中填写:

```env
# 微信支付
WECHAT_APPID=wx...
WECHAT_APPSECRET=...
WECHAT_MCH_ID=...
WECHAT_API_KEY=...
WECHAT_CALLBACK_URL=https://your-domain.com/api/payment/wechat/callback

# 支付宝
ALIPAY_APP_ID=2088...
ALIPAY_PRIVATE_KEY=...
ALIPAY_PUBLIC_KEY=...
```

---

## 常用运维命令

```bash
# 查看日志
pm2 logs chaowuqiong-api

# 重启服务
pm2 restart chaowuqiong-api

# 查看资源使用
pm2 monit

# 更新代码后重部署
cd /var/www/chaowuqiong
git pull
npm install
npm run build
pm2 restart chaowuqiong-api
```

---

## 故障排查

### 后端无法启动

```bash
# 查看错误日志
pm2 logs chaowuqiong-api --err

# 检查端口占用
netstat -tlnp | grep 3000
```

### 数据库连接失败

```bash
# 检查MySQL状态
systemctl status mysql

# 测试连接
mysql -uroot -p'Chaowuqiong@2026!' -e "SHOW DATABASES;"
```

### 前端502错误

```bash
# 检查Nginx错误日志
tail -f /var/log/nginx/chaowuqiong_error.log

# 检查后端是否运行
curl http://localhost:3000/health
```

---

## 目录结构

```
/var/www/chaowuqiong/
├── apps/
│   ├── web/           # 前端构建产物
│   │   └── dist/
│   └── backend/       # 后端
│       ├── src/
│       ├── dist/      # 编译产物
│       └── scripts/   # 初始化脚本
├── nginx/             # Nginx配置
├── scripts/           # 部署脚本
└── ecosystem.config.js # PM2配置
```

---

**部署完成后，请访问 http://115.190.158.182 测试！**
