@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹桌面客户端 - 开发模式
echo ========================================
echo.
echo 启动中...
call npm run electron:start
