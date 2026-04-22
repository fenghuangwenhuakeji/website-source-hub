$scriptPath = Join-Path $PSScriptRoot 'cloud-bridge\scripts\run-ssh-via-clash.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Cloud bridge script not found: $scriptPath"
}

& $scriptPath @args
exit $LASTEXITCODE
