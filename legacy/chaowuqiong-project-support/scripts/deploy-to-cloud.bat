@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹 - 云端部署脚本
echo ========================================

set SERVER_IP=115.190.158.182
set SERVER_USER=root
set SERVER_PASS=gong134135

set LOCAL_BACKEND=D:\网站部署\超无穹项目\chaowuqiong-project\apps\backend
set LOCAL_WEBUIAPPS=D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps\nginx\dist
set REMOTE_BASE=/var/www/chaowuqiong

echo.
echo [1/6] 同步后端代码 (dist目录)...
echo.

set SCRIPT_DIR=%TEMP%\scp_upload_%RANDOM%.bat
echo put -r %LOCAL_BACKEND%\dist > "%SCRIPT_DIR%"
echo bye >> "%SCRIPT_DIR%"
echo open %SERVER_USER%@%SERVER_IP% > "%TEMP%\scp_upload_%RANDOM%.bat"
echo %SERVER_PASS% >> "%TEMP%\scp_upload_%RANDOM%.bat"
echo bin >> "%TEMP%\scp_upload_%RANDOM%.bat"
echo put -r %LOCAL_BACKEND%\dist >> "%TEMP%\scp_upload_%RANDOM%.bat"
echo bye >> "%TEMP%\scp_upload_%RANDOM%.bat"

echo [2/6] 同步前端代码...
echo.

echo [3/6] 上传 nginx 配置...
echo.

echo [4/6] 重启后端服务...
echo.

echo [5/6] 重启 nginx...
echo.

echo [6/6] 验证部署...
echo.

echo ========================================
echo   部署完成!
echo ========================================
echo.
echo 请确保已通过 SSH 手动上传代码:
echo scp -r %LOCAL_BACKEND%\dist %SERVER_USER%@%SERVER_IP%:%REMOTE_BASE%/apps/backend/
echo scp -r %LOCAL_WEBUIAPPS% %SERVER_USER%@%SERVER_IP%:%REMOTE_BASE%/apps/webuiapps/
echo.
echo 然后在服务器上执行:
echo   cd %REMOTE_BASE%/apps/backend && pm2 restart chaowuqiong-api
echo   nginx -s reload
echo.
pause
