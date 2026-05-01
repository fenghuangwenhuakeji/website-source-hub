@echo off
echo ========================================
echo   Simple Electron Pack Script
echo ========================================
echo.

set PROJECT_ROOT=%~dp0
echo [1/3] Copying Electron files...
xcopy /s /e /y /i " "%PROJECT_ROOT%electron-v39.8.2-win32-x64\*" "%PROJECT_ROOT%main-app\release\win-unpacked\" /O /N /Y

echo [2/3] Copying dist files...
xcopy /s /e /y /i" "%PROJECT_ROOT%main-app\dist\*" "%PROJECT_ROOT%main-app\release\win-unpacked\resources\app\" /O /N /Y

echo [3/3] Creating portable exe...
copy /b "%PROJECT_ROOT%main-app\release\win-unpacked\超无穹.exe" "%PROJECT_ROOT%main-app\release\超无穹-Portable.exe"

echo.
echo ========================================
echo   Main App package created!
echo   Location: %PROJECT_ROOT%main-app\release\
echo ========================================
echo.
echo You portable exe is ready to run!
pause
