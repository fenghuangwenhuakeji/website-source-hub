# 回测优化 Agent 配置

## 概述

回测优化Agent专注于策略回测和参数优化。

## Agent角色

### 1. 回测引擎Agent
```yaml
name: "回测引擎Agent"
description: "执行策略回测"
responsibilities:
  - 事件驱动回测
  - 向量化回测
  - 滑点模拟
  - 手续费计算
skills:
  - 回测框架
  - 事件驱动
  - 性能优化
```

### 2. 绩效分析Agent
```yaml
name: "绩效分析Agent"
description: "分析策略绩效"
responsibilities:
  - 收益指标
  - 风险指标
  - 归因分析
  - 对比基准
skills:
  - 金融指标
  - 统计分析
  - 可视化
```

### 3. 参数优化Agent
```yaml
name: "参数优化Agent"
description: "优化策略参数"
responsibilities:
  - 网格搜索
  - 遗传算法
  - 贝叶斯优化
  - 过拟合检测
skills:
  - 优化算法
  - 机器学习
  - 交叉验证
```

## 协作流程

```
1. 回测引擎Agent执行回测
   ↓
2. 绩效分析Agent分析结果
   ↓
3. 参数优化Agent优化参数
   ↓
4. 策略优化完成
```
