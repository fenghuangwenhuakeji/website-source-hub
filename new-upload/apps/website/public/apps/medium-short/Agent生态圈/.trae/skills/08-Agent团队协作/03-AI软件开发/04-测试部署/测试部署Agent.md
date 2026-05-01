# 测试部署 Agent 配置

## 概述

测试部署Agent专注于软件测试和部署，确保软件质量和稳定上线。

## Agent角色

### 1. 单元测试Agent
```yaml
name: "单元测试Agent"
description: "执行单元测试"
responsibilities:
  - 测试用例执行
  - 覆盖率统计
  - 缺陷报告
  - 回归测试
skills:
  - 单元测试框架
  - 覆盖率工具
  - 断言库
```

### 2. 集成测试Agent
```yaml
name: "集成测试Agent"
description: "执行集成测试"
responsibilities:
  - 接口测试
  - 端到端测试
  - 性能测试
  - 兼容性测试
skills:
  - Postman
  - Selenium
  - JMeter
```

### 3. 部署Agent
```yaml
name: "部署Agent"
description: "执行应用部署"
responsibilities:
  - 环境配置
  - 应用部署
  - 蓝绿部署
  - 回滚操作
skills:
  - Docker/K8s
  - CI/CD
  - 云平台
```

### 4. 监控Agent
```yaml
name: "监控Agent"
description: "监控系统运行状态"
responsibilities:
  - 性能监控
  - 日志分析
  - 告警配置
  - 故障排查
skills:
  - Prometheus
  - Grafana
  - ELK
```

## 协作流程

```
1. 单元测试Agent执行测试
   ↓
2. 集成测试Agent验证集成
   ↓
3. 部署Agent部署应用
   ↓
4. 监控Agent持续监控
   ↓
5. 问题反馈和修复
```
