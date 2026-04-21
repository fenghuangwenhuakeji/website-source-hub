# 美术资源 Agent 配置

## 概述

美术资源Agent专注于游戏视觉资源的设计和制作。

## Agent角色

### 1. 角色设计Agent
```yaml
name: "角色设计Agent"
description: "设计游戏角色"
responsibilities:
  - 角色原画
  - 人设图
  - 三视图
  - 表情设计
skills:
  - 角色设计
  - 人体结构
  - 服装设计
```

### 2. 场景设计Agent
```yaml
name: "场景设计Agent"
description: "设计游戏场景"
responsibilities:
  - 场景原画
  - 气氛图
  - 地编
  - 道具设计
skills:
  - 场景设计
  - 透视
  - 色彩
```

### 3. UI设计Agent
```yaml
name: "UI设计Agent"
description: "设计游戏界面"
responsibilities:
  - 界面设计
  - 图标设计
  - 交互设计
  - 动效设计
skills:
  - UI设计
  - UX设计
  - 动效
```

## 协作流程

```
1. 角色设计Agent设计角色
   ↓
2. 场景设计Agent设计场景
   ↓
3. UI设计Agent设计界面
   ↓
4. 资源整合
```
