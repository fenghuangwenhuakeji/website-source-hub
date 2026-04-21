@echo off
chcp 65001 >nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║           🤖 核心Agent系统 - 增强版启动器                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 设置工作目录
cd /d "%~dp0"

REM 检查Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo ✅ Node.js版本: 
node --version
echo.

REM 检查ws模块（WebSocket支持）
node -e "require('ws')" >nul 2>&1
if errorlevel 1 (
    echo 📦 安装WebSocket支持...
    npm install ws --save
)

REM 创建必要的目录
if not exist "logs" mkdir logs
if not exist "workspace" mkdir workspace
if not exist "scripts" mkdir scripts

echo.
echo 🚀 启动选项:
echo   [1] 启动核心系统 + 示例任务
echo   [2] 启动监控模式
echo   [3] 启动集成系统（含WebSocket监控）
echo   [4] 执行批量Agent创建工作流
echo   [5] 查看系统状态
echo   [Q] 退出
echo.

set /p choice="请选择 (1-5 或 Q): "

if "%choice%"=="1" goto start_core
if "%choice%"=="2" goto start_monitor
if "%choice%"=="3" goto start_integration
if "%choice%"=="4" goto batch_workflow
if "%choice%"=="5" goto show_status
if /i "%choice%"=="Q" goto exit

echo ❌ 无效选择
pause
exit /b 1

:start_core
echo.
echo 🚀 启动核心Agent系统...
node core-agent-system.js start
pause
goto exit

:start_monitor
echo.
echo 📊 启动监控模式...
node core-agent-system.js monitor
pause
goto exit

:start_integration
echo.
echo 🔗 启动Agent集成系统...
echo 📊 监控面板将启动在 http://localhost:8765
node agent-integration.js start
pause
goto exit

:batch_workflow
echo.
echo 📦 执行批量Agent创建工作流...
set /p count="请输入要创建的Agent数量 (默认5): "
if "%count%"=="" set count=5
node core-agent-system.js workflow batch-agents %count%
pause
goto exit

:show_status
echo.
echo 📊 系统状态:
node core-agent-system.js status
pause
goto exit

:exit
echo.
echo 👋 感谢使用核心Agent系统！