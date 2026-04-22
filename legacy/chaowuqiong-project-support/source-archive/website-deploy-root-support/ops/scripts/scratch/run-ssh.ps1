$password = "Brfj0144"
$server = "root@115.190.158.182"
$commands = @(
    "pm2 list",
    "curl -s http://localhost:3001/health",
    "ls -la /var/www/license-backend/src/middleware/auth.js",
    "grep -A5 'checkRechargeRequired' /var/www/license-backend/src/middleware/auth.js",
    "pm2 logs license-backend --lines 20 --nostream"
)

$cmd = "echo '$password' | ssh -o StrictHostKeyChecking=no $server '{0}'"
$cmd = $cmd -f ($commands -join '; ')

Start-Process powershell -ArgumentList "-NoExit", "-Command", $cmd -WindowStyle Normal
