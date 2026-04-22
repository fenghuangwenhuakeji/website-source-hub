$ErrorActionPreference = "Stop"

$compiledRoot = Join-Path $PSScriptRoot "codex-compiled"

if (-not (Test-Path -LiteralPath $compiledRoot)) {
    throw "Compiled Codex root not found: $compiledRoot"
}

& (Join-Path $compiledRoot "start-codex.ps1") @args
