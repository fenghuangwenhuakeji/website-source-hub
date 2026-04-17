# Agent自动驾驶系统使用指南

## 🚀 快速开始

### 1. 启动自动驾驶系统

```bash
# 方法1: 使用批处理文件（推荐）
start-autopilot.bat

# 方法2: 直接使用Node
node autopilot-system.js start
```

### 2. 系统会自动执行以下任务

- ✅ 批量创建测试Agent
- ✅ 创建项目计划
- ✅ 编写规格文档
- ✅ 持续监控任务队列
- ✅ 自动重试失败任务

---

## 📋 核心功能

### 1. 任务队列管理

系统自动管理任务队列，包含以下状态：
- **pending**: 等待执行
- **running**: 正在执行
- **completed**: 已完成
- **failed**: 失败（可重试）

### 2. 工作流自动化

预定义的工作流：

#### 新项目工作流
```bash
node autopilot-system.js workflow new-project
```
执行步骤：
1. 创建项目计划
2. 编写规格文档
3. 生成项目Agent

#### 批量生成Agent工作流
```bash
node autopilot-system.js workflow batch-agents 10
```
生成10个Agent

#### 调试工作流
```bash
node autopilot-system.js workflow debug-session
```

### 3. 添加单个任务

```bash
node autopilot-system.js add <task-type> <agent-name>

# 示例
node autopilot-system.js add generate-agent agent-generator
node autopilot-system.js add create-plan plan-agent
node autopilot-system.js add write-spec spec-agent
```

### 4. 查看系统状态

```bash
node autopilot-system.js status
```

---

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                 Agent Autopilot System                   │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Task Queue  │  │   Executor   │  │   Logger     │  │
│  │   任务队列    │  │   执行器      │  │   日志系统    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Workflows  │  │    Stats     │  │   Recovery   │  │
│  │   工作流      │  │   统计监控    │  │   错误恢复    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 任务类型说明

| 任务类型 | 说明 | 对应Agent |
|----------|------|-----------|
| `generate-agent` | 生成新Agent | agent-generator |
| `batch-create` | 批量创建 | batch-agent-creator |
| `create-plan` | 创建项目计划 | plan-agent |
| `write-spec` | 编写规格文档 | spec-agent |
| `debug-code` | 调试代码 | debug-agent |

---

## 📝 配置文件

### 任务队列文件
`task-queue.json` - 自动生成的任务队列状态

### 工作日志
`logs/work-YYYY-MM-DD.log` - 每日工作日志

### 工作目录
`workspace/<task-id>/` - 每个任务的工作目录

---

## 🔄 持续工作模式

系统启动后会：

1. **每5秒**检查一次任务队列
2. **自动执行**队列中的任务
3. **失败重试**最多3次
4. **实时记录**所有操作日志
5. **定期统计**工作成果

---

## 🛠️ 自定义任务

### 创建自定义任务配置文件

创建 `my-tasks.json`:
```json
[
  {
    "type": "generate-agent",
    "agent": "agent-generator",
    "config": {
      "name": "my-custom-agent",
      "title": "My Custom Agent"
    }
  },
  {
    "type": "create-plan",
    "agent": "plan-agent",
    "config": {
      "project": "My Project",
      "phases": ["Phase 1", "Phase 2"]
    }
  }
]
```

### 加载自定义任务

修改 `autopilot-system.js` 中的 `main()` 函数，添加：
```javascript
const customTasks = JSON.parse(fs.readFileSync('my-tasks.json'));
system.addTasks(customTasks);
```

---

## 📈 监控和日志

### 实时查看日志
```bash
# Windows
type logs\work-2026-03-18.log

# Linux/Mac
tail -f logs/work-2026-03-18.log
```

### 查看任务队列
```bash
type task-queue.json
```

---

## 🎯 使用场景示例

### 场景1: 批量生成100个Agent
```bash
node autopilot-system.js workflow batch-agents 100
```

### 场景2: 自动化项目管理
```bash
# 启动系统，自动执行项目规划
node autopilot-system.js start
```

### 场景3: 持续集成流水线
```bash
# 添加代码检查任务
node autopilot-system.js add debug-code debug-agent

# 启动系统持续监控
node autopilot-system.js start
```

---

## ⚙️ 高级配置

修改 `autopilot-system.js` 中的 `CONFIG`:

```javascript
const CONFIG = {
  workDir: './workspace',      // 工作目录
  logDir: './logs',            // 日志目录
  checkInterval: 5000,         // 检查间隔（毫秒）
  maxRetries: 3,               // 最大重试次数
  autoRestart: true            // 自动重启
};
```

---

## 🛑 停止系统

按 `Ctrl+C` 即可安全停止系统

---

## 💡 最佳实践

1. **定期清理** completed 任务，避免队列过大
2. **监控** failed 任务，及时处理错误
3. **备份** task-queue.json，防止数据丢失
4. **合理设置** checkInterval，避免资源占用过高

---

**现在启动系统，让Agent开始自动工作吧！**
