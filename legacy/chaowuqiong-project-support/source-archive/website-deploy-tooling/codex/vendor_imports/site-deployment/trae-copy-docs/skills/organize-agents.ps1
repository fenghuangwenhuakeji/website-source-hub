# Agent分类整理脚本
# 将Agent按20大分类整理到对应目录

$skillsPath = "d:\AIcreateEngine\标准软件开发范式\Agent阵法\.trae\skills"

Write-Host "=== Agent分类整理脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 01-核心功能Agent (5个)
Write-Host "01-核心功能Agent..." -ForegroundColor Yellow
$agents01 = @("plan-agent", "spec-agent", "debug-agent", "meta-agent", "autopilot-agent")
foreach ($agent in $agents01) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "01-核心功能Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 02-编程语言Agent (11个)
Write-Host "02-编程语言Agent..." -ForegroundColor Yellow
$agents02 = @("c-agent", "cpp-agent", "rust-agent", "go-agent", "java-agent", "kotlin-agent", "csharp-agent", "python-agent", "javascript-agent", "typescript-agent")
foreach ($agent in $agents02) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "02-编程语言Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 03-前端框架Agent (3个)
Write-Host "03-前端框架Agent..." -ForegroundColor Yellow
$agents03 = @("vue3-agent", "react-agent", "flutter-agent")
foreach ($agent in $agents03) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "03-前端框架Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 04-游戏引擎Agent (8个)
Write-Host "04-游戏引擎Agent..." -ForegroundColor Yellow
$agents04 = @("unity-agent", "unreal-agent", "godot-gdscript-agent", "godot-csharp-agent", "godot-asset-agent", "godot-asset-script-agent", "godot-scene-agent", "GodotGame")
foreach ($agent in $agents04) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "04-游戏引擎Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 05-游戏设计Agent (7个)
Write-Host "05-游戏设计Agent..." -ForegroundColor Yellow
$agents05 = @("game-design-agent", "game-ai-agent", "level-design-agent", "quest-design-agent", "multiplayer-agent", "game-testing-agent", "game-localization-agent")
foreach ($agent in $agents05) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "05-游戏设计Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 06-游戏美术Agent (4个)
Write-Host "06-游戏美术Agent..." -ForegroundColor Yellow
$agents06 = @("shader-agent", "vfx-agent", "game-audio-agent", "sound-design-agent")
foreach ($agent in $agents06) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "06-游戏美术Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 07-小说创作Agent (核心5个 + 批量生成目录)
Write-Host "07-小说创作Agent..." -ForegroundColor Yellow
$agents07 = @("brainstorm-agent", "outline-agent", "narrative-engine-agent", "polish-agent", "dialogue-writer-agent", "generated_novel_agents")
foreach ($agent in $agents07) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "07-小说创作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 08-剧本创作Agent (6个)
Write-Host "08-剧本创作Agent..." -ForegroundColor Yellow
$agents08 = @("three-act-agent", "hero-journey-agent", "genre-agent", "screenplay-format-agent", "plot-twist-agent", "branching-narrative-agent")
foreach ($agent in $agents08) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "08-剧本创作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 09-影视剧本Agent (7个)
Write-Host "09-影视剧本Agent..." -ForegroundColor Yellow
$agents09 = @("tv-series-agent", "web-series-agent", "short-film-agent", "documentary-agent", "commercial-agent", "stage-play-agent", "radio-drama-agent")
foreach ($agent in $agents09) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "09-影视剧本Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 10-分镜制作Agent (4个)
Write-Host "10-分镜制作Agent..." -ForegroundColor Yellow
$agents10 = @("storyboard-agent", "comic-creator-agent", "animation-creator-agent", "script-creator-agent")
foreach ($agent in $agents10) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "10-分镜制作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 11-AI创作Agent (4个)
Write-Host "11-AI创作Agent..." -ForegroundColor Yellow
$agents11 = @("nanobanana-asset-agent", "nanobanana-grid-agent", "suno-music-agent", "game-server-agent")
foreach ($agent in $agents11) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "11-AI创作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 12-角色设计Agent (3个)
Write-Host "12-角色设计Agent..." -ForegroundColor Yellow
$agents12 = @("character-design-agent", "character-arc-agent", "dialogue-polish-agent")
foreach ($agent in $agents12) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "12-角色设计Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 13-世界构建Agent (2个)
Write-Host "13-世界构建Agent..." -ForegroundColor Yellow
$agents13 = @("worldbuilding-agent")
foreach ($agent in $agents13) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "13-世界构建Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 14-叙事技巧Agent (5个)
Write-Host "14-叙事技巧Agent..." -ForegroundColor Yellow
$agents14 = @("conflict-agent", "subtext-agent", "pacing-agent", "scene-transition-agent")
foreach ($agent in $agents14) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "14-叙事技巧Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 15-量化金融Agent (7个)
Write-Host "15-量化金融Agent..." -ForegroundColor Yellow
$agents15 = @("ml-trading-agent", "strategy-development-agent", "backtesting-agent", "risk-management-agent", "technical-analysis-agent", "data-acquisition-agent", "data-processing-agent")
foreach ($agent in $agents15) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "15-量化金融Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 16-垂直行业Agent
Write-Host "16-垂直行业Agent..." -ForegroundColor Yellow
$agents16 = @("game-performance-agent")
foreach ($agent in $agents16) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "16-垂直行业Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 17-工具辅助Agent (2个)
Write-Host "17-工具辅助Agent..." -ForegroundColor Yellow
$agents17 = @("language-selector-agent", "batch-agent-creator")
foreach ($agent in $agents17) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "17-工具辅助Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 18-Agent协作Agent (阵法系统)
Write-Host "18-Agent协作Agent..." -ForegroundColor Yellow
$agents18 = @("08-Agent团队协作", "Agent-team")
foreach ($agent in $agents18) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "18-Agent协作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 19-Agent生成Agent (2个)
Write-Host "19-Agent生成Agent..." -ForegroundColor Yellow
$agents19 = @("agent-generator")
foreach ($agent in $agents19) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "19-Agent生成Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

# 复制generated_400_agents和generated_500_agents到07-小说创作Agent
Write-Host "复制批量生成Agent..." -ForegroundColor Yellow
$batchAgents = @("generated_400_agents", "generated_500_agents", "generated_agents")
foreach ($agent in $batchAgents) {
    $src = Join-Path $skillsPath $agent
    $dst = Join-Path $skillsPath "07-小说创作Agent"
    if (Test-Path $src) {
        Copy-Item -Path $src -Destination $dst -Recurse -Force
        Write-Host "  ✓ $agent" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "=== 整理完成 ===" -ForegroundColor Cyan
Write-Host "Agent已按20大分类整理到对应目录" -ForegroundColor Green
