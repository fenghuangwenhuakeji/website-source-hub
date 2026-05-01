#!/usr/bin/env node
/**
 * Agent CLI - 统一的管理入口
 * 用法: node agent-cli.js [agent] [command] [options]
 * 
 * 示例:
 *   node agent-cli.js agent-generator generate my-agent
 *   node agent-cli.js plan-agent create "电商平台"
 *   node agent-cli.js meta-agent status
 *   node agent-cli.js status  (查看所有Agent状态)
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const BASE_DIR = __dirname;

const colors = {
  reset: '\x1b[0m', bright: '\x1b[1m', green: '\x1b[32m',
  yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m',
  magenta: '\x1b[35m', blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║              🤖 Agent CLI - 统一管理控制台                   ║
║                   核心Agent管理系统                           ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showHelp() {
  showBanner();
  log('用法: node agent-cli.js [agent] [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  status                    查看所有Agent状态');
  log('  list                      列出所有可用Agent');
  log('  run <agent> [cmd] [args]  运行指定Agent的命令');
  log('  help                      显示帮助信息\n');
  log('可用Agent:', 'bright');
  
  const agents = getAvailableAgents();
  agents.forEach(agent => {
    log(`  ${agent.name.padEnd(25)} ${agent.description}`, 'cyan');
  });
  
  log('\n示例:', 'bright');
  log('  node agent-cli.js status');
  log('  node agent-cli.js run agent-generator generate my-agent');
  log('  node agent-cli.js run plan-agent create "电商平台"');
  log('  node agent-cli.js run meta-agent status\n');
}

function getAvailableAgents() {
  const agents = [];
  const items = fs.readdirSync(BASE_DIR);
  
  items.forEach(item => {
    const itemPath = path.join(BASE_DIR, item);
    if (fs.statSync(itemPath).isDirectory()) {
      const runScript = path.join(itemPath, 'run.js');
      if (fs.existsSync(runScript)) {
        // 读取SKILL.md获取描述
        const skillFile = path.join(itemPath, 'SKILL.md');
        let description = '';
        if (fs.existsSync(skillFile)) {
          const content = fs.readFileSync(skillFile, 'utf8');
          const match = content.match(/description:\s*"([^"]+)"/);
          if (match) description = match[1];
        }
        agents.push({ name: item, description, path: itemPath });
      }
    }
  });
  
  return agents;
}

function showStatus() {
  showBanner();
  log('📊 系统状态总览\n', 'bright');
  
  const agents = getAvailableAgents();
  
  log('┌─────────────────────────────────────────────────────────────┐', 'cyan');
  log('│  Agent名称                状态      管理脚本               │', 'cyan');
  log('├─────────────────────────────────────────────────────────────┤', 'cyan');
  
  agents.forEach(agent => {
    const status = '🟢 就绪';
    const script = 'run.js';
    log(`│  ${agent.name.padEnd(25)} ${status.padEnd(10)} ${script.padEnd(15)} │`, 'cyan');
  });
  
  log('└─────────────────────────────────────────────────────────────┘', 'cyan');
  log(`\n总计: ${agents.length} 个Agent已安装管理脚本`, 'green');
  
  // 尝试调用核心系统状态
  try {
    const coreSystemPath = path.join(BASE_DIR, 'core-agent-system.js');
    if (fs.existsSync(coreSystemPath)) {
      log('\n📊 核心系统状态:', 'bright');
      const result = execSync(`node "${coreSystemPath}" status`, { 
        encoding: 'utf8',
        cwd: BASE_DIR
      });
      console.log(result);
    }
  } catch (error) {
    // 核心系统可能未运行，忽略错误
  }
}

function listAgents() {
  showBanner();
  log('📋 可用Agent列表\n', 'bright');
  
  const agents = getAvailableAgents();
  
  agents.forEach((agent, index) => {
    log(`${index + 1}. ${agent.name}`, 'bright');
    log(`   描述: ${agent.description || '无描述'}`, 'cyan');
    log(`   路径: ${agent.path}`, 'cyan');
    log(`   用法: node agent-cli.js run ${agent.name} [command]\n`, 'yellow');
  });
}

function runAgentCommand(agentName, args) {
  const agentPath = path.join(BASE_DIR, agentName);
  const runScript = path.join(agentPath, 'run.js');
  
  if (!fs.existsSync(runScript)) {
    log(`❌ 错误: Agent "${agentName}" 不存在或没有管理脚本`, 'red');
    log(`   可用Agent: ${getAvailableAgents().map(a => a.name).join(', ')}`, 'yellow');
    process.exit(1);
  }
  
  // 构建命令参数
  const cmdArgs = [runScript, ...args];
  
  try {
    // 使用spawn来实时输出
    const child = spawn('node', cmdArgs, {
      cwd: agentPath,
      stdio: 'inherit'
    });
    
    child.on('error', (error) => {
      log(`❌ 执行失败: ${error.message}`, 'red');
      process.exit(1);
    });
    
    child.on('exit', (code) => {
      process.exit(code);
    });
  } catch (error) {
    log(`❌ 执行失败: ${error.message}`, 'red');
    process.exit(1);
  }
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showHelp();
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'status':
    case 's':
      showStatus();
      break;
      
    case 'list':
    case 'ls':
    case 'l':
      listAgents();
      break;
      
    case 'run':
    case 'r':
      if (args.length < 2) {
        log('❌ 错误: 请指定Agent名称', 'red');
        log('   用法: node agent-cli.js run <agent> [command]', 'yellow');
        process.exit(1);
      }
      runAgentCommand(args[1], args.slice(2));
      break;
      
    case 'help':
    case 'h':
    default:
      showHelp();
      break;
  }
}

main();
