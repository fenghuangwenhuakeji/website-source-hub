@echo off
chcp 65001 >nul 2>&1
title Agent Assistant Launcher

echo.
echo ================================================================
echo              Agent Assistant Launcher
echo ================================================================
echo.
echo Please select the service to start:
echo.
echo   [1] Web Server
echo   [2] Desktop App (Electron)
echo   [3] Browser Extension Guide
echo   [4] Start All
echo   [5] Exit
echo.
set /p choice="Enter option (1-5): "

if "%choice%"=="1" goto web
if "%choice%"=="2" goto electron
if "%choice%"=="3" goto extension
if "%choice%"=="4" goto all
if "%choice%"=="5" goto end

:web
echo.
echo Starting Web Server...
cd /d "%~dp0web-server"
start "Agent Web Server" cmd /k "node server.js"
echo.
echo Web Server started!
echo URL: http://localhost:3100
echo.
pause
goto end

:electron
echo.
echo Starting Desktop App...
cd /d "%~dp0electron-app"
start "Agent Electron" cmd /k "npm start"
echo.
echo Desktop App started!
echo Check system tray for icon.
echo.
pause
goto end

:extension
echo.
echo Browser Extension Installation Guide:
echo.
echo Chrome:
echo   1. Open chrome://extensions/
echo   2. Enable "Developer mode"
echo   3. Click "Load unpacked"
echo   4. Select folder: %~dp0browser-extension
echo.
echo Edge:
echo   1. Open edge://extensions/
echo   2. Enable "Developer mode"
echo   3. Click "Load unpacked"
echo   4. Select folder: %~dp0browser-extension
echo.
pause
goto end

:all
echo.
echo Starting all services...
cd /d "%~dp0web-server"
start "Agent Web Server" cmd /k "node server.js"
timeout /t 2 >nul
cd /d "%~dp0electron-app"
start "Agent Electron" cmd /k "npm start"
echo.
echo All services started!
echo Web: http://localhost:3100
echo Desktop: Check system tray
echo.
pause
goto end

:end
