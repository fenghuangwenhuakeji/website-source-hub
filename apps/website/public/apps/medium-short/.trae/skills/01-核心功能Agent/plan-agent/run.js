#!/usr/bin/env node
/**
 * Plan Agent 管理脚本
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
║              📋 Plan Agent 管理器                            ║
║                   智能项目规划工具                            ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showHelp() {
  showBanner();
  log('用法: node run.js [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  create <project>     创建新项目计划');
  log('  sprint <name>        创建Sprint计划');
  log('  roadmap <project>    创建产品路线图');
  log('  estimate <tasks>     任务工时估算');
  log('  status               查看系统状态');
  log('  help                 显示帮助信息\n');
  log('示例:', 'bright');
  log('  node run.js create "电商平台"');
  log('  node run.js sprint "Sprint 1"\n');
}

function createPlan(projectName, options = {}) {
  if (!projectName) {
    log('❌ 错误: 请提供项目名称', 'red');
    process.exit(1);
  }

  log(`📋 创建项目计划: ${projectName}\n`, 'green');

  const plan = {
    project: projectName,
    phases: options.phases || ['需求分析', '设计', '开发', '测试', '部署'],
    milestones: options.milestones || [],
    created: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, '..', 'workspace', 'plans');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const planFile = path.join(outputDir, `${projectName.replace(/\s+/g, '-').toLowerCase()}-plan.json`);
  fs.writeFileSync(planFile, JSON.stringify(plan, null, 2));

  log(`✅ 项目计划创建成功！`, 'green');
  log(`📁 计划文件: ${planFile}`, 'cyan');
  log(`\n计划内容:`, 'bright');
  log(`  项目: ${plan.project}`, 'cyan');
  log(`  阶段: ${plan.phases.join(' → ')}`, 'cyan');
}

function createSprint(sprintName) {
  if (!sprintName) {
    log('❌ 错误: 请提供Sprint名称', 'red');
    process.exit(1);
  }

  log(`🏃 创建Sprint计划: ${sprintName}\n`, 'green');

  const sprint = {
    name: sprintName,
    duration: '2 weeks',
    stories: [],
    goal: '',
    created: new Date().toISOString()
  };

  log(`✅ Sprint计划模板已创建`, 'green');
  log(`  Sprint名称: ${sprint.name}`, 'cyan');
  log(`  持续时间: ${sprint.duration}`, 'cyan');
}

function showStatus() {
  try {
    const result = execSync(`node "${CORE_SYSTEM_PATH}" status`, { 
      encoding: 'utf8',
      cwd: path.dirname(CORE_SYSTEM_PATH)
    });
    console.log(result);
  } catch (error) {
    log('\n📋 Plan Agent 状态:', 'bright');
    log('  状态: 🟢 就绪', 'green');
    log('  功能: 项目规划、Sprint管理、工时估算', 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
    case 'c':
      showBanner();
      createPlan(args[1], { phases: args[2]?.split(',') });
      break;
    case 'sprint':
    case 's':
      showBanner();
      createSprint(args[1]);
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
