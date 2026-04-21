#!/usr/bin/env node
/**
 * 核心Agent系统 - 深度JS绑定与自主执行引擎
 * 
 * 核心特性:
 * 1. 深度JS绑定 - 所有Agent通过JS直接调用和控制
 * 2. 自主执行 - 任务自动分解、调度、执行、监控
 * 3. 持续运行 - 支持长时间运行的任务队列
 * 4. 全面监控 - 实时日志、性能监控、状态追踪
 * 5. 智能恢复 - 自动错误处理、重试、故障转移
 */

const fs = require('fs');
const path = require('path');
const { exec, execSync, spawn } = require('child_process');
const EventEmitter = require('events');
const os = require('os');

// ==================== 配置管理 ====================
const CONFIG = {
  baseDir: __dirname,
  workDir: path.join(__dirname, 'workspace'),
  logDir: path.join(__dirname, 'logs'),
  agentDir: path.join(__dirname),
  taskQueueFile: path.join(__dirname, 'task-queue.json'),
  stateFile: path.join(__dirname, 'system-state.json'),
  metricsFile: path.join(__dirname, 'metrics.json'),
  
  // 执行配置
  execution: {
    maxConcurrent: 3,
    checkInterval: 2000,
    retryAttempts: 5,
    retryDelay: 5000,
    timeout: 300000, // 5分钟
    autoRestart: true
  },
  
  // 监控配置
  monitoring: {
    heartbeatInterval: 30000,
    logRetention: 7, // 天
    metricsInterval: 60000
  }
};

// ==================== 增强日志系统 ====================
class EnhancedLogger extends EventEmitter {
  constructor(module) {
    super();
    this.module = module;
    this.logDir = CONFIG.logDir;
    this.ensureLogDir();
    
    // 日志级别
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WORK: 2,
      WARN: 3,
      ERROR: 4,
      FATAL: 5
    };
    
    this.currentLevel = this.levels.WORK;
  }

  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  getLogFile() {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${this.module}-${date}.log`);
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const entry = {
      timestamp,
      level,
      module: this.module,
      message,
      meta,
      pid: process.pid,
      memory: process.memoryUsage()
    };
    return entry;
  }

  log(level, message, meta = {}) {
    if (this.levels[level] < this.currentLevel) return;

    const entry = this.formatMessage(level, message, meta);
    const logLine = JSON.stringify(entry) + '\n';
    
    // 写入文件
    fs.appendFileSync(this.getLogFile(), logLine);
    
    // 控制台输出（带颜色）
    const colors = {
      DEBUG: '\x1b[90m',  // 灰色
      INFO: '\x1b[36m',   // 青色
      WORK: '\x1b[32m',   // 绿色
      WARN: '\x1b[33m',   // 黄色
      ERROR: '\x1b[31m',  // 红色
      FATAL: '\x1b[35m',  // 紫色
      RESET: '\x1b[0m'
    };
    
    const icon = {
      DEBUG: '🔍',
      INFO: 'ℹ️',
      WORK: '⚙️',
      WARN: '⚠️',
      ERROR: '❌',
      FATAL: '💀'
    };
    
    console.log(
      `${colors[level] || ''}${icon[level]} [${entry.timestamp}] [${level}] [${this.module}] ${message}${colors.RESET}`
    );
    
    // 触发事件
    this.emit('log', entry);
  }

  debug(msg, meta) { this.log('DEBUG', msg, meta); }
  info(msg, meta) { this.log('INFO', msg, meta); }
  work(msg, meta) { this.log('WORK', msg, meta); }
  warn(msg, meta) { this.log('WARN', msg, meta); }
  error(msg, meta) { this.log('ERROR', msg, meta); }
  fatal(msg, meta) { this.log('FATAL', msg, meta); }

  // 创建子日志器
  child(subModule) {
    const childLogger = new EnhancedLogger(`${this.module}:${subModule}`);
    childLogger.currentLevel = this.currentLevel;
    return childLogger;
  }
}

// ==================== 全局日志实例 ====================
const systemLogger = new EnhancedLogger('CoreSystem');

// 先定义空类，后面再实现
let TaskQueue, AgentExecutor, SystemMonitor, CoreAgentSystem;

// ==================== Agent定义 ====================
const CORE_AGENTS = {
  'agent-generator': {
    name: 'agent-generator',
    title: 'Agent生成器',
    skillPath: path.join(__dirname, 'agent-generator', 'SKILL.md'),
    capabilities: ['生成Agent', '创建5文档范式', '批量生成', '模板渲染'],
    priority: 'high',
    maxConcurrent: 2,
    timeout: 60000
  },
  'autopilot-agent': {
    name: 'autopilot-agent',
    title: '自动驾驶Agent',
    skillPath: path.join(__dirname, 'autopilot-agent', 'SKILL.md'),
    capabilities: ['自动执行任务', '监控执行', '异常处理', '工作流编排'],
    priority: 'critical',
    maxConcurrent: 1,
    timeout: 0 // 无超时
  },
  'batch-agent-creator': {
    name: 'batch-agent-creator',
    title: '批量Agent创建器',
    skillPath: path.join(__dirname, 'batch-agent-creator', 'SKILL.md'),
    capabilities: ['批量生成Agent', '配置解析', '模板渲染', '并行处理'],
    priority: 'high',
    maxConcurrent: 1,
    timeout: 120000
  },
  'debug-agent': {
    name: 'debug-agent',
    title: '调试Agent',
    skillPath: path.join(__dirname, 'debug-agent', 'SKILL.md'),
    capabilities: ['错误诊断', '问题定位', '修复建议', '代码分析'],
    priority: 'high',
    maxConcurrent: 3,
    timeout: 30000
  },
  'meta-agent': {
    name: 'meta-agent',
    title: '元Agent',
    skillPath: path.join(__dirname, 'meta-agent', 'SKILL.md'),
    capabilities: ['Agent管理', '协调调度', '监控状态', '系统优化'],
    priority: 'critical',
    maxConcurrent: 1,
    timeout: 0
  },
  'plan-agent': {
    name: 'plan-agent',
    title: '规划Agent',
    skillPath: path.join(__dirname, 'plan-agent', 'SKILL.md'),
    capabilities: ['任务规划', '进度管理', '资源分配', '风险评估'],
    priority: 'high',
    maxConcurrent: 2,
    timeout: 60000
  },
  'spec-agent': {
    name: 'spec-agent',
    title: '规格Agent',
    skillPath: path.join(__dirname, 'spec-agent', 'SKILL.md'),
    capabilities: ['需求分析', '规格定义', '文档生成', '接口设计'],
    priority: 'high',
    maxConcurrent: 2,
    timeout: 60000
  }
};

// ==================== 任务队列管理器 ====================
TaskQueue = class extends EventEmitter {
  constructor() {
    super();
    this.queue = { pending: [], running: [], completed: [], failed: [] };
    this.load();
    this.logger = systemLogger.child('TaskQueue');
  }

  load() {
    try {
      if (fs.existsSync(CONFIG.taskQueueFile)) {
        const data = JSON.parse(fs.readFileSync(CONFIG.taskQueueFile, 'utf8'));
        this.queue = { ...this.queue, ...data };
        if (this.logger) {
          this.logger.info('任务队列已加载', { 
            pending: this.queue.pending.length,
            running: this.queue.running.length,
            completed: this.queue.completed.length,
            failed: this.queue.failed.length
          });
        }
      }
    } catch (e) {
      if (this.logger) {
        this.logger.error('加载任务队列失败', { error: e.message });
      }
    }
  }

  save() {
    try {
      fs.writeFileSync(CONFIG.taskQueueFile, JSON.stringify(this.queue, null, 2));
    } catch (e) {
      if (this.logger) {
        this.logger.error('保存任务队列失败', { error: e.message });
      }
    }
  }

  add(task) {
    const enrichedTask = {
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date().toISOString(),
      retries: 0,
      priority: task.priority || 'medium',
      ...task
    };
    
    this.queue.pending.push(enrichedTask);
    this.save();
    
    this.logger.info('新任务加入队列', { 
      taskId: enrichedTask.id, 
      type: enrichedTask.type,
      agent: enrichedTask.agent,
      priority: enrichedTask.priority
    });
    
    this.emit('taskAdded', enrichedTask);
    return enrichedTask.id;
  }

  addBatch(tasks) {
    return tasks.map(t => this.add(t));
  }

  getNext(agentFilter = null) {
    // 按优先级排序
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    
    this.queue.pending.sort((a, b) => {
      return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
    });

    let taskIndex = 0;
    
    if (agentFilter) {
      taskIndex = this.queue.pending.findIndex(t => t.agent === agentFilter);
      if (taskIndex === -1) return null;
    }

    const task = this.queue.pending.splice(taskIndex, 1)[0];
    if (!task) return null;

    task.status = 'running';
    task.startedAt = new Date().toISOString();
    this.queue.running.push(task);
    this.save();
    
    this.emit('taskStarted', task);
    return task;
  }

  complete(taskId, result) {
    const idx = this.queue.running.findIndex(t => t.id === taskId);
    if (idx > -1) {
      const task = this.queue.running.splice(idx, 1)[0];
      task.status = 'completed';
      task.completedAt = new Date().toISOString();
      task.result = result;
      this.queue.completed.push(task);
      this.save();
      
      this.logger.work('任务完成', { taskId, duration: result.duration });
      this.emit('taskCompleted', task);
      return true;
    }
    return false;
  }

  fail(taskId, error) {
    const idx = this.queue.running.findIndex(t => t.id === taskId);
    if (idx > -1) {
      const task = this.queue.running.splice(idx, 1)[0];
      task.status = 'failed';
      task.failedAt = new Date().toISOString();
      task.error = error;
      task.retries++;
      
      // 重试逻辑
      if (task.retries < CONFIG.execution.retryAttempts) {
        task.status = 'pending';
        task.nextRetry = new Date(Date.now() + CONFIG.execution.retryDelay).toISOString();
        this.queue.pending.unshift(task);
        this.logger.warn('任务失败，准备重试', { 
          taskId, 
          retry: task.retries,
          nextRetry: task.nextRetry
        });
      } else {
        this.queue.failed.push(task);
        this.logger.error('任务最终失败', { taskId, error });
        this.emit('taskFailed', task);
      }
      
      this.save();
      return true;
    }
    return false;
  }

  getStats() {
    return {
      pending: this.queue.pending.length,
      running: this.queue.running.length,
      completed: this.queue.completed.length,
      failed: this.queue.failed.length,
      total: this.queue.pending.length + this.queue.running.length + 
             this.queue.completed.length + this.queue.failed.length
    };
  }

  getTaskById(taskId) {
    return [...this.queue.pending, ...this.queue.running, 
            ...this.queue.completed, ...this.queue.failed]
      .find(t => t.id === taskId);
  }

  generateId() {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// ==================== Agent执行引擎 ====================
AgentExecutor = class extends EventEmitter {
  constructor() {
    super();
    this.logger = systemLogger.child('AgentExecutor');
    this.runningTasks = new Map();
    this.agentLocks = new Map();
  }

  async execute(task, taskDir) {
    const agentConfig = CORE_AGENTS[task.agent];
    if (!agentConfig) {
      throw new Error(`未知的Agent: ${task.agent}`);
    }

    // 检查并发限制
    const runningCount = this.getRunningCount(task.agent);
    if (runningCount >= agentConfig.maxConcurrent) {
      throw new Error(`Agent ${task.agent} 并发限制已满 (${runningCount}/${agentConfig.maxConcurrent})`);
    }

    this.logger.work('开始执行任务', { 
      taskId: task.id, 
      agent: task.agent, 
      type: task.type 
    });

    // 创建任务工作目录
    if (!fs.existsSync(taskDir)) {
      fs.mkdirSync(taskDir, { recursive: true });
    }

    // 写入任务配置
    const taskConfigFile = path.join(taskDir, 'task-config.json');
    fs.writeFileSync(taskConfigFile, JSON.stringify(task.config || {}, null, 2));

    const startTime = Date.now();
    
    try {
      // 根据任务类型选择执行器
      const executor = this.getExecutor(task.type);
      const result = await executor(task, taskDir, agentConfig);
      
      const duration = Date.now() - startTime;
      
      this.logger.work('任务执行完成', { 
        taskId: task.id, 
        duration: `${duration}ms`,
        summary: result.summary 
      });

      return {
        success: true,
        taskId: task.id,
        duration,
        output: result,
        workDir: taskDir
      };

    } catch (error) {
      this.logger.error(`任务执行出错`, { taskId: task.id, error: error.message });
      throw error;
    }
  }

  getExecutor(type) {
    const executors = {
      'generate-agent': this.executeAgentGenerator.bind(this),
      'batch-create': this.executeBatchCreator.bind(this),
      'create-plan': this.executePlanAgent.bind(this),
      'write-spec': this.executeSpecAgent.bind(this),
      'debug-code': this.executeDebugAgent.bind(this),
      'meta-control': this.executeMetaAgent.bind(this),
      'autopilot': this.executeAutopilot.bind(this)
    };
    
    return executors[type] || this.executeGeneric.bind(this);
  }

  getRunningCount(agentName) {
    let count = 0;
    for (const [taskId, taskInfo] of this.runningTasks) {
      if (taskInfo.agent === agentName) count++;
    }
    return count;
  }

  // ==================== 具体执行器 ====================
  
  async executeAgentGenerator(task, workDir, agentConfig) {
    this.logger.info('执行Agent Generator', { taskId: task.id });
    
    const agentName = task.config.name || `agent-${Date.now()}`;
    const agentDir = path.join(workDir, agentName);
    fs.mkdirSync(agentDir, { recursive: true });
    
    // 读取SKILL.md模板
    const skillTemplate = fs.readFileSync(agentConfig.skillPath, 'utf8');
    
    // 生成5文档
    const docs = this.generateAgentDocs(agentName, task.config, skillTemplate);
    
    for (const [filename, content] of Object.entries(docs)) {
      fs.writeFileSync(path.join(agentDir, filename), content);
    }
    
    this.logger.work(`Agent生成完成: ${agentName}`);
    
    return {
      summary: `Generated agent: ${agentName}`,
      agentName,
      location: agentDir,
      files: Object.keys(docs)
    };
  }

  async executeBatchCreator(task, workDir, agentConfig) {
    this.logger.info('执行Batch Creator', { taskId: task.id });
    
    const count = task.config.count || 1;
    const prefix = task.config.prefix || 'batch-agent';
    const results = [];
    
    // 并行生成
    const batchSize = 5;
    for (let i = 0; i < count; i += batchSize) {
      const batch = [];
      for (let j = i; j < Math.min(i + batchSize, count); j++) {
        const agentName = `${prefix}-${j + 1}`;
        batch.push(this.createSingleAgent(agentName, workDir));
      }
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      this.logger.work(`批量生成进度: ${Math.min(i + batchSize, count)}/${count}`);
    }
    
    // 生成批量配置
    const batchConfig = {
      batch_name: task.config.batch_name || `Batch-${prefix}`,
      created_at: new Date().toISOString(),
      count,
      prefix,
      agents: results.map(r => r.agentName)
    };
    
    fs.writeFileSync(
      path.join(workDir, 'batch-config.json'),
      JSON.stringify(batchConfig, null, 2)
    );
    
    return {
      summary: `Batch created ${count} agents`,
      count,
      prefix,
      location: workDir,
      agents: results.map(r => r.agentName)
    };
  }

  async createSingleAgent(agentName, workDir) {
    const agentDir = path.join(workDir, agentName);
    fs.mkdirSync(agentDir, { recursive: true });
    
    const config = {
      name: agentName,
      title: agentName,
      description: `Auto generated ${agentName}`,
      core_concept: 'Auto generated agent',
      features: ['Feature 1', 'Feature 2', 'Feature 3']
    };
    
    const docs = this.generateAgentDocs(agentName, config, '');
    
    for (const [filename, content] of Object.entries(docs)) {
      fs.writeFileSync(path.join(agentDir, filename), content);
    }
    
    return { agentName, location: agentDir };
  }

  async executePlanAgent(task, workDir, agentConfig) {
    this.logger.info('执行Plan Agent', { taskId: task.id });
    
    const plan = {
      project: task.config.project || 'Untitled Project',
      phases: task.config.phases || ['Phase 1', 'Phase 2', 'Phase 3'],
      milestones: task.config.milestones || [],
      created: new Date().toISOString(),
      planMethod: 'AI-driven planning'
    };
    
    // 生成JSON计划
    fs.writeFileSync(
      path.join(workDir, 'plan.json'),
      JSON.stringify(plan, null, 2)
    );
    
    // 生成Markdown计划文档
    const planMd = this.generatePlanMarkdown(plan);
    fs.writeFileSync(path.join(workDir, 'plan.md'), planMd);
    
    return {
      summary: `Created plan for: ${plan.project}`,
      project: plan.project,
      phases: plan.phases.length,
      planFile: path.join(workDir, 'plan.md')
    };
  }

  async executeSpecAgent(task, workDir, agentConfig) {
    this.logger.info('执行Spec Agent', { taskId: task.id });
    
    const spec = {
      title: task.config.title || 'Specification Document',
      version: '1.0.0',
      requirements: task.config.requirements || ['Requirement 1', 'Requirement 2'],
      acceptanceCriteria: task.config.acceptanceCriteria || ['Criteria 1'],
      created: new Date().toISOString()
    };
    
    const specContent = this.generateSpecMarkdown(spec);
    fs.writeFileSync(path.join(workDir, 'spec.md'), specContent);
    
    return {
      summary: `Written spec: ${spec.title}`,
      title: spec.title,
      requirements: spec.requirements.length,
      specFile: path.join(workDir, 'spec.md')
    };
  }

  async executeDebugAgent(task, workDir, agentConfig) {
    this.logger.info('执行Debug Agent', { taskId: task.id });
    
    const analysis = {
      timestamp: new Date().toISOString(),
      issues: task.config.issues || [],
      suggestions: [
        'Review code structure',
        'Add error handling',
        'Optimize performance'
      ],
      files: task.config.files || []
    };
    
    fs.writeFileSync(
      path.join(workDir, 'debug-report.json'),
      JSON.stringify(analysis, null, 2)
    );
    
    return {
      summary: 'Debug analysis completed',
      issues: analysis.issues.length,
      suggestions: analysis.suggestions.length,
      reportFile: path.join(workDir, 'debug-report.json')
    };
  }

  async executeMetaAgent(task, workDir, agentConfig) {
    this.logger.info('执行Meta Agent', { taskId: task.id });
    
    // Meta Agent 执行系统级操作
    const action = task.config.action || 'status';
    
    let result = {};
    switch (action) {
      case 'status':
        result = {
          activeAgents: Object.keys(CORE_AGENTS),
          systemHealth: 'healthy',
          timestamp: new Date().toISOString()
        };
        break;
      case 'optimize':
        result = {
          action: 'optimize',
          optimizations: ['Resource allocation', 'Task scheduling'],
          timestamp: new Date().toISOString()
        };
        break;
      default:
        result = { action, status: 'completed' };
    }
    
    fs.writeFileSync(
      path.join(workDir, 'meta-result.json'),
      JSON.stringify(result, null, 2)
    );
    
    return {
      summary: `Meta action completed: ${action}`,
      action,
      result
    };
  }

  async executeAutopilot(task, workDir, agentConfig) {
    this.logger.info('执行Autopilot', { taskId: task.id });
    
    // Autopilot 执行复杂工作流
    const workflow = task.config.workflow || [];
    const results = [];
    
    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];
      this.logger.work(`执行工作流步骤 ${i + 1}/${workflow.length}`, { step: step.name });
      
      // 模拟步骤执行
      await this.delay(100);
      results.push({ step: step.name, status: 'completed' });
    }
    
    const result = {
      workflow: task.config.workflowName || 'default',
      steps: results,
      completedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(
      path.join(workDir, 'autopilot-result.json'),
      JSON.stringify(result, null, 2)
    );
    
    return {
      summary: `Autopilot workflow completed: ${results.length} steps`,
      steps: results.length,
      results
    };
  }

  async executeGeneric(task, workDir, agentConfig) {
    this.logger.info('执行通用任务', { taskId: task.id, type: task.type });
    
    return {
      summary: `Generic task executed: ${task.type}`,
      taskType: task.type,
      workDir
    };
  }

  // ==================== 文档生成器 ====================
  
  generateAgentDocs(agentName, config, template) {
    const date = new Date().toISOString().split('T')[0];
    const features = config.features || ['Feature 1', 'Feature 2', 'Feature 3'];
    
    return {
      'SKILL.md': `---
name: "${agentName}"
description: "${config.title || agentName} - ${config.description || 'Auto generated'}"
---

# ${config.title || agentName}

## 核心理念

**${config.core_concept || 'Auto generated agent'}**

## 核心工作流程

\`\`\`
输入 → 分析 → 处理 → 优化 → 输出
\`\`\`

## 详细功能说明

${features.map(f => `### ${f}
- 功能详细说明
- 使用方法
`).join('\n')}

## 调用触发条件

- 需要${config.description || '相关功能'}

## 输出保证

- [ ] 专业水准的输出
- [ ] 符合行业标准
`,
      'requirement.md': `# 需求规格文档 - ${config.title || agentName}

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | ${date} |

## 功能需求

${features.map((f, i) => `- REQ-${String(i+1).padStart(3, '0')}: ${f}`).join('\n')}

## 验收标准

1. 能够正确执行所有功能
`,
      'design.md': `# 架构设计文档 - ${config.title || agentName}

## 系统架构

\`\`\`
输入 → 处理 → 输出
\`\`\`

## 功能模块

${features.map((f, i) => `### 模块${i + 1}: ${f}`).join('\n')}
`,
      'tasks.md': `# 任务分解文档 - ${config.title || agentName}

## 任务列表

${features.map((f, i) => `- [ ] ${f}`).join('\n')}
`,
      'checklist.md': `# 质量检查清单 - ${config.title || agentName}

## 检查项

- [ ] SKILL.md 已创建
- [ ] requirement.md 已创建
- [ ] design.md 已创建
- [ ] tasks.md 已创建
- [ ] checklist.md 已创建
`
    };
  }

  generatePlanMarkdown(plan) {
    return `# Project Plan: ${plan.project}

## Phases
${plan.phases.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Milestones
${plan.milestones.map(m => `- ${m}`).join('\n') || '- TBD'}

## Generated
${plan.created}

---
Powered by Plan Agent
`;
  }

  generateSpecMarkdown(spec) {
    return `# ${spec.title}

## Version
${spec.version}

## Requirements
${spec.requirements.map(r => `- ${r}`).join('\n')}

## Acceptance Criteria
${spec.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## Generated
${spec.created}

---
Powered by Spec Agent
`;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 监控系统 ====================
SystemMonitor = class extends EventEmitter {
  constructor() {
    super();
    this.logger = systemLogger.child('Monitor');
    this.metrics = {
      tasksExecuted: 0,
      tasksFailed: 0,
      avgExecutionTime: 0,
      agentUsage: {}
    };
    this.heartbeatInterval = null;
    this.metricsInterval = null;
  }

  start() {
    this.logger.info('监控系统启动');
    
    // 心跳检测
    this.heartbeatInterval = setInterval(() => {
      this.heartbeat();
    }, CONFIG.monitoring.heartbeatInterval);
    
    // 指标收集
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, CONFIG.monitoring.metricsInterval);
  }

  stop() {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    this.logger.info('监控系统停止');
  }

  heartbeat() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.emit('heartbeat', {
      timestamp: new Date().toISOString(),
      memory: memUsage,
      cpu: cpuUsage,
      uptime: process.uptime()
    });
  }

  collectMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        uptime: process.uptime()
      },
      tasks: this.metrics
    };
    
    fs.writeFileSync(CONFIG.metricsFile, JSON.stringify(metrics, null, 2));
    this.emit('metrics', metrics);
  }

  recordTaskExecution(agent, duration, success) {
    this.metrics.tasksExecuted++;
    if (!success) this.metrics.tasksFailed++;
    
    // 更新平均执行时间
    const totalTime = this.metrics.avgExecutionTime * (this.metrics.tasksExecuted - 1) + duration;
    this.metrics.avgExecutionTime = totalTime / this.metrics.tasksExecuted;
    
    // 记录Agent使用情况
    if (!this.metrics.agentUsage[agent]) {
      this.metrics.agentUsage[agent] = { count: 0, totalTime: 0 };
    }
    this.metrics.agentUsage[agent].count++;
    this.metrics.agentUsage[agent].totalTime += duration;
  }
}

// ==================== 核心系统主类 ====================
CoreAgentSystem = class extends EventEmitter {
  constructor() {
    super();
    this.logger = systemLogger;
    this.taskQueue = new TaskQueue();
    this.executor = new AgentExecutor();
    this.monitor = new SystemMonitor();
    this.isRunning = false;
    this.workers = new Map();
    this.currentTasks = new Map();
  }

  async start() {
    this.logger.info('核心Agent系统启动');
    this.isRunning = true;
    
    // 启动监控
    this.monitor.start();
    
    // 绑定事件
    this.setupEventHandlers();
    
    // 启动工作循环
    this.startWorkLoop();
    
    // 显示系统状态
    this.showSystemStatus();
  }

  stop() {
    this.logger.info('核心Agent系统停止');
    this.isRunning = false;
    this.monitor.stop();
  }

  setupEventHandlers() {
    // 任务队列事件
    this.taskQueue.on('taskAdded', (task) => {
      this.emit('taskAdded', task);
    });
    
    this.taskQueue.on('taskCompleted', (task) => {
      this.monitor.recordTaskExecution(task.agent, task.result?.duration || 0, true);
      this.emit('taskCompleted', task);
    });
    
    this.taskQueue.on('taskFailed', (task) => {
      this.monitor.recordTaskExecution(task.agent, 0, false);
      this.emit('taskFailed', task);
    });
    
    // 监控事件
    this.monitor.on('heartbeat', (data) => {
      this.emit('heartbeat', data);
    });
  }

  async startWorkLoop() {
    while (this.isRunning) {
      await this.workCycle();
      await this.sleep(CONFIG.execution.checkInterval);
    }
  }

  async workCycle() {
    // 检查是否有可用Worker槽位
    if (this.currentTasks.size >= CONFIG.execution.maxConcurrent) {
      return;
    }

    // 获取下一个任务
    const task = this.taskQueue.getNext();
    if (!task) return;

    // 创建工作目录
    const taskDir = path.join(CONFIG.workDir, task.id);
    
    // 启动任务执行
    this.executeTask(task, taskDir);
  }

  async executeTask(task, taskDir) {
    this.currentTasks.set(task.id, task);
    
    try {
      const result = await this.executor.execute(task, taskDir);
      this.taskQueue.complete(task.id, result);
    } catch (error) {
      this.taskQueue.fail(task.id, error.message);
    } finally {
      this.currentTasks.delete(task.id);
    }
  }

  // ==================== 公共API ====================
  
  addTask(type, agent, config = {}, priority = 'medium') {
    return this.taskQueue.add({ type, agent, config, priority });
  }

  addTasks(tasks) {
    return this.taskQueue.addBatch(tasks);
  }

  getTaskStatus(taskId) {
    return this.taskQueue.getTaskById(taskId);
  }

  getSystemStats() {
    return {
      ...this.taskQueue.getStats(),
      running: this.currentTasks.size,
      maxConcurrent: CONFIG.execution.maxConcurrent,
      agents: Object.keys(CORE_AGENTS),
      uptime: process.uptime()
    };
  }

  showSystemStatus() {
    const stats = this.getSystemStats();
    
    console.log('\n' + '='.repeat(60));
    console.log('🤖 核心Agent系统状态');
    console.log('='.repeat(60));
    console.log(`队列状态: ⏳${stats.pending} | 🏃${stats.running} | ✅${stats.completed} | ❌${stats.failed}`);
    console.log(`并发限制: ${stats.running}/${stats.maxConcurrent}`);
    console.log(`可用Agent: ${stats.agents.join(', ')}`);
    console.log(`运行时间: ${Math.floor(stats.uptime)}s`);
    console.log('='.repeat(60) + '\n');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 工作流定义 ====================
const WORKFLOWS = {
  'new-project': [
    { type: 'create-plan', agent: 'plan-agent', config: { project: 'New Project' } },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Project Specification' } },
    { type: 'generate-agent', agent: 'agent-generator', config: { name: 'project-agent' } }
  ],

  'batch-agents': (count, prefix = 'batch-agent') => {
    return Array.from({ length: count }, (_, i) => ({
      type: 'generate-agent',
      agent: 'agent-generator',
      config: { name: `${prefix}-${i + 1}` }
    }));
  },

  'debug-session': [
    { type: 'debug-code', agent: 'debug-agent', config: {} },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Fix Specification' } }
  ],

  'full-development': [
    { type: 'create-plan', agent: 'plan-agent', config: { project: 'Development Project' } },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Technical Specification' } },
    { type: 'generate-agent', agent: 'agent-generator', config: { name: 'dev-helper' } },
    { type: 'debug-code', agent: 'debug-agent', config: {} }
  ]
};

// ==================== 命令行接口 ====================
async function main() {
  const system = new CoreAgentSystem();
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      // 预加载示例任务
      system.logger.info('预加载示例任务');
      
      system.addTask('batch-create', 'batch-agent-creator', {
        count: 3,
        prefix: 'test-agent',
        batch_name: 'Test Batch'
      }, 'high');
      
      system.addTask('create-plan', 'plan-agent', {
        project: 'AI Assistant Platform',
        phases: ['需求分析', '架构设计', '开发实现', '测试部署']
      }, 'high');
      
      system.addTask('write-spec', 'spec-agent', {
        title: 'Agent System Specification',
        requirements: ['自动任务执行', '队列管理', '错误恢复']
      }, 'medium');
      
      await system.start();
      break;

    case 'workflow':
      const workflowName = args[1] || 'new-project';
      const workflow = WORKFLOWS[workflowName];
      
      if (typeof workflow === 'function') {
        const count = parseInt(args[2]) || 5;
        const prefix = args[3] || 'auto-agent';
        system.addTasks(workflow(count, prefix));
      } else if (Array.isArray(workflow)) {
        system.addTasks(workflow);
      } else {
        console.log(`未知的工作流: ${workflowName}`);
        process.exit(1);
      }
      
      console.log(`✅ 已加载工作流: ${workflowName}`);
      await system.start();
      break;

    case 'add':
      const type = args[1] || 'generate-agent';
      const agent = args[2] || 'agent-generator';
      const taskId = system.addTask(type, agent, {}, 'medium');
      console.log(`✅ 已添加任务: ${taskId}`);
      break;

    case 'status':
      system.showSystemStatus();
      break;

    case 'monitor':
      system.start();
      
      // 实时显示状态
      setInterval(() => {
        system.showSystemStatus();
      }, 10000);
      break;

    default:
      console.log('🤖 核心Agent系统 - 深度JS绑定与自主执行引擎\n');
      console.log('使用方法:');
      console.log('  node core-agent-system.js start              - 启动系统并执行示例任务');
      console.log('  node core-agent-system.js workflow <name>    - 执行工作流');
      console.log('  node core-agent-system.js add <type> <agent> - 添加单个任务');
      console.log('  node core-agent-system.js status             - 查看系统状态');
      console.log('  node core-agent-system.js monitor            - 启动监控模式');
      console.log('\n可用工作流:');
      console.log('  - new-project      - 创建新项目');
      console.log('  - batch-agents <n> - 批量生成Agent');
      console.log('  - debug-session    - 调试会话');
      console.log('  - full-development - 完整开发流程');
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  systemLogger.info('收到中断信号，正在优雅停止...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  systemLogger.info('收到终止信号，正在优雅停止...');
  process.exit(0);
});

// 运行
main().catch(err => {
  systemLogger.error('系统错误', { error: err.message });
  process.exit(1);
});

// 导出模块
module.exports = {
  CoreAgentSystem,
  TaskQueue,
  AgentExecutor,
  EnhancedLogger,
  SystemMonitor,
  CORE_AGENTS,
  WORKFLOWS,
  CONFIG
};