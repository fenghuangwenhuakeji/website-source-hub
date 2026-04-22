@echo off
chcp 65001 >nul 2>&1
title Agent System Master Controller

echo ================================================================
echo        Agent System Master Controller
echo        Auto-Discover, Auto-Schedule, Auto-Execute
echo ================================================================
echo.

set SKILLS_DIR=D:\网站部署\.trae\skills
set TARGET_DIR=%SKILLS_DIR%\02-超无穹项目Agent

echo Starting Master Controller...
echo Target: %TARGET_DIR%
echo.

node "%SKILLS_DIR%\master-controller.js" "%TARGET_DIR%"

echo.
echo Press any key to exit...
pause >nul
