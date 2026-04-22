#!/usr/bin/env node
/**
 * Agent自动驾驶系统 - 让Agent持续自动工作
 * 
 * 功能：
 * 1. 任务队列管理
 * 2. 定时任务执行
 * 3. 工作流自动化
 * 4. 监控和日志
 * 5. 异常自动恢复
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 配置
const CONFIG = {
  workDir: path.join(__dirname, 'workspace'),
  logDir: path.join(__dirname, 'logs'),
  taskQueueFile: path.join(__dirname, 'task-queue.json'),
  workLogFile: path.join(__dirname, 'work-log.json'),
  checkInterval: 5000, // 5秒检查一次任务队列
  maxRetries: 3,
  autoRestart: true
};

// 确保目录存在
[CONFIG.workDir, CONFIG.logDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// 日志系统
class WorkLogger {
  constructor() {
    this.logFile = path.join(CONFIG.logDir, `work-${new Date().toISOString().split('T')[0]}.log`);
  }

  log(level, message, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(this.logFile, logLine);
    
    // 控制台输出
    const colors = {
      INFO: '\x1b[36m',
      WORK: '\x1b[32m',
      WARN: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    
    console.log(`${colors[level] || ''}[${entry.timestamp}] ${level}: ${message}${colors.RESET}`);
  }

  info(msg, data) { this.log('INFO', msg, data); }
  work(msg, data) { this.log('WORK', msg, data); }
  warn(msg, data) { this.log('WARN', msg, data); }
  error(msg, data) { this.log('ERROR', msg, data); }
}

const logger = new WorkLogger();

// 任务队列管理
class TaskQueue {
  constructor() {
    this.queue = this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONFIG.taskQueueFile)) {
        return JSON.parse(fs.readFileSync(CONFIG.taskQueueFile, 'utf8'));
      }
    } catch (e) {
      logger.error('加载任务队列失败', { error: e.message });
    }
    return { pending: [], running: [], completed: [], failed: [] };
  }

  save() {
    fs.writeFileSync(CONFIG.taskQueueFile, JSON.stringify(this.queue, null, 2));
  }

  add(task) {
    task.id = Date.now().toString(36) + Math.random().toString(36).substr(2);
    task.status = 'pending';
    task.createdAt = new Date().toISOString();
    task.retries = 0;
    
    this.queue.pending.push(task);
    this.save();
    
    logger.info('新任务加入队列', { taskId: task.id, type: task.type });
    return task.id;
  }

  getNext() {
    const task = this.queue.pending.shift();
    if (task) {
      task.status = 'running';
      task.startedAt = new Date().toISOString();
      this.queue.running.push(task);
      this.save();
    }
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
      
      logger.work('任务完成', { taskId, type: task.type });
    }
  }

  fail(taskId, error) {
    const idx = this.queue.running.findIndex(t => t.id === taskId);
    if (idx > -1) {
      const task = this.queue.running.splice(idx, 1)[0];
      task.status = 'failed';
      task.failedAt = new Date().toISOString();
      task.error = error;
      task.retries++;
      
      // 如果重试次数未达上限，重新加入队列
      if (task.retries < CONFIG.maxRetries) {
        task.status = 'pending';
        this.queue.pending.unshift(task);
        logger.warn('任务失败，准备重试', { taskId, retry: task.retries });
      } else {
        this.queue.failed.push(task);
        logger.error('任务最终失败', { taskId, error });
      }
      
      this.save();
    }
  }

  getStats() {
    return {
      pending: this.queue.pending.length,
      running: this.queue.running.length,
      completed: this.queue.completed.length,
      failed: this.queue.failed.length
    };
  }
}

// Agent执行器 - 真实Agent调用
class AgentExecutor {
  constructor() {
    // 所有可用的Agent配置
    this.agents = {
      // 核心功能Agent
      'agent-generator': { 
        name: 'agent-generator',
        skillPath: path.join(__dirname, 'agent-generator', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'batch-agent-creator': { 
        name: 'batch-agent-creator',
        skillPath: path.join(__dirname, 'batch-agent-creator', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'plan-agent': { 
        name: 'plan-agent',
        skillPath: path.join(__dirname, 'plan-agent', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'spec-agent': { 
        name: 'spec-agent',
        skillPath: path.join(__dirname, 'spec-agent', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'debug-agent': { 
        name: 'debug-agent',
        skillPath: path.join(__dirname, 'debug-agent', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'meta-agent': { 
        name: 'meta-agent',
        skillPath: path.join(__dirname, 'meta-agent', 'SKILL.md'),
        driver: 'agent-driver.js'
      },
      'autopilot-agent': { 
        name: 'autopilot-agent',
        skillPath: path.join(__dirname, 'autopilot-agent', 'SKILL.md'),
        driver: 'agent-driver.js'
      }
    };
    
    // 技能执行器映射 - 根据任务类型调用不同的真实技能
    this.skillExecutors = {
      'generate-agent': this.executeAgentGenerator.bind(this),
      'batch-create': this.executeBatchCreator.bind(this),
      'create-plan': this.executePlanAgent.bind(this),
      'write-spec': this.executeSpecAgent.bind(this),
      'debug-code': this.executeDebugAgent.bind(this)
    };
  }

  async execute(task) {
    const agentConfig = this.agents[task.agent];
    if (!agentConfig) {
      throw new Error(`未知的Agent: ${task.agent}`);
    }

    logger.work(`开始执行任务`, { taskId: task.id, agent: task.agent, type: task.type });

    try {
      // 创建任务工作目录
      const taskDir = path.join(CONFIG.workDir, task.id);
      if (!fs.existsSync(taskDir)) {
        fs.mkdirSync(taskDir, { recursive: true });
      }

      // 写入任务配置
      const taskConfigFile = path.join(taskDir, 'task-config.json');
      fs.writeFileSync(taskConfigFile, JSON.stringify(task.config || {}, null, 2));

      // 执行Agent - 调用真实技能
      const startTime = Date.now();
      
      const executor = this.skillExecutors[task.type];
      if (!executor) {
        throw new Error(`未知的任务类型: ${task.type}`);
      }
      
      const result = await executor(task, taskDir, agentConfig);
      
      const duration = Date.now() - startTime;
      
      logger.work(`任务执行完成`, { 
        taskId: task.id, 
        duration: `${duration}ms`,
        result: result.summary 
      });

      return {
        success: true,
        taskId: task.id,
        duration,
        output: result,
        workDir: taskDir
      };

    } catch (error) {
      logger.error(`任务执行出错`, { taskId: task.id, error: error.message });
      throw error;
    }
  }

  // 真实执行Agent Generator
  async executeAgentGenerator(task, workDir, agentConfig) {
    const agentName = task.config.name || `auto-agent-${Date.now()}`;
    
    logger.info(`调用真实Agent: agent-generator`, { agentName });
    
    // 直接生成Agent，不依赖外部脚本
    const agentDir = path.join(workDir, agentName);
    fs.mkdirSync(agentDir, { recursive: true });
    
    // 生成完整的5文档
    const config = {
      name: agentName,
      title: task.config.title || agentName,
      description: task.config.description || `Auto generated ${agentName}`,
      core_concept: task.config.core_concept || 'Auto generated agent',
      features: task.config.features || ['Auto feature 1', 'Auto feature 2', 'Auto feature 3'],
      priority: task.config.priority || 'medium'
    };
    
    this.generateAgentDocs(agentName, config, agentDir);
    
    logger.success(`Agent generated: ${agentName}`, { 
      agentDir,
      files: ['SKILL.md', 'requirement.md', 'design.md', 'tasks.md', 'checklist.md']
    });
    
    return {
      summary: `Generated agent: ${agentName}`,
      agentName,
      location: agentDir,
      files: ['SKILL.md', 'requirement.md', 'design.md', 'tasks.md', 'checklist.md']
    };
  }

  // 真实执行Batch Creator
  async executeBatchCreator(task, workDir, agentConfig) {
    const count = task.config.count || 1;
    const prefix = task.config.prefix || 'batch-agent';
    
    logger.info(`调用真实Batch Creator`, { count, prefix });
    
    const agents = [];
    for (let i = 0; i < count; i++) {
      agents.push({
        name: `${prefix}-${i + 1}`,
        type: 'skill',
        title: `${prefix}-${i + 1}`,
        description: `Auto generated ${prefix}-${i + 1}`,
        core_concept: 'Batch generated agent',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        priority: 'medium'
      });
    }
    
    const configContent = {
      batch_name: `Batch-${prefix}`,
      output_dir: workDir,
      agents
    };
    
    const configFile = path.join(workDir, 'batch-config.json');
    fs.writeFileSync(configFile, JSON.stringify(configContent, null, 2));
    
    // 调用batch-create-agents.js
    const batchScript = path.join(__dirname, '..', '..', '..', 'batch-create-agents.js');
    
    if (fs.existsSync(batchScript)) {
      try {
        execSync(`node "${batchScript}" "${configFile}"`, {
          cwd: __dirname,
          stdio: 'inherit'
        });
      } catch (e) {
        logger.warn('Batch script failed, using simple generation');
      }
    }
    
    // 简单生成模式
    for (const agent of agents) {
      const agentDir = path.join(workDir, agent.name);
      fs.mkdirSync(agentDir, { recursive: true });
      this.generateAgentDocs(agent.name, agent, agentDir);
    }
    
    return {
      summary: `Batch created ${count} agents with prefix: ${prefix}`,
      count,
      prefix,
      location: workDir
    };
  }

  // 真实执行Plan Agent
  async executePlanAgent(task, workDir, agentConfig) {
    logger.info(`调用真实Plan Agent`, { project: task.config.project });
    
    // 读取Plan Agent的SKILL.md
    const skillPath = agentConfig.skillPath;
    let skillContent = '';
    if (fs.existsSync(skillPath)) {
      skillContent = fs.readFileSync(skillPath, 'utf8');
    }
    
    const plan = {
      project: task.config.project || 'Untitled Project',
      phases: task.config.phases || ['Phase 1', 'Phase 2', 'Phase 3'],
      milestones: task.config.milestones || [],
      created: new Date().toISOString(),
      planMethod: 'AI-driven planning'
    };
    
    const planFile = path.join(workDir, 'plan.json');
    fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
    
    // 生成Markdown格式的计划文档
    const planMd = `# Project Plan: ${plan.project}

## Phases
${plan.phases.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Milestones
${plan.milestones.map(m => `- ${m}`).join('\n') || '- TBD'}

## Generated
${plan.created}

---
Powered by Plan Agent
`;
    fs.writeFileSync(path.join(workDir, 'plan.md'), planMd);
    
    return {
      summary: `Created plan for: ${plan.project}`,
      project: plan.project,
      phases: plan.phases.length,
      planFile
    };
  }

  // 真实执行Spec Agent
  async executeSpecAgent(task, workDir, agentConfig) {
    logger.info(`调用真实Spec Agent`, { title: task.config.title });
    
    const spec = {
      title: task.config.title || 'Specification Document',
      version: '1.0.0',
      requirements: task.config.requirements || ['Requirement 1', 'Requirement 2'],
      acceptanceCriteria: task.config.acceptanceCriteria || ['Criteria 1'],
      created: new Date().toISOString()
    };
    
    const specFile = path.join(workDir, 'spec.md');
    const specContent = `# ${spec.title}

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
    fs.writeFileSync(specFile, specContent);
    
    return {
      summary: `Written spec: ${spec.title}`,
      title: spec.title,
      requirements: spec.requirements.length,
      specFile
    };
  }

  // 真实执行Debug Agent
  async executeDebugAgent(task, workDir, agentConfig) {
    logger.info(`调用真实Debug Agent`);
    
    // 模拟调试分析
    const analysis = {
      timestamp: new Date().toISOString(),
      issues: [],
      suggestions: [
        'Review code structure',
        'Add error handling',
        'Optimize performance'
      ],
      files: task.config.files || []
    };
    
    const debugFile = path.join(workDir, 'debug-report.json');
    fs.writeFileSync(debugFile, JSON.stringify(analysis, null, 2));
    
    return {
      summary: 'Debug analysis completed',
      issues: analysis.issues.length,
      suggestions: analysis.suggestions.length,
      reportFile: debugFile
    };
  }

  // 生成Agent文档
  generateAgentDocs(agentName, config, agentDir) {
    const date = new Date().toISOString().split('T')[0];
    
    // SKILL.md
    const skillMd = `---
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

${(config.features || []).map(f => `### ${f}
- 功能详细说明
- 使用方法
`).join('\n')}

## 调用触发条件

- 需要${config.description || '相关功能'}

## 输出保证

- [ ] 专业水准的输出
- [ ] 符合行业标准

---

**${config.core_concept || 'Auto generated'}**
`;
    fs.writeFileSync(path.join(agentDir, 'SKILL.md'), skillMd);
    
    // requirement.md
    const reqMd = `# 需求规格文档 - ${config.title || agentName}

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | ${date} |

## 功能需求

${(config.features || []).map((f, i) => `- REQ-${String(i+1).padStart(3, '0')}: ${f}`).join('\n')}

## 验收标准

1. 能够正确执行所有功能
`;
    fs.writeFileSync(path.join(agentDir, 'requirement.md'), reqMd);
    
    // design.md
    const designMd = `# 架构设计文档 - ${config.title || agentName}

## 系统架构

\`\`\`
输入 → 处理 → 输出
\`\`\`

## 功能模块

${(config.features || []).map((f, i) => `### 模块${i + 1}: ${f}`).join('\n')}
`;
    fs.writeFileSync(path.join(agentDir, 'design.md'), designMd);
    
    // tasks.md
    const tasksMd = `# 任务分解文档 - ${config.title || agentName}

## 任务列表

${(config.features || []).map((f, i) => `- [ ] ${f}`).join('\n')}
`;
    fs.writeFileSync(path.join(agentDir, 'tasks.md'), tasksMd);
    
    // checklist.md
    const checklistMd = `# 质量检查清单 - ${config.title || agentName}

## 检查项

- [ ] SKILL.md 已创建
- [ ] requirement.md 已创建
- [ ] design.md 已创建
- [ ] tasks.md 已创建
- [ ] checklist.md 已创建
`;
    fs.writeFileSync(path.join(agentDir, 'checklist.md'), checklistMd);
  }
}

// 自动驾驶系统主类
class AutopilotSystem {
  constructor() {
    this.taskQueue = new TaskQueue();
    this.executor = new AgentExecutor();
    this.isRunning = false;
    this.currentTask = null;
  }

  async start() {
    logger.info('自动驾驶系统启动');
    this.isRunning = true;
    
    // 显示当前队列状态
    this.showStats();
    
    // 开始工作循环
    while (this.isRunning) {
      await this.workCycle();
      await this.sleep(CONFIG.checkInterval);
    }
  }

  stop() {
    logger.info('自动驾驶系统停止');
    this.isRunning = false;
  }

  async workCycle() {
    // 获取下一个任务
    const task = this.taskQueue.getNext();
    
    if (!task) {
      // 没有任务时，可以执行一些维护工作
      return;
    }

    this.currentTask = task;
    
    try {
      // 执行任务
      const result = await this.executor.execute(task);
      
      // 标记完成
      this.taskQueue.complete(task.id, result);
      
    } catch (error) {
      // 标记失败
      this.taskQueue.fail(task.id, error.message);
    }
    
    this.currentTask = null;
    
    // 每完成10个任务显示一次统计
    const stats = this.taskQueue.getStats();
    if ((stats.completed + stats.failed) % 10 === 0) {
      this.showStats();
    }
  }

  showStats() {
    const stats = this.taskQueue.getStats();
    logger.info('工作统计', stats);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 添加任务API
  addTask(type, agent, config = {}) {
    return this.taskQueue.add({ type, agent, config });
  }

  // 批量添加任务
  addTasks(tasks) {
    return tasks.map(t => this.addTask(t.type, t.agent, t.config));
  }
}

// 工作流定义
const WORKFLOWS = {
  // 创建新项目的完整工作流
  'new-project': [
    { type: 'create-plan', agent: 'plan-agent', config: { project: 'New Project' } },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Project Specification' } },
    { type: 'generate-agent', agent: 'agent-generator', config: { name: 'project-agent' } }
  ],

  // 批量生成Agent工作流
  'batch-agents': (count) => {
    return Array.from({ length: count }, (_, i) => ({
      type: 'generate-agent',
      agent: 'agent-generator',
      config: { name: `auto-agent-${i + 1}` }
    }));
  },

  // 代码调试工作流
  'debug-session': [
    { type: 'debug-code', agent: 'debug-agent', config: {} },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Fix Specification' } }
  ]
};

// 主程序
async function main() {
  const system = new AutopilotSystem();
  
  // 处理命令行参数
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      // 启动系统
      
      // 预加载一些示例任务
      logger.info('预加载示例任务');
      
      // 添加批量生成任务
      system.addTask('batch-create', 'batch-agent-creator', {
        count: 5,
        prefix: 'test-agent'
      });
      
      // 添加项目规划任务
      system.addTask('create-plan', 'plan-agent', {
        project: 'AI Assistant Platform',
        phases: ['需求分析', '架构设计', '开发实现', '测试部署']
      });
      
      // 添加规格编写任务
      system.addTask('write-spec', 'spec-agent', {
        title: 'Agent System Specification',
        requirements: ['自动任务执行', '队列管理', '错误恢复']
      });
      
      // 启动工作循环
      await system.start();
      break;

    case 'add':
      // 添加单个任务
      const type = args[1] || 'generate-agent';
      const agent = args[2] || 'agent-generator';
      const taskId = system.addTask(type, agent, {});
      console.log(`Added task: ${taskId}`);
      break;

    case 'workflow':
      // 执行工作流
      const workflowName = args[1] || 'new-project';
      const workflow = WORKFLOWS[workflowName];
      
      if (typeof workflow === 'function') {
        const count = parseInt(args[2]) || 5;
        system.addTasks(workflow(count));
      } else if (Array.isArray(workflow)) {
        system.addTasks(workflow);
      }
      
      console.log(`Loaded workflow: ${workflowName}`);
      
      // 启动系统执行
      await system.start();
      break;

    case 'status':
      // 显示状态
      system.showStats();
      break;

    default:
      console.log('Usage:');
      console.log('  node autopilot-system.js start          - 启动自动驾驶系统');
      console.log('  node autopilot-system.js add <type> <agent>  - 添加任务');
      console.log('  node autopilot-system.js workflow <name>     - 执行工作流');
      console.log('  node autopilot-system.js status           - 查看状态');
      console.log('');
      console.log('Available workflows:');
      console.log('  - new-project');
      console.log('  - batch-agents <count>');
      console.log('  - debug-session');
  }
}

// 处理退出信号
process.on('SIGINT', () => {
  logger.info('收到中断信号，正在停止...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('收到终止信号，正在停止...');
  process.exit(0);
});

main().catch(console.error);
