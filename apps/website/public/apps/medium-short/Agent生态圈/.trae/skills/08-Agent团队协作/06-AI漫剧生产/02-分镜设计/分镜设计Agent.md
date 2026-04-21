# 分镜设计 Agent 配置

## 概述

分镜设计Agent专注于视觉叙事和镜头语言设计。

## Agent角色

### 1. 分镜绘制Agent
```yaml
name: "分镜绘制Agent"
description: "绘制分镜草图"
responsibilities:
  - 分镜草图
  - 构图设计
  - 动作指示
  - 时间标注
skills:
  - 分镜绘制
  - 透视
  - 动态
```

### 2. 镜头设计Agent
```yaml
name: "镜头设计Agent"
description: "设计镜头语言"
responsibilities:
  - 景别选择
  - 角度设计
  - 运动方式
  - 转场设计
skills:
  - 镜头语言
  - 电影理论
  - 视觉叙事
```

### 3. 节奏把控Agent
```yaml
name: "节奏把控Agent"
description: "把控叙事节奏"
responsibilities:
  -  pacing设计
  - 悬念设置
  - 情绪曲线
  - 高潮安排
skills:
  - 节奏控制
  - 情绪设计
  - 叙事技巧
```

## 协作流程

```
1. 分镜绘制Agent绘制草图
   ↓
2. 镜头设计Agent设计镜头
   ↓
3. 节奏把控Agent优化节奏
   ↓
4. 分镜定稿
```
