$ErrorActionPreference = "Stop"

$env:CODEX_HOME = $PSScriptRoot

if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
    throw "codex command not found in PATH"
}

Write-Host "Using CODEX_HOME=$env:CODEX_HOME" -ForegroundColor Cyan
& codex @args
