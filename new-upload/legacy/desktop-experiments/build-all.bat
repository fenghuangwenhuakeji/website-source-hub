@echo off
chcp 65001 >nul
echo ========================================
echo   Chaowuqiong Desktop Build Script
echo ========================================
echo.
echo This script will build two desktop apps:
echo   1. Main App (Register, Recharge, Main)
echo   2. Admin Dashboard
echo.

set PROJECT_ROOT=%~dp0

echo ========================================
echo   Building Main App...
echo ========================================
call "%PROJECT_ROOT%build-main.bat"

echo.
echo ========================================
echo   Building Admin Dashboard...
echo ========================================
call "%PROJECT_ROOT%build-admin.bat"

echo.
echo ========================================
echo   All builds completed!
echo ========================================
echo.
echo Main App: %PROJECT_ROOT%main-app\release\
echo Admin Dashboard: %PROJECT_ROOT%admin-app\release\
echo ========================================
pause
