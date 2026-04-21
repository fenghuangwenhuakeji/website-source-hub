# 需求分析 Agent 配置

## 概述

需求分析Agent专注于软件需求的收集、分析和文档化，确保项目目标明确、需求清晰。

## Agent角色

### 1. 需求收集Agent
```yaml
name: "需求收集Agent"
description: "收集和整理用户需求"
responsibilities:
  - 用户访谈
  - 问卷调查
  - 竞品分析
  - 需求整理
skills:
  - 沟通技巧
  - 需求挖掘
  - 文档编写
```

### 2. 需求分析Agent
```yaml
name: "需求分析Agent"
description: "分析需求可行性和优先级"
responsibilities:
  - 需求分类
  - 可行性分析
  - 优先级排序
  - 依赖关系梳理
skills:
  - 业务分析
  - 技术评估
  - 项目管理
```

### 3. 原型设计Agent
```yaml
name: "原型设计Agent"
description: "设计产品原型和交互流程"
responsibilities:
  - 线框图设计
  - 交互设计
  - 用户流程
  - 原型演示
skills:
  - 原型工具
  - UX设计
  - 交互逻辑
```

### 4. 规格定义Agent
```yaml
name: "规格定义Agent"
description: "编写详细的需求规格文档"
responsibilities:
  - 功能规格
  - 非功能规格
  - 接口定义
  - 验收标准
skills:
  - 文档规范
  - 技术写作
  - 标准制定
```

## 协作流程

```
1. 需求收集Agent收集原始需求
   ↓
2. 需求分析Agent分析整理
   ↓
3. 原型设计Agent设计交互原型
   ↓
4. 规格定义Agent输出PRD文档
   ↓
5. 评审确认
```
