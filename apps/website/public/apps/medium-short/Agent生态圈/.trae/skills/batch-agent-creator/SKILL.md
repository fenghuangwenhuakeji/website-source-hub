---
name: "batch-agent-creator"
description: "批量Agent生成器 - 一键批量创建多个Agent，支持从JSON/YAML配置批量生成完整的5文档范式Agent"
---

# Batch Agent Creator - 批量Agent生成器

## 核心理念

**批量创造，效率至上。让Agent生产流水线化，一次配置，批量生成。**

Batch Agent Creator 是一个高级Agent生成工具，能够根据配置文件批量创建多个Agent，每个Agent都包含完整的5文档范式（SKILL.md, requirement.md, design.md, tasks.md, checklist.md）。

## 核心工作流程

```
配置准备 → 批量解析 → 并行生成 → 质量检查 → 输出汇总
```

## 详细功能说明

### 1. 配置文件解析
支持多种配置格式：
- **JSON格式** - 结构化配置
- **YAML格式** - 易读配置
- **CSV格式** - 表格批量配置
- **Markdown列表** - 简单列表配置

### 2. 智能模板系统
- **内置模板库** - 常见Agent类型模板
- **自定义模板** - 支持用户自定义模板
- **模板继承** - 基础模板+个性化覆盖
- **变量替换** - 动态内容填充

### 3. 批量生成功能
- **单批次生成** - 一次生成1-100个Agent
- **分类生成** - 按类别批量生成
- **依赖管理** - 处理Agent间依赖关系
- **命名规范** - 自动kebab-case命名

### 4. 质量检查系统
- **文档完整性检查** - 确保5文档齐全
- **内容质量评分** - 自动评估文档质量
- **重复检测** - 避免重复创建
- **链接验证** - 验证内部链接

## 配置格式示例

### JSON配置格式
```json
{
  "batch_name": "剧本Agent家族",
  "output_dir": ".trae/skills",
  "agents": [
    {
      "name": "screenplay-format-agent",
      "type": "skill",
      "title": "专业剧本格式专家",
      "description": "提供好莱坞标准剧本格式化服务",
      "core_concept": "让每一份剧本都符合行业标准",
      "features": ["场景标题格式化", "动作描述格式化", "对话格式化"],
      "priority": "high"
    },
    {
      "name": "character-arc-agent",
      "type": "skill",
      "title": "角色弧线设计专家",
      "description": "设计角色成长轨迹和转变弧线",
      "core_concept": "让每个角色都有动人的成长故事",
      "features": ["角色分析", "弧线设计", "转变节点"],
      "priority": "high"
    }
  ]
}
```

### YAML配置格式
```yaml
batch_name: 剧本Agent家族
output_dir: .trae/skills
agents:
  - name: screenplay-format-agent
    type: skill
    title: 专业剧本格式专家
    description: 提供好莱坞标准剧本格式化服务
    core_concept: 让每一份剧本都符合行业标准
    features:
      - 场景标题格式化
      - 动作描述格式化
      - 对话格式化
    priority: high
  
  - name: character-arc-agent
    type: skill
    title: 角色弧线设计专家
    description: 设计角色成长轨迹和转变弧线
    core_concept: 让每个角色都有动人的成长故事
    features:
      - 角色分析
      - 弧线设计
      - 转变节点
    priority: high
```

### Markdown列表格式
```markdown
# 批量创建Agent列表

## 高优先级
- screenplay-format-agent | 专业剧本格式专家 | 提供好莱坞标准剧本格式化
- character-arc-agent | 角色弧线设计专家 | 设计角色成长轨迹
- dialogue-polish-agent | 对话润色专家 | 对话质量提升

## 中优先级
- pacing-agent | 剧本节奏控制专家 | 叙事节奏管理
- genre-agent | 类型片剧本专家 | 类型片套路设计
```

## 调用触发条件

**立即调用此 Skill 当：**

- 需要批量创建多个Agent
- 创建Agent家族或系列
- 从配置文件生成Agent
- 需要标准化批量生产
- 迁移现有Agent到新格式

## 执行示例

### 示例1: 从JSON配置批量生成

```
用户: "根据以下配置批量创建Agent：
{
  \"batch_name\": \"游戏开发Agent家族\",
  \"agents\": [
    {\"name\": \"game-design-agent\", \"title\": \"游戏设计专家\"},
    {\"name\": \"level-design-agent\", \"title\": \"关卡设计专家\"},
    {\"name\": \"game-ai-agent\", \"title\": \"游戏AI专家\"}
  ]
}"

Agent 分析:
┌────────────────────────────────────────────────────────────┐
│ [配置解析]                                                  │
│ 批次名称: 游戏开发Agent家族                                 │
│ Agent数量: 3                                                │
│ 输出目录: .trae/skills/                                     │
├────────────────────────────────────────────────────────────┤
│ [批量生成]                                                  │
│ ✓ game-design-agent/                                        │
│   - SKILL.md                                                │
│   - requirement.md                                          │
│   - design.md                                               │
│   - tasks.md                                                │
│   - checklist.md                                            │
│ ✓ level-design-agent/                                       │
│   - SKILL.md                                                │
│   - requirement.md                                          │
│   - design.md                                               │
│   - tasks.md                                                │
│   - checklist.md                                            │
│ ✓ game-ai-agent/                                            │
│   - SKILL.md                                                │
│   - requirement.md                                          │
│   - design.md                                               │
│   - tasks.md                                                │
│   - checklist.md                                            │
├────────────────────────────────────────────────────────────┤
│ [生成统计]                                                  │
│ 成功: 3/3                                                   │
│ 失败: 0                                                     │
│ 总文件: 15                                                  │
│ 耗时: 5.2s                                                  │
└────────────────────────────────────────────────────────────┘
```

### 示例2: 从YAML配置批量生成

```
用户: "读取 config/agents.yaml 并批量创建"

Agent 分析:
┌────────────────────────────────────────────────────────────┐
│ [配置读取]                                                  │
│ 文件: config/agents.yaml                                    │
│ 格式: YAML                                                  │
│ 解析状态: 成功                                              │
├────────────────────────────────────────────────────────────┤
│ [Agent列表]                                                 │
│ 发现 17 个Agent配置                                         │
│ - screenplay-format-agent (high)                           │
│ - character-arc-agent (high)                               │
│ - dialogue-polish-agent (high)                             │
│ ... (14 more)                                              │
├────────────────────────────────────────────────────────────┤
│ [批量生成]                                                  │
│ 开始并行生成...                                             │
│ 进度: [████████████████████] 100%                           │
│ 成功: 17/17                                                 │
└────────────────────────────────────────────────────────────┘
```

## 内置模板库

### Skill Agent模板
```yaml
template: skill-agent
params:
  workflow: "输入 → 分析 → 处理 → 输出"
  sections:
    - 核心理念
    - 核心工作流程
    - 详细功能说明
    - 调用触发条件
    - 执行示例
    - 输出保证
```

### Debug Agent模板
```yaml
template: debug-agent
params:
  workflow: "问题输入 → 诊断 → 分析 → 解决 → 验证"
  sections:
    - 核心理念
    - 诊断流程
    - 常见错误库
    - 解决方案库
    - 调用触发条件
    - 执行示例
```

### Plan Agent模板
```yaml
template: plan-agent
params:
  workflow: "目标输入 → 分解 → 排序 → 分配 → 跟踪"
  sections:
    - 核心理念
    - 规划方法论
    - 任务分解策略
    - 时间管理
    - 调用触发条件
    - 执行示例
```

## 高级功能

### 1. 变量系统
```yaml
variables:
  agent_name: "{{name}}"
  agent_title: "{{title}}"
  created_date: "{{date}}"
  author: "{{author|default:'AI Assistant'}}"
```

### 2. 条件生成
```yaml
conditions:
  - if: "priority == 'high'"
    then: "生成更详细的示例"
  - if: "type == 'debug'"
    then: "添加错误日志模板"
```

### 3. 继承与覆盖
```yaml
base_template: skill-agent
overrides:
  SKILL.md:
    sections:
      - 添加: "专业术语表"
  requirement.md:
    add_requirements:
      - "支持多语言"
```

### 4. 批量后处理
```yaml
post_process:
  - 生成索引文件
  - 创建Agent目录README
  - 生成依赖关系图
  - 创建快速启动指南
```

## 输出保证

- [ ] 所有Agent包含完整的5文档
- [ ] 文档格式统一规范
- [ ] 命名符合kebab-case规范
- [ ] YAML Front Matter正确
- [ ] 生成索引和导航
- [ ] 提供批量生成报告

---

**批量创造，让Agent生产像流水线一样高效！**
