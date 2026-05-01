# 批量Agent分类整理脚本
# 将批量生成的Agent从 批量Agent制造机 复制到 Agent阵法

$sourcePath = "d:\AIcreateEngine\标准软件开发范式\批量Agent制造机"
$targetPath = "d:\AIcreateEngine\标准软件开发范式\Agent阵法\.trae\skills"

Write-Host "=== 批量Agent分类整理 ===" -ForegroundColor Cyan
Write-Host ""

# 07-小说创作Agent - 包含润色、大纲、风格、特殊效果等
Write-Host "整理到 07-小说创作Agent..." -ForegroundColor Yellow
$novelAgents = @(
    "generated_novel_agents\batch-03-plot",
    "generated_novel_agents\batch-04-style",
    "generated_novel_agents\batch-05-special",
    "generated_400_agents\runse",
    "generated_400_agents\wuji",
    "generated_400_agents\xigang",
    "generated_comprehensive_agents\zhongzu",
    "generated_comprehensive_agents\xunhuan"
)
foreach ($agent in $novelAgents) {
    $src = Join-Path $sourcePath $agent
    $dst = Join-Path $targetPath "07-小说创作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 10-分镜制作Agent / 11-AI创作Agent - 视觉类宫格提示词
Write-Host "整理到 10-分镜制作Agent..." -ForegroundColor Yellow
$visualAgents = @(
    "generated_500_agents\batch_05_visual"
)
foreach ($agent in $visualAgents) {
    $src = Join-Path $sourcePath $agent
    $dst = Join-Path $targetPath "10-分镜制作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 16-垂直行业Agent - 行业类Agent
Write-Host "整理到 16-垂直行业Agent..." -ForegroundColor Yellow
$industryAgents = @(
    "generated_agents\batch-05-industrial-2"
)
foreach ($agent in $industryAgents) {
    $src = Join-Path $sourcePath $agent
    $dst = Join-Path $targetPath "16-垂直行业Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== 批量Agent整理完成 ===" -ForegroundColor Cyan
