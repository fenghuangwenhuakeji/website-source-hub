# 架构设计 Agent 配置

## 概述

架构设计Agent专注于系统架构设计，确保系统的可扩展性、可维护性和高性能。

## Agent角色

### 1. 系统架构Agent
```yaml
name: "系统架构Agent"
description: "设计整体系统架构"
responsibilities:
  - 架构选型
  - 模块划分
  - 技术栈选择
  - 架构评审
skills:
  - 架构模式
  - 微服务
  - 分布式系统
```

### 2. 技术选型Agent
```yaml
name: "技术选型Agent"
description: "评估和选择技术方案"
responsibilities:
  - 框架评估
  - 数据库选型
  - 中间件选择
  - 技术对比
skills:
  - 技术调研
  - 性能评估
  - 成本分析
```

### 3. 模块设计Agent
```yaml
name: "模块设计Agent"
description: "设计系统模块和组件"
responsibilities:
  - 模块划分
  - 职责定义
  - 依赖关系
  - 接口设计
skills:
  - 模块化设计
  - 高内聚低耦合
  - 设计模式
```

### 4. 接口设计Agent
```yaml
name: "接口设计Agent"
description: "设计API和接口规范"
responsibilities:
  - API设计
  - 协议选择
  - 数据格式
  - 版本管理
skills:
  - RESTful
  - GraphQL
  - gRPC
```

## 协作流程

```
1. 系统架构Agent确定整体架构
   ↓
2. 技术选型Agent选择技术栈
   ↓
3. 模块设计Agent划分模块
   ↓
4. 接口设计Agent定义接口
   ↓
5. 架构评审
```
