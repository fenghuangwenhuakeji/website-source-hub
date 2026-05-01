param(
    [string]$WorkspaceRoot = "",
    [string]$CodexHome = "C:\Users\8\.codex"
)

$ErrorActionPreference = "Stop"

if (-not $WorkspaceRoot) {
    $WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..\..")).Path
}

function Ensure-Directory {
    param([string]$Path)

    if (-not (Test-Path -LiteralPath $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

function Ensure-Junction {
    param(
        [string]$LinkPath,
        [string]$TargetPath
    )

    if (-not (Test-Path -LiteralPath $TargetPath)) {
        throw "Target path does not exist: $TargetPath"
    }

    $parent = Split-Path -Parent $LinkPath
    Ensure-Directory -Path $parent

    if (Test-Path -LiteralPath $LinkPath) {
        $existing = Get-Item -LiteralPath $LinkPath -Force
        $isJunction = ($existing.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0
        $matchesTarget = $false

        if ($isJunction -and $existing.Target) {
            $existingTargets = @($existing.Target | ForEach-Object { [string]$_ })
            $resolvedTarget = (Resolve-Path -LiteralPath $TargetPath).Path
            $matchesTarget = $existingTargets -contains $resolvedTarget
        }

        if ($matchesTarget) {
            return
        }

        Remove-Item -LiteralPath $LinkPath -Recurse -Force
    }

    New-Item -ItemType Junction -Path $LinkPath -Target $TargetPath | Out-Null
}

function Get-SkillStats {
    param([string]$RootPath)

    if (-not (Test-Path -LiteralPath $RootPath)) {
        return [ordered]@{
            direct_skill_dirs = 0
            recursive_skill_dirs = 0
        }
    }

    $direct = @(Get-ChildItem -LiteralPath $RootPath -Directory | Where-Object {
        Test-Path -LiteralPath (Join-Path $_.FullName "SKILL.md")
    }).Count

    $recursive = @(Get-ChildItem -LiteralPath $RootPath -Recurse -Directory | Where-Object {
        Test-Path -LiteralPath (Join-Path $_.FullName "SKILL.md")
    }).Count

    return [ordered]@{
        direct_skill_dirs = $direct
        recursive_skill_dirs = $recursive
    }
}

function Get-SkillIndexEntries {
    param(
        [string]$RootPath,
        [string]$SourceName,
        [switch]$DirectOnly
    )

    if (-not (Test-Path -LiteralPath $RootPath)) {
        return @()
    }

    $baseItems = if ($DirectOnly) {
        Get-ChildItem -LiteralPath $RootPath -Directory
    }
    else {
        Get-ChildItem -LiteralPath $RootPath -Recurse -Directory
    }

    return @(
        $baseItems |
            Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "SKILL.md") } |
            Sort-Object FullName |
            ForEach-Object {
                [ordered]@{
                    source = $SourceName
                    name = $_.Name
                    path = $_.FullName
                }
            }
    )
}

function Get-FileCount {
    param([string]$RootPath)

    if (-not (Test-Path -LiteralPath $RootPath)) {
        return 0
    }

    return @(Get-ChildItem -LiteralPath $RootPath -Recurse -Force -File).Count
}

function Resolve-RequiredPath {
    param(
        [string]$Description,
        [string]$Path
    )

    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) {
        throw "Could not resolve required path for $Description"
    }

    return (Resolve-Path -LiteralPath $Path).Path
}

function Write-Utf8Json {
    param(
        [string]$Path,
        [object]$Value
    )

    $json = $Value | ConvertTo-Json -Depth 8
    [System.IO.File]::WriteAllText($Path, $json + [Environment]::NewLine, [System.Text.Encoding]::UTF8)
}

$skillsMountRoot = Join-Path $CodexHome "skills\site-deployment-imports"
$vendorRoot = Join-Path $CodexHome "vendor_imports\site-deployment"

$traeSkills = Resolve-RequiredPath -Description "main Trae skills" -Path (Join-Path $WorkspaceRoot ".trae\skills")
$agentMachineRoot = Get-ChildItem -LiteralPath $WorkspaceRoot -Directory -Filter "Agent+Agent*" | Select-Object -First 1
$agentMachineSkillsCandidate = $null
if ($agentMachineRoot) {
    $agentMachineSkillsCandidate = Get-ChildItem -LiteralPath $agentMachineRoot.FullName -Recurse -Directory -Filter "skills" |
        Where-Object { $_.FullName -like "*\.trae\skills" } |
        Select-Object -First 1 -ExpandProperty FullName
}
$agentMachineSkills = Resolve-RequiredPath -Description "Agent+Agent skills" -Path $agentMachineSkillsCandidate

$traeCopyCandidate = Get-ChildItem -LiteralPath $WorkspaceRoot -Directory |
    Where-Object { $_.Name -like "trae*" -and $_.Name -ne ".trae" } |
    Select-Object -First 1 -ExpandProperty FullName
$traeCopy = Resolve-RequiredPath -Description "Trae copy docs" -Path $traeCopyCandidate

$codeEditorMcpCandidate = Get-ChildItem -LiteralPath $WorkspaceRoot -Recurse -Directory -Filter "mcp" |
    Where-Object { $_.FullName -like "*CodeEditor\mcp" } |
    Select-Object -First 1 -ExpandProperty FullName
$codeEditorMcp = Resolve-RequiredPath -Description "CodeEditor MCP source" -Path $codeEditorMcpCandidate

$llmProxy = Resolve-RequiredPath -Description "llm proxy route" -Path (Join-Path $WorkspaceRoot "llm-proxy.js")

Ensure-Directory -Path $skillsMountRoot
Ensure-Directory -Path $vendorRoot

Ensure-Junction -LinkPath (Join-Path $skillsMountRoot "trae-main") -TargetPath $traeSkills
Ensure-Junction -LinkPath (Join-Path $skillsMountRoot "agent-plus-agent") -TargetPath $agentMachineSkills

Ensure-Junction -LinkPath (Join-Path $vendorRoot "trae-copy-docs") -TargetPath $traeCopy
Ensure-Junction -LinkPath (Join-Path $vendorRoot "codeeditor-mcp-source") -TargetPath $codeEditorMcp

$manifest = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    workspace_root = $WorkspaceRoot
    codex_home = $CodexHome
    summary = [ordered]@{
        imported_skill_mounts = 2
        vendor_reference_mounts = 2
    }
    imports = @(
        [ordered]@{
            name = "trae-main"
            source = $traeSkills
            mounted_to = Join-Path $skillsMountRoot "trae-main"
            kind = "codex-skills"
            stats = Get-SkillStats -RootPath $traeSkills
        },
        [ordered]@{
            name = "agent-plus-agent"
            source = $agentMachineSkills
            mounted_to = Join-Path $skillsMountRoot "agent-plus-agent"
            kind = "codex-skills"
            stats = Get-SkillStats -RootPath $agentMachineSkills
        },
        [ordered]@{
            name = "trae-copy-docs"
            source = $traeCopy
            mounted_to = Join-Path $vendorRoot "trae-copy-docs"
            kind = "reference-project"
            file_count = Get-FileCount -RootPath $traeCopy
        },
        [ordered]@{
            name = "codeeditor-mcp-source"
            source = $codeEditorMcp
            mounted_to = Join-Path $vendorRoot "codeeditor-mcp-source"
            kind = "mcp-source"
            file_count = Get-FileCount -RootPath $codeEditorMcp
        }
    )
    direct_sources = [ordered]@{
        llm_proxy = $llmProxy
    }
    notes = @(
        "The Trae skill trees are mounted into Codex via junctions so Codex can discover SKILL.md files without copying the original libraries.",
        "Reference-only projects are mounted under vendor_imports for Codex to read when adaptation work is needed.",
        "The CodeEditor MCP source is preserved as source code; it is not auto-started as a live MCP server by this script."
    )
}

$skillIndex = [ordered]@{
    generated_at = (Get-Date).ToString("o")
    direct = @(
        (Get-SkillIndexEntries -RootPath $traeSkills -SourceName "trae-main" -DirectOnly)
        (Get-SkillIndexEntries -RootPath $agentMachineSkills -SourceName "agent-plus-agent" -DirectOnly)
    )
    recursive = @(
        (Get-SkillIndexEntries -RootPath $traeSkills -SourceName "trae-main")
        (Get-SkillIndexEntries -RootPath $agentMachineSkills -SourceName "agent-plus-agent")
    )
}

$workspaceManifest = Join-Path $WorkspaceRoot "codex-migration\site-deployment-manifest.json"
$codexManifest = Join-Path $vendorRoot "site-deployment-manifest.json"
$workspaceSkillIndex = Join-Path $WorkspaceRoot "codex-migration\site-deployment-skill-index.json"
$codexSkillIndex = Join-Path $vendorRoot "site-deployment-skill-index.json"

Write-Utf8Json -Path $workspaceManifest -Value $manifest
Write-Utf8Json -Path $codexManifest -Value $manifest
Write-Utf8Json -Path $workspaceSkillIndex -Value $skillIndex
Write-Utf8Json -Path $codexSkillIndex -Value $skillIndex

Write-Host "Import complete." -ForegroundColor Green
Write-Host "Skills mounted at: $skillsMountRoot" -ForegroundColor Cyan
Write-Host "Vendor references mounted at: $vendorRoot" -ForegroundColor Cyan
Write-Host "Manifest written to: $workspaceManifest" -ForegroundColor Cyan
Write-Host "Skill index written to: $workspaceSkillIndex" -ForegroundColor Cyan
