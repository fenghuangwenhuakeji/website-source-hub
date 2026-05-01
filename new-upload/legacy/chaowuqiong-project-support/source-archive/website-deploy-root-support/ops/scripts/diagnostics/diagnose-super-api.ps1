# 超无穹系统诊断脚本 - Windows PowerShell 版本
# 用于诊断 502 Bad Gateway 问题

$ServerIP = "115.190.158.182"
$SSHKey = "C:\Users\8\Downloads\fenghuangwenhua.pem"

Write-Host "========== 开始诊断超无穹后端服务 ==========" -ForegroundColor Cyan

# 1. 检查 PM2 状态
Write-Host "`n[1] 检查 PM2 服务状态..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "pm2 status"

# 2. 检查端口监听状态
Write-Host "`n[2] 检查 3000 和 3001 端口..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "netstat -tlnp 2>/dev/null | grep -E '3000|3001' || ss -tlnp 2>/dev/null | grep -E '3000|3001' || echo '未找到端口监听'"

# 3. 测试 3000 端口
Write-Host "`n[3] 测试 3000 端口..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "curl -s http://127.0.0.1:3000/health || echo '3000 端口无响应'"

# 4. 测试 3001 端口
Write-Host "`n[4] 测试 3001 端口..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "curl -s http://127.0.0.1:3001/health || echo '3001 端口无响应'"

# 5. 检查 Nginx 配置
Write-Host "`n[5] 检查 Nginx 配置..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "cat /etc/nginx/conf.d/chaowuqiong.conf 2>/dev/null || cat /etc/nginx/sites-enabled/chaowuqiong 2>/dev/null || echo '未找到 chaowuqiong Nginx 配置'"

# 6. 检查 Nginx 错误日志
Write-Host "`n[6] 最近 Nginx 错误日志..." -ForegroundColor Yellow
& ssh -i $SSHKey root@$ServerIP "tail -20 /var/log/nginx/error.log 2>/dev/null || echo '无法读取 Nginx 错误日志'"

Write-Host "`n========== 诊断完成 ==========" -ForegroundColor Cyan
Write-Host "`n根据上述输出，请告诉我结果，我可以帮你进一步分析和修复。" -ForegroundColor Green