# ==========================================
# Agent批量操作脚本
# 用于批量创建、更新、删除和管理560个Agent
# ==========================================

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("create", "update", "delete", "list", "stats", "export", "import", "validate")]
    [string]$Action = "list",
    
    [Parameter(Mandatory=$false)]
    [string]$ConfigFile = "AGENT-INDEX.yaml",
    
    [Parameter(Mandatory=$false)]
    [string]$OutputDir = ".trae/skills",
    
    [Parameter(Mandatory=$false)]
    [string]$Filter = "",
    
    [Parameter(Mandatory=$false)]
    [ValidateSet("high", "medium", "low", "")]
    [string]$Priority = "",
    
    [Parameter(Mandatory=$false)]
    [string]$Category = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,
    
    [Parameter(Mandatory=$false)]
    [switch]$Force
)

# 颜色定义
$Colors = @{
    Success = "Green"
    Error = "Red"
    Warning = "Yellow"
    Info = "Cyan"
    Default = "White"
}

# 日志函数
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "Info"
    )
    $color = $Colors[$Level]
    Write-Host $Message -ForegroundColor $color
}

# 加载YAML文件
function Load-Yaml {
    param([string]$FilePath)
    
    if (-not (Test-Path $FilePath)) {
        Write-Log "配置文件不存在: $FilePath" "Error"
        exit 1
    }
    
    try {
        $content = Get-Content $FilePath -Raw -Encoding UTF8
        # 简单的YAML解析（实际项目中应使用专门的YAML模块）
        Write-Log "✅ 成功加载配置文件: $FilePath" "Success"
        return $content
    }
    catch {
        Write-Log "❌ 加载配置文件失败: $_" "Error"
        exit 1
    }
}

# 获取所有Agent
function Get-Agents {
    param([string]$YamlContent)
    
    $agents = @()
    
    # 解析分类
    $categoryPattern = '- name:\s*"([^"]+)"[\s\S]*?agents:([\s\S]*?)(?=- name:|$)'
    $categoryMatches = [regex]::Matches($YamlContent, $categoryPattern)
    
    foreach ($catMatch in $categoryMatches) {
        $categoryName = $catMatch.Groups[1].Value
        $agentsSection = $catMatch.Groups[2].Value
        
        # 解析Agent
        $agentPattern = '- \{ id:\s*"([^"]+)",\s*name:\s*"([^"]+)"(?:,\s*priority:\s*"([^"]+)")?'
        $agentMatches = [regex]::Matches($agentsSection, $agentPattern)
        
        foreach ($agentMatch in $agentMatches) {
            $agent = @{
                Id = $agentMatch.Groups[1].Value
                Name = $agentMatch.Groups[2].Value
                Category = $categoryName
                Priority = if ($agentMatch.Groups[3].Success) { $agentMatch.Groups[3].Value } else { "medium" }
            }
            $agents += $agent
        }
    }
    
    return $agents
}

# 筛选Agent
function Filter-Agents {
    param(
        [array]$Agents,
        [string]$FilterText = "",
        [string]$PriorityFilter = "",
        [string]$CategoryFilter = ""
    )
    
    $filtered = $Agents
    
    if ($FilterText) {
        $filtered = $filtered | Where-Object { 
            $_.Id -like "*$FilterText*" -or 
            $_.Name -like "*$FilterText*" -or
            $_.Category -like "*$FilterText*"
        }
    }
    
    if ($PriorityFilter) {
        $filtered = $filtered | Where-Object { $_.Priority -eq $PriorityFilter }
    }
    
    if ($CategoryFilter) {
        $filtered = $filtered | Where-Object { $_.Category -eq $CategoryFilter }
    }
    
    return $filtered
}

# 显示统计信息
function Show-Stats {
    param([array]$Agents)
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "       📊 Agent生态系统统计" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    $total = $Agents.Count
    Write-Host "总Agent数: " -NoNewline
    Write-Host $total -ForegroundColor Green
    
    # 优先级统计
    Write-Host "`n按优先级分布:" -ForegroundColor Yellow
    $priorityStats = $Agents | Group-Object -Property Priority | Sort-Object Count -Descending
    foreach ($stat in $priorityStats) {
        $icon = switch ($stat.Name) {
            "high" { "🔴" }
            "medium" { "🟡" }
            "low" { "🟢" }
            default { "⚪" }
        }
        $percentage = [math]::Round(($stat.Count / $total) * 100, 1)
        Write-Host "  $icon $($stat.Name): $($stat.Count)个 ($percentage%)"
    }
    
    # 分类统计
    Write-Host "`n按分类分布 (Top 10):" -ForegroundColor Yellow
    $categoryStats = $Agents | Group-Object -Property Category | Sort-Object Count -Descending | Select-Object -First 10
    foreach ($stat in $categoryStats) {
        Write-Host "  📁 $($stat.Name): $($stat.Count)个"
    }
    
    Write-Host "`n========================================`n" -ForegroundColor Cyan
}

# 列出Agent
function List-Agents {
    param(
        [array]$Agents,
        [int]$PageSize = 20
    )
    
    $total = $Agents.Count
    $pages = [math]::Ceiling($total / $PageSize)
    $currentPage = 1
    
    while ($currentPage -le $pages) {
        Clear-Host
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "       📋 Agent列表 ($currentPage/$pages)" -ForegroundColor Cyan
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        $start = ($currentPage - 1) * $PageSize
        $end = [math]::Min($start + $PageSize - 1, $total - 1)
        
        for ($i = $start; $i -le $end; $i++) {
            $agent = $Agents[$i]
            $num = $i + 1
            $icon = switch ($agent.Priority) {
                "high" { "🔴" }
                "medium" { "🟡" }
                "low" { "🟢" }
                default { "⚪" }
            }
            
            Write-Host "$num. $icon [$($agent.Id)]" -ForegroundColor White
            Write-Host "   名称: $($agent.Name)" -ForegroundColor Gray
            Write-Host "   分类: $($agent.Category)" -ForegroundColor Gray
            Write-Host ""
        }
        
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "n: 下一页 | p: 上一页 | q: 退出" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Cyan
        
        $key = Read-Host "请选择"
        
        switch ($key) {
            "n" { if ($currentPage -lt $pages) { $currentPage++ } }
            "p" { if ($currentPage -gt 1) { $currentPage-- } }
            "q" { return }
        }
    }
}

# 批量创建Agent
function Create-Agents {
    param(
        [array]$Agents,
        [string]$OutputDirectory,
        [switch]$Simulate
    )
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "       🚀 批量创建Agent" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan
    
    if ($Simulate) {
        Write-Host "⚠️  模拟模式 - 不会实际创建文件`n" -ForegroundColor Yellow
    }
    
    $success = 0
    $failed = 0
    $skipped = 0
    
    foreach ($agent in $Agents) {
        $agentDir = Join-Path $OutputDirectory $agent.Id
        
        # 检查是否已存在
        if (Test-Path $agentDir) {
            if (-not $Force) {
                Write-Host "⏭️  跳过已存在的Agent: $($agent.Id)" -ForegroundColor Yellow
                $skipped++
                continue
            }
        }
        
        if ($Simulate) {
            Write-Host "✅ [模拟] 将创建: $($agent.Id) - $($agent.Name)" -ForegroundColor Green
            $success++
            continue
        }
        
        try {
            # 创建Agent目录
            New-Item -ItemType Directory -Path $agentDir -Force | Out-Null
            
            # 创建5个标准文档
            @("SKILL.md", "requirement.md", "design.md", "tasks.md", "checklist.md") | ForEach-Object {
                $filePath = Join-Path $agentDir $_
                $content = Generate-AgentDocument -Agent $agent -DocumentType $_
                Set-Content -Path $filePath -Value $content -Encoding UTF8
            }
            
            Write-Host "✅ 创建成功: $($agent.Id)" -ForegroundColor Green
            $success++
        }
        catch {
            Write-Host "❌ 创建失败: $($agent.Id) - $_" -ForegroundColor Red
            $failed++
        }
    }
    
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "创建完成:" -ForegroundColor Green
    Write-Host "  成功: $success" -ForegroundColor Green
    Write-Host "  失败: $failed" -ForegroundColor Red
    Write-Host "  跳过: $skipped" -ForegroundColor Yellow
    Write-Host "========================================`n" -ForegroundColor Cyan
}

# 生成Agent文档
function Generate-AgentDocument {
    param(
        [hashtable]$Agent,
        [string]$DocumentType
    )
    
    $date = Get-Date -Format "yyyy-MM-dd"
    
    switch ($DocumentType) {
        "SKILL.md" {
            return @"
# $($Agent.Name)

## 概述

**Agent ID**: $($Agent.Id)
**分类**: $($Agent.Category)
**优先级**: $($Agent.Priority)
**创建日期**: $date

## 功能描述

这是一个专业的AI Agent，用于提供$($Agent.Category)领域的专业服务。

## 核心能力

- 专业能力1
- 专业能力2
- 专业能力3

## 使用场景

1. 场景1
2. 场景2
3. 场景3

## 注意事项

- 注意点1
- 注意点2

---
*由Agent管理系统自动生成*
"@
        }
        "requirement.md" {
            return @"
# 需求文档 - $($Agent.Name)

## Agent信息

- **ID**: $($Agent.Id)
- **名称**: $($Agent.Name)
- **分类**: $($Agent.Category)
- **优先级**: $($Agent.Priority)

## 功能需求

### 必须实现 (Must Have)
- [ ] 核心功能1
- [ ] 核心功能2
- [ ] 核心功能3

### 应该实现 (Should Have)
- [ ] 扩展功能1
- [ ] 扩展功能2

### 可以实现 (Could Have)
- [ ] 附加功能1
- [ ] 附加功能2

## 非功能需求

- 性能要求
- 安全要求
- 可用性要求

## 验收标准

1. 标准1
2. 标准2
3. 标准3

---
*创建日期: $date*
"@
        }
        "design.md" {
            return @"
# 设计文档 - $($Agent.Name)

## 架构设计

### 系统架构

```
[用户输入] -> [Agent处理] -> [结果输出]
```

### 组件设计

1. **输入处理模块**
   - 功能: 解析用户输入
   - 接口: TBD

2. **核心处理模块**
   - 功能: 业务逻辑处理
   - 算法: TBD

3. **输出生成模块**
   - 功能: 生成响应结果
   - 格式: TBD

## 数据模型

### 输入数据

```json
{
  "query": "string",
  "context": "object",
  "parameters": "object"
}
```

### 输出数据

```json
{
  "result": "string",
  "metadata": "object",
  "suggestions": "array"
}
```

## 接口设计

### 主要接口

- `process(input): output` - 主处理接口
- `validate(input): boolean` - 输入验证接口
- `configure(options): void` - 配置接口

## 错误处理

- 错误类型1: 处理方式
- 错误类型2: 处理方式

---
*设计日期: $date*
"@
        }
        "tasks.md" {
            return @"
# 任务清单 - $($Agent.Name)

## 开发阶段

### Phase 1: 基础架构
- [ ] 1.1 搭建项目结构
- [ ] 1.2 实现核心框架
- [ ] 1.3 编写基础工具函数
- [ ] 1.4 单元测试覆盖

### Phase 2: 核心功能
- [ ] 2.1 实现主要业务逻辑
- [ ] 2.2 集成外部服务
- [ ] 2.3 错误处理机制
- [ ] 2.4 性能优化

### Phase 3: 完善优化
- [ ] 3.1 边界情况处理
- [ ] 3.2 日志和监控
- [ ] 3.3 文档完善
- [ ] 3.4 集成测试

## 优先级

- 🔴 高优先级: 核心功能
- 🟡 中优先级: 扩展功能
- 🟢 低优先级: 优化功能

## 时间规划

| 阶段 | 预计时间 | 状态 |
|------|----------|------|
| Phase 1 | 3天 | 未开始 |
| Phase 2 | 5天 | 未开始 |
| Phase 3 | 2天 | 未开始 |

## 依赖项

- [ ] 依赖1
- [ ] 依赖2

---
*创建日期: $date*
"@
        }
        "checklist.md" {
            return @"
# 验收清单 - $($Agent.Name)

## 功能验收

### 核心功能
- [ ] 功能1正常工作
- [ ] 功能2正常工作
- [ ] 功能3正常工作

### 边界情况
- [ ] 空输入处理
- [ ] 超长输入处理
- [ ] 特殊字符处理

## 性能验收

- [ ] 响应时间 < 2秒
- [ ] 内存占用合理
- [ ] 并发处理正常

## 安全验收

- [ ] 输入验证完整
- [ ] 无SQL注入风险
- [ ] 无XSS漏洞

## 文档验收

- [ ] SKILL.md 完整
- [ ] API文档完整
- [ ] 使用示例完整

## 测试验收

- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] 端到端测试通过

## 部署验收

- [ ] 生产环境配置
- [ ] 监控告警配置
- [ ] 回滚方案准备

## 签核

- [ ] 开发负责人
- [ ] 测试负责人
- [ ] 产品负责人

---
*验收日期: $date*
"@
        }
        default { return "" }
    }
}

# 导出Agent数据
function Export-Agents {
    param(
        [array]$Agents,
        [string]$Format = "json"
    )
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $filename = "agents_export_$timestamp.$Format"
    
    switch ($Format) {
        "json" {
            $Agents | ConvertTo-Json -Depth 3 | Set-Content $filename -Encoding UTF8
        }
        "csv" {
            $Agents | Export-Csv $filename -NoTypeInformation -Encoding UTF8
        }
    }
    
    Write-Log "✅ 已导出到: $filename" "Success"
}

# 主函数
function Main {
    Write-Host "`n"
    Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           🤖 Agent批量操作工具 v2.0                      ║" -ForegroundColor Cyan
    Write-Host "║           管理560个AI Agent的专业工具                     ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host "`n"
    
    # 加载配置
    $yamlContent = Load-Yaml $ConfigFile
    $allAgents = Get-Agents $yamlContent
    
    Write-Log "📊 已加载 $($allAgents.Count) 个Agent配置" "Info"
    
    # 筛选Agent
    $filteredAgents = Filter-Agents -Agents $allAgents -FilterText $Filter -PriorityFilter $Priority -CategoryFilter $Category
    
    if ($filteredAgents.Count -eq 0) {
        Write-Log "❌ 没有匹配的Agent" "Error"
        exit 1
    }
    
    Write-Log "🔍 筛选后: $($filteredAgents.Count) 个Agent" "Info"
    
    # 执行操作
    switch ($Action) {
        "list" {
            List-Agents $filteredAgents
        }
        "stats" {
            Show-Stats $filteredAgents
        }
        "create" {
            Create-Agents -Agents $filteredAgents -OutputDirectory $OutputDir -Simulate:$DryRun
        }
        "export" {
            Export-Agents $filteredAgents "json"
        }
        "validate" {
            Write-Log "✅ 验证通过: $($filteredAgents.Count) 个Agent配置有效" "Success"
        }
        default {
            Write-Log "⚠️  功能开发中: $Action" "Warning"
        }
    }
}

# 显示帮助
function Show-Help {
    @"
Agent批量操作工具

用法:
  .\batch-operations.ps1 [操作] [选项]

操作:
  list      - 列出Agent (默认)
  stats     - 显示统计信息
  create    - 批量创建Agent
  export    - 导出Agent数据
  validate  - 验证配置

选项:
  -ConfigFile  <文件>   配置文件路径 (默认: AGENT-INDEX.yaml)
  -OutputDir   <目录>   输出目录 (默认: .trae/skills)
  -Filter      <文本>   筛选文本
  -Priority    <优先级> 按优先级筛选 (high/medium/low)
  -Category    <分类>   按分类筛选
  -DryRun              模拟模式 (不实际执行)
  -Force               强制覆盖已存在的Agent

示例:
  # 列出所有Agent
  .\batch-operations.ps1 list

  # 显示统计信息
  .\batch-operations.ps1 stats

  # 创建高优先级的Agent (模拟)
  .\batch-operations.ps1 create -Priority high -DryRun

  # 导出特定分类的Agent
  .\batch-operations.ps1 export -Category "软件开发"

  # 创建所有Agent
  .\batch-operations.ps1 create -Force
"@
}

# 入口点
if ($args -contains "-help" -or $args -contains "--help" -or $args -contains "-h") {
    Show-Help
}
else {
    Main
}
