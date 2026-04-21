param(
    [string]$Server = "root@115.190.158.182",
    [Parameter(Mandatory = $true)]
    [string]$RemoteCommand,
    [string]$KeyPath = "",
    [int]$MaxAttempts = 5,
    [int]$RetryDelaySeconds = 3
)

$ErrorActionPreference = "Stop"

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

$sshArgs = @(
    "-o", "StrictHostKeyChecking=no",
    "-o", "BatchMode=yes",
    "-o", "ServerAliveInterval=30",
    "-o", "ServerAliveCountMax=3",
    "-o", "ConnectTimeout=15",
    "-T"
)

if ($KeyPath -and (Test-Path $KeyPath)) {
    $sshArgs += "-i"
    $sshArgs += $KeyPath
}

$sshArgs += $Server
$sshArgs += $RemoteCommand

Write-Host "Running remote command on $Server via direct SSH..." -ForegroundColor Cyan
if ($KeyPath -and (Test-Path $KeyPath)) {
    Write-Host "Using key: $KeyPath" -ForegroundColor DarkCyan
}
Write-Host "Remote command: $RemoteCommand" -ForegroundColor DarkGray

$lastExitCode = 1

for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
    if ($attempt -gt 1) {
        Write-Host "Retrying SSH command ($attempt/$MaxAttempts)..." -ForegroundColor Yellow
        Start-Sleep -Seconds $RetryDelaySeconds
    }

    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & ssh @sshArgs 2>&1 | ForEach-Object {
            if ($_ -is [System.Management.Automation.ErrorRecord]) {
                Write-Host $_.ToString()
            }
            else {
                Write-Output $_
            }
        }
    }
    finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    $lastExitCode = $LASTEXITCODE

    if ($lastExitCode -eq 0) {
        break
    }
}

if ($lastExitCode -ne 0) {
    throw "ssh exited with code $lastExitCode after $MaxAttempts attempt(s)"
}
