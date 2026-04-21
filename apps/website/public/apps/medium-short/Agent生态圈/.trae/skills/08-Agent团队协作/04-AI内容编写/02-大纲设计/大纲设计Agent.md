# 大纲设计 Agent 配置

## 概述

大纲设计Agent专注于内容结构的规划和设计，确保内容逻辑清晰、层次分明。

## Agent角色

### 1. 结构设计Agent
```yaml
name: "结构设计Agent"
description: "设计内容整体结构"
responsibilities:
  - 章节划分
  - 结构框架
  - 篇幅分配
  - 逻辑关系
skills:
  - 结构设计
  - 信息架构
  - 逻辑梳理
```

### 2. 大纲生成Agent
```yaml
name: "大纲生成Agent"
description: "生成详细内容大纲"
responsibilities:
  - 标题设计
  - 要点提取
  - 内容填充
  - 细节完善
skills:
  - 大纲编写
  - 内容规划
  - 要点提炼
```

### 3. 逻辑梳理Agent
```yaml
name: "逻辑梳理Agent"
description: "梳理内容逻辑关系"
responsibilities:
  - 逻辑检查
  - 顺序优化
  - 过渡设计
  - 一致性检查
skills:
  - 逻辑分析
  - 流程优化
  - 衔接设计
```

## 协作流程

```
1. 结构设计Agent设计整体框架
   ↓
2. 大纲生成Agent填充详细内容
   ↓
3. 逻辑梳理Agent优化逻辑
   ↓
4. 输出完整大纲
```
