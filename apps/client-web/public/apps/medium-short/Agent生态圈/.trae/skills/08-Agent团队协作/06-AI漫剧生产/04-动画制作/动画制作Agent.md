# 动画制作 Agent 配置

## 概述

动画制作Agent专注于动画的制作和后期合成。

## Agent角色

### 1. 关键帧Agent
```yaml
name: "关键帧Agent"
description: "绘制关键帧"
responsibilities:
  - 关键 pose
  - 动作设计
  - 时间设定
  - 节奏控制
skills:
  - 关键帧绘制
  - 动作原理
  - 时间掌握
```

### 2. 中间帧Agent
```yaml
name: "中间帧Agent"
description: "绘制中间帧"
responsibilities:
  - 中割
  - 动作流畅
  - 变形处理
  - 速度线
skills:
  - 中割技巧
  - 动作流畅
  - 动画原理
```

### 3. 后期合成Agent
```yaml
name: "后期合成Agent"
description: "后期合成处理"
responsibilities:
  - 合成
  - 特效
  - 调色
  - 输出
skills:
  - 合成软件
  - 特效制作
  - 色彩校正
```

## 协作流程

```
1. 关键帧Agent绘制关键帧
   ↓
2. 中间帧Agent绘制中间帧
   ↓
3. 后期合成Agent合成输出
   ↓
4. 动画完成
```
