# Portable Skill Registration Script
# Run this script after copying the skills folder to a new location
# This script works with any path - no hardcoded directories

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Portable Skill Registration Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up old junction links
Write-Host "[Step 1] Cleaning up old junction links..." -ForegroundColor Yellow

$oldJunctions = Get-ChildItem -Path $scriptPath -Directory | Where-Object { 
    $_.LinkType -eq "Junction" 
}

foreach ($junction in $oldJunctions) {
    try {
        Remove-Item -Path $junction.FullName -Force -Recurse
        Write-Host "  Removed: $($junction.Name)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  Failed to remove: $($junction.Name)" -ForegroundColor Red
    }
}

# Step 2: Find all skill directories (containing SKILL.md)
Write-Host ""
Write-Host "[Step 2] Finding skill directories..." -ForegroundColor Yellow

$skillDirs = Get-ChildItem -Path $scriptPath -Recurse -Directory | Where-Object {
    $skillFile = Join-Path $_.FullName "SKILL.md"
    Test-Path $skillFile
}

Write-Host "  Found $($skillDirs.Count) skill directories" -ForegroundColor Gray

# Step 3: Create new junction links
Write-Host ""
Write-Host "[Step 3] Creating junction links..." -ForegroundColor Yellow

$linked = 0
$skipped = 0
$failed = 0

foreach ($dir in $skillDirs) {
    $skillName = $dir.Name
    $targetPath = Join-Path $scriptPath $skillName
    
    # Skip if already in root directory (real directory, not junction)
    if ($dir.Parent.FullName -eq $scriptPath -and $dir.LinkType -ne "Junction") {
        Write-Host "  [SKIP] $skillName already in root (real directory)" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    
    # Remove existing if any
    if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Create junction link
    try {
        New-Item -ItemType Junction -Path $targetPath -Target $dir.FullName | Out-Null
        Write-Host "  [OK] $skillName" -ForegroundColor Green
        $linked++
    }
    catch {
        Write-Host "  [FAIL] $skillName : $_" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  Registration Complete!" -ForegroundColor Green
Write-Host "  Linked: $linked | Skipped: $skipped | Failed: $failed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Trae IDE to load the skills" -ForegroundColor Gray
Write-Host "  2. Or run this script again after moving to a new location" -ForegroundColor Gray
