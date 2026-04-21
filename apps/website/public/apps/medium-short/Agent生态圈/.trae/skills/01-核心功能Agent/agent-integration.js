#!/usr/bin/env node
/**
 * Agent集成模块 - 深度脚本调用与扩展系统
 * 
 * 功能:
 * 1. 动态脚本加载与执行
 * 2. Agent间通信与协作
 * 3. 外部工具集成
 * 4. 自定义脚本扩展
 * 5. 实时日志流
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const EventEmitter = require('events');
const http = require('http');
const WebSocket = require('ws');

// 尝试加载核心系统
let CoreSystem;
try {
  CoreSystem = require('./core-agent-system');
} catch (e) {
  console.warn('核心系统未加载，使用独立模式');
}

// ==================== 脚本管理器 ====================
class ScriptManager extends EventEmitter {
  constructor() {
    super();
    this.scripts = new Map();
    this.hooks = new Map();
    this.scriptDir = path.join(__dirname, 'scripts');
    this.ensureScriptDir();
  }

  ensureScriptDir() {
    if (!fs.existsSync(this.scriptDir)) {
      fs.mkdirSync(this.scriptDir, { recursive: true });
    }
  }

  // 注册脚本
  register(name, scriptPath, options = {}) {
    this.scripts.set(name, {
      path: scriptPath,
      options,
      lastRun: null,
      runCount: 0
    });
    this.emit('scriptRegistered', { name, path: scriptPath });
  }

  // 执行脚本
  async execute(name, args = [], options = {}) {
    const script = this.scripts.get(name);
    if (!script) {
      throw new Error(`脚本未找到: ${name}`);
    }

    const scriptPath = script.path;
    const isJavaScript = scriptPath.endsWith('.js');
    
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      let command;
      if (isJavaScript) {
        command = spawn('node', [scriptPath, ...args], {
          cwd: options.cwd || __dirname,
          env: { ...process.env, ...options.env }
        });
      } else {
        command = spawn(scriptPath, args, {
          cwd: options.cwd || __dirname,
          shell: true,
          env: { ...process.env, ...options.env }
        });
      }

      let stdout = '';
      let stderr = '';

      command.stdout.on('data', (data) => {
        stdout += data.toString();
        this.emit('scriptOutput', { name, type: 'stdout', data: data.toString() });
      });

      command.stderr.on('data', (data) => {
        stderr += data.toString();
        this.emit('scriptOutput', { name, type: 'stderr', data: data.toString() });
      });

      command.on('close', (code) => {
        const duration = Date.now() - startTime;
        script.lastRun = new Date().toISOString();
        script.runCount++;

        const result = {
          name,
          code,
          stdout,
          stderr,
          duration,
          success: code === 0
        };

        if (code === 0) {
          this.emit('scriptSuccess', result);
          resolve(result);
        } else {
          this.emit('scriptError', result);
          reject(new Error(`脚本执行失败: ${name}, 退出码: ${code}`));
        }
      });

      command.on('error', (error) => {
        reject(error);
      });

      // 超时处理
      if (options.timeout) {
        setTimeout(() => {
          command.kill();
          reject(new Error(`脚本执行超时: ${name}`));
        }, options.timeout);
      }
    });
  }

  // 注册钩子
  registerHook(event, callback) {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event).push(callback);
  }

  // 触发钩子
  async triggerHook(event, data) {
    const hooks = this.hooks.get(event) || [];
    for (const hook of hooks) {
      try {
        await hook(data);
      } catch (e) {
        console.error(`钩子执行失败: ${event}`, e);
      }
    }
  }

  // 获取所有脚本
  getScripts() {
    return Array.from(this.scripts.entries()).map(([name, info]) => ({
      name,
      ...info
    }));
  }
}

// ==================== Agent通信总线 ====================
class AgentBus extends EventEmitter {
  constructor() {
    super();
    this.agents = new Map();
    this.channels = new Map();
    this.messageHistory = [];
    this.maxHistory = 1000;
  }

  // 注册Agent
  registerAgent(agentId, agentInfo) {
    this.agents.set(agentId, {
      ...agentInfo,
      registeredAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    });
    this.emit('agentRegistered', { agentId, info: agentInfo });
  }

  // 创建频道
  createChannel(channelName, options = {}) {
    this.channels.set(channelName, {
      name: channelName,
      subscribers: new Set(),
      messages: [],
      options
    });
  }

  // 订阅频道
  subscribe(channelName, agentId) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.subscribers.add(agentId);
      this.emit('subscribed', { channel: channelName, agentId });
    }
  }

  // 发布消息
  publish(channelName, message, senderId) {
    const channel = this.channels.get(channelName);
    if (!channel) return;

    const enrichedMessage = {
      id: this.generateMessageId(),
      channel: channelName,
      sender: senderId,
      timestamp: new Date().toISOString(),
      data: message
    };

    channel.messages.push(enrichedMessage);
    this.messageHistory.push(enrichedMessage);

    // 限制历史记录
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.shift();
    }

    // 通知订阅者
    channel.subscribers.forEach(subscriberId => {
      if (subscriberId !== senderId) {
        this.emit('message', {
          target: subscriberId,
          message: enrichedMessage
        });
      }
    });

    this.emit('published', enrichedMessage);
  }

  // 发送直接消息
  sendDirect(targetId, message, senderId) {
    const enrichedMessage = {
      id: this.generateMessageId(),
      type: 'direct',
      sender: senderId,
      target: targetId,
      timestamp: new Date().toISOString(),
      data: message
    };

    this.emit('directMessage', enrichedMessage);
  }

  // 广播消息
  broadcast(message, senderId, exclude = []) {
    this.agents.forEach((info, agentId) => {
      if (!exclude.includes(agentId) && agentId !== senderId) {
        this.sendDirect(agentId, message, senderId);
      }
    });
  }

  generateMessageId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取Agent列表
  getAgents() {
    return Array.from(this.agents.entries()).map(([id, info]) => ({
      id,
      ...info
    }));
  }

  // 获取频道列表
  getChannels() {
    return Array.from(this.channels.entries()).map(([name, info]) => ({
      name,
      subscriberCount: info.subscribers.size,
      messageCount: info.messages.length
    }));
  }
}

// ==================== 外部工具集成器 ====================
class ToolIntegrator extends EventEmitter {
  constructor() {
    super();
    this.tools = new Map();
    this.integrations = new Map();
  }

  // 注册工具
  registerTool(name, config) {
    this.tools.set(name, {
      name,
      ...config,
      registeredAt: new Date().toISOString()
    });
  }

  // 执行工具
  async executeTool(name, params = {}) {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`工具未找到: ${name}`);
    }

    this.emit('toolExecuting', { name, params });

    try {
      let result;
      
      switch (tool.type) {
        case 'command':
          result = await this.executeCommand(tool.command, params);
          break;
        case 'script':
          result = await this.executeScript(tool.script, params);
          break;
        case 'api':
          result = await this.callAPI(tool.endpoint, params, tool.method);
          break;
        case 'function':
          result = await tool.handler(params);
          break;
        default:
          throw new Error(`未知的工具类型: ${tool.type}`);
      }

      this.emit('toolExecuted', { name, result });
      return result;
    } catch (error) {
      this.emit('toolError', { name, error });
      throw error;
    }
  }

  // 执行命令
  executeCommand(command, params) {
    return new Promise((resolve, reject) => {
      const filledCommand = this.fillTemplate(command, params);
      
      exec(filledCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // 执行脚本
  executeScript(scriptPath, params) {
    return new Promise((resolve, reject) => {
      const args = Object.entries(params).map(([k, v]) => `--${k}=${v}`);
      
      exec(`node ${scriptPath} ${args.join(' ')}`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        }
      });
    });
  }

  // 调用API
  callAPI(endpoint, params, method = 'GET') {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      
      if (method === 'GET' && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([k, v]) => {
          url.searchParams.append(k, v);
        });
      }

      const options = {
        hostname: url.hostname,
        port: url.port || 80,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        });
      });

      req.on('error', reject);

      if (method !== 'GET') {
        req.write(JSON.stringify(params));
      }

      req.end();
    });
  }

  // 填充模板
  fillTemplate(template, params) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] !== undefined ? params[key] : match;
    });
  }

  // 获取所有工具
  getTools() {
    return Array.from(this.tools.values());
  }
}

// ==================== 实时监控面板 ====================
class MonitorDashboard extends EventEmitter {
  constructor(port = 0) {
    super();
    this.port = port;
    this.server = null;
    this.wss = null;
    this.clients = new Set();
    this.metrics = {
      tasks: 0,
      errors: 0,
      agents: 0,
      startTime: Date.now()
    };
  }

  start() {
    // 创建HTTP服务器
    this.server = http.createServer((req, res) => {
      this.handleHTTPRequest(req, res);
    });

    // 创建WebSocket服务器
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws) => {
      this.clients.add(ws);
      
      // 发送初始数据
      ws.send(JSON.stringify({
        type: 'init',
        data: this.getDashboardData()
      }));

      ws.on('close', () => {
        this.clients.delete(ws);
      });

      ws.on('message', (message) => {
        this.handleWebSocketMessage(ws, message);
      });
    });

    this.server.listen(this.port, () => {
      const actualPort = this.server.address().port;
      console.log(`📊 监控面板已启动: http://localhost:${actualPort}`);
    });

    // 定期广播更新
    setInterval(() => {
      this.broadcast({
        type: 'update',
        data: this.getDashboardData()
      });
    }, 5000);
  }

  handleHTTPRequest(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.url === '/api/status') {
      res.end(JSON.stringify(this.getDashboardData()));
    } else if (req.url === '/api/agents') {
      res.end(JSON.stringify({ agents: this.getAgentList() }));
    } else if (req.url === '/api/tasks') {
      res.end(JSON.stringify({ tasks: this.getTaskList() }));
    } else {
      res.statusCode = 404;
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  }

  handleWebSocketMessage(ws, message) {
    try {
      const data = JSON.parse(message);
      
      switch (data.action) {
        case 'getStatus':
          ws.send(JSON.stringify({
            type: 'status',
            data: this.getDashboardData()
          }));
          break;
        case 'executeCommand':
          this.emit('command', data.command);
          break;
      }
    } catch (e) {
      ws.send(JSON.stringify({
        type: 'error',
        message: e.message
      }));
    }
  }

  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  getDashboardData() {
    return {
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.metrics.startTime,
      metrics: this.metrics,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage()
    };
  }

  getAgentList() {
    return [];
  }

  getTaskList() {
    return [];
  }

  updateMetrics(key, value) {
    this.metrics[key] = value;
    this.broadcast({
      type: 'metrics',
      data: { [key]: value }
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    }
    if (this.wss) {
      this.wss.close();
    }
  }
}

// ==================== 自动化工作流引擎 ====================
class WorkflowEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.runningWorkflows = new Map();
  }

  // 注册工作流
  registerWorkflow(name, definition) {
    this.workflows.set(name, {
      name,
      definition,
      registeredAt: new Date().toISOString()
    });
  }

  // 执行工作流
  async execute(name, context = {}) {
    const workflow = this.workflows.get(name);
    if (!workflow) {
      throw new Error(`工作流未找到: ${name}`);
    }

    const executionId = this.generateExecutionId();
    const execution = {
      id: executionId,
      name,
      status: 'running',
      context,
      steps: [],
      startedAt: new Date().toISOString()
    };

    this.runningWorkflows.set(executionId, execution);
    this.emit('workflowStarted', execution);

    try {
      for (const step of workflow.definition.steps) {
        const stepResult = await this.executeStep(step, context, execution);
        execution.steps.push(stepResult);
        
        if (stepResult.status === 'failed') {
          execution.status = 'failed';
          break;
        }
      }

      if (execution.status !== 'failed') {
        execution.status = 'completed';
      }

      execution.completedAt = new Date().toISOString();
      this.emit('workflowCompleted', execution);
      
      return execution;
    } catch (error) {
      execution.status = 'error';
      execution.error = error.message;
      this.emit('workflowError', execution);
      throw error;
    }
  }

  // 执行步骤
  async executeStep(step, context, execution) {
    const stepExecution = {
      name: step.name,
      status: 'running',
      startedAt: new Date().toISOString()
    };

    this.emit('stepStarted', { execution, step: stepExecution });

    try {
      let result;
      
      switch (step.type) {
        case 'task':
          result = await this.executeTask(step, context);
          break;
        case 'condition':
          result = await this.evaluateCondition(step, context);
          break;
        case 'parallel':
          result = await this.executeParallel(step, context);
          break;
        case 'script':
          result = await this.executeScript(step, context);
          break;
        default:
          throw new Error(`未知的步骤类型: ${step.type}`);
      }

      stepExecution.status = 'completed';
      stepExecution.result = result;
      stepExecution.completedAt = new Date().toISOString();

      this.emit('stepCompleted', { execution, step: stepExecution });
      
      return stepExecution;
    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.error = error.message;
      stepExecution.completedAt = new Date().toISOString();

      this.emit('stepFailed', { execution, step: stepExecution });
      
      return stepExecution;
    }
  }

  executeTask(step, context) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ message: `Task ${step.name} executed` });
      }, step.delay || 100);
    });
  }

  evaluateCondition(step, context) {
    const condition = step.condition;
    const result = this.evaluateExpression(condition, context);
    return { condition, result };
  }

  executeParallel(step, context) {
    const promises = step.steps.map(s => this.executeStep(s, context, {}));
    return Promise.all(promises);
  }

  executeScript(step, context) {
    return new Promise((resolve, reject) => {
      exec(step.script, (error, stdout) => {
        if (error) {
          reject(error);
        } else {
          resolve({ output: stdout.trim() });
        }
      });
    });
  }

  evaluateExpression(expression, context) {
    try {
      const func = new Function('context', `return ${expression}`);
      return func(context);
    } catch {
      return false;
    }
  }

  generateExecutionId() {
    return `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // 获取工作流列表
  getWorkflows() {
    return Array.from(this.workflows.values());
  }

  // 获取运行中的工作流
  getRunningWorkflows() {
    return Array.from(this.runningWorkflows.values());
  }
}

// ==================== 主集成类 ====================
class AgentIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    this.scriptManager = new ScriptManager();
    this.agentBus = new AgentBus();
    this.toolIntegrator = new ToolIntegrator();
    this.workflowEngine = new WorkflowEngine();
    this.dashboard = new MonitorDashboard(options.dashboardPort);
    
    this.coreSystem = null;
    if (CoreSystem) {
      this.coreSystem = new CoreSystem.CoreAgentSystem();
    }

    this.setupDefaultTools();
    this.setupDefaultWorkflows();
  }

  // 设置默认工具
  setupDefaultTools() {
    // 文件操作工具
    this.toolIntegrator.registerTool('readFile', {
      type: 'function',
      handler: (params) => {
        return fs.readFileSync(params.path, 'utf8');
      }
    });

    this.toolIntegrator.registerTool('writeFile', {
      type: 'function',
      handler: (params) => {
        fs.writeFileSync(params.path, params.content);
        return { success: true };
      }
    });

    // 目录操作工具
    this.toolIntegrator.registerTool('listDir', {
      type: 'function',
      handler: (params) => {
        return fs.readdirSync(params.path);
      }
    });

    // Git工具
    this.toolIntegrator.registerTool('gitStatus', {
      type: 'command',
      command: 'git status'
    });

    // HTTP请求工具
    this.toolIntegrator.registerTool('httpGet', {
      type: 'api',
      endpoint: '{{url}}',
      method: 'GET'
    });
  }

  // 设置默认工作流
  setupDefaultWorkflows() {
    this.workflowEngine.registerWorkflow('agent-creation', {
      steps: [
        { name: 'validate-input', type: 'task' },
        { name: 'generate-skill', type: 'task' },
        { name: 'generate-requirements', type: 'task' },
        { name: 'generate-design', type: 'task' },
        { name: 'generate-tasks', type: 'task' },
        { name: 'generate-checklist', type: 'task' },
        { name: 'verify-output', type: 'task' }
      ]
    });

    this.workflowEngine.registerWorkflow('batch-creation', {
      steps: [
        { name: 'parse-config', type: 'task' },
        { name: 'validate-config', type: 'task' },
        { name: 'parallel-generation', type: 'parallel', steps: [] },
        { name: 'verify-all', type: 'task' }
      ]
    });
  }

  // 启动集成系统
  async start() {
    console.log('🚀 启动Agent集成系统...');

    // 启动监控面板
    this.dashboard.start();

    // 启动核心系统（如果可用）
    if (this.coreSystem) {
      await this.coreSystem.start();
    }

    // 设置事件转发
    this.setupEventForwarding();

    console.log('✅ Agent集成系统已启动');
  }

  // 设置事件转发
  setupEventForwarding() {
    // 将各种事件转发到监控面板
    this.scriptManager.on('scriptOutput', (data) => {
      this.dashboard.broadcast({
        type: 'scriptOutput',
        data
      });
    });

    this.agentBus.on('message', (data) => {
      this.dashboard.broadcast({
        type: 'agentMessage',
        data
      });
    });

    this.workflowEngine.on('workflowStarted', (data) => {
      this.dashboard.updateMetrics('workflows', 
        this.workflowEngine.getRunningWorkflows().length);
    });
  }

  // 停止集成系统
  stop() {
    this.dashboard.stop();
    if (this.coreSystem) {
      this.coreSystem.stop();
    }
  }

  // 执行Agent任务
  async executeAgentTask(agentType, config) {
    if (this.coreSystem) {
      const taskId = this.coreSystem.addTask(
        this.getTaskType(agentType),
        agentType,
        config,
        'high'
      );
      return { taskId, status: 'queued' };
    } else {
      // 独立模式执行
      return this.executeStandalone(agentType, config);
    }
  }

  getTaskType(agentType) {
    const typeMap = {
      'agent-generator': 'generate-agent',
      'batch-agent-creator': 'batch-create',
      'plan-agent': 'create-plan',
      'spec-agent': 'write-spec',
      'debug-agent': 'debug-code',
      'meta-agent': 'meta-control',
      'autopilot-agent': 'autopilot'
    };
    return typeMap[agentType] || 'generic';
  }

  async executeStandalone(agentType, config) {
    // 独立模式下的简单执行
    console.log(`执行 ${agentType}`, config);
    return { status: 'completed', agentType, config };
  }

  // 获取系统状态
  getStatus() {
    return {
      scripts: this.scriptManager.getScripts().length,
      agents: this.agentBus.getAgents().length,
      channels: this.agentBus.getChannels().length,
      tools: this.toolIntegrator.getTools().length,
      workflows: this.workflowEngine.getWorkflows().length,
      runningWorkflows: this.workflowEngine.getRunningWorkflows().length,
      coreSystem: this.coreSystem ? 'connected' : 'standalone'
    };
  }
}

// ==================== 命令行接口 ====================
async function main() {
  const integration = new AgentIntegration({ dashboardPort: 8765 });
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'start':
      await integration.start();
      
      // 保持运行
      console.log('按 Ctrl+C 停止');
      process.stdin.resume();
      break;

    case 'status':
      console.log('系统状态:', integration.getStatus());
      break;

    case 'execute':
      const agentType = args[1] || 'agent-generator';
      const config = JSON.parse(args[2] || '{}');
      const result = await integration.executeAgentTask(agentType, config);
      console.log('执行结果:', result);
      break;

    case 'workflow':
      const workflowName = args[1] || 'agent-creation';
      const workflowResult = await integration.workflowEngine.execute(workflowName);
      console.log('工作流结果:', workflowResult);
      break;

    default:
      console.log('🤖 Agent集成系统\n');
      console.log('使用方法:');
      console.log('  node agent-integration.js start              - 启动集成系统');
      console.log('  node agent-integration.js status             - 查看系统状态');
      console.log('  node agent-integration.js execute <agent>    - 执行Agent任务');
      console.log('  node agent-integration.js workflow <name>    - 执行工作流');
  }
}

// 运行
if (require.main === module) {
  main().catch(console.error);
}

// 导出模块
module.exports = {
  AgentIntegration,
  ScriptManager,
  AgentBus,
  ToolIntegrator,
  WorkflowEngine,
  MonitorDashboard
};