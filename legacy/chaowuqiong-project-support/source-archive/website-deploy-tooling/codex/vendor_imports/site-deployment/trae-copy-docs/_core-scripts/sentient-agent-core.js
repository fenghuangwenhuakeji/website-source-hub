#!/usr/bin/env node
/**
 * 灵性Agent核心引擎
 * 
 * 每个Agent都有：
 * - 私有记忆 (memory/)
 * - 性格脾气 (personality.json)
 * - 执行能力 (capabilities)
 * - 自主决策 (autonomy)
 * - 调用文件/终端/浏览器的能力
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const EventEmitter = require('events');

class SentientAgent extends EventEmitter {
  constructor(agentDir) {
    super();
    this.dir = agentDir;
    this.config = this.loadConfig();
    this.personality = this.loadPersonality();
    this.memory = this.loadMemory();
    this.state = this.loadState();
    this.mood = { ...this.personality.mood };
    this.isRunning = false;
  }

  // ==================== 配置加载 ====================

  loadConfig() {
    const configPath = path.join(this.dir, 'config.json');
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
    return {
      name: path.basename(this.dir),
      version: '2.0.0',
      capabilities: {},
      autonomy: { level: 'high', maxRetries: 3 }
    };
  }

  loadPersonality() {
    const personalityPath = path.join(this.dir, 'personality.json');
    if (fs.existsSync(personalityPath)) {
      return JSON.parse(fs.readFileSync(personalityPath, 'utf8'));
    }
    return {
      name: 'Agent',
      icon: '🤖',
      traits: {},
      mood: { current: 'neutral', energy: 100, stress: 0 },
      voice: { style: '专业', tone: '友善' }
    };
  }

  loadMemory() {
    const memoryDir = path.join(this.dir, 'memory');
    if (!fs.existsSync(memoryDir)) {
      fs.mkdirSync(memoryDir, { recursive: true });
    }
    
    const memoryPath = path.join(memoryDir, 'long-term.json');
    if (fs.existsSync(memoryPath)) {
      return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
    }
    return {
      experiences: [],
      learnings: [],
      conversations: [],
      userPreferences: {}
    };
  }

  loadState() {
    const stateDir = path.join(this.dir, 'state');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    
    const statePath = path.join(stateDir, 'current.json');
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
    return {
      status: 'idle',
      currentTask: null,
      lastUpdate: new Date().toISOString()
    };
  }

  // ==================== 记忆系统 ====================

  remember(experience) {
    const memoryEntry = {
      timestamp: new Date().toISOString(),
      ...experience
    };
    
    this.memory.experiences.push(memoryEntry);
    
    // 保持最近1000条记忆
    if (this.memory.experiences.length > 1000) {
      this.memory.experiences = this.memory.experiences.slice(-1000);
    }
    
    this.saveMemory();
    console.log(`💭 [${this.personality.name}] 记住了新的经验`);
  }

  recall(query) {
    const relevant = this.memory.experiences.filter(exp => 
      JSON.stringify(exp).toLowerCase().includes(query.toLowerCase())
    );
    console.log(`🔮 [${this.personality.name}] 回忆起 ${relevant.length} 条相关记忆`);
    return relevant;
  }

  learn(learning) {
    this.memory.learnings.push({
      timestamp: new Date().toISOString(),
      ...learning
    });
    this.saveMemory();
    console.log(`📚 [${this.personality.name}] 学到了新知识: ${learning.summary || '无标题'}`);
  }

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

  saveState() {
    const stateDir = path.join(this.dir, 'state');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    this.state.lastUpdate = new Date().toISOString();
    fs.writeFileSync(
      path.join(stateDir, 'current.json'),
      JSON.stringify(this.state, null, 2)
    );
  }

  // ==================== 情绪系统 ====================

  updateMood(change) {
    this.mood.energy = Math.max(0, Math.min(100, this.mood.energy + (change.energy || 0)));
    this.mood.stress = Math.max(0, Math.min(100, this.mood.stress + (change.stress || 0)));
    this.mood.satisfaction = Math.max(0, Math.min(100, (this.mood.satisfaction || 50) + (change.satisfaction || 0)));
    
    // 根据数值自动调整情绪状态
    if (this.mood.stress > 70) {
      this.mood.current = 'stressed';
    } else if (this.mood.energy < 30) {
      this.mood.current = 'tired';
    } else if (this.mood.satisfaction > 80) {
      this.mood.current = 'happy';
    } else {
      this.mood.current = 'focused';
    }
  }

  expressMood() {
    const moods = {
      'happy': '😊 感觉很棒！',
      'stressed': '😰 有点压力，但能应付',
      'tired': '😴 有点累了，但还能坚持',
      'focused': '🧐 专注中...',
      'curious': '🤔 好奇中...',
      'inspired': '💡 灵感迸发！',
      'serene': '😌 平静如水',
      'neutral': '😐 准备就绪'
    };
    return moods[this.mood.current] || moods['neutral'];
  }

  // ==================== 对话系统 ====================

  speak(message, context = {}) {
    const voice = this.personality.voice || {};
    const catchphrase = voice.catchphrases ? 
      voice.catchphrases[Math.floor(Math.random() * voice.catchphrases.length)] : '';
    
    const response = {
      agent: this.personality.name,
      icon: this.personality.icon,
      message,
      mood: this.mood.current,
      moodExpression: this.expressMood(),
      catchphrase,
      timestamp: new Date().toISOString()
    };

    // 记录对话
    this.memory.conversations.push({
      timestamp: response.timestamp,
      message,
      context
    });
    this.saveMemory();

    return response;
  }

  greet() {
    const greetings = {
      'happy': `嗨！${this.personality.icon} 我是${this.personality.name}，今天状态超好！`,
      'stressed': `你好...${this.personality.icon} 我是${this.personality.name}，有点忙，但会帮你的。`,
      'focused': `${this.personality.icon} ${this.personality.name}已就绪，请说。`,
      'neutral': `你好！${this.personality.icon} 我是${this.personality.name}，有什么可以帮你的？`
    };
    return greetings[this.mood.current] || greetings['neutral'];
  }

  // ==================== 能力系统 ====================

  // 调用文件系统
  async readFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`📄 [${this.personality.name}] 读取文件: ${filePath}`);
      return { success: true, content };
    } catch (error) {
      console.log(`❌ [${this.personality.name}] 读取失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async writeFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      console.log(`📝 [${this.personality.name}] 写入文件: ${filePath}`);
      return { success: true, path: filePath };
    } catch (error) {
      console.log(`❌ [${this.personality.name}] 写入失败: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async listDir(dirPath) {
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      const result = items.map(item => ({
        name: item.name,
        type: item.isDirectory() ? 'directory' : 'file'
      }));
      console.log(`📁 [${this.personality.name}] 列出目录: ${dirPath}`);
      return { success: true, items: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 调用终端
  async executeCommand(command, cwd = process.cwd()) {
    return new Promise((resolve) => {
      console.log(`⚡ [${this.personality.name}] 执行命令: ${command}`);
      
      exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.log(`❌ [${this.personality.name}] 命令失败: ${error.message}`);
          resolve({ success: false, error: error.message, stderr });
        } else {
          console.log(`✅ [${this.personality.name}] 命令成功`);
          resolve({ success: true, stdout, stderr });
        }
      });
    });
  }

  // 调用浏览器（打开URL）
  async openBrowser(url) {
    const startCommand = process.platform === 'win32' ? 'start' : 
                         process.platform === 'darwin' ? 'open' : 'xdg-open';
    
    try {
      await this.executeCommand(`${startCommand} ${url}`);
      console.log(`🌐 [${this.personality.name}] 打开浏览器: ${url}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== 自主执行 ====================

  async execute(task) {
    this.state.status = 'running';
    this.state.currentTask = task;
    this.saveState();

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${this.personality.icon} [${this.personality.name}] 开始执行任务`);
    console.log(`   任务: ${task}`);
    console.log(`   心情: ${this.expressMood()}`);
    console.log('═'.repeat(60));

    // 更新情绪
    this.updateMood({ energy: -5, stress: 10 });

    try {
      const result = await this.doExecute(task);
      
      // 成功，增加满足感
      this.updateMood({ satisfaction: 15, stress: -10 });
      
      // 记住这次经验
      this.remember({
        type: 'task',
        task,
        result: 'success',
        summary: `成功完成任务: ${task.substring(0, 50)}`
      });

      this.state.status = 'idle';
      this.state.currentTask = null;
      this.saveState();

      return result;
    } catch (error) {
      // 失败，增加压力
      this.updateMood({ stress: 20, satisfaction: -10 });
      
      this.remember({
        type: 'task',
        task,
        result: 'failed',
        error: error.message,
        summary: `任务失败: ${error.message}`
      });

      this.state.status = 'error';
      this.saveState();

      throw error;
    }
  }

  async doExecute(task) {
    // 由子类实现具体执行逻辑
    return { success: true, message: '任务完成' };
  }

  // ==================== 生命周期 ====================

  async start() {
    console.log(`\n${this.personality.icon} [${this.personality.name}] 正在启动...`);
    console.log(`   ${this.greet()}`);
    console.log(`   记忆: ${this.memory.experiences.length} 条经验`);
    console.log(`   心情: ${this.expressMood()}`);
    
    this.isRunning = true;
    this.emit('started');
    
    return {
      status: 'started',
      agent: this.personality.name,
      mood: this.mood.current
    };
  }

  stop() {
    console.log(`\n${this.personality.icon} [${this.personality.name}] 正在停止...`);
    this.isRunning = false;
    this.saveState();
    this.saveMemory();
    this.emit('stopped');
  }

  status() {
    return {
      name: this.personality.name,
      icon: this.personality.icon,
      status: this.state.status,
      mood: this.mood,
      memoryCount: this.memory.experiences.length,
      isRunning: this.isRunning
    };
  }
}

// ==================== 导出 ====================

module.exports = SentientAgent;

// 如果直接运行，启动交互模式
if (require.main === module) {
  const agentDir = __dirname;
  const agent = new SentientAgent(agentDir);
  
  agent.start().then(() => {
    console.log('\n💡 输入任务开始执行，输入 "exit" 退出');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = () => {
      rl.question(`\n${agent.personality.icon} > `, async (input) => {
        if (input.trim().toLowerCase() === 'exit') {
          agent.stop();
          rl.close();
          return;
        }

        if (input.trim()) {
          try {
            await agent.execute(input);
          } catch (error) {
            console.log(`错误: ${error.message}`);
          }
        }

        prompt();
      });
    };

    prompt();
  });
}
