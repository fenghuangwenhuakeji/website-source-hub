@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹 - 完整部署脚本
echo ========================================
echo.

set PROJECT_ROOT=d:\网站部署\超无穹项目\chaowuqiong-project
set FRONTEND_DIR=%PROJECT_ROOT%\apps\frontent\webuiapps
set BACKEND_DIR=%PROJECT_ROOT%\apps\backend
set PUBLIC_DIR=%FRONTEND_DIR%\public

echo [步骤 1] 构建前端...
cd /d %FRONTEND_DIR%
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 前端构建失败!
    pause
    exit /b 1
)

echo.
echo [步骤 2] 复制静态应用到 dist...
if exist "%FRONTEND_DIR%\dist\static" (
    xcopy /E /I /Y "%PUBLIC_DIR%\static\short" "%FRONTEND_DIR%\dist\static\short\"
    xcopy /E /I /Y "%PUBLIC_DIR%\static\fenghuang" "%FRONTEND_DIR%\dist\static\fenghuang\"
    xcopy /E /I /Y "%PUBLIC_DIR%\static\medium-short" "%FRONTEND_DIR%\dist\static\medium-short\"
)

echo.
echo [步骤 3] 打包后端...
cd /d %BACKEND_DIR%
call npm run build
if %ERRORLEVEL% neq 0 (
    echo 后端构建失败!
    pause
    exit /b 1
)

echo.
echo [步骤 4] 创建部署包...
cd /d %PROJECT_ROOT%

if exist "deploy-package" rd /s /q "deploy-package"
mkdir "deploy-package"

echo 打包前端...
tar -czvf deploy-package/frontend.tar.gz -C %FRONTEND_DIR% dist

echo 打包后端...
tar -czvf deploy-package/backend.tar.gz -C %BACKEND_DIR% dist

echo.
echo ========================================
echo   本地构建完成!
echo ========================================
echo.
echo 部署包已创建在: %PROJECT_ROOT%\deploy-package
echo.
echo 后续步骤:
echo   1. 上传 deploy-package 到服务器
echo   2. 解压到对应目录
echo   3. 重启服务: pm2 restart chaowuqiong-api
echo   4. 重载 nginx: nginx -s reload
echo.
pause
