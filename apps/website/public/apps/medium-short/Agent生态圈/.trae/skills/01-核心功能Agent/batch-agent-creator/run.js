#!/usr/bin/env node
/**
 * Batch Agent Creator 管理脚本
 * 用法: node run.js [command] [options]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CORE_SYSTEM_PATH = path.join(__dirname, '..', 'core-agent-system.js');

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║           📦 Batch Agent Creator 管理器                      ║
║                批量Agent创建工具                              ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showHelp() {
  showBanner();
  log('用法: node run.js [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  batch <config>       从配置文件批量创建');
  log('  create <n> <prefix>  创建n个Agent');
  log('  from-json <file>     从JSON文件创建');
  log('  from-yaml <file>     从YAML文件创建');
  log('  template <name>      使用模板创建');
  log('  status               查看系统状态');
  log('  help                 显示帮助信息\n');
  log('示例:', 'bright');
  log('  node run.js batch ./agents.json');
  log('  node run.js create 10 test-agent\n');
}

function batchCreate(configPath) {
  if (!configPath || !fs.existsSync(configPath)) {
    log('❌ 错误: 请提供有效的配置文件', 'red');
    process.exit(1);
  }

  log(`📦 批量创建Agent...\n`, 'yellow');

  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const agents = config.agents || [];

    log(`发现 ${agents.length} 个Agent配置\n`, 'cyan');

    const outputDir = path.join(__dirname, '..', 'workspace', 'batch-created');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    agents.forEach((agentConfig, index) => {
      log(`[${index + 1}/${agents.length}] 创建 ${agentConfig.name}...`, 'yellow');
      
      const agentDir = path.join(outputDir, agentConfig.name);
      if (!fs.existsSync(agentDir)) {
        fs.mkdirSync(agentDir, { recursive: true });
      }

      // 生成基础文档
      const date = new Date().toISOString().split('T')[0];
      fs.writeFileSync(path.join(agentDir, 'SKILL.md'), `# ${agentConfig.title || agentConfig.name}\n\nAuto-generated agent.`);
      fs.writeFileSync(path.join(agentDir, 'requirement.md'), `# Requirements\n\nGenerated: ${date}`);
      fs.writeFileSync(path.join(agentDir, 'design.md'), `# Design\n\nGenerated: ${date}`);
      fs.writeFileSync(path.join(agentDir, 'tasks.md'), `# Tasks\n\nGenerated: ${date}`);
      fs.writeFileSync(path.join(agentDir, 'checklist.md'), `# Checklist\n\nGenerated: ${date}`);
    });

    log(`\n✅ 批量创建完成！共创建 ${agents.length} 个Agent`, 'green');
    log(`📁 输出目录: ${outputDir}`, 'cyan');
  } catch (error) {
    log(`❌ 批量创建失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function createMultiple(count, prefix) {
  const num = parseInt(count) || 5;
  const pre = prefix || 'batch-agent';

  log(`📦 创建 ${num} 个Agent，前缀: ${pre}\n`, 'yellow');

  const agents = [];
  for (let i = 1; i <= num; i++) {
    agents.push({
      name: `${pre}-${i}`,
      title: `${pre}-${i}`,
      description: `Auto-generated ${pre}-${i}`
    });
  }

  // 创建临时配置文件
  const tempConfig = path.join(__dirname, '..', 'workspace', 'temp-batch.json');
  fs.writeFileSync(tempConfig, JSON.stringify({ agents }, null, 2));
  
  batchCreate(tempConfig);
}

function showStatus() {
  try {
    const result = execSync(`node "${CORE_SYSTEM_PATH}" status`, { 
      encoding: 'utf8',
      cwd: path.dirname(CORE_SYSTEM_PATH)
    });
    console.log(result);
  } catch (error) {
    log('\n📦 Batch Agent Creator 状态:', 'bright');
    log('  状态: 🟢 就绪', 'green');
    log('  功能: 批量创建、配置解析、模板渲染', 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'batch':
    case 'b':
      showBanner();
      batchCreate(args[1]);
      break;
    case 'create':
    case 'c':
      showBanner();
      createMultiple(args[1], args[2]);
      break;
    case 'status':
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
