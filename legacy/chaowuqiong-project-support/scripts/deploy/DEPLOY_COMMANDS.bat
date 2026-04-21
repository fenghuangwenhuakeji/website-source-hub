@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹 - 完整部署命令
echo ========================================
echo.
echo 服务器: 115.190.158.182
echo 用户: root
echo 密码: gong134135 (如果需要)
echo.
echo ========================================
echo   第一步: 上传后端代码
echo ========================================
echo.
echo 请在 PowerShell 中执行以下命令:
echo.
echo 1. 上传后端 dist 目录:
echo    scp -r D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\dist root@115.190.158.182:/var/www/chaowuqiong/apps/backend/
echo.
echo 2. 上传后端路由 (llmProxy.ts 的更新):
echo    scp -r D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend\src\routes root@115.190.158.182:/var/www/chaowuqiong/apps/backend/src/
echo.
echo 3. 上传前端:
echo    scp -r D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\nginx\dist root@115.190.158.182:/var/www/chaowuqiong/apps/webuiapps/
echo.
echo 4. 上传 nginx 配置:
echo    scp D:\网站部署\超无穹项目\chaowuqiong-project\nginx\server.conf root@115.190.158.182:/etc/nginx/conf.d/chaowuqiong.conf
echo.
echo ========================================
echo   第二步: 在服务器上执行
echo ========================================
echo.
echo SSH 到服务器后执行:
echo.
echo    # 重启后端
echo    cd /var/www/chaowuqiong/apps/backend
echo    pm2 restart chaowuqiong-api
echo.
echo    # 重载 nginx
echo    nginx -t ^&^& nginx -s reload
echo.
echo    # 检查状态
echo    pm2 status
echo    curl http://localhost:3000/health
echo.
echo ========================================
pause
