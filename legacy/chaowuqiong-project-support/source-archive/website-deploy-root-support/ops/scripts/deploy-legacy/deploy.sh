#!/bin/bash

echo "开始部署后端服务..."

# 创建目录
mkdir -p /var/www/fenghuang-backend

# 解压文件
echo "解压文件..."
unzip /tmp/fenghuang-backend-deploy.zip -d /var/www/fenghuang-backend

# 安装依赖
echo "安装依赖..."
cd /var/www/fenghuang-backend
npm install

# 启动服务
echo "启动服务..."
npm start

echo "部署完成！"