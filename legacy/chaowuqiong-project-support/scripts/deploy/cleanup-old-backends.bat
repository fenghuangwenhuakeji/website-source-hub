@echo off
chcp 65001 >nul
echo ========================================
echo   删除旧后端项目
echo ========================================

set SERVER_IP=115.190.158.182
set SERVER_USER=root

echo [1/4] 停止并删除 license-backend 服务...
ssh %SERVER_USER%@%SERVER_IP% "pm2 stop license-backend && pm2 delete license-backend"

echo [2/4] 停止并删除 backend_original 服务...
ssh %SERVER_USER%@%SERVER_IP% "pm2 stop backend-original 2>/dev/null || true && pm2 delete backend-original 2>/dev/null || true"

echo [3/4] 删除旧项目目录...
ssh %SERVER_USER%@%SERVER_IP% "rm -rf /var/www/chaowuqiong/apps/license-backend /var/www/chaowuqiong/apps/backend_original"

echo [4/4] 保存PM2配置...
ssh %SERVER_USER%@%SERVER_IP% "pm2 save"

echo ========================================
echo   清理完成!
echo ========================================
pause
