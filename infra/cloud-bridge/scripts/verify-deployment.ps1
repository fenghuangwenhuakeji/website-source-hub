# 超无穹 - 部署验证脚本
# 会等待你输入密码

param(
    [string]$server = "root@115.190.158.182",
    [string]$password = "gong134135"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署验证脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Run-SSHCommand {
    param($cmd, $description)
    Write-Host "[$description] 正在连接..." -ForegroundColor Yellow
    Write-Host "命令: $cmd" -ForegroundColor Gray
    Write-Host ""
    Write-Host "请在下方输入密码: $password" -ForegroundColor Green
    Write-Host ""

    $process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -PassThru -WindowStyle Normal
    $process.WaitForExit()

    Write-Host "[$description] 完成" -ForegroundColor Green
    Write-Host ""
}

# 1. 查看 PM2 服务状态
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "步骤 1: 查看 PM2 服务状态" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Run-SSHCommand "ssh $server `"pm2 list`"" "PM2状态"

# 2. 测试 API 健康检查
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "步骤 2: 测试 API 健康检查" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Run-SSHCommand "ssh $server `"curl -s http://localhost:3001/health`"" "API健康检查"

# 3. 查看 middleware/auth.js 修改时间
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "步骤 3: 确认代码已更新" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Run-SSHCommand "ssh $server `"ls -la /var/www/license-backend/src/middleware/auth.js && head -50 /var/www/license-backend/src/middleware/auth.js | grep -A5 'checkRechargeRequired'`"" "代码验证"

# 4. 查看 recent 日志
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "步骤 4: 查看最近日志" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Run-SSHCommand "ssh $server `"pm2 logs license-backend --lines 50 --nostream`"" "查看日志"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  验证完成!" -ForegroundColor Green
Write-Host "  请检查上方输出确认部署状态" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
