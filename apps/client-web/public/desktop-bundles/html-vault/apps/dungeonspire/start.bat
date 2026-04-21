@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: =================================================================================================
:: DungeonSpire Launcher
:: =================================================================================================

title DungeonSpire Launcher
color 0A
cls

echo.
echo  ======================================================================
echo    D U N G E O N   S P I R E
echo  ======================================================================
echo.

:: 1. Check Python
echo  [*] Checking Python environment...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Python is not found in your PATH.
    echo  Please install Python 3 from https://www.python.org/
    echo.
    pause
    exit /b 1
)

:: 2. Configuration
set "PORT=8080"
set "HOST=localhost"
set "URL=http://%HOST%:%PORT%"

:: 3. Start Server
echo  [*] Starting Server on port %PORT%...

start "DungeonSpire Server" cmd /k "python server.py %PORT%"

:: Wait for server to initialize
timeout /t 2 >nul

:: 4. Open Browser
echo  [*] Opening Browser: %URL%
start "" "%URL%"

:: 5. Done
echo.
echo  ======================================================================
echo    Game is Running!
echo    - Close the Server window to stop.
echo  ======================================================================
echo.
pause
