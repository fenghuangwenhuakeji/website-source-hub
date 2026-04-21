@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹桌面客户端打包脚本
echo ========================================
echo.

echo [1/5] 检查前端依赖...
call npm install

echo.
echo [2/5] 构建前端...
call npm run build

echo.
echo [3/5] 进入桌面壳目录...
cd /d "%~dp0..\client-desktop"

echo.
echo [4/5] 检查桌面壳依赖...
call npm install

echo.
echo [5/5] 打包Electron应用...
call npm run build:win

echo.
echo 完成！
echo.
echo 安装包位置: ..\client-desktop\release\
echo ========================================
pause
