@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹后端部署脚本
echo ========================================

set SERVER_IP=115.190.158.182
set SERVER_USER=root
set REMOTE_DIR=/var/www/chaowuqiong/apps/backend
set LOCAL_DIR=D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend

echo [1/4] 正在上传 dist 目录...
scp -r %LOCAL_DIR%\dist %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/

echo [2/4] 正在上传 src/routes 目录...
scp -r %LOCAL_DIR%\src\routes %SERVER_USER%@%SERVER_IP%:%REMOTE_DIR%/src/

echo [3/4] 重启后端服务...
ssh %SERVER_USER%@%SERVER_IP% "cd %REMOTE_DIR% && pm2 restart chaowuqiong-api"

echo [4/4] 检查服务状态...
ssh %SERVER_USER%@%SERVER_IP% "pm2 status chaowuqiong-api"

echo ========================================
echo   部署完成!
echo ========================================
pause
