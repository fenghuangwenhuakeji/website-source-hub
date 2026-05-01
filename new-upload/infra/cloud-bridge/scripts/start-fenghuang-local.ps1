param(
    [int]$Port = 5182
)

$ErrorActionPreference = "Stop"

$workspace = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$projectDir = Join-Path $workspace "fenghuang-unified"
$logDir = Join-Path $workspace "cloud-bridge\logs"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$logFile = Join-Path $logDir "fenghuang-local-$timestamp.log"
$serverScript = Join-Path $workspace "cloud-bridge\scripts\serve-fenghuang-local.mjs"

$existing = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($existing) {
    Stop-Process -Id $existing.OwningProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

Push-Location $projectDir
try {
    npm run build
}
finally {
    Pop-Location
}

$command = "$env:FENGHUANG_LOCAL_PORT='$Port'; node `"$serverScript`" *> `"$logFile`""
Start-Process -FilePath "powershell" -ArgumentList "-NoProfile", "-Command", $command -WindowStyle Hidden | Out-Null

Start-Sleep -Seconds 2

Write-Output "local_server_port=$Port"
Write-Output "local_server_log=$logFile"
