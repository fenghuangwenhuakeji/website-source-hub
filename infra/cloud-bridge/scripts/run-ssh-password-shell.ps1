param(
    [string]$Server = "root@115.190.158.182",
    [string]$Password = "",
    [string]$ProxyHost = "127.0.0.1",
    [int]$ProxyPort = 7890
)

$ErrorActionPreference = "Stop"

if ([string]::IsNullOrWhiteSpace($Password)) {
    $Password = $env:SSH_SERVER_PASSWORD
}

if ([string]::IsNullOrWhiteSpace($Password)) {
    throw "SSH password is required."
}

$env:SSH_SERVER = $Server
$env:SSH_SERVER_PASSWORD = $Password
$env:SSH_PROXY_HOST = $ProxyHost
$env:SSH_PROXY_PORT = [string]$ProxyPort
$env:SSH_CLASH_FORCE_DIRECT = "1"

Write-Host "Opening interactive SSH shell for $Server ..." -ForegroundColor Cyan
& node (Join-Path $PSScriptRoot "ssh-via-clash-password-shell.js")
