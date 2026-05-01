param(
    [string]$Server = "root@115.190.158.182",
    [string]$KeyPath = "",
    [string]$ProxyHost = "127.0.0.1",
    [int]$ProxyPort = 7890
)

$ErrorActionPreference = "Stop"

$proxyScript = "C:\Users\8\.codex\bin\ssh-http-proxy.js"

if (-not (Test-Path $proxyScript)) {
    throw "Proxy script not found: $proxyScript"
}

if ([string]::IsNullOrWhiteSpace($KeyPath)) {
    $preferredKeys = @(
        "C:\Users\8\.codex\bin\fenghuangwenhua.pem",
        (Join-Path $PSScriptRoot "fenghuangwenhua.pem"),
        "C:\Users\8\.codex\bin\id_rsa_chaowuqiong",
        (Join-Path $PSScriptRoot "id_rsa_chaowuqiong")
    )

    foreach ($candidate in $preferredKeys) {
        if (Test-Path $candidate) {
            $KeyPath = $candidate
            break
        }
    }
}

$env:SSH_PROXY_HOST = $ProxyHost
$env:SSH_PROXY_PORT = [string]$ProxyPort

$sshArgs = @(
    "-o", "ProxyCommand=node `"$proxyScript`" %h %p",
    "-o", "StrictHostKeyChecking=no",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3"
)

if (Test-Path $KeyPath) {
    $sshArgs += "-i"
    $sshArgs += $KeyPath
}

$sshArgs += $Server

Write-Host "Connecting to $Server via HTTP proxy ${ProxyHost}:$ProxyPort ..." -ForegroundColor Cyan
if (Test-Path $KeyPath) {
    Write-Host "Using key: $KeyPath" -ForegroundColor DarkCyan
}

& ssh @sshArgs
