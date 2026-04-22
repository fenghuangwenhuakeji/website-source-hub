# 终极Agent系统架构设计

## 第一性原理分析

### 核心问题
1. **记忆问题**: 新对话不记得之前的内容 → 需要持久化存储
2. **结构问题**: Agent结构不完整 → 需要标准化范式
3. **自主问题**: 不能自动执行 → 需要自动化引擎
4. **包装问题**: 没有统一入口 → 需要统一运行脚本

### 物理事实
- Agent本质是**知识+能力+状态**的组合
- 对话本质是**输入→处理→输出→记忆**的流程
- 自动化本质是**触发→执行→反馈**的循环

---

## 终极Agent目录结构

```
agent-name/
├── 📄 核心文档层 (必须)
│   ├── SKILL.md              # 技能定义 - Agent的灵魂
│   ├── requirement.md        # 需求规格 - 做什么
│   ├── design.md             # 架构设计 - 怎么做
│   ├── tasks.md              # 任务分解 - 执行步骤
│   └── checklist.md          # 质量检查 - 验证标准
│
├── 🧠 知识层 (推荐)
│   ├── knowledge/
│   │   ├── concepts.json     # 核心概念定义
│   │   ├── patterns.json     # 设计模式库
│   │   ├── examples.json     # 示例库
│   │   └── best-practices.md # 最佳实践
│   └── templates/
│       ├── code/             # 代码模板
│       ├── docs/             # 文档模板
│       └── config/           # 配置模板
│
├── ⚙️ 执行层 (推荐)
│   ├── run.js                # 主运行脚本
│   ├── executor.js           # 执行引擎
│   ├── validator.js          # 验证器
│   └── scheduler.js          # 调度器
│
├── 💾 状态层 (必须 - 解决记忆问题)
│   ├── state/
│   │   ├── current.json      # 当前状态
│   │   ├── history.json      # 历史记录
│   │   ├── context.json      # 上下文信息
│   │   └── session/          # 会话数据
│   ├── memory/
│   │   ├── short-term.json   # 短期记忆
│   │   ├── long-term.json    # 长期记忆
│   │   └── embeddings/       # 向量存储
│   └── logs/
│       ├── execution.log     # 执行日志
│       ├── error.log         # 错误日志
│       └── audit.log         # 审计日志
│
├── 🔗 集成层 (可选)
│   ├── api/
│   │   ├── routes.js         # API路由
│   │   ├── handlers.js       # 处理器
│   │   └── middleware.js     # 中间件
│   ├── hooks/
│   │   ├── before.js         # 前置钩子
│   │   ├── after.js          # 后置钩子
│   │   └── error.js          # 错误钩子
│   └── adapters/
│       ├── llm.js            # LLM适配器
│       ├── database.js       # 数据库适配器
│       └── external.js       # 外部服务适配器
│
├── 📊 监控层 (推荐)
│   ├── metrics/
│   │   ├── performance.json  # 性能指标
│   │   ├── usage.json        # 使用统计
│   │   └── quality.json      # 质量指标
│   └── dashboard/
│       └── status.html       # 状态面板
│
├── 🧪 测试层 (推荐)
│   ├── tests/
│   │   ├── unit/             # 单元测试
│   │   ├── integration/      # 集成测试
│   │   └── e2e/              # 端到端测试
│   └── fixtures/             # 测试数据
│
├── 📦 配置层
│   ├── config.json           # 主配置
│   ├── config.dev.json       # 开发配置
│   ├── config.prod.json      # 生产配置
│   └── .env                  # 环境变量
│
└── 📝 文档层
    ├── README.md             # 使用说明
    ├── CHANGELOG.md          # 变更日志
    ├── API.md                # API文档
    └── CONTRIBUTING.md       # 贡献指南
```

---

## 核心文件详解

### 1. SKILL.md - Agent的灵魂

```markdown
---
name: "agent-name"
version: "1.0.0"
type: "skill|debug|plan|spec|custom"
priority: 1
dependencies: ["dep-agent-1", "dep-agent-2"]
triggers:
  keywords: ["关键词1", "关键词2"]
  patterns: ["正则模式1"]
  commands: ["命令1"]
---

# Agent名称

## 核心理念
一句话概括Agent的核心价值

## 能力定义
| 能力ID | 名称 | 描述 | 输入 | 输出 |
|--------|------|------|------|------|
| CAP-001 | 能力1 | 描述 | 输入类型 | 输出类型 |

## 工作流程
状态机定义，包含所有可能的状态转换

## 调用条件
自动触发和手动触发的条件

## 输出保证
Agent输出的质量承诺
```

### 2. config.json - 统一配置

```json
{
  "name": "agent-name",
  "version": "1.0.0",
  "description": "Agent描述",
  
  "identity": {
    "type": "skill",
    "priority": 1,
    "tags": ["tag1", "tag2"],
    "icon": "🤖"
  },
  
  "capabilities": {
    "maxConcurrent": 3,
    "timeout": 30000,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  
  "memory": {
    "enabled": true,
    "shortTermLimit": 100,
    "longTermLimit": 10000,
    "embeddingModel": "text-embedding-3-small"
  },
  
  "triggers": {
    "keywords": ["关键词"],
    "patterns": ["正则"],
    "commands": ["命令"],
    "autoStart": false
  },
  
  "dependencies": {
    "agents": ["dep-agent"],
    "services": ["service1"],
    "models": ["gpt-4"]
  },
  
  "hooks": {
    "beforeExecute": "./hooks/before.js",
    "afterExecute": "./hooks/after.js",
    "onError": "./hooks/error.js"
  },
  
  "monitoring": {
    "logLevel": "info",
    "metricsEnabled": true,
    "auditEnabled": true
  }
}
```

### 3. state/current.json - 当前状态

```json
{
  "agentId": "agent-name",
  "status": "idle|running|paused|error",
  "lastUpdate": "2026-03-27T10:00:00Z",
  
  "session": {
    "id": "session-xxx",
    "startedAt": "2026-03-27T10:00:00Z",
    "context": {}
  },
  
  "currentTask": {
    "id": "task-xxx",
    "description": "当前任务描述",
    "progress": 50,
    "status": "in_progress"
  },
  
  "memory": {
    "recentInteractions": [],
    "learnedPatterns": [],
    "userPreferences": {}
  }
}
```

### 4. memory/long-term.json - 长期记忆

```json
{
  "agentId": "agent-name",
  "createdAt": "2026-01-01T00:00:00Z",
  
  "knowledge": {
    "concepts": [],
    "patterns": [],
    "examples": []
  },
  
  "experiences": [
    {
      "timestamp": "2026-03-27T10:00:00Z",
      "task": "任务描述",
      "approach": "采用的方法",
      "outcome": "结果",
      "learnings": "学到的经验"
    }
  ],
  
  "userProfiles": {
    "user-xxx": {
      "preferences": {},
      "history": [],
      "feedback": []
    }
  }
}
```

---

## 自动化运行脚本

### run.js - 主运行脚本

```javascript
#!/usr/bin/env node
/**
 * Agent自动运行脚本
 * 
 * 功能:
 * 1. 自动加载配置和状态
 * 2. 自动恢复上次会话
 * 3. 自动执行任务队列
 * 4. 自动保存状态和记忆
 * 5. 支持命令行和API两种模式
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class AgentRunner extends EventEmitter {
  constructor(agentDir) {
    super();
    this.dir = agentDir;
    this.config = this.loadConfig();
    this.state = this.loadState();
    this.memory = this.loadMemory();
    this.taskQueue = [];
    this.isRunning = false;
  }

  // 加载配置
  loadConfig() {
    const configPath = path.join(this.dir, 'config.json');
    return fs.existsSync(configPath) 
      ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
      : this.getDefaultConfig();
  }

  // 加载状态
  loadState() {
    const statePath = path.join(this.dir, 'state', 'current.json');
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
    return this.getInitialState();
  }

  // 加载记忆
  loadMemory() {
    const memoryPath = path.join(this.dir, 'memory', 'long-term.json');
    if (fs.existsSync(memoryPath)) {
      return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    }
    return { experiences: [], knowledge: {} };
  }

  // 保存状态
  saveState() {
    const stateDir = path.join(this.dir, 'state');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(stateDir, 'current.json'),
      JSON.stringify(this.state, null, 2)
    );
  }

  // 保存记忆
  saveMemory() {
    const memoryDir = path.join(this.dir, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(memoryDir, 'long-term.json'),
      JSON.stringify(this.memory, null, 2)
    );
  }

  // 记住经验
  remember(task, approach, outcome, learnings) {
    this.memory.experiences.push({
      timestamp: new Date().toISOString(),
      task, approach, outcome, learnings
    });
    this.saveMemory();
  }

  // 回忆相关经验
  recall(query) {
    return this.memory.experiences.filter(exp => 
      exp.task.includes(query) || 
      exp.approach.includes(query) ||
      exp.learnings.includes(query)
    );
  }

  // 执行任务
  async execute(task) {
    console.log(`\n🤖 [${this.config.name}] 开始执行: ${task}`);
    
    // 回忆相关经验
    const relevantExperiences = this.recall(task);
    if (relevantExperiences.length > 0) {
      console.log(`   💭 回忆起 ${relevantExperiences.length} 条相关经验`);
    }

    this.state.status = 'running';
    this.state.currentTask = {
      id: `task-${Date.now()}`,
      description: task,
      progress: 0,
      status: 'in_progress'
    };
    this.saveState();

    try {
      // 执行逻辑...
      const result = await this.doExecute(task);
      
      // 记住这次经验
      this.remember(task, '执行方法', result, '学到的经验');
      
      this.state.status = 'idle';
      this.state.currentTask.status = 'completed';
      this.saveState();
      
      return result;
    } catch (error) {
      this.state.status = 'error';
      this.state.currentTask.status = 'failed';
      this.saveState();
      throw error;
    }
  }

  async doExecute(task) {
    // 具体执行逻辑，由子类实现
    return { success: true, message: '任务完成' };
  }

  // 启动
  async start() {
    console.log(`\n🚀 [${this.config.name}] 启动中...`);
    console.log(`   状态: ${this.state.status}`);
    console.log(`   记忆: ${this.memory.experiences.length} 条经验`);
    
    this.isRunning = true;
    
    // 恢复上次未完成的任务
    if (this.state.currentTask?.status === 'in_progress') {
      console.log(`   🔄 恢复未完成任务: ${this.state.currentTask.description}`);
    }
    
    this.emit('started');
  }

  // 停止
  stop() {
    console.log(`\n⏹️ [${this.config.name}] 停止中...`);
    this.isRunning = false;
    this.saveState();
    this.saveMemory();
    this.emit('stopped');
  }
}

// 命令行入口
async function main() {
  const agentDir = __dirname;
  const runner = new AgentRunner(agentDir);
  
  await runner.start();
  
  // 处理命令行参数
  const args = process.argv.slice(2);
  if (args.length > 0) {
    const task = args.join(' ');
    await runner.execute(task);
  }
  
  // 优雅退出
  process.on('SIGINT', () => {
    runner.stop();
    process.exit(0);
  });
}

module.exports = AgentRunner;
if (require.main === module) {
  main().catch(console.error);
}
```

---

## 系统级自动化脚本

### master-controller.js - 总控制器

```javascript
#!/usr/bin/env node
/**
 * Agent系统总控制器
 * 
 * 功能:
 * 1. 自动发现和注册所有Agent
 * 2. 统一调度和监控
 * 3. 跨Agent协作
 * 4. 全局记忆和状态管理
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class MasterController extends EventEmitter {
  constructor(skillsDir) {
    super();
    this.skillsDir = skillsDir;
    this.agents = new Map();
    this.globalMemory = this.loadGlobalMemory();
    this.taskQueue = [];
    this.isRunning = false;
  }

  // 发现所有Agent
  discoverAgents() {
    const agents = [];
    const dirs = fs.readdirSync(this.skillsDir, { withFileTypes: true });
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const skillPath = path.join(this.skillsDir, dir.name, 'SKILL.md');
        const configPath = path.join(this.skillsDir, dir.name, 'config.json');
        
        if (fs.existsSync(skillPath)) {
          const config = fs.existsSync(configPath)
            ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
            : { name: dir.name };
          
          agents.push({
            id: dir.name,
            name: config.name || dir.name,
            path: path.join(this.skillsDir, dir.name),
            config,
            status: 'discovered'
          });
        }
      }
    }
    
    return agents;
  }

  // 注册Agent
  registerAgent(agentInfo) {
    this.agents.set(agentInfo.id, agentInfo);
    console.log(`✅ 注册Agent: ${agentInfo.name}`);
  }

  // 分析任务，选择Agent
  analyzeTask(task) {
    const scores = [];
    
    for (const [id, agent] of this.agents) {
      let score = 0;
      const keywords = agent.config.triggers?.keywords || [];
      
      for (const keyword of keywords) {
        if (task.toLowerCase().includes(keyword.toLowerCase())) {
          score++;
        }
      }
      
      if (score > 0) {
        scores.push({ agent: id, score, priority: agent.config.priority || 1 });
      }
    }
    
    return scores
      .sort((a, b) => b.score - a.score || a.priority - b.priority)
      .slice(0, 3)
      .map(s => s.agent);
  }

  // 执行任务
  async executeTask(task) {
    console.log(`\n📥 新任务: ${task}`);
    
    // 分析选择Agent
    const selectedAgents = this.analyzeTask(task);
    
    if (selectedAgents.length === 0) {
      console.log('   ⚠️ 未找到合适的Agent');
      return { success: false, message: '未找到合适的Agent' };
    }
    
    console.log(`   🎯 选择Agent: ${selectedAgents.join(', ')}`);
    
    const results = [];
    for (const agentId of selectedAgents) {
      const agent = this.agents.get(agentId);
      console.log(`\n🤖 调用 ${agent.name}...`);
      
      // 这里可以动态加载Agent的run.js并执行
      // const AgentRunner = require(path.join(agent.path, 'run.js'));
      // const runner = new AgentRunner(agent.path);
      // const result = await runner.execute(task);
      
      results.push({ agent: agentId, success: true });
    }
    
    // 记住这次执行
    this.remember(task, selectedAgents, results);
    
    return { success: true, results };
  }

  // 全局记忆
  loadGlobalMemory() {
    const memoryPath = path.join(this.skillsDir, '.global-memory.json');
    if (fs.existsSync(memoryPath)) {
      return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    }
    return { tasks: [], patterns: [], users: {} };
  }

  saveGlobalMemory() {
    fs.writeFileSync(
      path.join(this.skillsDir, '.global-memory.json'),
      JSON.stringify(this.globalMemory, null, 2)
    );
  }

  remember(task, agents, results) {
    this.globalMemory.tasks.push({
      timestamp: new Date().toISOString(),
      task,
      agents,
      results
    });
    this.saveGlobalMemory();
  }

  // 启动
  async start() {
    console.log('\n🚀 Agent系统总控制器启动...');
    
    // 发现并注册Agent
    const agents = this.discoverAgents();
    for (const agent of agents) {
      this.registerAgent(agent);
    }
    
    console.log(`\n📊 已注册 ${this.agents.size} 个Agent`);
    this.isRunning = true;
    
    this.emit('started');
  }

  // 对话接口
  async chat(message) {
    return await this.executeTask(message);
  }
}

// 启动
async function main() {
  const skillsDir = process.argv[2] || path.join(__dirname);
  const controller = new MasterController(skillsDir);
  
  await controller.start();
  
  // 示例任务
  const demoTasks = [
    '添加用户登录功能',
    '优化支付流程',
    '修复移动端适配问题'
  ];
  
  for (const task of demoTasks) {
    await controller.executeTask(task);
  }
  
  console.log('\n✅ 演示完成');
}

module.exports = MasterController;
if (require.main === module) {
  main().catch(console.error);
}
```

---

## 快速启动脚本

### start.bat (Windows)

```batch
@echo off
chcp 65001 >nul
title Agent System

echo ================================================================
echo              Agent System - Auto Starter
echo ================================================================
echo.

:: 设置路径
set SKILLS_DIR=D:\网站部署\.trae\skills

:: 启动总控制器
echo Starting Master Controller...
cd /d "%SKILLS_DIR%"
node master-controller.js "02-超无穹项目Agent"

pause
```

---

## 总结

### 解决的问题

| 问题 | 解决方案 | 文件 |
|------|----------|------|
| 记忆问题 | 状态层 + 记忆层 | state/, memory/ |
| 结构问题 | 标准化目录结构 | 完整的目录范式 |
| 自主问题 | 自动执行引擎 | run.js, executor.js |
| 包装问题 | 统一运行脚本 | master-controller.js |

### 核心创新

1. **持久化记忆**: 每个Agent都有独立的记忆系统
2. **状态恢复**: 重启后自动恢复上次状态
3. **经验学习**: 自动记录和回忆经验
4. **统一调度**: 总控制器管理所有Agent

---

**这就是终极Agent系统！**
