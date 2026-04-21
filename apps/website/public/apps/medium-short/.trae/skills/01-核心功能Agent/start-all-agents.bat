@echo off
chcp 65001 >nul
cls
echo ========================================
echo Starting all core function agents...
echo ========================================
echo.

node agent-driver.js all

echo.
echo ========================================
echo All agents started successfully!
echo ========================================
pause
