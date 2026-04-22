@echo off
echo ========================================
echo 超无穹 - 一键验证部署
echo ========================================
echo.
echo 服务器: root@115.190.158.182
echo 密码: Brfj0144
echo.
echo 请按任意键开始...
pause

echo.
echo [1/4] 查看 PM2 服务状态...
echo.
ssh root@115.190.158.182 "pm2 list"

echo.
echo [2/4] 测试 API 健康检查...
echo.
ssh root@115.190.158.182 "curl -s http://localhost:3001/health"

echo.
echo [3/4] 确认代码已更新...
echo.
ssh root@115.190.158.182 "ls -la /var/www/license-backend/src/middleware/auth.js"

echo.
echo [4/4] 查看最近日志...
echo.
ssh root@115.190.158.182 "pm2 logs license-backend --lines 30 --nostream"

echo.
echo ========================================
echo 验证完成!
echo ========================================
pause
