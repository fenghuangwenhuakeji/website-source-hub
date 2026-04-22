$scriptPath = Join-Path $PSScriptRoot 'cloud-bridge\scripts\verify-deployment-v2.ps1'

if (-not (Test-Path $scriptPath)) {
    throw "Cloud bridge script not found: $scriptPath"
}

& $scriptPath @args
exit $LASTEXITCODE
