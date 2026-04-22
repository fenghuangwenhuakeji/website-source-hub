#!/bin/bash

echo "========== 开始诊断和修复后端服务 =========="

# 检查 3000 端口是否在监听
echo "[1] 检查 3000 端口状态..."
netstat -tlnp | grep 3000 || ss -tlnp | grep 3000 || echo "3000 端口未监听"

# 检查 pm2 状态
echo -e "\n[2] 检查 PM2 服务状态..."
pm2 status

# 检查 super-api 是否在运行
echo -e "\n[3] 检查 super-api 进程..."
ps aux | grep -i "node.*fenghuang" | grep -v grep || echo "未找到相关 Node 进程"

# 重启后端服务
echo -e "\n[4] 重启 super-api 服务..."
cd /var/www/fenghuang-backend
pm2 restart super-api

# 等待几秒让服务启动
sleep 3

# 再次检查端口
echo -e "\n[5] 验证 3000 端口..."
netstat -tlnp | grep 3000 || ss -tlnp | grep 3000 || echo "3000 端口仍未监听"

# 测试本地 API
echo -e "\n[6] 测试本地 API..."
curl -s http://127.0.0.1:3000/health || echo "本地 API 测试失败"

# 检查 Nginx 错误日志
echo -e "\n[7] 最近 Nginx 错误日志..."
tail -20 /var/log/nginx/error.log 2>/dev/null || echo "无法读取 Nginx 错误日志"

echo -e "\n========== 诊断完成 =========="