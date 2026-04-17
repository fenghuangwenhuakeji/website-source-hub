#!/usr/bin/env node
/**
 * Trae Agent 控制器 - 直接在Trae终端驱使和监督Agent
 * 
 * 特性:
 * 1. 一键驱使任意Agent
 * 2. 实时监督任务执行
 * 3. 自动错误恢复
 * 4. 执行日志追踪
 * 5. 任务完成通知
 */

const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const EventEmitter = require('events');

const BASE_DIR = __dirname;
const WORKSPACE_DIR = path.join(BASE_DIR, 'workspace');
const LOGS_DIR = path.join(BASE_DIR, 'logs');

// 确保目录存在
if (!fs.existsSync(WORKSPACE_DIR)) fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
if (!fs.existsSync(LOGS_DIR)) fs.mkdirSync(LOGS_DIR, { recursive: true });

// 颜色输出
const c = {
  reset: '\x1b[0m', bright: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(msg, color = 'white') {
  console.log(`${c[color]}${msg}${c.reset}`);
}

function logSection(title) {
  console.log(`\n${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}`);
  console.log(`${c.bright}${c.cyan}  ${title}${c.reset}`);
  console.log(`${c.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${c.reset}\n`);
}

// ==================== 任务监督器 ====================
class TaskSupervisor extends EventEmitter {
  constructor() {
    super();
    this.tasks = new Map();
    this.logFile = path.join(LOGS_DIR, `supervisor-${Date.now()}.log`);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.on('taskStarted', (task) => {
      this.logEvent('START', task);
      log(`🔵 任务开始 [${task.id}] ${task.agent}`, 'blue');
    });

    this.on('taskProgress', (task, progress) => {
      this.logEvent('PROGRESS', { task, progress });
      log(`⏳ ${task.agent}: ${progress}%`, 'yellow');
    });

    this.on('taskCompleted', (task) => {
      this.logEvent('COMPLETE', task);
      log(`✅ 任务完成 [${task.id}] ${task.agent}`, 'green');
      log(`   耗时: ${task.duration}ms`, 'dim');
    });

    this.on('taskFailed', (task, error) => {
      this.logEvent('FAILED', { task, error });
      log(`❌ 任务失败 [${task.id}] ${task.agent}`, 'red');
      log(`   错误: ${error}`, 'red');
    });

    this.on('taskRetry', (task, attempt) => {
      this.logEvent('RETRY', { task, attempt });
      log(`🔄 任务重试 [${task.id}] 第${attempt}次`, 'yellow');
    });
  }

  logEvent(type, data) {
    const entry = {
      timestamp: new Date().toISOString(),
      type,
      data
    };
    fs.appendFileSync(this.logFile, JSON.stringify(entry) + '\n');
  }

  createTask(agent, command, args) {
    const task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      agent,
      command,
      args,
      status: 'pending',
      startTime: null,
      endTime: null,
      duration: 0,
      retries: 0,
      maxRetries: 3,
      output: []
    };
    this.tasks.set(task.id, task);
    return task;
  }

  getTask(id) {
    return this.tasks.get(id);
  }

  getAllTasks() {
    return Array.from(this.tasks.values());
  }

  getRunningTasks() {
    return this.getAllTasks().filter(t => t.status === 'running');
  }

  getCompletedTasks() {
    return this.getAllTasks().filter(t => t.status === 'completed');
  }

  getFailedTasks() {
    return this.getAllTasks().filter(t => t.status === 'failed');
  }
}

// ==================== Agent 执行器 ====================
class AgentExecutor {
  constructor(supervisor) {
    this.supervisor = supervisor;
  }

  async execute(agent, command, args = []) {
    const task = this.supervisor.createTask(agent, command, args);
    
    return new Promise((resolve, reject) => {
      const agentPath = path.join(BASE_DIR, agent);
      const runScript = path.join(agentPath, 'run.js');

      if (!fs.existsSync(runScript)) {
        reject(new Error(`Agent ${agent} 不存在`));
        return;
      }

      task.status = 'running';
      task.startTime = Date.now();
      this.supervisor.emit('taskStarted', task);

      const child = spawn('node', [runScript, command, ...args], {
        cwd: agentPath,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        task.output.push({ type: 'stdout', data: chunk, time: Date.now() });
        
        // 实时输出到终端
        process.stdout.write(chunk);
        
        // 解析进度
        const progressMatch = chunk.match(/(\d+)%/);
        if (progressMatch) {
          this.supervisor.emit('taskProgress', task, parseInt(progressMatch[1]));
        }
      });

      child.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        task.output.push({ type: 'stderr', data: chunk, time: Date.now() });
        process.stderr.write(c.red + chunk + c.reset);
      });

      child.on('close', (code) => {
        task.endTime = Date.now();
        task.duration = task.endTime - task.startTime;

        if (code === 0) {
          task.status = 'completed';
          this.supervisor.emit('taskCompleted', task);
          resolve({ task, stdout, stderr });
        } else {
          task.status = 'failed';
          task.error = stderr || `Exit code: ${code}`;
          
          // 自动重试
          if (task.retries < task.maxRetries) {
            task.retries++;
            this.supervisor.emit('taskRetry', task, task.retries);
            setTimeout(() => {
              this.execute(agent, command, args).then(resolve).catch(reject);
            }, 2000);
            return;
          }
          
          this.supervisor.emit('taskFailed', task, task.error);
          reject(new Error(`Task failed: ${task.error}`));
        }
      });

      child.on('error', (error) => {
        task.status = 'failed';
        task.endTime = Date.now();
        task.duration = task.endTime - task.startTime;
        task.error = error.message;
        this.supervisor.emit('taskFailed', task, error.message);
        reject(error);
      });
    });
  }

  async executeBatch(tasks) {
    logSection('批量任务执行');
    log(`计划执行 ${tasks.length} 个任务\n`, 'cyan');

    const results = [];
    for (let i = 0; i < tasks.length; i++) {
      const { agent, command, args } = tasks[i];
      log(`\n[${i + 1}/${tasks.length}] 执行: ${agent} ${command}`, 'bright');
      
      try {
        const result = await this.execute(agent, command, args);
        results.push({ success: true, result });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }
}

// ==================== 实时监控面板 ====================
class MonitorDashboard {
  constructor(supervisor) {
    this.supervisor = supervisor;
    this.updateInterval = null;
  }

  start() {
    this.updateInterval = setInterval(() => {
      this.render();
    }, 2000);
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  render() {
    const tasks = this.supervisor.getAllTasks();
    const running = this.supervisor.getRunningTasks();
    const completed = this.supervisor.getCompletedTasks();
    const failed = this.supervisor.getFailedTasks();

    // 清屏（在支持的终端）
    console.log('\x1Bc');

    logSection('🎯 Trae Agent 实时监控');
    
    log(`任务统计:`, 'bright');
    log(`  🟢 运行中: ${running.length}`, running.length > 0 ? 'green' : 'dim');
    log(`  ✅ 已完成: ${completed.length}`, completed.length > 0 ? 'green' : 'dim');
    log(`  ❌ 失败: ${failed.length}`, failed.length > 0 ? 'red' : 'dim');
    log(`  📊 总计: ${tasks.length}`, 'cyan');

    if (running.length > 0) {
      log(`\n正在执行的任务:`, 'bright');
      running.forEach(task => {
        const elapsed = Date.now() - task.startTime;
        log(`  ⏳ ${task.agent} - ${task.command} (${elapsed}ms)`, 'yellow');
      });
    }

    if (failed.length > 0) {
      log(`\n失败的任务:`, 'bright');
      failed.slice(-3).forEach(task => {
        log(`  ❌ ${task.agent} - ${task.error?.substring(0, 50)}...`, 'red');
      });
    }

    log(`\n${c.dim}按 Ctrl+C 停止监控${c.reset}`);
  }
}

// ==================== 主控制器 ====================
class TraeAgentController {
  constructor() {
    this.supervisor = new TaskSupervisor();
    this.executor = new AgentExecutor(this.supervisor);
    this.dashboard = new MonitorDashboard(this.supervisor);
    this.agents = this.discoverAgents();
  }

  discoverAgents() {
    const agents = [];
    const items = fs.readdirSync(BASE_DIR);
    
    items.forEach(item => {
      const itemPath = path.join(BASE_DIR, item);
      if (fs.statSync(itemPath).isDirectory()) {
        const runScript = path.join(itemPath, 'run.js');
        if (fs.existsSync(runScript)) {
          agents.push(item);
        }
      }
    });
    
    return agents;
  }

  showBanner() {
    console.log(`
${c.cyan}╔══════════════════════════════════════════════════════════════╗${c.reset}
${c.cyan}║${c.reset}           ${c.bright}🎯 Trae Agent 控制器${c.reset}                        ${c.cyan}║${c.reset}
${c.cyan}║${c.reset}           ${c.dim}直接在Trae终端驱使和监督Agent${c.reset}              ${c.cyan}║${c.reset}
${c.cyan}╚══════════════════════════════════════════════════════════════╝${c.reset}
`);
  }

  showHelp() {
    this.showBanner();
    log('用法:', 'bright');
    log('  node trae-agent-controller.js <agent> <command> [args...]', 'cyan');
    log('  node trae-agent-controller.js monitor', 'cyan');
    log('  node trae-agent-controller.js status', 'cyan');
    log('  node trae-agent-controller.js batch <config.json>', 'cyan');
    log('  node trae-agent-controller.js interactive', 'cyan');
    log('');
    log('可用Agent:', 'bright');
    this.agents.forEach(agent => {
      log(`  • ${agent}`, 'cyan');
    });
    log('');
    log('示例:', 'bright');
    log('  node trae-agent-controller.js agent-generator generate my-agent', 'yellow');
    log('  node trae-agent-controller.js plan-agent create "电商平台"', 'yellow');
    log('  node trae-agent-controller.js meta-agent status', 'yellow');
    log('  node trae-agent-controller.js monitor', 'yellow');
  }

  async runAgent(agent, command, args) {
    this.showBanner();
    logSection(`执行任务: ${agent} ${command}`);

    try {
      const result = await this.executor.execute(agent, command, args);
      
      logSection('任务完成');
      log(`✅ Agent: ${agent}`, 'green');
      log(`✅ 命令: ${command}`, 'green');
      log(`✅ 耗时: ${result.task.duration}ms`, 'green');
      
      return result;
    } catch (error) {
      logSection('任务失败');
      log(`❌ 错误: ${error.message}`, 'red');
      throw error;
    }
  }

  async runBatch(configPath) {
    if (!fs.existsSync(configPath)) {
      log(`❌ 配置文件不存在: ${configPath}`, 'red');
      return;
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const tasks = config.tasks || [];

    this.dashboard.start();
    
    try {
      const results = await this.executor.executeBatch(tasks);
      
      this.dashboard.stop();
      
      logSection('批量任务完成');
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      
      log(`✅ 成功: ${successCount}`, 'green');
      log(`❌ 失败: ${failCount}`, failCount > 0 ? 'red' : 'dim');
      
    } catch (error) {
      this.dashboard.stop();
      throw error;
    }
  }

  showStatus() {
    this.showBanner();
    logSection('系统状态');

    const tasks = this.supervisor.getAllTasks();
    const running = this.supervisor.getRunningTasks();
    const completed = this.supervisor.getCompletedTasks();
    const failed = this.supervisor.getFailedTasks();

    log(`Agent列表:`, 'bright');
    this.agents.forEach(agent => {
      log(`  ✅ ${agent}`, 'cyan');
    });

    log(`\n任务统计:`, 'bright');
    log(`  🟢 运行中: ${running.length}`, 'green');
    log(`  ✅ 已完成: ${completed.length}`, 'green');
    log(`  ❌ 失败: ${failed.length}`, failed.length > 0 ? 'red' : 'dim');
    log(`  📊 总计: ${tasks.length}`, 'cyan');

    if (completed.length > 0) {
      const avgDuration = completed.reduce((sum, t) => sum + t.duration, 0) / completed.length;
      log(`\n平均执行时间: ${Math.round(avgDuration)}ms`, 'cyan');
    }
  }

  async interactive() {
    this.showBanner();
    logSection('交互模式');
    log('输入命令来驱使Agent (输入 help 查看帮助, exit 退出)\n', 'cyan');

    const readline = require('readline');
    const rl = readline.createInterface({