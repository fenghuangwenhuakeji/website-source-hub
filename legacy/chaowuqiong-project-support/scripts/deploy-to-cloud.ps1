# 超无穹 - 云端部署脚本 (PowerShell)
# 使用 WinSCP 进行文件上传

$SERVER_IP = "115.190.158.182"
$SERVER_USER = "root"
$SERVER_PASS = "gong134135"
$REMOTE_BASE = "/var/www/chaowuqiong/apps"

$PROJECT_ROOT = "d:\网站部署\超无穹项目\chaowuqiong-project"
$FRONTEND_DIST = Join-Path $PROJECT_ROOT "apps\frontent\webuiapps\dist"
$BACKEND_DIST = Join-Path $PROJECT_ROOT "apps\backend\dist"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  超无穹 - 云端部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "PROJECT_ROOT: $PROJECT_ROOT" -ForegroundColor Gray
Write-Host "FRONTEND_DIST: $FRONTEND_DIST" -ForegroundColor Gray
Write-Host "BACKEND_DIST: $BACKEND_DIST" -ForegroundColor Gray
Write-Host ""

# 创建部署包目录
$deployDir = Join-Path $PROJECT_ROOT "deploy-package"
if (Test-Path $deployDir) {
    Remove-Item -Recurse -Force $deployDir
}
New-Item -ItemType Directory -Force -Path $deployDir | Out-Null

# 打包前端
Write-Host "[1/4] 打包前端..." -ForegroundColor Yellow
$frontendZip = Join-Path $deployDir "frontend-dist.zip"
if (Test-Path $FRONTEND_DIST) {
    Compress-Archive -Path "$FRONTEND_DIST\*" -DestinationPath $frontendZip -Force
    Write-Host "  前端打包完成: $frontendZip" -ForegroundColor Green
} else {
    Write-Host "  前端 dist 目录不存在: $FRONTEND_DIST" -ForegroundColor Red
    exit 1
}

# 打包后端
Write-Host "[2/4] 打包后端..." -ForegroundColor Yellow
$backendZip = Join-Path $deployDir "backend-dist.zip"
if (Test-Path $BACKEND_DIST) {
    Compress-Archive -Path "$BACKEND_DIST\*" -DestinationPath $backendZip -Force
    Write-Host "  后端打包完成: $backendZip" -ForegroundColor Green
} else {
    Write-Host "  后端 dist 目录不存在: $BACKEND_DIST" -ForegroundColor Red
    exit 1
}

# 创建服务器部署脚本
Write-Host "[3/4] 创建服务器部署脚本..." -ForegroundColor Yellow
$serverScript = @'
#!/bin/bash
cd /var/www/chaowuqiong/apps/webuiapps/
rm -rf dist_backup_$(date +%Y%m%d) 2>/dev/null
mv dist dist_backup_$(date +%Y%m%d) 2>/dev/null
mkdir -p dist
cd dist
unzip -o /tmp/frontend-dist.zip
chown -R nginx:nginx /var/www/chaowuqiong/apps/webuiapps/dist
chmod -R 755 /var/www/chaowuqiong/apps/webuiapps/dist

cd /var/www/chaowuqiong/apps/backend/
rm -rf dist_backup_$(date +%Y%m%d) 2>/dev/null
mv dist dist_backup_$(date +%Y%m%d) 2>/dev/null
mkdir -p dist
cd dist
unzip -o /tmp/backend-dist.zip

pm2 restart chaowuqiong-api
nginx -s reload
echo "部署完成!"
'@
$scriptPath = Join-Path $deployDir "deploy.sh"
$serverScript | Out-File -FilePath $scriptPath -Encoding ASCII

Write-Host "  服务器脚本创建完成" -ForegroundColor Green

# 显示上传说明
Write-Host ""
Write-Host "[4/4] 上传到服务器..." -ForegroundColor Yellow
Write-Host ""
Write-Host "请使用以下命令上传文件到服务器:" -ForegroundColor White
Write-Host ""
Write-Host "  # 使用 SCP 上传 (在 Git Bash 或 WSL 中执行):" -ForegroundColor Gray
Write-Host "  scp `"$frontendZip`" ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host "  scp `"$backendZip`" ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host "  scp `"$scriptPath`" ${SERVER_USER}@${SERVER_IP}:/tmp/" -ForegroundColor White
Write-Host ""
Write-Host "  # 然后登录服务器执行:" -ForegroundColor Gray
Write-Host "  ssh ${SERVER_USER}@${SERVER_IP}" -ForegroundColor White
Write-Host "  chmod +x /tmp/deploy.sh && /tmp/deploy.sh" -ForegroundColor White
Write-Host ""
Write-Host "或者使用 WinSCP/FileZilla 等工具上传以下文件:" -ForegroundColor Gray
Write-Host "  - $frontendZip -> /tmp/frontend-dist.zip" -ForegroundColor White
Write-Host "  - $backendZip -> /tmp/backend-dist.zip" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  本地打包完成!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "部署包位置: $deployDir" -ForegroundColor Yellow
Write-Host ""
