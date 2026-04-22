# 超无穹 license-backend 部署脚本
# 需要手动输入密码进行 SSH 连接

param(
    [string]$server = "root@115.190.158.182",
    [string]$zipPath = "D:\网站部署\chaowuqiong-project\deploy\license-backend-fixed.zip",
    [string]$remoteDir = "/var/www/license-backend"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  超无穹 license-backend 部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload file
Write-Host "[1/4] 上传部署文件..." -ForegroundColor Yellow
Write-Host "请在弹出的窗口中输入密码: gong134135"
Write-Host ""

# Use SCP with password prompt
$scpCmd = "scp `"$zipPath`" `"$server`:/tmp/license-backend-fixed.zip`""
Write-Host "执行命令: $scpCmd" -ForegroundColor Gray

# Try using Start-Process to open SSH with password prompt
$process = Start-Process powershell -ArgumentList "-NoExit", "-Command", $scpCmd -PassThru -WindowStyle Normal

Write-Host "等待上传完成..." -ForegroundColor Yellow
$process.WaitForExit()

# Step 2: Extract and deploy
Write-Host ""
Write-Host "[2/4] 解压并部署文件..." -ForegroundColor Yellow
Write-Host "请在弹出的窗口中输入密码: gong134135"
Write-Host ""

$deployCmd = @"
ssh $server "cd /tmp && tar -xzf license-backend-fixed.zip && cp -r src/* $remoteDir/src/ && cp package.json $remoteDir/ 2>/dev/null; ls -la $remoteDir/src/"
"@

$deployProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $deployCmd -PassThru -WindowStyle Normal
$deployProcess.WaitForExit()

# Step 3: Restart service
Write-Host ""
Write-Host "[3/4] 重启服务..." -ForegroundColor Yellow
Write-Host "请在弹出的窗口中输入密码: gong134135"
Write-Host ""

$restartCmd = @"
ssh $server "cd $remoteDir && pm2 restart license-backend || pm2 start src/app.js --name license-backend && pm2 list"
"@

$restartProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $restartCmd -PassThru -WindowStyle Normal
$restartProcess.WaitForExit()

# Step 4: Verify
Write-Host ""
Write-Host "[4/4] 验证服务状态..." -ForegroundColor Yellow
Write-Host "请在弹出的窗口中输入密码: gong134135"
Write-Host ""

$verifyCmd = @"
ssh $server "curl -s http://localhost:3001/health && pm2 list"
"@

$verifyProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", $verifyCmd -PassThru -WindowStyle Normal
$verifyProcess.WaitForExit()

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  部署流程已启动!" -ForegroundColor Green
Write-Host "  请在各个弹出的窗口中输入密码: gong134135" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
