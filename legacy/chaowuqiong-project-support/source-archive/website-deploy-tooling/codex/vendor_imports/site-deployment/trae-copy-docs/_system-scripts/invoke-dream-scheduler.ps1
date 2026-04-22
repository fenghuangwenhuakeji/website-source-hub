param(
  [int]$Limit = 6,
  [string]$Summary = 'background dream synthesis'
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

$schedulerFile = Resolve-RuntimeFile 'dream-scheduler.js'

& node $schedulerFile --limit $Limit --summary $Summary
