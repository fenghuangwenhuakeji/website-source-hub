param(
    [Parameter(Mandatory = $true)]
    [string]$Query,
    [string]$CodexRoot = "D:\网站部署\codex",
    [int]$Limit = 50
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$indexPath = Join-Path $CodexRoot "vendor_imports\site-deployment\site-deployment-skill-index.json"
if (-not (Test-Path -LiteralPath $indexPath)) {
    throw "Skill index not found: $indexPath"
}

$index = Get-Content -LiteralPath $indexPath -Raw | ConvertFrom-Json
$needle = $Query.ToLowerInvariant()

$results = @($index.recursive | Where-Object {
    $_.name.ToLowerInvariant().Contains($needle) -or $_.path.ToLowerInvariant().Contains($needle)
})

$results |
    Select-Object -First $Limit |
    ForEach-Object {
        [pscustomobject]@{
            source = $_.source
            name = $_.name
            path = $_.path
        }
    } |
    ConvertTo-Json -Depth 4
