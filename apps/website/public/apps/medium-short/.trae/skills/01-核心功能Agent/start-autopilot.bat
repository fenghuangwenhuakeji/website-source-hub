@echo off
chcp 65001 >nul
cls
echo ========================================
echo Agent Autopilot System
echo ========================================
echo.
echo Starting autonomous agent system...
echo.

node autopilot-system.js start

echo.
echo ========================================
echo System stopped
echo ========================================
pause
