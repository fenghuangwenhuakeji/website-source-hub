#!/usr/bin/env node
/**
 * Agent System Master Controller
 * 
 * Core Features:
 * 1. Auto-discover and register all Agents
 * 2. Unified scheduling and monitoring
 * 3. Cross-Agent collaboration
 * 4. Global memory and state management
 * 5. Persistent conversation context
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
    this.conversationHistory = this.loadHistory();
    this.taskQueue = [];
    this.isRunning = false;
    this.currentSession = null;
  }

  // ==================== Agent Discovery ====================

  discoverAgents() {
    console.log('\n🔍 Scanning for Agents...');
    const agents = [];
    
    const scanDir = (dir, depth = 0) => {
      if (depth > 3) return;
      
      try {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          if (item.isDirectory()) {
            const fullPath = path.join(dir, item.name);
            const skillPath = path.join(fullPath, 'SKILL.md');
            const configPath = path.join(fullPath, 'config.json');
            
            if (fs.existsSync(skillPath)) {
              let config = { name: item.name };
              if (fs.existsSync(configPath)) {
                try {
                  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                } catch (e) {}
              }
              
              const skillContent = fs.readFileSync(skillPath, 'utf8');
              const frontMatter = this.parseFrontMatter(skillContent);
              
              agents.push({
                id: item.name,
                name: config.name || frontMatter.name || item.name,
                description: config.description || frontMatter.description || '',
                path: fullPath,
                config: { ...config, ...frontMatter },
                status: 'discovered',
                capabilities: config.capabilities || [],
                keywords: config.triggers?.keywords || this.extractKeywords(skillContent)
              });
            }
            
            scanDir(fullPath, depth + 1);
          }
        }
      } catch (e) {}
    };
    
    scanDir(this.skillsDir);
    return agents;
  }

  parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return {};
    
    const frontMatter = {};
    match[1].split('\n').forEach(line => {
      const [key, ...values] = line.split(':');
      if (key && values.length) {
        frontMatter[key.trim()] = values.join(':').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return frontMatter;
  }

  extractKeywords(content) {
    const keywords = [];
    const keywordPatterns = [
      /关键词[：:]\s*([^\n]+)/g,
      /keywords[：:]\s*([^\n]+)/gi,
      /触发条件[：:]\s*([^\n]+)/g,
      /调用条件[：:]\s*([^\n]+)/g
    ];
    
    for (const pattern of keywordPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        keywords.push(...match[1].split(/[,，、]/).map(k => k.trim()));
      }
    }
    
    return [...new Set(keywords)].filter(k => k.length > 0);
  }

  // ==================== Agent Registration ====================

  registerAgent(agentInfo) {
    this.agents.set(agentInfo.id, {
      ...agentInfo,
      status: 'registered',
      registeredAt: new Date().toISOString()
    });
    console.log(`   ✅ ${agentInfo.config.icon || '🤖'} ${agentInfo.name}`);
  }

  // ==================== Task Analysis ====================

  analyzeTask(task) {
    const scores = [];
    const taskLower = task.toLowerCase();
    
    for (const [id, agent] of this.agents) {
      let score = 0;
      const reasons = [];
      
      // Keyword matching
      const keywords = agent.keywords || [];
      for (const keyword of keywords) {
        if (taskLower.includes(keyword.toLowerCase())) {
          score += 2;
          reasons.push(`keyword: ${keyword}`);
        }
      }
      
      // Capability matching
      const capabilities = agent.capabilities || [];
      for (const cap of capabilities) {
        if (taskLower.includes(cap.toLowerCase())) {
          score += 1;
          reasons.push(`capability: ${cap}`);
        }
      }
      
      // Name matching
      if (taskLower.includes(agent.name.toLowerCase())) {
        score += 3;
        reasons.push('name match');
      }
      
      if (score > 0) {
        scores.push({
          agent: id,
          score,
          priority: agent.config.priority || 1,
          reasons
        });
      }
    }
    
    return scores
      .sort((a, b) => b.score - a.score || a.priority - b.priority)
      .slice(0, 3)
      .map(s => ({
        agent: s.agent,
        score: s.score,
        reasons: s.reasons
      }));
  }

  // ==================== Task Execution ====================

  async executeTask(task, options = {}) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📥 New Task: ${task}`);
    console.log('═'.repeat(60));
    
    // Create session
    const sessionId = `session-${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      task,
      startedAt: new Date().toISOString(),
      status: 'running'
    };
    
    // Analyze and select agents
    const selectedAgents = this.analyzeTask(task);
    
    if (selectedAgents.length === 0) {
      console.log('   ⚠️ No suitable Agent found');
      return { success: false, message: 'No suitable Agent found' };
    }
    
    console.log('\n🎯 Selected Agents:');
    selectedAgents.forEach((s, i) => {
      const agent = this.agents.get(s.agent);
      console.log(`   ${i + 1}. ${agent.config.icon || '🤖'} ${agent.name} (score: ${s.score})`);
      console.log(`      Reasons: ${s.reasons.join(', ')}`);
    });
    
    // Execute with each agent
    const results = [];
    for (const selected of selectedAgents) {
      const agent = this.agents.get(selected.agent);
      console.log(`\n${'─'.repeat(60)}`);
      console.log(`🤖 Executing: ${agent.config.icon || '🤖'} ${agent.name}`);
      console.log('─'.repeat(60));
      
      const result = await this.executeWithAgent(agent, task);
      results.push(result);
      
      if (result.success) {
        console.log(`   ✅ ${agent.name} completed`);
      } else {
        console.log(`   ❌ ${agent.name} failed: ${result.error}`);
      }
    }
    
    // Save to history
    this.saveToHistory(task, selectedAgents, results);
    
    // Update session
    this.currentSession.status = 'completed';
    this.currentSession.completedAt = new Date().toISOString();
    
    console.log(`\n${'═'.repeat(60)}`);
    console.log('✅ Task Completed');
    console.log('═'.repeat(60));
    
    return {
      success: true,
      sessionId,
      results,
      summary: this.generateSummary(results)
    };
  }

  async executeWithAgent(agent, task) {
    const startTime = Date.now();
    
    try {
      // Load agent skill
      const skillPath = path.join(agent.path, 'SKILL.md');
      let skillContent = '';
      if (fs.existsSync(skillPath)) {
        skillContent = fs.readFileSync(skillPath, 'utf8');
      }
      
      // Generate response based on skill
      const response = this.generateAgentResponse(agent, task, skillContent);
      
      return {
        agent: agent.id,
        agentName: agent.name,
        success: true,
        response,
        duration: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        agent: agent.id,
        agentName: agent.name,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  generateAgentResponse(agent, task, skillContent) {
    // Extract key information from skill
    const sections = this.extractSections(skillContent);
    
    return {
      analysis: `Task analyzed by ${agent.name}`,
      capabilities: agent.capabilities,
      relevantSections: Object.keys(sections),
      suggestions: [
        `Review ${agent.name} SKILL.md for detailed guidance`,
        `Check the design.md for implementation details`,
        `Follow the checklist.md for quality assurance`
      ],
      skillPath: agent.path
    };
  }

  extractSections(content) {
    const sections = {};
    const pattern = /^##\s+(.+)$/gm;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      sections[match[1]] = true;
    }
    
    return sections;
  }

  generateSummary(results) {
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    
    return {
      totalAgents: results.length,
      successful,
      failed,
      message: `${successful}/${results.length} agents completed successfully`
    };
  }

  // ==================== Memory Management ====================

  loadGlobalMemory() {
    const memoryPath = path.join(this.skillsDir, '.global-memory.json');
    if (fs.existsSync(memoryPath)) {
      try {
        return JSON.parse(fs.readFileSync(memoryPath, 'utf8'));
      } catch (e) {}
    }
    return {
      tasks: [],
      patterns: [],
      users: {},
      learnings: []
    };
  }

  saveGlobalMemory() {
    try {
      fs.writeFileSync(
        path.join(this.skillsDir, '.global-memory.json'),
        JSON.stringify(this.globalMemory, null, 2)
      );
    } catch (e) {}
  }

  loadHistory() {
    const historyPath = path.join(this.skillsDir, '.conversation-history.json');
    if (fs.existsSync(historyPath)) {
      try {
        return JSON.parse(fs.readFileSync(historyPath, 'utf8'));
      } catch (e) {}
    }
    return [];
  }

  saveHistory() {
    try {
      fs.writeFileSync(
        path.join(this.skillsDir, '.conversation-history.json'),
        JSON.stringify(this.conversationHistory, null, 2)
      );
    } catch (e) {}
  }

  saveToHistory(task, agents, results) {
    this.conversationHistory.push({
      timestamp: new Date().toISOString(),
      task,
      agents: agents.map(a => a.agent),
      results: results.map(r => ({
        agent: r.agentName,
        success: r.success
      })),
      session: this.currentSession?.id
    });
    
    // Keep last 100 conversations
    if (this.conversationHistory.length > 100) {
      this.conversationHistory = this.conversationHistory.slice(-100);
    }
    
    this.saveHistory();
    
    // Also save to global memory
    this.globalMemory.tasks.push({
      timestamp: new Date().toISOString(),
      task,
      agents: agents.map(a => a.agent),
      success: results.every(r => r.success)
    });
    
    if (this.globalMemory.tasks.length > 1000) {
      this.globalMemory.tasks = this.globalMemory.tasks.slice(-1000);
    }
    
    this.saveGlobalMemory();
  }

  // ==================== Conversation Interface ====================

  async chat(message) {
    return await this.executeTask(message);
  }

  getHistory(limit = 10) {
    return this.conversationHistory.slice(-limit);
  }

  getAgentInfo(agentId) {
    return this.agents.get(agentId);
  }

  listAgents() {
    return Array.from(this.agents.values()).map(a => ({
      id: a.id,
      name: a.name,
      icon: a.config.icon || '🤖',
      capabilities: a.capabilities,
      keywords: a.keywords
    }));
  }

  // ==================== System Control ====================

  async start() {
    console.log('\n' + '═'.repeat(60));
    console.log('🚀 Agent System Master Controller');
    console.log('═'.repeat(60));
    
    // Discover and register agents
    const agents = this.discoverAgents();
    for (const agent of agents) {
      this.registerAgent(agent);
    }
    
    console.log(`\n📊 System Status:`);
    console.log(`   Registered Agents: ${this.agents.size}`);
    console.log(`   History Records: ${this.conversationHistory.length}`);
    console.log(`   Memory Tasks: ${this.globalMemory.tasks.length}`);
    
    this.isRunning = true;
    this.emit('started');
    
    console.log('\n✅ System Ready');
    console.log('═'.repeat(60));
    
    return {
      status: 'started',
      agentsCount: this.agents.size,
      historyCount: this.conversationHistory.length
    };
  }

  stop() {
    console.log('\n⏹️ Stopping Agent System...');
    this.isRunning = false;
    this.saveHistory();
    this.saveGlobalMemory();
    this.emit('stopped');
    console.log('✅ System Stopped');
  }

  status() {
    return {
      isRunning: this.isRunning,
      agentsCount: this.agents.size,
      historyCount: this.conversationHistory.length,
      memoryTasks: this.globalMemory.tasks.length,
      currentSession: this.currentSession
    };
  }
}

// ==================== CLI Entry ====================

async function main() {
  const skillsDir = process.argv[2] || path.join(__dirname);
  const controller = new MasterController(skillsDir);
  
  await controller.start();
  
  // Demo tasks
  const demoTasks = [
    'Add user login feature with phone and WeChat support',
    'Optimize payment process',
    'Fix mobile page adaptation issue'
  ];
  
  console.log('\n📝 Running demo tasks...\n');
  
  for (const task of demoTasks) {
    await controller.executeTask(task);
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n✅ Demo completed!');
  controller.stop();
}

// Export
module.exports = MasterController;

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
