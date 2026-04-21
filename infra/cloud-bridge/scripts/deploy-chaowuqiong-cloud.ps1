param(
    [string]$Server = "root@115.190.158.182"
)

$ErrorActionPreference = "Stop"

$remoteCommand = @'
set -e
ts=$(date +%Y%m%d-%H%M%S)
cd /tmp/chaowuqiong-deploy-20260409
cp -a /var/www/chaowuqiong/apps/backend/dist /var/www/chaowuqiong/apps/backend/dist_backup_$ts
cp -a /var/www/chaowuqiong/frontend /var/www/chaowuqiong/frontend_backup_$ts
cp -a /var/www/chaowuqiong/apps/web-manage/dist /var/www/chaowuqiong/apps/web-manage/dist_backup_$ts
rm -rf /var/www/chaowuqiong/apps/backend/dist
cp -a backend-new/dist /var/www/chaowuqiong/apps/backend/dist
find /var/www/chaowuqiong/frontend -mindepth 1 -maxdepth 1 -exec rm -rf {} +
cp -a frontend-new/dist/. /var/www/chaowuqiong/frontend/
rm -rf /var/www/chaowuqiong/apps/web-manage/dist
cp -a admin-new/dist /var/www/chaowuqiong/apps/web-manage/dist
pm2 restart chaowuqiong-api
nginx -t
systemctl reload nginx
echo deployed_$ts
'@

& "$PSScriptRoot\run-ssh-command-via-clash.ps1" -Server $Server -RemoteCommand $remoteCommand
