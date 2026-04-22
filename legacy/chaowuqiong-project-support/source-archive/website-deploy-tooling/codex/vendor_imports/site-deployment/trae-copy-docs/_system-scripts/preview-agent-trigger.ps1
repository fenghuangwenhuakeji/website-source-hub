param(
  [string]$Prompt = 'agent runtime check',
  [string]$Mode = 'run',
  [string]$AgentId = '',
  [int]$Limit = 8,
  [switch]$Json
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Resolve-RuntimeFile([string]$FileName) {
  $root = Split-Path -Path $PSScriptRoot -Parent
  $candidates = @(
    (Join-Path $root "skills\_agent-system\runtime\$FileName"),
    (Join-Path $root "runtime\$FileName")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate) {
      return $candidate
    }
  }

  throw "$FileName not found from script root: $PSScriptRoot"
}

$hostFile = Resolve-RuntimeFile 'agent-host.js'

$arguments = @($hostFile, '--mode', $Mode, '--prompt', $Prompt, '--limit', $Limit)
if ($AgentId) {
  $arguments += @('--agent', $AgentId)
}

$raw = & node @arguments
if ($Json) {
  $raw
  return
}

$result = $raw | ConvertFrom-Json

Write-Host ''
Write-Host "Trigger Phrase : $Prompt" -ForegroundColor Cyan
Write-Host "Mode           : $Mode" -ForegroundColor Cyan
if ($result.target) {
  Write-Host "Selected Agent : $($result.target.id) [$($result.target.source)]" -ForegroundColor Green
  Write-Host "Display Name   : $($result.target.displayName)" -ForegroundColor Green
}

if ($result.matches) {
  Write-Host ''
  Write-Host 'Top Matches:' -ForegroundColor Yellow
  $index = 1
  foreach ($item in $result.matches) {
    Write-Host ("  {0}. {1} [{2}] score={3}" -f $index, $item.id, $item.source, $item.score)
    $index += 1
  }
}

Write-Host ''
Write-Host 'Tip:' -ForegroundColor Yellow
Write-Host "  Use invoke-core-agent.ps1 to run the selected agent lifecycle directly."
