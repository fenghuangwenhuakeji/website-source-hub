@echo off
chcp 65001 >nul
echo ========================================
echo   Chaowuqiong Main App Build Script
echo ========================================
echo.

set PROJECT_ROOT=%~dp0
set FRONTEND_PATH=D:\网站部署\超无穹项目\chaowuqiong-project\apps\frontent\webuiapps
set MAIN_APP_PATH=%PROJECT_ROOT%main-app

echo [1/5] Checking frontend dependencies...
cd /d "%FRONTEND_PATH%"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo [2/5] Building frontend...
call npm run build

echo.
echo [3/5] Copying build files...
if exist "%MAIN_APP_PATH%\dist" rd /s /q "%MAIN_APP_PATH%\dist"
xcopy /s /e /y "%FRONTEND_PATH%\dist" "%MAIN_APP_PATH%\dist\"

echo.
echo [4/5] Installing Electron Builder...
cd /d "%MAIN_APP_PATH%"
if not exist "node_modules" (
    echo Installing electron-builder...
    call npm install electron-builder --save-dev
)

echo.
echo [5/5] Building Electron app...
call npx electron-builder --config electron-builder.json --win

echo.
echo ========================================
echo   Main App build completed!
echo   Output: %MAIN_APP_PATH%\release\
echo ========================================
pause
