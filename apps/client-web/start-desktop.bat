@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹桌面客户端 - 开发模式
echo ========================================
echo.
echo [1/3] 构建当前前端...
call npm run build

echo.
echo [2/3] 准备桌面壳资源...
cd /d "%~dp0..\client-desktop"
call npm install

echo.
echo [3/3] 启动桌面壳...
call npm run start
