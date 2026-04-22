param(
  [string]$CodexImportRoot = 'C:\Users\8\.codex\skills\site-deployment-imports\trae-main',
  [string]$CodexSkillRoot = 'C:\Users\8\.codex\skills'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Ensure-Dir([string]$Path) {
  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

$dotTraeRoot = Split-Path -Path $PSScriptRoot -Parent
$agentSystemSource = Join-Path $dotTraeRoot 'skills\_agent-system'
$agentSystemTarget = Join-Path $CodexImportRoot '_agent-system'
$scriptTarget = Join-Path $agentSystemTarget 'scripts'
$runtimeHubSource = Join-Path $dotTraeRoot 'skills\trae-agent-runtime-hub'
$runtimeHubTarget = Join-Path $CodexSkillRoot 'trae-agent-runtime-hub'

if (-not (Test-Path -LiteralPath $agentSystemSource)) {
  throw "agent-system source not found: $agentSystemSource"
}

Ensure-Dir $CodexImportRoot
Ensure-Dir $CodexSkillRoot
Ensure-Dir $scriptTarget

$null = robocopy $agentSystemSource $agentSystemTarget /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
if (Test-Path -LiteralPath $runtimeHubSource) {
  $null = robocopy $runtimeHubSource $runtimeHubTarget /E /R:1 /W:1 /NFL /NDL /NJH /NJS /NP
}

Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'build-agent-system.ps1') -Destination (Join-Path $scriptTarget 'build-agent-system.ps1') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'invoke-core-agent.ps1') -Destination (Join-Path $scriptTarget 'invoke-core-agent.ps1') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'invoke-dream-scheduler.ps1') -Destination (Join-Path $scriptTarget 'invoke-dream-scheduler.ps1') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'preview-agent-trigger.ps1') -Destination (Join-Path $scriptTarget 'preview-agent-trigger.ps1') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'test-agent-runtime.ps1') -Destination (Join-Path $scriptTarget 'test-agent-runtime.ps1') -Force
Copy-Item -LiteralPath (Join-Path $PSScriptRoot 'sync-codex-agent-config.ps1') -Destination (Join-Path $scriptTarget 'sync-codex-agent-config.ps1') -Force

Write-Output "Synced agent system to $agentSystemTarget"
if (Test-Path -LiteralPath $runtimeHubSource) {
  Write-Output "Synced runtime hub skill to $runtimeHubTarget"
}
