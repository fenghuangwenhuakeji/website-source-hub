#!/usr/bin/env node
/**
 * Trae Agent Supervisor - Trae对话中的Agent监督系统
 */

const { orchestrator, call, workflow, status, agents, suggest } = require('./agent-orchestrator');

class TraeAgentSupervisor {
  constructor() {
    this.orchestrator = orchestrator;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.orchestrator.on('taskStarted', (task) => {
      console.log(`\n🚀 [监督] 任务开始: ${task.agent} -> ${task.command}`);
    });

    this.orchestrator.on('taskOutput', ({ taskId, type, content }) => {
      if (type === 'stdout' && (content.includes('✅') || content.includes('📁'))) {
        console.log(`   ${content.trim()}`);
      }
    });

    this.orchestrator.on('taskCompleted', (task) => {
      console.log(`✅ [监督] 任务完成: ${task.agent} (${task.duration}ms)`);
    });

    this.orchestrator.on('taskFailed', (task) => {
      console.log(`❌ [监督] 任务失败: ${task.agent} - ${task.error}`);
    });
  }

  async execute(agentName, command, args = {}) {
    console.log(`\n🤖 正在执行: ${agentName} -> ${command}`);
    console.log('─'.repeat(50));

    try {
      const result = await this.orchestrator.invoke(agentName, command, args);
      console.log('─'.repeat(50));
      console.log(`✅ 执行成功!\n`);
      if (result.result.message) console.log(`📋 ${result.result.message}`);
      return result;
    } catch (error) {
      console.log('─'.repeat(50));
      console.log(`❌ 执行失败: ${error.message}\n`);
      throw error;
    }
  }

  async smartExecute(taskDescription, args = {}) {
    const suggestedAgent = suggest(taskDescription);
    if (!suggestedAgent) {
      console.log('⚠️ 无法自动选择Agent');
      return null;
    }

    console.log(`🤖 智能选择Agent: ${suggestedAgent}`);
    let command = 'help';
    if (taskDescription.includes('生成') || taskDescription.includes('创建')) command = 'generate';
    else if (taskDescription.includes('计划') || taskDescription.includes('规划')) command = 'create';
    else if (taskDescription.includes('规格') || taskDescription.includes('文档')) command = 'create';
    else if (taskDescription.includes('调试') || taskDescription.includes('错误')) command = 'analyze';

    const finalArgs = args.name ? args : { ...args, name: 'smart-generated-agent' };
    return this.execute(suggestedAgent, command, finalArgs);
  }

  showStatus() {
    const report = status();
    console.log('\n📊 Agent执行状态报告');
    console.log('═'.repeat(50));
    console.log(`会话ID: ${report.session}`);
    console.log(`总任务数: ${report.summary.total}`);
    console.log(`已完成: ${report.summary.completed} ✅`);
    console.log(`失败: ${report.summary.failed} ❌`);
    console.log(`成功率: ${report.summary.successRate}`);
    console.log('═'.repeat(50));
  }

  showAgents() {
    const agentList = agents();
    console.log('\n🤖 可用Agent列表');
    console.log('─'.repeat(50));
    agentList.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.name}`);
      console.log(`   描述: ${agent.description}`);
      console.log(`   能力: ${agent.capabilities.join(', ')}`);
      console.log();
    });
  }
}

const supervisor = new TraeAgentSupervisor();

module.exports = {
  TraeAgentSupervisor,
  supervisor,
  async run(agent, command, args) { return supervisor.execute(agent, command, args); },
  async smart(task, args) { return supervisor.smartExecute(task, args); },
  report() { return supervisor.showStatus(); },
  list() { return supervisor.showAgents(); }
};

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'run':
      if (args.length < 3) {
        console.log('用法: node trae-agent-supervisor.js run <agent> <command> [name]');
        process.exit(1);
      }
      supervisor.execute(args[1], args[2], args[3] ? { name: args[3] } : {});
      break;
    case 'smart':
      if (args.length < 2) {
        console.log('用法: node trae-agent-supervisor.js smart "任务描述"');
        process.exit(1);
      }
      supervisor.smartExecute(args[1]);
      break;
    case 'status':
      supervisor.showStatus();
      break;
    case 'agents':
      supervisor.showAgents();
      break;
    default:
      console.log('Trae Agent Supervisor');
      console.log('用法:');
      console.log('  node trae-agent-supervisor.js run <agent> <command> [name]');
      console.log('  node trae-agent-supervisor.js smart "任务描述"');
      console.log('  node trae-agent-supervisor.js status');
      console.log('  node trae-agent-supervisor.js agents');
  }
}
