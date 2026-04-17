# 核心功能Agent驱动系统

## 📋 概述

本目录包含7个核心功能Agent，每个Agent都配备了自动驱动脚本，可以自动执行任务。

## 🤖 核心Agent列表

| Agent名称 | 功能描述 | 状态 |
|-----------|----------|------|
| agent-generator | Agent生成器 - 创建新Agent | ✅ 已配置驱动 |
| autopilot-agent | 自动驾驶Agent - 自动执行任务 | ✅ 已配置驱动 |
| batch-agent-creator | 批量Agent创建器 - 批量生成Agent | ✅ 已配置驱动 |
| debug-agent | 调试Agent - 诊断和修复问题 | ✅ 已配置驱动 |
| meta-agent | 元Agent - 管理和协调其他Agent | ✅ 已配置驱动 |
| plan-agent | 规划Agent - 项目规划和任务分解 | ✅ 已配置驱动 |
| spec-agent | 规格Agent - 需求分析和规格定义 | ✅ 已配置驱动 |

## 🚀 快速开始

### 方法1: 一键启动所有Agent
```bash
# Windows
start-all-agents.bat

# 或直接使用Node
node agent-driver.js all
```

### 方法2: 启动单个Agent
```bash
node agent-driver.js <agent-name> [task-file]

# 示例
node agent-driver.js agent-generator task.json
node agent-driver.js plan-agent project-plan.json
```

## 📁 文件说明

| 文件 | 说明 |
|------|------|
| `agent-driver.js` | 核心驱动脚本 - 驱动所有Agent执行任务 |
| `start-all-agents.bat` | Windows批处理 - 一键启动所有Agent |
| `example-task.json` | 示例任务配置文件 |
| `*-driver.log` | Agent执行日志文件 |

## 📝 任务配置文件格式

### JSON格式
```json
{
  "name": "任务名称",
  "project_name": "项目名称",
  "output_dir": "输出目录",
  "agents": [
    {
      "name": "agent-name",
      "title": "Agent标题",
      "description": "描述",
      "core_concept": "核心理念",
      "features": ["功能1", "功能2"],
      "priority": "high"
    }
  ],
  "phases": [
    {"name": "阶段1", "duration": "3天"}
  ],
  "milestones": ["里程碑1", "里程碑2"]
}
```

### YAML格式
```yaml
name: 任务名称
project_name: 项目名称
agents:
  - name: agent-name
    title: Agent标题
    features:
      - 功能1
      - 功能2
```

## 🎯 使用示例

### 示例1: 批量生成Agent
```bash
node agent-driver.js agent-generator example-task.json
```

### 示例2: 创建项目计划
```bash
node agent-driver.js plan-agent plan-config.json
```

### 示例3: 生成规格文档
```bash
node agent-driver.js spec-agent spec-config.json
```

### 示例4: 调试问题
```bash
node agent-driver.js debug-agent error-report.json
```

## 📊 驱动系统功能

- ✅ 自动解析任务配置（JSON/YAML）
- ✅ 智能Agent调度
- ✅ 彩色日志输出
- ✅ 执行状态监控
- ✅ 批量任务执行
- ✅ 结果汇总报告

## 🔧 扩展开发

要为新的Agent添加驱动支持：

1. 在 `CORE_AGENTS` 中添加Agent配置
2. 在 `AgentDriver.execute()` 中添加执行逻辑
3. 创建对应的任务配置文件

## 📝 日志查看

每个Agent的执行日志保存在：
```
<agent-name>-driver.log
```

例如：
- `agent-generator-driver.log`
- `plan-agent-driver.log`

## 🎉 开始使用

1. 准备任务配置文件（参考 example-task.json）
2. 运行驱动脚本
3. 查看执行结果和日志

---

**核心Agent驱动系统已就绪，可以自动执行所有任务！**
