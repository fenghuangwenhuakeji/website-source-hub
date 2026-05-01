#!/bin/bash

# 超无穹 - 火山引擎云服务器一键部署脚本
# 适用于 Ubuntu 22.04 LTS

set -e

echo "========================================"
echo "  超无穹 - 云服务器一键部署脚本"
echo "========================================"

# 配置变量
PROJECT_NAME="chaowuqiong"
PROJECT_DIR="/var/www/chaowuqiong"
BACKUP_DIR="/var/www/chaowuqiong/backup"
LOG_FILE="/var/log/chaowuqiong-deploy.log"

# 颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    error "请使用 root 用户运行此脚本"
    exit 1
fi

log "开始部署超无穹项目..."

# 1. 更新系统
log "1. 更新系统软件包..."
apt update && apt upgrade -y

# 2. 安装 Node.js 20.x
log "2. 安装 Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# 3. 安装 PM2
log "3. 安装 PM2 进程管理器..."
npm install -g pm2
pm2 --version

# 4. 安装 Nginx
log "4. 安装 Nginx..."
apt install -y nginx
systemctl enable nginx
systemctl start nginx

# 5. 安装 MySQL 8.0
log "5. 安装 MySQL 8.0..."
apt install -y mysql-server
systemctl enable mysql
systemctl start mysql

# 配置MySQL
log "5.1 配置MySQL root密码..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'Chaowuqiong@2026!';"
mysql -e "FLUSH PRIVILEGES;"

# 6. 安装 Redis
log "6. 安装 Redis..."
apt install -y redis-server
systemctl enable redis
systemctl start redis

# 7. 创建项目目录
log "7. 创建项目目录..."
mkdir -p $PROJECT_DIR
mkdir -p $BACKUP_DIR
mkdir -p /var/log/chaowuqiong

# 8. 初始化数据库
log "8. 初始化数据库..."
mysql -uroot -p'Chaowuqiong@2026!' -e "CREATE DATABASE IF NOT EXISTS chaowuqiong_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 9. 上传项目文件 (需要手动或使用scp)
log "9. 请上传项目文件到 $PROJECT_DIR"
log "   可以使用: scp -r ./chaowuqiong-project/* root@115.190.158.182:$PROJECT_DIR/"

# 10. 安装项目依赖
log "10. 安装项目依赖..."
cd $PROJECT_DIR
npm install

# 11. 配置环境变量
log "11. 配置环境变量..."
cat > $PROJECT_DIR/apps/backend/.env << 'EOF'
# 服务器配置
PORT=3000
NODE_ENV=production

# JWT配置
JWT_SECRET=chaowuqiong-production-secret-key-2026
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=Chaowuqiong@2026!
DB_NAME=chaowuqiong_db

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 微信支付配置 (需要填写)
WECHAT_APPID=your_wechat_appid
WECHAT_APPSECRET=your_wechat_appsecret
WECHAT_MCH_ID=your_merchant_id
WECHAT_API_KEY=your_api_key
WECHAT_CALLBACK_URL=https://your-domain.com/api/payment/wechat/callback

# 支付宝配置 (需要填写)
ALIPAY_APP_ID=your_alipay_app_id
ALIPAY_PRIVATE_KEY=your_private_key
ALIPAY_PUBLIC_KEY=your_alipay_public_key
ALIPAY_CALLBACK_URL=https://your-domain.com/api/payment/alipay/callback

# CORS配置
CORS_ORIGIN=https://your-domain.com,http://localhost:5173
EOF

# 12. 复制Nginx配置
log "12. 配置Nginx..."
cp $PROJECT_DIR/nginx/default.conf /etc/nginx/sites-available/chaowuqiong
ln -sf /etc/nginx/sites-available/chaowuqiong /etc/nginx/sites-enabled/
nginx -t

# 13. 重载Nginx
log "13. 重载Nginx..."
systemctl reload nginx

# 14. 启动后端服务
log "14. 启动后端服务..."
cd $PROJECT_DIR/apps/backend
pm2 stop $PROJECT_NAME-api 2>/dev/null || true
pm2 start $PROJECT_DIR/apps/backend/dist/app.js --name $PROJECT_NAME-api

# 15. 保存PM2进程列表
log "15. 保存PM2进程列表..."
pm2 save

# 16. 设置PM2开机自启
log "16. 设置PM2开机自启..."
pm2 startup

# 17. 构建前端
log "17. 构建前端..."
cd $PROJECT_DIR/apps/web
npm run build

# 完成
echo ""
echo "========================================"
echo "  部署完成!"
echo "========================================"
echo ""
echo "请完成以下步骤:"
echo "1. 配置微信支付和支付宝商户信息"
echo "2. 解析域名到 115.190.158.182"
echo "3. 配置SSL证书 (推荐Let's Encrypt)"
echo ""
echo "常用命令:"
echo "  查看日志: pm2 logs $PROJECT_NAME-api"
echo "  重启服务: pm2 restart $PROJECT_NAME-api"
echo "  查看状态: pm2 status"
echo ""
