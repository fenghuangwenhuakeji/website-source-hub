@echo off
chcp 65001 >nul
echo ========================================
echo   Chaowuqiong Admin Build Script
echo ========================================
echo.

set PROJECT_ROOT=%~dp0
set ADMIN_FRONTEND_PATH=D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\web-manage
set ADMIN_APP_PATH=%PROJECT_ROOT%admin-app

echo [1/4] Checking frontend dependencies...
cd /d "%ADMIN_FRONTEND_PATH%"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo [2/4] Building frontend...
call npm run build

echo.
echo [3/4] Copying build files...
if exist "%ADMIN_APP_PATH%\dist" rd /s /q "%ADMIN_APP_PATH%\dist"
xcopy /s /e /y "%ADMIN_FRONTEND_PATH%\dist" "%ADMIN_APP_PATH%\dist\"

echo.
echo [4/4] Installing Electron Builder...
cd /d "%ADMIN_APP_PATH%"
if not exist "node_modules" (
    echo Installing electron-builder...
    call npm install electron-builder --save-dev
)

call npx electron-builder --config electron-builder.json --win

echo.
echo ========================================
echo   Admin build completed!
echo   Output: %ADMIN_APP_PATH%\release\
echo ========================================
pause
