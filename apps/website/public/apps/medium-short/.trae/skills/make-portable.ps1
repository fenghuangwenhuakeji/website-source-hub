# Make Skills Portable - Copy all skills to root directory
# This creates a fully portable skills folder with no junction links
# Run this script after copying to a new location

$ErrorActionPreference = "Stop"
$scriptPath = $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Make Skills Portable" -ForegroundColor Cyan
Write-Host "  Copy all skills to root directory" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Clean up old junction links
Write-Host "[Step 1] Removing old junction links..." -ForegroundColor Yellow

$oldJunctions = Get-ChildItem -Path $scriptPath -Directory | Where-Object { 
    $_.LinkType -eq "Junction" 
}

foreach ($junction in $oldJunctions) {
    try {
        Remove-Item -Path $junction.FullName -Force -Recurse
        Write-Host "  Removed junction: $($junction.Name)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  Failed: $($junction.Name)" -ForegroundColor Red
    }
}

# Step 2: Find all skill directories
Write-Host ""
Write-Host "[Step 2] Finding skill directories..." -ForegroundColor Yellow

$skillDirs = Get-ChildItem -Path $scriptPath -Recurse -Directory | Where-Object {
    $skillFile = Join-Path $_.FullName "SKILL.md"
    Test-Path $skillFile
}

Write-Host "  Found $($skillDirs.Count) skill directories" -ForegroundColor Gray

# Step 3: Copy skills to root
Write-Host ""
Write-Host "[Step 3] Copying skills to root directory..." -ForegroundColor Yellow

$copied = 0
$skipped = 0
$failed = 0

foreach ($dir in $skillDirs) {
    $skillName = $dir.Name
    $targetPath = Join-Path $scriptPath $skillName
    
    # Skip if already in root directory (real directory)
    if ($dir.Parent.FullName -eq $scriptPath) {
        Write-Host "  [SKIP] $skillName already in root" -ForegroundColor DarkGray
        $skipped++
        continue
    }
    
    # Remove existing if any (junction or directory)
    if (Test-Path $targetPath) {
        Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Copy directory
    try {
        Copy-Item -Path $dir.FullName -Destination $targetPath -Recurse -Force
        Write-Host "  [OK] $skillName" -ForegroundColor Green
        $copied++
    }
    catch {
        Write-Host "  [FAIL] $skillName : $_" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor White
Write-Host "  Portable Skills Created!" -ForegroundColor Green
Write-Host "  Copied: $copied | Skipped: $skipped | Failed: $failed" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor White
Write-Host ""
Write-Host "The skills folder is now fully portable!" -ForegroundColor Green
Write-Host "You can copy it anywhere and it will work." -ForegroundColor Green
Write-Host ""
Write-Host "Note: This creates duplicate files. If you want to save space," -ForegroundColor Yellow
Write-Host "      use portable-register.ps1 instead (creates junction links)." -ForegroundColor Yellow
