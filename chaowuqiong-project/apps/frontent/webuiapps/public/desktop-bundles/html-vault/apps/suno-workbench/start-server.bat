@echo off
chcp 65001 >nul
title Suno Workbench - AI Music Creation Assistant
echo ========================================
echo    Suno Workbench - AI Music Creation Assistant
echo ========================================
echo.
echo Starting local server...
echo.

cd /d "%~dp0"

echo Server address: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

:: Start the server in background
start /b python -m http.server 8080

:: Wait a moment for server to start
timeout /t 2 /nobreak >nul

:: Open browser
echo Opening browser...
start http://localhost:8080

:: Keep the window open
echo.
echo Server is running. Close this window to stop the server.
pause >nul

:: Stop the server when window is closed
taskkill /f /im python.exe >nul 2>&1
