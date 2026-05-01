@echo off
chcp 65001 >nul
echo ========================================
echo   打包单个应用
echo ========================================
echo.

set APP_NAME=%1
if "%APP_NAME%"=="" (
    echo 用法: build-single-app.bat [应用名称]
    echo.
    echo 可选应用:
    echo   short-story  - 短篇拆书版
    echo   fenghuang    - 凤煌创世合集
    echo   medium-short - 中短篇
    echo   admin        - 管理后台
    echo   main         - 主程序
    pause
    exit /b 1
)

set BASE_DIR=%~dp0

if "%APP_NAME%"=="short-story" (
    echo 复制短篇拆书版资源...
    xcopy /E /I /Y "%BASE_DIR%待打包\短篇拆书版\*" "%BASE_DIR%short-story-app\app\"
    cd /d "%BASE_DIR%short-story-app"
    call npm install
    call npm run electron:build
    echo 打包完成: %BASE_DIR%short-story-app\dist-release
) else if "%APP_NAME%"=="fenghuang" (
    echo 复制凤煌创世合集资源...
    xcopy /E /I /Y "%BASE_DIR%待打包\凤煌创世合集早期版\*" "%BASE_DIR%fenghuang-app\app\"
    cd /d "%BASE_DIR%fenghuang-app"
    call npm install
    call npm run electron:build
    echo 打包完成: %BASE_DIR%fenghuang-app\dist-release
) else if "%APP_NAME%"=="medium-short" (
    echo 复制中短篇资源...
    xcopy /E /I /Y "%BASE_DIR%待打包\中短篇\*" "%BASE_DIR%medium-short-app\app\"
    cd /d "%BASE_DIR%medium-short-app"
    call npm install
    call npm run electron:build
    echo 打包完成: %BASE_DIR%medium-short-app\dist-release
) else if "%APP_NAME%"=="admin" (
    cd /d "%BASE_DIR%admin-app"
    call npm install
    call npm run electron:build
    echo 打包完成: %BASE_DIR%admin-app\dist-release
) else if "%APP_NAME%"=="main" (
    cd /d "%BASE_DIR%main-app"
    call npm install
    call npm run electron:build
    echo 打包完成: %BASE_DIR%main-app\dist-release
) else (
    echo 未知应用: %APP_NAME%
    pause
    exit /b 1
)

echo.
pause
