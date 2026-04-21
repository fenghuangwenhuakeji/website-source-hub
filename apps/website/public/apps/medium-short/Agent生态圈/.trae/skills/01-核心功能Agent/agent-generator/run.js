#!/usr/bin/env node
/**
 * Agent Generator 管理脚本
 * 用法: node run.js [command] [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 获取核心系统路径
const CORE_SYSTEM_PATH = path.join(__dirname, '..', 'core-agent-system.js');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 显示Banner
function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🤖 Agent Generator 管理器                        ║
║                   智能Agent生成工具                           ║
╚══════════════════════════════════════════════════════════════╝
`);
}

// 显示帮助
function showHelp() {
  showBanner();
  log('用法: node run.js [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  generate <name>    生成一个新的Agent');
  log('  batch <config>     批量生成Agent');
  log('  from-template <t>  从模板生成Agent');
  log('  validate <dir>     验证Agent文档完整性');
  log('  list-templates     列出可用模板');
  log('  status             查看系统状态');
  log('  help               显示帮助信息\n');
  log('示例:', 'bright');
  log('  node run.js generate my-agent');
  log('  node run.js batch ./config.json');
  log('  node run.js from-template skill-agent\n');
}

// 生成Agent
function generateAgent(name, options = {}) {
  if (!name) {
    log('❌ 错误: 请提供Agent名称', 'red');
    process.exit(1);
  }

  log(`🚀 开始生成Agent: ${name}\n`, 'green');

  // 创建Agent配置
  const config = {
    name: name,
    title: options.title || name,
    description: options.description || `Auto-generated ${name}`,
    core_concept: options.concept || 'Intelligent automation',
    features: options.features || ['Core functionality', 'Smart processing', 'Auto-optimization'],
    priority: options.priority || 'medium'
  };

  // 调用核心系统
  try {
    const taskConfig = JSON.stringify(config).replace(/"/g, '\\"');
    const result = execSync(
      `node "${CORE_SYSTEM_PATH}" add generate-agent agent-generator "${taskConfig}"`,
      { encoding: 'utf8', cwd: path.dirname(CORE_SYSTEM_PATH) }
    );
    log(`✅ Agent "${name}" 生成成功！`, 'green');
    log(result, 'cyan');
  } catch (error) {
    // 如果核心系统不可用，直接生成
    generateAgentDirectly(config);
  }
}

// 直接生成Agent（备用方案）
function generateAgentDirectly(config) {
  const outputDir = path.join(__dirname, '..', 'workspace', 'generated', config.name);
  
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 生成5个文档
  const date = new Date().toISOString().split('T')[0];
  
  // SKILL.md
  const skillMd = `---
name: "${config.name}"
description: "${config.title} - ${config.description}"
---

# ${config.title}

## 核心理念

**${config.core_concept}**

${config.title} 是一个智能Agent，专注于${config.description}。

## 核心工作流程

\`\`\`
输入 → 分析 → 处理 → 优化 → 输出
\`\`\`

## 详细功能说明

${config.features.map(f => `### ${f}
- 功能详细说明
- 使用方法
- 最佳实践
`).join('\n')}

## 调用触发条件

**立即调用此 Agent 当：**

- 需要${config.description}
- 想要优化相关流程
- 需要专业建议和指导

## 输出保证

- [ ] 专业水准的输出
- [ ] 符合行业标准
- [ ] 可操作性强
- [ ] 结果可验证

---

**${config.core_concept}**
`;

  // requirement.md
  const requirementMd = `# 需求规格文档 - ${config.title}

## 文档信息

| 项目 | 内容 |
|------|------|
| 文档版本 | v1.0.0 |
| 创建日期 | ${date} |
| 最后更新 | ${date} |
| 文档状态 | 初始版本 |
| 作者 | Agent Generator |

## 项目概述

### 背景
${config.description}

### 核心理念
**${config.core_concept}**

## 功能需求

${config.features.map((f, i) => `- REQ-${String(i+1).padStart(3, '0')}: ${f}`).join('\n')}

## 验收标准

1. 能够正确执行所有功能
2. 输出内容专业、规范
`;

  // design.md
  const designMd = `# 架构设计文档 - ${config.title}

## 系统架构

\`\`\`
输入 → 处理 → 输出
\`\`\`

## 功能模块

${config.features.map((f, i) => `### 模块${i + 1}: ${f}`).join('\n')}

## 技术栈

- 核心引擎: JavaScript/Node.js
- 架构模式: Event-driven
`;

  // tasks.md
  const tasksMd = `# 任务分解文档 - ${config.title}

## 任务列表

${config.features.map((f, i) => `- [ ] 实现${f}`).join('\n')}

## 开发计划

1. 第一阶段: 核心功能实现
2. 第二阶段: 优化与测试
3. 第三阶段: 文档完善
`;

  // checklist.md
  const checklistMd = `# 质量检查清单 - ${config.title}

## 检查项

- [ ] SKILL.md 已创建并符合规范
- [ ] requirement.md 已创建并符合规范
- [ ] design.md 已创建并符合规范
- [ ] tasks.md 已创建并符合规范
- [ ] checklist.md 已创建并符合规范
- [ ] 所有文档通过质量检查
`;

  // 写入文件
  fs.writeFileSync(path.join(outputDir, 'SKILL.md'), skillMd);
  fs.writeFileSync(path.join(outputDir, 'requirement.md'), requirementMd);
  fs.writeFileSync(path.join(outputDir, 'design.md'), designMd);
  fs.writeFileSync(path.join(outputDir, 'tasks.md'), tasksMd);
  fs.writeFileSync(path.join(outputDir, 'checklist.md'), checklistMd);

  log(`✅ Agent "${config.name}" 生成成功！`, 'green');
  log(`📁 输出目录: ${outputDir}`, 'cyan');
  log(`📄 生成文件:`, 'cyan');
  log(`   - SKILL.md`, 'cyan');
  log(`   - requirement.md`, 'cyan');
  log(`   - design.md`, 'cyan');
  log(`   - tasks.md`, 'cyan');
  log(`   - checklist.md`, 'cyan');
}

// 批量生成
function batchGenerate(configPath) {
  if (!configPath || !fs.existsSync(configPath)) {
    log('❌ 错误: 请提供有效的配置文件路径', 'red');
    process.exit(1);
  }

  log(`📦 开始批量生成...\n`, 'yellow');

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const agents = config.agents || [];

    log(`发现 ${agents.length} 个Agent配置\n`, 'cyan');

    agents.forEach((agentConfig, index) => {
      log(`[${index + 1}/${agents.length}] 生成 ${agentConfig.name}...`, 'yellow');
      generateAgentDirectly(agentConfig);
    });

    log(`\n✅ 批量生成完成！共生成 ${agents.length} 个Agent`, 'green');
  } catch (error) {
    log(`❌ 批量生成失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

// 验证Agent
function validateAgent(agentDir) {
  if (!agentDir || !fs.existsSync(agentDir)) {
    log('❌ 错误: 请提供有效的Agent目录', 'red');
    process.exit(1);
  }

  log(`🔍 验证Agent: ${agentDir}\n`, 'yellow');

  const requiredFiles = ['SKILL.md', 'requirement.md', 'design.md', 'tasks.md', 'checklist.md'];
  let passed = 0;
  let failed = 0;

  requiredFiles.forEach(file => {
    const filePath = path.join(agentDir, file);
    if (fs.existsSync(filePath)) {
      log(`  ✅ ${file}`, 'green');
      passed++;
    } else {
      log(`  ❌ ${file} (缺失)`, 'red');
      failed++;
    }
  });

  log(`\n验证结果: ${passed} 通过, ${failed} 失败`, failed === 0 ? 'green' : 'yellow');
}

// 列出模板
function listTemplates() {
  log('📋 可用模板:\n', 'bright');
  log('  skill-agent    - 技能型Agent模板', 'cyan');
  log('  debug-agent    - 调试型Agent模板', 'cyan');
  log('  plan-agent     - 规划型Agent模板', 'cyan');
  log('  spec-agent     - 规格型Agent模板', 'cyan');
  log('  custom-agent   - 自定义Agent模板\n', 'cyan');
}

// 查看状态
function showStatus() {
  try {
    const result = execSync(`node "${CORE_SYSTEM_PATH}" status`, { 
      encoding: 'utf8',
      cwd: path.dirname(CORE_SYSTEM_PATH)
    });
    console.log(result);
  } catch (error) {
    log('⚠️ 核心系统未运行，使用本地状态', 'yellow');
    log('\n本地Agent Generator状态:', 'bright');
    log('  状态: 🟢 就绪', 'green');
    log('  功能: 生成Agent、批量创建、验证', 'cyan');
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
    case 'g':
      showBanner();
      generateAgent(args[1], {
        title: args[2],
        description: args[3],
        concept: args[4]
      });
      break;

    case 'batch':
    case 'b':
      showBanner();
      batchGenerate(args[1]);
      break;

    case 'validate':
    case 'v':
      validateAgent(args[1]);
      break;

    case 'list-templates':
    case 'lt':
      listTemplates();
      break;

    case 'status':
    case 's':
      showStatus();
      break;

    case 'help':
    case 'h':
    default:
      showHelp();
      break;
  }
}

main();
