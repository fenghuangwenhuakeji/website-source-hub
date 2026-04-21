# Agent 制造生成器 (Agent-Generator)

## 概述

Agent-Generator 是整个 Agent 生态系统的核心制造工厂，负责生成、配置和管理所有其他 Agent。它采用元编程思想，能够根据需求自动生成符合标准的 Agent 体系。

## 核心能力

### 1. Agent 生成能力

```
输入: 需求描述 + 领域类型
    ↓
Agent-Generator 分析
    ↓
输出: 完整的 Agent 包 (SKILL.md + requirement.md + design.md + tasks.md + checklist.md)
```

### 2. 支持的 Agent 类型

| 类型 | 说明 | 示例 |
|------|------|------|
| **编程语言 Agent** | 特定语言的开发专家 | rust-agent, python-agent |
| **框架 Agent** | 特定框架的专家 | vue3-agent, react-agent |
| **创意 Agent** | 内容创作专家 | storyboard-agent, narrative-engine-agent |
| **工具 Agent** | 辅助功能专家 | plan-agent, debug-agent |
| **游戏 Agent** | 游戏开发专家 | godot-gdscript-agent |
| **金融 Agent** | 量化交易专家 | quant-strategy-agent |

### 3. 生成流程

```
┌─────────────────────────────────────────────────────────┐
│                    Agent-Generator                       │
├─────────────────────────────────────────────────────────┤
│  1. 需求解析 → 提取关键信息                               │
│  2. 类型识别 → 确定 Agent 类型                           │
│  3. 知识检索 → 查询模板库                                 │
│  4. 文档生成 → 创建5标准文档                             │
│  5. 质量检查 → 验证完整性                                 │
│  6. 输出打包 → 生成 Agent 目录                           │
└─────────────────────────────────────────────────────────┘
```

## 文档标准模板

### SKILL.md 模板结构

```markdown
# [Agent名称] 专家

## 角色定义
- 你是谁
- 你的专长
- 你的目标

## 核心能力
1. 能力A
2. 能力B
3. 能力C

## 代码规范
### 1. 命名规范
### 2. 代码结构
### 3. 错误处理

## 常用代码模式
### 1. 模式A
### 2. 模式B

## 测试实践

## 性能优化

## 常用库推荐
```

## 使用示例

### 生成一个 Python 数据分析 Agent

```
输入:
"创建一个专门用于 Python 数据分析的 Agent，需要支持 pandas、numpy、
matplotlib，能够生成数据清洗、可视化、统计分析的代码"

输出:
- python-data-agent/
  - SKILL.md (数据分析专家技能)
  - requirement.md (需求规格)
  - design.md (架构设计)
  - tasks.md (任务分解)
  - checklist.md (质量检查)
```

## 配置参数

```yaml
agent_generator:
  # 文档生成配置
  documents:
    - skill_md: true
    - requirement_md: true
    - design_md: true
    - tasks_md: true
    - checklist_md: true
  
  # 代码示例配置
  code_examples:
    min_examples: 5
    max_examples: 20
    include_tests: true
  
  # 质量检查配置
  quality_check:
    enable_lint: true
    check_completeness: true
    verify_links: true
```

## 扩展机制

### 自定义模板

```rust
pub trait AgentTemplate {
    fn name(&self) -> &str;
    fn skill_template(&self) -> &str;
    fn requirement_template(&self) -> &str;
    fn design_template(&self) -> &str;
    fn tasks_template(&self) -> &str;
    fn checklist_template(&self) -> &str;
}
```

### 插件系统

```rust
pub trait AgentGeneratorPlugin {
    fn before_generate(&self, context: &mut GenerateContext);
    fn after_generate(&self, context: &GenerateContext, result: &mut AgentPackage);
}
```
