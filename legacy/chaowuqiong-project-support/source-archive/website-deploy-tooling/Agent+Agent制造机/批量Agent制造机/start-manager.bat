@echo off
chcp 65001 >nul
echo.
echo ==========================================
echo    Agent管理系统启动器
echo ==========================================
echo.

REM 切换到脚本所在目录
cd /d "%~dp0"

echo 当前目录: %cd%
echo.

REM 检查Python是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未检测到Python，请先安装Python
    pause
    exit /b 1
)

echo [1] 启动交互式管理器
echo [2] 显示统计信息
echo [3] 列出所有Agent
echo [4] 搜索Agent
echo [5] 启动Web仪表盘
echo [6] PowerShell批量操作
echo [0] 退出
echo.

set /p choice="请选择操作: "

if "%choice%"=="1" goto interactive
if "%choice%"=="2" goto stats
if "%choice%"=="3" goto list
if "%choice%"=="4" goto search
if "%choice%"=="5" goto dashboard
if "%choice%"=="6" goto powershell
if "%choice%"=="0" goto exit
goto menu

:interactive
echo.
echo 启动交互式管理器...
python agent-manager.py
goto end

:stats
echo.
echo 显示统计信息...
python agent-manager.py stats
goto end

:list
echo.
echo 列出所有Agent...
python agent-manager.py list
goto end

:search
echo.
set /p keyword="请输入搜索关键词: "
python agent-manager.py search "%keyword%"
goto end

:dashboard
echo.
echo 正在启动Web仪表盘...
start agent-dashboard.html
goto end

:powershell
echo.
echo 启动PowerShell批量操作工具...
powershell -ExecutionPolicy Bypass -File "batch-operations.ps1" stats
goto end

:exit
exit /b 0

:end
echo.
pause
