param(
    [string]$Server = "root@115.190.158.182",
    [Parameter(Mandatory = $true)]
    [string]$RemoteCommand,
    [string]$KeyPath = "",
    [string]$ProxyHost = "127.0.0.1",
    [int]$ProxyPort = 7890
)

$ErrorActionPreference = "Stop"

$localSetGlobalScript = Join-Path $PSScriptRoot "set-clash-global.js"
$localProxyScript = Join-Path $PSScriptRoot "ssh-http-proxy.js"

$setGlobalScript = if (Test-Path $localSetGlobalScript) {
    $localSetGlobalScript
} else {
    "C:\Users\8\.codex\bin\set-clash-global.js"
}

$proxyScript = if (Test-Path $localProxyScript) {
    $localProxyScript
} else {
    "C:\Users\8\.codex\bin\ssh-http-proxy.js"
}

if (-not (Test-Path $setGlobalScript)) {
    throw "Clash selector script not found: $setGlobalScript"
}

if (-not (Test-Path $proxyScript)) {
    throw "Proxy script not found: $proxyScript"
}

$switchedTo = & node $setGlobalScript --exact DIRECT
if ($LASTEXITCODE -ne 0) {
    throw "Failed to switch Clash GLOBAL to DIRECT"
}
Write-Host "Clash GLOBAL switched to $($switchedTo.Trim())." -ForegroundColor Yellow

if ([string]::IsNullOrWhiteSpace($KeyPath)) {
    $preferredKeys = @(
        (Join-Path $PSScriptRoot "..\secrets\fenghuangwenhua.pem"),
        "C:\Users\8\.codex\bin\fenghuangwenhua.pem",
        (Join-Path $PSScriptRoot "fenghuangwenhua.pem"),
        (Join-Path $PSScriptRoot "..\secrets\id_rsa_chaowuqiong"),
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
    "-o", "BatchMode=yes",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3",
    "-T"
)

if ($KeyPath -and (Test-Path $KeyPath)) {
    $sshArgs += "-i"
    $sshArgs += $KeyPath
}

$sshArgs += $Server
$sshArgs += $RemoteCommand

Write-Host "Running remote command on $Server via Clash ${ProxyHost}:$ProxyPort ..." -ForegroundColor Cyan
if ($KeyPath -and (Test-Path $KeyPath)) {
    Write-Host "Using key: $KeyPath" -ForegroundColor DarkCyan
}
Write-Host "Remote command: $RemoteCommand" -ForegroundColor DarkGray

& ssh @sshArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
    throw "ssh exited with code $exitCode"
}
