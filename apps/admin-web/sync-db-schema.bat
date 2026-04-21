@echo off
echo ========================================
echo   Sync Database Schema from Cloud
echo ========================================
echo.

set "OUTPUT_FILE=%~dp0database-schema.sql"

echo Exporting database schema from cloud server...
echo.

ssh root@115.190.158.182 "mysqldump -u root -p'Lzj990815@' --no-data --skip-triggers --skip-add-drop-table chaowuqiong 2>/dev/null" > "%OUTPUT_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   Sync completed successfully!
    echo ========================================
    echo   Output: %OUTPUT_FILE%
    echo ========================================
) else (
    echo ========================================
    echo   Sync failed! Please check SSH connection.
    echo ========================================
)

echo.
pause
