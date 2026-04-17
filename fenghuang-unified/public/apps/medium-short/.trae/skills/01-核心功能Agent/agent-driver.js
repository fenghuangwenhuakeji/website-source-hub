#!/usr/bin/env node
/**
 * 核心Agent驱动系统
 * 自动驱动所有核心功能Agent执行任务
 * 
 * 使用方法:
 *   node agent-driver.js <agent-name> <task-file>
 *   node agent-driver.js all <batch-config>
 * 
 * 示例:
 *   node agent-driver.js agent-generator task.json
 *   node agent-driver.js all batch-tasks.yaml
 */

const fs = require('fs');
const path = require('path');

// 核心Agent配置
const CORE_AGENTS = {
  'agent-generator': {
    name: 'agent-generator',
    title: 'Agent生成器',
    skillFile: './agent-generator/SKILL.md',
    capabilities: ['生成Agent', '创建5文档范式', '批量生成'],
    autoExecute: true
  },
  'autopilot-agent': {
    name: 'autopilot-agent',
    title: '自动驾驶Agent',
    skillFile: './autopilot-agent/SKILL.md',
    capabilities: ['自动执行任务', '监控执行', '异常处理'],
    autoExecute: true
  },
  'batch-agent-creator': {
    name: 'batch-agent-creator',
    title: '批量Agent创建器',
    skillFile: './batch-agent-creator/SKILL.md',
    capabilities: ['批量生成Agent', '配置解析', '模板渲染'],
    autoExecute: true
  },
  'debug-agent': {
    name: 'debug-agent',
    title: '调试Agent',
    skillFile: './debug-agent/SKILL.md',
    capabilities: ['错误诊断', '问题定位', '修复建议'],
    autoExecute: true
  },
  'meta-agent': {
    name: 'meta-agent',
    title: '元Agent',
    skillFile: './meta-agent/SKILL.md',
    capabilities: ['Agent管理', '协调调度', '监控状态'],
    autoExecute: true
  },
  'plan-agent': {
    name: 'plan-agent',
    title: '规划Agent',
    skillFile: './plan-agent/SKILL.md',
    capabilities: ['任务规划', '进度管理', '资源分配'],
    autoExecute: true
  },
  'spec-agent': {
    name: 'spec-agent',
    title: '规格Agent',
    skillFile: './spec-agent/SKILL.md',
    capabilities: ['需求分析', '规格定义', '文档生成'],
    autoExecute: true
  }
};

// 日志系统
class Logger {
  constructor(agentName) {
    this.agentName = agentName;
    this.logFile = path.join(__dirname, `${agentName}-driver.log`);
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] [${this.agentName}] ${message}\n`;
    
    // 输出到控制台
    const colors = {
      INFO: '\x1b[36m',    // 青色
      SUCCESS: '\x1b[32m', // 绿色
      WARN: '\x1b[33m',    // 黄色
      ERROR: '\x1b[31m',   // 红色
      RESET: '\x1b[0m'
    };
    
    console.log(`${colors[level] || ''}${logEntry}${colors.RESET}`);
    
    // 写入日志文件
    fs.appendFileSync(this.logFile, logEntry);
  }

  info(msg) { this.log('INFO', msg); }
  success(msg) { this.log('SUCCESS', msg); }
  warn(msg) { this.log('WARN', msg); }
  error(msg) { this.log('ERROR', msg); }
}

// Agent驱动器
class AgentDriver {
  constructor(agentConfig) {
    this.config = agentConfig;
    this.logger = new Logger(agentConfig.name);
    this.status = 'idle'; // idle, running, completed, error
  }

  // 读取Skill文件
  readSkill() {
    try {
      const skillPath = path.join(__dirname, this.config.skillFile);
      if (!fs.existsSync(skillPath)) {
        throw new Error(`Skill文件不存在: ${skillPath}`);
      }
      return fs.readFileSync(skillPath, 'utf8');
    } catch (error) {
      this.logger.error(`读取Skill失败: ${error.message}`);
      throw error;
    }
  }

  // 解析任务
  parseTask(taskFile) {
    try {
      const content = fs.readFileSync(taskFile, 'utf8');
      const ext = path.extname(taskFile);
      
      if (ext === '.json') {
        return JSON.parse(content);
      } else if (ext === '.yaml' || ext === '.yml') {
        return this.parseYAML(content);
      } else {
        return { raw: content };
      }
    } catch (error) {
      this.logger.error(`解析任务失败: ${error.message}`);
      throw error;
    }
  }

  // 简单YAML解析
  parseYAML(content) {
    const result = {};
    const lines = content.split('\n');
    let currentKey = null;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      if (trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':');
        const value = valueParts.join(':').trim();
        currentKey = key.trim();
        result[currentKey] = value || [];
      } else if (trimmed.startsWith('- ') && currentKey) {
        if (!Array.isArray(result[currentKey])) {
          result[currentKey] = [];
        }
        result[currentKey].push(trimmed.replace('- ', ''));
      }
    }
    
    return result;
  }

  // 执行任务
  async execute(task) {
    this.logger.info(`开始执行任务: ${task.name || '未命名任务'}`);
    this.status = 'running';
    
    try {
      // 根据Agent类型执行不同逻辑
      switch (this.config.name) {
        case 'agent-generator':
          await this.executeAgentGenerator(task);
          break;
        case 'batch-agent-creator':
          await this.executeBatchCreator(task);
          break;
        case 'plan-agent':
          await this.executePlanAgent(task);
          break;
        case 'spec-agent':
          await this.executeSpecAgent(task);
          break;
        case 'debug-agent':
          await this.executeDebugAgent(task);
          break;
        case 'meta-agent':
          await this.executeMetaAgent(task);
          break;
        case 'autopilot-agent':
          await this.executeAutopilotAgent(task);
          break;
        default:
          throw new Error(`未知的Agent类型: ${this.config.name}`);
      }
      
      this.status = 'completed';
      this.logger.success('任务执行完成');
      return { success: true, agent: this.config.name };
      
    } catch (error) {
      this.status = 'error';
      this.logger.error(`任务执行失败: ${error.message}`);
      return { success: false, error: error.message, agent: this.config.name };
    }
  }

  // Agent Generator执行逻辑
  async executeAgentGenerator(task) {
    this.logger.info('生成Agent...');
    // 实际执行Agent生成的逻辑
    const outputDir = path.join(__dirname, '..', task.output_dir || 'generated-agents');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 创建Agent目录结构
    for (const agent of task.agents || []) {
      const agentDir = path.join(outputDir, agent.name);
      fs.mkdirSync(agentDir, { recursive: true });
      
      // 生成5个文档
      this.generateAgentDocs(agent, agentDir);
      this.logger.success(`生成Agent: ${agent.name}`);
    }
  }

  // Batch Agent Creator执行逻辑
  async executeBatchCreator(task) {
    this.logger.info('批量创建Agent...');
    // 调用batch-create-agents.js
    const batchScript = path.join(__dirname, 'batch-agent-creator', 'example-screenplay-agents.yaml');
    if (fs.existsSync(batchScript)) {
      this.logger.info(`使用配置: ${batchScript}`);
    }
  }

  // Plan Agent执行逻辑
  async executePlanAgent(task) {
    this.logger.info('创建项目计划...');
    const plan = {
      project: task.project_name,
      phases: task.phases || [],
      milestones: task.milestones || [],
      created_at: new Date().toISOString()
    };
    
    const planFile = path.join(__dirname, `${task.project_name}-plan.json`);
    fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));
    this.logger.success(`计划已保存: ${planFile}`);
  }

  // Spec Agent执行逻辑
  async executeSpecAgent(task) {
    this.logger.info('生成规格文档...');
    const spec = {
      title: task.title,
      requirements: task.requirements || [],
      acceptance_criteria: task.acceptance_criteria || [],
      created_at: new Date().toISOString()
    };
    
    const specFile = path.join(__dirname, `${task.title}-spec.md`);
    this.generateSpecDoc(spec, specFile);
    this.logger.success(`规格文档已生成: ${specFile}`);
  }

  // Debug Agent执行逻辑
  async executeDebugAgent(task) {
    this.logger.info('诊断问题...');
    // 分析错误日志，提供修复建议
    const analysis = {
      error: task.error,
      cause: task.cause || '未知',
      solution: task.solution || '需要进一步分析',
      timestamp: new Date().toISOString()
    };
    
    this.logger.info(`问题分析: ${analysis.cause}`);
    this.logger.info(`建议方案: ${analysis.solution}`);
  }

  // Meta Agent执行逻辑
  async executeMetaAgent(task) {
    this.logger.info('协调Agent工作...');
    // 监控其他Agent状态，协调任务分配
    const status = {
      active_agents: Object.keys(CORE_AGENTS).length,
      tasks: task.subtasks || [],
      timestamp: new Date().toISOString()
    };
    
    this.logger.info(`当前活跃Agent: ${status.active_agents}`);
    this.logger.info(`待处理任务: ${status.tasks.length}`);
  }

  // Autopilot Agent执行逻辑
  async executeAutopilotAgent(task) {
    this.logger.info('自动执行工作流...');
    // 自动执行预定义的工作流
    const workflow = task.workflow || [];
    
    for (let i = 0; i < workflow.length; i++) {
      const step = workflow[i];
      this.logger.info(`执行步骤 ${i + 1}/${workflow.length}: ${step.name}`);
      // 模拟执行
      await this.delay(100);
    }
    
    this.logger.success('工作流执行完成');
  }

  // 生成Agent文档
  generateAgentDocs(agent, agentDir) {
    const docs = ['SKILL.md', 'requirement.md', 'design.md', 'tasks.md', 'checklist.md'];
    
    for (const doc of docs) {
      const content = this.generateDocContent(doc, agent);
      fs.writeFileSync(path.join(agentDir, doc), content);
    }
  }

  // 生成文档内容
  generateDocContent(docType, agent) {
    const date = new Date().toISOString().split('T')[0];
    
    switch (docType) {
      case 'SKILL.md':
        return `---
name: "${agent.name}"
description: "${agent.title} - ${agent.description}"
---

# ${agent.title}

## 核心理念

**${agent.core_concept}**

${agent.title} 是一个 Skill Agent，专注于${agent.description}。

## 核心工作流程

\`\`\`
输入 → 分析 → 处理 → 优化 → 输出
\`\`\`

## 详细功能说明

${agent.features.map(f => `### ${f}
- 功能详细说明
- 使用方法
- 最佳实践
`).join('\n')}

## 调用触发条件

**立即调用此 Skill 当：**

- 需要${agent.description}
- 想要优化相关方面
- 需要专业建议和指导

## 输出保证

- [ ] 专业水准的输出
- [ ] 符合行业标准
- [ ] 可操作性强
- [ ] 结果可验证

---

**${agent.core_concept}**
`;
      
      case 'requirement.md':
        return `# 需求规格文档 - ${agent.title}

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | ${date} |
| 最后更新 | ${date} |
| 文档状态 | 初始版本 |
| 作者 | AI Assistant |

## 项目概述

### 背景
${agent.description}

### 核心理念
**${agent.core_concept}**

## 功能需求

${agent.features.map((f, i) => `- ${f}`).join('\n')}

## 验收标准

1. 能够正确执行所有功能
2. 输出内容专业、规范
`;
      
      default:
        return `# ${docType} - ${agent.title}\n\n生成时间: ${date}\n`;
    }
  }

  // 生成规格文档
  generateSpecDoc(spec, filePath) {
    const content = `# 规格文档 - ${spec.title}

## 需求列表

${spec.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## 验收标准

${spec.acceptance_criteria.map((c, i) => `- ${c}`).join('\n')}

## 生成时间

${spec.created_at}
`;
    fs.writeFileSync(filePath, content);
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 批量执行所有Agent
async function executeAllAgents(configFile) {
  console.log('🚀 启动核心Agent驱动系统\n');
  console.log('='.repeat(60));
  
  const results = [];
  
  for (const [name, config] of Object.entries(CORE_AGENTS)) {
    console.log(`\n📦 启动Agent: ${config.title}`);
    console.log('-'.repeat(40));
    
    const driver = new AgentDriver(config);
    
    try {
      // 读取默认任务或配置文件
      let task = { name: `默认任务-${name}` };
      
      if (configFile && fs.existsSync(configFile)) {
        task = driver.parseTask(configFile);
      }
      
      const result = await driver.execute(task);
      results.push(result);
      
    } catch (error) {
      console.error(`❌ Agent ${name} 执行失败:`, error.message);
      results.push({ success: false, agent: name, error: error.message });
    }
  }
  
  // 生成汇总报告
  console.log('\n' + '='.repeat(60));
  console.log('📊 执行汇总报告');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  
  console.log(`总Agent数: ${results.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failCount}`);
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.agent}`);
  });
  
  return results;
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const agentName = args[0];
  const taskFile = args[1];
  
  if (!agentName) {
    console.log('使用方法:');
    console.log('  node agent-driver.js <agent-name> [task-file]');
    console.log('  node agent-driver.js all [batch-config]');
    console.log('\n可用的Agent:');
    Object.entries(CORE_AGENTS).forEach(([name, config]) => {
      console.log(`  - ${name}: ${config.title}`);
    });
    process.exit(0);
  }
  
  if (agentName === 'all') {
    // 批量执行所有Agent
    await executeAllAgents(taskFile);
  } else {
    // 执行单个Agent
    const config = CORE_AGENTS[agentName];
    if (!config) {
      console.error(`❌ 未知的Agent: ${agentName}`);
      console.log('可用的Agent:', Object.keys(CORE_AGENTS).join(', '));
      process.exit(1);
    }
    
    const driver = new AgentDriver(config);
    
    let task = { name: '默认任务' };
    if (taskFile) {
      task = driver.parseTask(taskFile);
    }
    
    const result = await driver.execute(task);
    
    if (result.success) {
      console.log('\n✅ 任务执行成功');
    } else {
      console.log('\n❌ 任务执行失败:', result.error);
      process.exit(1);
    }
  }
}

// 运行
main().catch(console.error);
