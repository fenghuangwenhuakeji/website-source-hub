# 交易执行 Agent 配置

## 概述

交易执行Agent专注于实盘交易执行和风险控制。

## Agent角色

### 1. 算法交易Agent
```yaml
name: "算法交易Agent"
description: "执行算法交易"
responsibilities:
  - TWAP/VWAP
  - 冰山算法
  - 智能路由
  - 滑点控制
skills:
  - 算法交易
  - 订单执行
  - 市场微观结构
```

### 2. 订单管理Agent
```yaml
name: "订单管理Agent"
description: "管理交易订单"
responsibilities:
  - 订单生成
  - 订单路由
  - 成交分析
  - 异常处理
skills:
  - 订单管理
  - 交易API
  - 风险控制
```

### 3. 风控执行Agent
```yaml
name: "风控执行Agent"
description: "执行风险控制"
responsibilities:
  - 限额监控
  - 止损执行
  - 风险告警
  - 紧急平仓
skills:
  - 风险管理
  - 实时监控
  - 应急响应
```

## 协作流程

```
1. 算法交易Agent生成订单
   ↓
2. 订单管理Agent执行交易
   ↓
3. 风控执行Agent监控风险
   ↓
4. 交易闭环
```
