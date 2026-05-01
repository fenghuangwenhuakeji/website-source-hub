@echo off
chcp 65001 >nul
cd /d "%~dp0\apps\client-desktop"

REM 清除会导致 Electron 以 Node 模式运行的环境变量
set ELECTRON_RUN_AS_NODE=

REM 启用本地验收模式，加载本地构建而非远程服务器
set LOCAL_ACCEPTANCE_MODE=1

REM 检查 dist 是否存在
if not exist "dist\index.html" (
    echo 正在准备桌面端资源...
    if exist "dist" rmdir /s /q "dist"
    xcopy /s /e /i /y "..\client-web\dist" "dist"
)

echo 正在启动凤煌桌面端...
start "" "node_modules\electron\dist\electron.exe" .
