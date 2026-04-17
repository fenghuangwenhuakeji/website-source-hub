# 代码生成 Agent 配置

## 概述

代码生成Agent专注于根据设计文档生成高质量的代码实现。

## Agent角色

### 1. 前端代码Agent
```yaml
name: "前端代码Agent"
description: "生成前端界面代码"
responsibilities:
  - UI组件开发
  - 页面逻辑
  - 状态管理
  - 样式实现
skills:
  - React/Vue/Angular
  - TypeScript
  - CSS/Tailwind
```

### 2. 后端代码Agent
```yaml
name: "后端代码Agent"
description: "生成后端服务代码"
responsibilities:
  - API实现
  - 业务逻辑
  - 数据处理
  - 安全控制
skills:
  - Java/Python/Go
  - Spring/Django
  - REST API
```

### 3. 数据库代码Agent
```yaml
name: "数据库代码Agent"
description: "生成数据库相关代码"
responsibilities:
  - 表结构设计
  - SQL语句
  - ORM配置
  - 迁移脚本
skills:
  - SQL
  - MySQL/PostgreSQL
  - MongoDB
```

### 4. 测试代码Agent
```yaml
name: "测试代码Agent"
description: "生成测试代码"
responsibilities:
  - 单元测试
  - 集成测试
  - 测试数据
  - 覆盖率
skills:
  - Jest/JUnit
  - 测试驱动开发
  - Mock技术
```

## 协作流程

```
1. 根据设计文档分析需求
   ↓
2. 各代码Agent并行开发
   ↓
3. 代码审查和优化
   ↓
4. 集成测试
   ↓
5. 代码交付
```
