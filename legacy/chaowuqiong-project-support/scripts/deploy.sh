#!/bin/bash

# 超无穹部署脚本

set -e

echo "========================================"
echo "  超无穹部署脚本"
echo "========================================"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 项目目录
PROJECT_DIR="/var/www/chaowuqiong"

# 前端构建
echo -e "${YELLOW}构建前端...${NC}"
cd "$PROJECT_DIR/apps/web"
npm install
npm run build

# 后端构建
echo -e "${YELLOW}构建后端...${NC}"
cd "$PROJECT_DIR/apps/backend"
npm install
npm run build

# 数据库初始化
echo -e "${YELLOW}初始化数据库...${NC}"
mysql -u root -p < "$PROJECT_DIR/apps/backend/scripts/init-db.sql"

# 重启服务
echo -e "${YELLOW}重启服务...${NC}"
pm2 restart chaowuqiong-api || pm2 start "$PROJECT_DIR/apps/backend/dist/app.js" --name chaowuqiong-api

# Nginx重载
echo -e "${YELLOW}重载Nginx...${NC}"
nginx -t && nginx -s reload

echo -e "${GREEN}========================================"
echo "  部署完成!"
echo "========================================${NC}"
