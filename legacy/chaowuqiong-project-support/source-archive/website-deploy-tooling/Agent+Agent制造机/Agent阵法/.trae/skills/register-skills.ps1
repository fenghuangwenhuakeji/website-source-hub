# Skill Registration Script
$ErrorActionPreference = "Stop"

# Use relative path from script location
$scriptPath = $PSScriptRoot
$skillsRoot = $scriptPath

Write-Host "Skills root: $skillsRoot" -ForegroundColor Cyan

# Get all directories containing SKILL.md
$skillDirs = Get-ChildItem -Path $skillsRoot -Recurse -Directory | Where-Object {
    $skillFile = Join-Path $_.FullName "SKILL.md"
    Test-Path $skillFile
}

Write-Host "`nFound skill directories:" -ForegroundColor Cyan
$skillDirs | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor Gray }

# Create junction links for each skill
$linked = 0
$skipped = 0
$failed = 0

foreach ($dir in $skillDirs) {
    $skillName = $dir.Name
    $targetPath = Join-Path $skillsRoot $skillName
    
    # Skip if already in root directory
    if ($dir.Parent.FullName -eq $skillsRoot) {
        Write-Host "[SKIP] $skillName already in root" -ForegroundColor Yellow
        $skipped++
        continue
    }
    
    # Remove existing target if exists
    if (Test-Path $targetPath) {
        Write-Host "[REMOVE] Old link: $skillName" -ForegroundColor Yellow
        Remove-Item -Path $targetPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # Create junction link
    try {
        New-Item -ItemType Junction -Path $targetPath -Target $dir.FullName | Out-Null
        Write-Host "[OK] Linked: $skillName" -ForegroundColor Green
        $linked++
    }
    catch {
        Write-Host "[FAIL] Cannot link $skillName : $_" -ForegroundColor Red
        $failed++
    }
}

Write-Host "`n========================================" -ForegroundColor White
Write-Host "Skill registration complete!" -ForegroundColor Green
Write-Host "Linked: $linked | Skipped: $skipped | Failed: $failed" -ForegroundColor Cyan
Write-Host "Please restart Trae IDE to load new skills" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor White
