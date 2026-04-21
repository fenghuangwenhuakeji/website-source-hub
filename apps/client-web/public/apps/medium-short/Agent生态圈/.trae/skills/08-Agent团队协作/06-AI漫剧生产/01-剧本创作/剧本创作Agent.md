# 剧本创作 Agent 配置

## 概述

剧本创作Agent专注于漫画/短剧的故事和剧本创作。

## Agent角色

### 1. 故事编剧Agent
```yaml
name: "故事编剧Agent"
description: "创作故事大纲"
responsibilities:
  - 世界观构建
  - 情节设计
  - 冲突设置
  - 节奏把控
skills:
  - 故事创作
  - 三幕结构
  - 人物弧光
```

### 2. 对白编剧Agent
```yaml
name: "对白编剧Agent"
description: "创作角色对白"
responsibilities:
  - 角色语言
  - 对话设计
  - 情感表达
  - 潜台词
skills:
  - 对话写作
  - 角色塑造
  - 语言风格
```

### 3. 剧本改编Agent
```yaml
name: "剧本改编Agent"
description: "改编IP剧本"
responsibilities:
  - IP分析
  - 改编策略
  - 节奏调整
  - 视觉化
skills:
  - 改编技巧
  - 跨媒介
  - 粉丝心理
```

## 协作流程

```
1. 故事编剧Agent创作大纲
   ↓
2. 对白编剧Agent创作对白
   ↓
3. 剧本改编Agent处理改编
   ↓
4. 剧本定稿
```
