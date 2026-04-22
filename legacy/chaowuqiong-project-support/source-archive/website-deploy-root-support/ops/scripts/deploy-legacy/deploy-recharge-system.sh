#!/bin/bash
set -e

SERVER_IP="115.190.158.182"
SERVER_USER="root"
SERVER_PATH="/var/www/chaowuqiong/apps/backend"
LOCAL_BUILD_DIR="D:/网站部署/超无穹项目/chaowuqiong-project/apps/backend"

echo "=== 开始部署充值系统更新 ==="

echo "1. 同步代码到服务器..."
scp -r "$LOCAL_BUILD_DIR/src" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
scp -r "$LOCAL_BUILD_DIR/migrations" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

echo "2. 执行数据库迁移..."
ssh $SERVER_USER@$SERVER_IP "mysql -u root -pgong134135 chaowuqiong_db < $SERVER_PATH/migrations/recharge_system_tables.sql"

echo "3. 安装依赖..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npm install --production"

echo "4. 构建项目..."
ssh $SERVER_USER@$SERVER_IP "cd $SERVER_PATH && npm run build"

echo "5. 重启服务..."
ssh $SERVER_USER@$SERVER_IP "pm2 restart chaowuqiong-api"

echo "6. 检查服务状态..."
ssh $SERVER_USER@$SERVER_IP "pm2 status"

echo "=== 充值系统更新部署完成 ==="
