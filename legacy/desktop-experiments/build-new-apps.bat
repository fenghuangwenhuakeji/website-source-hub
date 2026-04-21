@echo off
chcp 65001 >nul
echo ========================================
echo   超无穹桌面应用批量打包脚本
echo ========================================
echo.

set BASE_DIR=%~dp0

echo [1/6] 复制短篇拆书版资源到 app 目录...
xcopy /E /I /Y "%BASE_DIR%待打包\短篇拆书版\*" "%BASE_DIR%short-story-app\app\"

echo.
echo [2/6] 复制凤煌创世合集资源到 app 目录...
xcopy /E /I /Y "%BASE_DIR%待打包\凤煌创世合集早期版\*" "%BASE_DIR%fenghuang-app\app\"

echo.
echo [3/6] 复制中短篇资源到 app 目录...
xcopy /E /I /Y "%BASE_DIR%待打包\中短篇\*" "%BASE_DIR%medium-short-app\app\"

echo.
echo [4/6] 安装依赖并打包短篇拆书版...
cd /d "%BASE_DIR%short-story-app"
call npm install
call npm run electron:build

echo.
echo [5/6] 安装依赖并打包凤煌创世合集...
cd /d "%BASE_DIR%fenghuang-app"
call npm install
call npm run electron:build

echo.
echo [6/6] 安装依赖并打包中短篇...
cd /d "%BASE_DIR%medium-short-app"
call npm install
call npm run electron:build

echo.
echo ========================================
echo   打包完成！
echo ========================================
echo.
echo 输出目录:
echo   - 短篇拆书版: %BASE_DIR%short-story-app\dist-release
echo   - 凤煌创世合集: %BASE_DIR%fenghuang-app\dist-release
echo   - 中短篇: %BASE_DIR%medium-short-app\dist-release
echo.
pause
