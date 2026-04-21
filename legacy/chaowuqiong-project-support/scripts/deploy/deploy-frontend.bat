@echo off
chcp 65001 >nul
echo ========================================
echo   OpenRoom (webuiapps) 前端部署脚本
echo ========================================

set SERVER_IP=115.190.158.182
set SERVER_USER=root
set REMOTE_BASE=/var/www/chaowuqiong/apps
set LOCAL_DIR=D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps

echo [1/5] 创建远程目录结构...
ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %REMOTE_BASE%/webuiapps/dist"

echo [2/5] 上传前端构建文件...
scp -r %LOCAL_DIR%\nginx\dist\* %SERVER_USER%@%SERVER_IP%:%REMOTE_BASE%/webuiapps/dist/

echo [3/5] 上传nginx配置...
scp D:\网站部署\超无穹项目\chaowuqiong-project\nginx\chaowuqiong.conf %SERVER_USER%@%SERVER_IP%:/etc/nginx/conf.d/chaowuqiong.conf

echo [4/5] 重启nginx...
ssh %SERVER_USER%@%SERVER_IP% "nginx -t && nginx -s reload"

echo [5/5] 检查nginx状态...
ssh %SERVER_USER%@%SERVER_IP% "nginx -t"

echo ========================================
echo   前端部署完成!
echo   访问: http://%SERVER_IP%
echo ========================================
pause
