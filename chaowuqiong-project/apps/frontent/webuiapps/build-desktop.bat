@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹桌面客户端打包脚本
echo ========================================
echo.

echo [1/4] 检查依赖...
call npm install

echo.
echo [2/4] 构建前端...
call npm run build

echo.
echo [3/4] 打包Electron应用...
call npm run electron:build:win

echo.
echo [4/4] 完成！
echo.
echo 安装包位置: release\
echo ========================================
pause
