#!/usr/bin/env node
/**
 * Spec Agent 管理脚本
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
║              📝 Spec Agent 管理器                            ║
║                   智能规格定义工具                            ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showHelp() {
  showBanner();
  log('用法: node run.js [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  create <title>       创建规格文档');
  log('  api <endpoint>       定义API接口');
  log('  model <name>         定义数据模型');
  log('  validate <file>      验证规格文档');
  log('  status               查看系统状态');
  log('  help                 显示帮助信息\n');
  log('示例:', 'bright');
  log('  node run.js create "用户管理系统"');
  log('  node run.js api "/api/users"\n');
}

function createSpec(title, options = {}) {
  if (!title) {
    log('❌ 错误: 请提供规格标题', 'red');
    process.exit(1);
  }

  log(`📝 创建规格文档: ${title}\n`, 'green');

  const spec = {
    title: title,
    version: '1.0.0',
    requirements: options.requirements || ['功能需求1', '功能需求2'],
    acceptanceCriteria: options.criteria || ['验收标准1'],
    created: new Date().toISOString()
  };

  const outputDir = path.join(__dirname, '..', 'workspace', 'specs');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const specFile = path.join(outputDir, `${title.replace(/\s+/g, '-').toLowerCase()}-spec.md`);
  
  const content = `# ${spec.title}

## 版本
${spec.version}

## 需求列表
${spec.requirements.map(r => `- ${r}`).join('\n')}

## 验收标准
${spec.acceptanceCriteria.map(c => `- [ ] ${c}`).join('\n')}

## 创建时间
${spec.created}
`;

  fs.writeFileSync(specFile, content);

  log(`✅ 规格文档创建成功！`, 'green');
  log(`📁 文档路径: ${specFile}`, 'cyan');
}

function showStatus() {
  try {
    const result = execSync(`node "${CORE_SYSTEM_PATH}" status`, { 
      encoding: 'utf8',
      cwd: path.dirname(CORE_SYSTEM_PATH)
    });
    console.log(result);
  } catch (error) {
    log('\n📝 Spec Agent 状态:', 'bright');
    log('  状态: 🟢 就绪', 'green');
    log('  功能: 规格定义、API设计、数据建模', 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'create':
    case 'c':
      showBanner();
      createSpec(args[1]);
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
