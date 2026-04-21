# 超无穹 - 部署验证脚本 v2
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================"
Write-Host "  部署验证脚本 - 请按顺序执行"
Write-Host "========================================"
Write-Host ""
Write-Host "密码: Brfj0144
Write-Host ""

Write-Host "--- 步骤 1: 查看 PM2 服务状态 ---"
Write-Host "请在弹出的窗口输入密码，然后按任意键继续..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh root@115.190.158.182 'pm2 list'; Read-Host '按回车继续'"
Read-Host ""

Write-Host ""
Write-Host "--- 步骤 2: 测试 API 健康检查 ---"
Write-Host "请在弹出的窗口输入密码，然后按任意键继续..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh root@115.190.158.182 'curl -s http://localhost:3001/health'"; Read-Host "按回车继续"

Write-Host ""
Write-Host "--- 步骤 3: 确认代码已更新 ---"
Write-Host "请在弹出的窗口输入密码，然后按任意键继续..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh root@115.190.158.182 'ls -la /var/www/license-backend/src/middleware/auth.js'"; Read-Host "按回车继续"

Write-Host ""
Write-Host "--- 步骤 4: 查看最近日志 ---"
Write-Host "请在弹出的窗口输入密码，然后按任意键继续..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ssh root@115.190.158.182 'pm2 logs license-backend --lines 30 --nostream'"; Read-Host "按回车继续"

Write-Host ""
Write-Host "========================================"
Write-Host "  验证完成!"
Write-Host "========================================"
