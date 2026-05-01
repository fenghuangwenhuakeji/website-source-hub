param(
  [string]$Prompt = 'agent runtime check',
  [string]$AgentId = '',
  [int]$Limit = 8
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

$arguments = @($hostFile, '--mode', 'run', '--prompt', $Prompt, '--limit', $Limit)
if ($AgentId) {
  $arguments += @('--agent', $AgentId)
}

& node @arguments
