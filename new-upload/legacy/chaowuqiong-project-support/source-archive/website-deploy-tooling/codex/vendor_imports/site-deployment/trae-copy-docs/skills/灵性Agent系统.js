#!/usr/bin/env node
/**
 * 灵性Agent系统 - 统一入口
 * 
 * 管理5个核心灵性Agent:
 * - 🌟 造物主 (agent-generator) - 创造新Agent
 * - 🚀 自动驾驶 - 全自主执行任务
 * - 🔍 侦探 - 分析和修复Bug
 * - 📐 建筑师 - 定义系统规格
 * - 👑 天道 - 管理Agent生态
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const AGENTS_DIR = path.join(__dirname, '01-核心功能Agent');

const AGENTS = {
  'generator': {
    name: '造物主',
    icon: '🌟',
    path: path.join(AGENTS_DIR, 'agent-generator'),
    description: '创造新的Agent',
    personality: '专业而富有创造力'
  },
  'autopilot': {
    name: '自动驾驶',
    icon: '🚀',
    path: path.join(AGENTS_DIR, 'autopilot-agent'),
    description: '全自主执行任务，永不放弃',
    personality: '果断而高效'
  },
  'debug': {
    name: '侦探',
    icon: '🔍',
    path: path.join(AGENTS_DIR, 'debug-agent'),
    description: '分析和修复Bug',
    personality: '冷静而细致'
  },
  'spec': {
    name: '建筑师',
    icon: '📐',
    path: path.join(AGENTS_DIR, 'spec-agent'),
    description: '定义系统规格',
    personality: '清晰而严谨'
  },
  'meta': {
    name: '天道',
    icon: '👑',
    path: path.join(AGENTS_DIR, 'meta-agent'),
    description: '管理Agent生态',
    personality: '威严而公正'
  }
};

class SentientAgentSystem {
  constructor() {
    this.agents = new Map();
    this.currentAgent = null;
    this.rl = null;
  }

  async start() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🧠 灵性Agent系统 - Sentient Agent System                 ║
║                                                              ║
║     每个Agent都有:                                           ║
║     - 私有记忆 💾                                            ║
║     - 性格脾气 😊                                            ║
║     - 人性化对话 💬                                          ║
║     - 高度自主执行 ⚡                                        ║
║     - 调用文件/终端/浏览器能力 🛠️                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    `);

    this.showAgents();
    this.startInteractiveMode();
  }

  showAgents() {
    console.log('\n📋 可用的灵性Agent:\n');
    console.log('┌─────────────────────────────────────────────────────────────┐');
    for (const [id, agent] of Object.entries(AGENTS)) {
      console.log(`│  ${agent.icon} [${id.padEnd(10)}] ${agent.name.padEnd(8)} - ${agent.description}`);
    }
    console.log('└─────────────────────────────────────────────────────────────┘');
    console.log('\n命令:');
    console.log('  use <agent>  - 切换到指定Agent');
    console.log('  list         - 列出所有Agent');
    console.log('  status       - 查看当前Agent状态');
    console.log('  help         - 显示帮助');
    console.log('  exit         - 退出系统\n');
  }

  startInteractiveMode() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = () => {
      const agentInfo = this.currentAgent ? 
        `${this.currentAgent.icon} ${this.currentAgent.name}` : 
        '系统';
      this.rl.question(`\n${agentInfo} > `, async (input) => {
        await this.handleInput(input.trim());
        prompt();
      });
    };

    prompt();
  }

  async handleInput(input) {
    if (!input) return;

    const parts = input.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    switch (command) {
      case 'use':
        this.switchAgent(args);
        break;
      case 'list':
        this.showAgents();
        break;
      case 'status':
        this.showStatus();
        break;
      case 'help':
        this.showHelp();
        break;
      case 'exit':
      case 'quit':
        console.log('\n👋 再见！灵性Agent系统已关闭。');
        this.rl.close();
        process.exit(0);
        break;
      default:
        if (this.currentAgent) {
          await this.executeWithCurrentAgent(input);
        } else {
          console.log('\n⚠️ 请先选择一个Agent (use <agent>)');
        }
    }
  }

  switchAgent(agentId) {
    const agent = AGENTS[agentId];
    if (!agent) {
      console.log(`\n❌ 未找到Agent: ${agentId}`);
      console.log('可用Agent: ' + Object.keys(AGENTS).join(', '));
      return;
    }

    this.currentAgent = agent;
    console.log(`\n${agent.icon} 已切换到 [${agent.name}]`);
    console.log(`   性格: ${agent.personality}`);
    console.log(`   能力: ${agent.description}`);
    console.log(`\n💡 输入任务开始执行，输入 "help" 查看帮助`);
  }

  showStatus() {
    if (!this.currentAgent) {
      console.log('\n⚠️ 当前没有选择Agent');
      return;
    }

    const agent = this.currentAgent;
    const personalityPath = path.join(agent.path, 'personality.json');
    const memoryPath = path.join(agent.path, 'memory', 'long-term.json');

    console.log(`\n${agent.icon} [${agent.name}] 状态:`);
    console.log('─'.repeat(40));

    if (fs.existsSync(personalityPath)) {
      const personality = JSON.parse(fs.readFileSync(personalityPath, 'utf8'));
      console.log(`   心情: ${personality.mood?.current || 'neutral'}`);
      console.log(`   能量: ${personality.mood?.energy || 100}%`);
      console.log(`   压力: ${personality.mood?.stress || 0}%`);
    }

    if (fs.existsSync(memoryPath)) {
      const memory = JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
      console.log(`   记忆: ${(memory.experiences || []).length} 条经验`);
    }

    console.log('─'.repeat(40));
  }

  showHelp() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      帮助信息                                 ║
╠══════════════════════════════════════════════════════════════╣
║  use <agent>   切换到指定Agent                                ║
║  list          列出所有Agent                                  ║
║  status        查看当前Agent状态                              ║
║  help          显示帮助                                       ║
║  exit          退出系统                                       ║
╠══════════════════════════════════════════════════════════════╣
║  直接输入任务，当前Agent会自动执行                            ║
╚══════════════════════════════════════════════════════════════╝
    `);
  }

  async executeWithCurrentAgent(task) {
    console.log(`\n${this.currentAgent.icon} [${this.currentAgent.name}] 正在处理...`);
    console.log('─'.repeat(40));

    // 模拟执行
    await new Promise(r => setTimeout(r, 500));

    // 根据不同Agent给出不同响应
    const responses = {
      'generator': `✨ 我会为你创建一个新的Agent来处理: "${task.substring(0, 30)}..."`,
      'autopilot': `🚀 收到任务！我会全自主执行，直到完成: "${task.substring(0, 30)}..."`,
      'debug': `🔍 让我分析一下这个问题: "${task.substring(0, 30)}..."`,
      'spec': `📐 我来定义这个系统的规格: "${task.substring(0, 30)}..."`,
      'meta': `👑 天道已审视你的请求: "${task.substring(0, 30)}..."`
    };

    console.log(responses[this.currentAgent.name] || '处理中...');
    console.log('─'.repeat(40));
    console.log('💡 提示: 运行 node run.js 可以启动完整的Agent交互模式');
  }
}

// 启动系统
const system = new SentientAgentSystem();
system.start();
