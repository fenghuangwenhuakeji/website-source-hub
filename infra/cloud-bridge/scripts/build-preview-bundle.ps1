param(
    [string]$RepoRoot = "",
    [string]$OutputRoot = "",
    [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

if (-not $RepoRoot) {
    $RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
}

if (-not $OutputRoot) {
    $OutputRoot = Join-Path $RepoRoot "infra\cloud-bridge\artifacts"
}

if (-not $Tag) {
    $gitTag = git -C $RepoRoot rev-parse --short HEAD
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $Tag = "$gitTag-previewdeploy-$timestamp"
}

$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) "fhwh-preview-build-$Tag"
$contextRoot = Join-Path $tempRoot "context"
$bundleRoot = Join-Path $OutputRoot $Tag
$archivePath = Join-Path $OutputRoot "$Tag.tgz"
$dockerfilePath = Join-Path $RepoRoot "infra\cloud-bridge\docker\preview-bundle.Dockerfile"
$imageName = "fhwh-preview-bundle:$Tag"

Write-Host "Preparing preview bundle for tag: $Tag"

if (Test-Path $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
}

if (Test-Path $bundleRoot) {
    Remove-Item -LiteralPath $bundleRoot -Recurse -Force
}

if (Test-Path $archivePath) {
    Remove-Item -LiteralPath $archivePath -Force
}

New-Item -ItemType Directory -Path $contextRoot -Force | Out-Null
New-Item -ItemType Directory -Path $bundleRoot -Force | Out-Null

$copyPairs = @(
    @{ Source = (Join-Path $RepoRoot "apps\website"); Destination = (Join-Path $contextRoot "apps\website") },
    @{ Source = (Join-Path $RepoRoot "apps\client-web"); Destination = (Join-Path $contextRoot "apps\client-web") },
    @{ Source = (Join-Path $RepoRoot "apps\backend"); Destination = (Join-Path $contextRoot "apps\backend") },
    @{ Source = (Join-Path $RepoRoot "packages\shared"); Destination = (Join-Path $contextRoot "packages\shared") }
)

foreach ($pair in $copyPairs) {
    New-Item -ItemType Directory -Path (Split-Path $pair.Destination -Parent) -Force | Out-Null
    robocopy $pair.Source $pair.Destination /E /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) {
        throw "robocopy failed for $($pair.Source) with exit code $LASTEXITCODE"
    }
}

docker build -f $dockerfilePath -t $imageName $contextRoot
if ($LASTEXITCODE -ne 0) {
    throw "docker build failed"
}

$containerId = docker create $imageName
if (-not $containerId) {
    throw "docker create failed"
}

try {
    docker cp "${containerId}:/out/." $bundleRoot
    if ($LASTEXITCODE -ne 0) {
        throw "docker cp failed"
    }
} finally {
    docker rm -f $containerId | Out-Null
}

$meta = [ordered]@{
    tag = $Tag
    createdAt = (Get-Date).ToString("s")
    gitCommit = (git -C $RepoRoot rev-parse HEAD)
    gitSummary = (git -C $RepoRoot log -1 --pretty=%s)
}

$meta | ConvertTo-Json | Set-Content -Path (Join-Path $bundleRoot "meta.json")

tar -czf $archivePath -C $bundleRoot .
if ($LASTEXITCODE -ne 0) {
    throw "tar archive creation failed"
}

Write-Host "Bundle tag: $Tag"
Write-Host "Bundle directory: $bundleRoot"
Write-Host "Bundle archive: $archivePath"
