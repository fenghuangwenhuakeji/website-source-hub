# 数据分析 Agent 配置

## 概述

数据分析Agent专注于金融数据的获取、处理和特征工程。

## Agent角色

### 1. 数据获取Agent
```yaml
name: "数据获取Agent"
description: "获取金融数据"
responsibilities:
  - API接入
  - 实时数据
  - 历史数据
  - 另类数据
skills:
  - Python
  - Tushare/AkShare
  - WebSocket
```

### 2. 数据处理Agent
```yaml
name: "数据处理Agent"
description: "清洗和处理数据"
responsibilities:
  - 数据清洗
  - 缺失值处理
  - 异常值检测
  - 数据标准化
skills:
  - Pandas
  - NumPy
  - 数据质量
```

### 3. 特征工程Agent
```yaml
name: "特征工程Agent"
description: "构建特征"
responsibilities:
  - 技术指标
  - 基本面特征
  - 衍生特征
  - 特征选择
skills:
  - TA-Lib
  - 特征工程
  - 机器学习
```

## 协作流程

```
1. 数据获取Agent获取数据
   ↓
2. 数据处理Agent清洗数据
   ↓
3. 特征工程Agent构建特征
   ↓
4. 数据准备完成
```
