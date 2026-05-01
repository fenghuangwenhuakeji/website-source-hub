#!/bin/bash

# 修复 orders.js
cd /var/www/fenghuang-backend/src/routes/

# 备份原文件
cp orders.js orders.js.bak

# 修复 SQL 查询参数类型 - 将字符串转为整数
sed -i 's/const page = req.query.page || 1;/const page = parseInt(req.query.page) || 1;/g' orders.js
sed -i 's/const pageSize = req.query.pageSize || 10;/const pageSize = parseInt(req.query.pageSize) || 10;/g' orders.js
sed -i 's/const limit = req.query.pageSize || 10;/const limit = parseInt(req.query.pageSize) || 10;/g' orders.js

echo "orders.js 修复完成"

# 修复 users.js
if [ -f users.js ]; then
    cp users.js users.js.bak
    sed -i 's/const page = req.query.page || 1;/const page = parseInt(req.query.page) || 1;/g' users.js
    sed -i 's/const pageSize = req.query.pageSize || 10;/const pageSize = parseInt(req.query.pageSize) || 10;/g' users.js
    sed -i 's/const limit = req.query.pageSize || 10;/const limit = parseInt(req.query.pageSize) || 10;/g' users.js
    echo "users.js 修复完成"
fi

# 修复 keys.js
if [ -f keys.js ]; then
    cp keys.js keys.js.bak
    sed -i 's/const page = req.query.page || 1;/const page = parseInt(req.query.page) || 1;/g' keys.js
    sed -i 's/const pageSize = req.query.pageSize || 10;/const pageSize = parseInt(req.query.pageSize) || 10;/g' keys.js
    sed -i 's/const limit = req.query.pageSize || 10;/const limit = parseInt(req.query.pageSize) || 10;/g' keys.js
    echo "keys.js 修复完成"
fi

# 停止旧进程
pkill -9 -f "node.*fenghuang-backend"
sleep 2

# 重启服务
cd /var/www/fenghuang-backend
pm2 restart super-api

echo "后端服务已重启"
