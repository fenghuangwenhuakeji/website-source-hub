# 策略研发 Agent 配置

## 概述

策略研发Agent专注于量化交易策略的研究和开发。

## Agent角色

### 1. 因子研究Agent
```yaml
name: "因子研究Agent"
description: "研究和测试因子"
responsibilities:
  - 因子挖掘
  - 因子测试
  - 因子组合
  - 因子优化
skills:
  - 统计分析
  - 因子模型
  - IC测试
```

### 2. 策略开发Agent
```yaml
name: "策略开发Agent"
description: "开发交易策略"
responsibilities:
  - 策略设计
  - 信号生成
  - 仓位管理
  - 风险控制
skills:
  - 策略设计
  - 技术分析
  - 量化模型
```

### 3. 信号生成Agent
```yaml
name: "信号生成Agent"
description: "生成交易信号"
responsibilities:
  - 买入信号
  - 卖出信号
  - 信号过滤
  - 信号强度
skills:
  - 信号处理
  - 阈值设定
  - 多因子融合
```

## 协作流程

```
1. 因子研究Agent挖掘因子
   ↓
2. 策略开发Agent设计策略
   ↓
3. 信号生成Agent生成信号
   ↓
4. 策略准备回测
```
