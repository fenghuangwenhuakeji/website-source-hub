#!/usr/bin/env node
/**
 * Agent Orchestrator - 对话系统中的Agent编排器
 * 
 * 功能：
 * 1. 在对话中直接调用Agent
 * 2. 实时监控Agent执行
 * 3. 任务追踪和状态报告
 * 4. 自动错误处理和重试
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const EventEmitter = require('events');

const BASE_DIR = __dirname;
const WORKSPACE_DIR = path.join(BASE_DIR, 'workspace');
const LOGS_DIR = path.join(BASE_DIR, 'logs');

// 确保目录存在
[WORKSPACE_DIR, LOGS_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

class AgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.activeTasks = new Map();
    this.taskHistory = [];
    this.agents = this.discoverAgents();
    this.sessionId = `session-${Date.now()}`;
  }

  // 发现所有可用Agent
  discoverAgents() {
    const agents = {};
    const items = fs.readdirSync(BASE_DIR);
    
    items.forEach(item => {
      const itemPath = path.join(BASE_DIR, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const runScript = path.join(itemPath, 'run.js');
        const skillFile = path.join(itemPath, 'SKILL.md');
        
        if (fs.existsSync(runScript)) {
          let capabilities = [];
          let description = '';
          
          if (fs.existsSync(skillFile)) {
            const content = fs.readFileSync(skillFile, 'utf8');
            const descMatch = content.match(/description:\s*"([^"]+)"/);
            if (descMatch) description = descMatch[1];
            
            // 解析能力
            if (content.includes('生成Agent')) capabilities.push('生成Agent');
            if (content.includes('规划')) capabilities.push('项目规划');
            if (content.includes('规格')) capabilities.push('规格定义');
            if (content.includes('调试')) capabilities.push('调试诊断');
            if (content.includes('批量')) capabilities.push('批量处理');
            if (content.includes('元')) capabilities.push('系统管理');
            if (content.includes('自动')) capabilities.push('自动执行');
          }
          
          agents[item] = {
            name: item,
            path: itemPath,
            runScript,
            description,
            capabilities,
            status: 'ready'
          };
        }
      }
    });
    
    return agents;
  }

  // 在对话中调用Agent
  async invoke(agentName, command, args = {}, options = {}) {
    const agent = this.agents[agentName];
    if (!agent) {
      throw new Error(`Agent "${agentName}" 不存在。可用Agent: ${Object.keys(this.agents).join(', ')}`);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task = {
      id: taskId,
      agent: agentName,
      command,
      args,
      status: 'running',
      startTime: Date.now(),
      logs: [],
      options
    };

    this.activeTasks.set(taskId, task);
    this.emit('taskStarted', task);

    try {
      // 构建命令参数
      const cmdArgs = [agent.runScript, command];
      
      // 添加参数
      if (args.name) cmdArgs.push(args.name);
      if (args.config) cmdArgs.push(JSON.stringify(args.config));
      if (args.file) cmdArgs.push(args.file);
      
      // 执行Agent
      const result = await this.executeAgent(cmdArgs, task);
      
      task.status = 'completed';
      task.endTime = Date.now();
      task.duration = task.endTime - task.startTime;
      task.result = result;
      
      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);
      
      this.emit('taskCompleted', task);
      
      return {
        success: true,
        taskId,
        agent: agentName,
        command,
        duration: task.duration,
        result: this.formatResult(result),
        summary: this.generateSummary(task)
      };

    } catch (error) {
      task.status = 'failed';
      task.endTime = Date.now();
      task.error = error.message;
      
      this.taskHistory.push(task);
      this.activeTasks.delete(taskId);
      
      this.emit('taskFailed', task);
      
      // 自动重试逻辑
      if (options.retry && options.retryCount > 0) {
        console.log(`⚠️ 任务失败，${options.retryCount}秒后重试...`);
        await this.sleep(options.retryCount * 1000);
        return this.invoke(agentName, command, args, { ...options, retryCount: options.retryCount - 1 });
      }
      
      throw error;
    }
  }

  // 执行Agent命令
  executeAgent(cmdArgs, task) {
    return new Promise((resolve, reject) => {
      const output = [];
      const errors = [];
      
      const child = spawn('node', cmdArgs, {
        cwd: path.dirname(cmdArgs[0]),
        env: { ...process.env, AGENT_TASK_ID: task.id }
      });

      child.stdout.on('data', (data) => {
        const line = data.toString();
        output.push(line);
        task.logs.push({ type: 'stdout', content: line, time: Date.now() });
        this.emit('taskOutput', { taskId: task.id, type: 'stdout', content: line });
      });

      child.stderr.on('data', (data) => {
        const line = data.toString();
        errors.push(line);
        task.logs.push({ type: 'stderr', content: line, time: Date.now() });
        this.emit('taskOutput', { taskId: task.id, type: 'stderr', content: line });
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output.join(''));
        } else {
          reject(new Error(`Agent执行失败，退出码: ${code}\n${errors.join('')}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // 超时处理
      if (task.options.timeout) {
        setTimeout(() => {
          child.kill();
          reject(new Error(`Agent执行超时 (${task.options.timeout}ms)`));
        }, task.options.timeout);
      }
    });
  }

  // 格式化结果
  formatResult(output) {
    // 提取关键信息
    const lines = output.split('\n').filter(l => l.trim());
    
    // 查找成功消息
    const successMatch = output.match(/✅\s*(.+)/);
    const success = successMatch ? successMatch[1] : '执行完成';
    
    // 查找文件路径
    const fileMatches = output.match(/[\w\-]+\.(md|json|js)/g) || [];
    
    // 查找目录
    const dirMatch = output.match(/输出目录:\s*(.+)/);
    
    return {
      message: success,
      files: [...new Set(fileMatches)],
      directory: dirMatch ? dirMatch[1] : null,
      raw: output
    };
  }

  // 生成摘要
  generateSummary(task) {
    const duration = task.duration || 0;
    const durationStr = duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(2)}s`;
    
    return `Agent "${task.agent}" 执行 "${task.command}" 完成，耗时 ${durationStr}`;
  }

  // 获取任务状态
  getTaskStatus(taskId) {
    if (this.activeTasks.has(taskId)) {
      return { status: 'running', task: this.activeTasks.get(taskId) };
    }
    
    const historyTask = this.taskHistory.find(t => t.id === taskId);
    if (historyTask) {
      return { status: historyTask.status, task: historyTask };
    }
    
    return { status: 'not_found', task: null };
  }

  // 获取所有任务状态
  getAllTasks() {
    return {
      active: Array.from(this.activeTasks.values()),
      history: this.taskHistory.slice(-10), // 最近10个
      total: this.taskHistory.length
    };
  }

  // 获取Agent列表
  getAgents() {
    return Object.values(this.agents).map(agent => ({
      name: agent.name,
      description: agent.description,
      capabilities: agent.capabilities,
      status: agent.status
    }));
  }

  // 智能Agent选择
  selectAgentForTask(taskDescription) {
    const keywords = {
      'agent-generator': ['生成', '创建', 'agent', '批量', '模板'],
      'plan-agent': ['计划', '规划', 'sprint', '项目', '路线图'],
      'spec-agent': ['规格', '文档', '需求', 'api', '设计'],
      'debug-agent': ['调试', '错误', '修复', 'bug', '问题'],
      'batch-agent-creator': ['批量', '多个', '批量创建'],
      'meta-agent': ['监控', '状态', '管理', '系统'],
      'autopilot-agent': ['自动', '执行', '工作流', 'workflow']
    };

    const scores = {};
    const desc = taskDescription.toLowerCase();

    for (const [agent, words] of Object.entries(keywords)) {
      scores[agent] = words.reduce((score, word) => {
        return score + (desc.includes(word.toLowerCase()) ? 1 : 0);
      }, 0);
    }

    const bestAgent = Object.entries(scores)
      .sort((a, b) => b[1] - a[1])
      .filter(([_, score]) => score > 0)[0];

    return bestAgent ? bestAgent[0] : null;
  }

  // 执行工作流
  async executeWorkflow(workflowName, context = {}) {
    const workflows = {
      'create-agent': [
        { agent: 'spec-agent', command: 'create', args: { name: context.name + '-spec' } },
        { agent: 'agent-generator', command: 'generate', args: { name: context.name } }
      ],
      'new-project': [
        { agent: 'plan-agent', command: 'create', args: { name: context.projectName } },
        { agent: 'spec-agent', command: 'create', args: { name: context.projectName + '-spec' } }
      ],
      'debug-fix': [
        { agent: 'debug-agent', command: 'analyze', args: { name: context.error } },
        { agent: 'spec-agent', command: 'create', args: { name: 'fix-spec' } }
      ]
    };

    const steps = workflows[workflowName];
    if (!steps) {
      throw new Error(`未知的工作流: ${workflowName}`);
    }

    const results = [];
    for (const step of steps) {
      console.log(`🔄 执行工作流步骤: ${step.agent} -> ${step.command}`);
      const result = await this.invoke(step.agent, step.command, step.args);
      results.push(result);
    }

    return {
      workflow: workflowName,
      steps: results.length,
      results
    };
  }

  // 生成报告
  generateReport() {
    const tasks = this.getAllTasks();
    const completed = tasks.history.filter(t => t.status === 'completed').length;
    const failed = tasks.history.filter(t => t.status === 'failed').length;
    
    return {
      session: this.sessionId,
      summary: {
        total: tasks.total,
        completed,
        failed,
        active: tasks.active.length,
        successRate: tasks.total > 0 ? ((completed / tasks.total) * 100).toFixed(1) + '%' : 'N/A'
      },
      agents: this.getAgents(),
      recentTasks: tasks.history.slice(-5).map(t => ({
        id: t.id,
        agent: t.agent,
        command: t.command,
        status: t.status,
        duration: t.duration
      }))
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建全局实例
const orchestrator = new AgentOrchestrator();

// 导出API
module.exports = {
  AgentOrchestrator,
  orchestrator,
  
  // 便捷函数
  async call(agent, command, args) {
    return orchestrator.invoke(agent, command, args);
  },
  
  async workflow(name, context) {
    return orchestrator.executeWorkflow(name, context);
  },
  
  status() {
    return orchestrator.generateReport();
  },
  
  agents() {
    return orchestrator.getAgents();
  },
  
  suggest(task) {
    return orchestrator.selectAgentForTask(task);
  }
};

// 如果直接运行
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'agents':
      console.log('可用Agent:');
      orchestrator.getAgents().forEach(agent => {
        console.log(`  - ${agent.name}: ${agent.description}`);
      });
      break;

    case 'status':
      console.log(JSON.stringify(orchestrator.generateReport(), null, 2));
      break;

    default:
      console.log('Agent Orchestrator - 对话系统中的Agent编排器');
      console.log('\n用法:');
      console.log('  在代码中引用:');
      console.log('    const { call, workflow, status } = require("./agent-orchestrator");');
      console.log('    await call("agent-generator", "generate", { name: "my-agent" });');
      console.log('\n  CLI命令:');
      console.log('    node agent-orchestrator.js agents    # 列出Agent');
      console.log('    node agent-orchestrator.js status    # 查看状态');
  }
}
