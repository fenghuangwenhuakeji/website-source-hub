#!/usr/bin/env node
/**
 * Debug Agent 管理脚本
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
║              🐛 Debug Agent 管理器                           ║
║                   智能调试诊断工具                            ║
╚══════════════════════════════════════════════════════════════╝
`);
}

function showHelp() {
  showBanner();
  log('用法: node run.js [command] [options]\n', 'bright');
  log('命令:', 'bright');
  log('  analyze <file>       分析错误日志');
  log('  fix <error>          提供修复建议');
  log('  check <dir>          代码质量检查');
  log('  test <path>          运行测试诊断');
  log('  status               查看系统状态');
  log('  help                 显示帮助信息\n');
  log('示例:', 'bright');
  log('  node run.js analyze ./error.log');
  log('  node run.js fix "Cannot read property of undefined"\n');
}

function analyzeError(errorMessage, options = {}) {
  if (!errorMessage) {
    log('❌ 错误: 请提供错误信息', 'red');
    process.exit(1);
  }

  log(`🔍 分析错误...\n`, 'yellow');

  // 简单的错误分析逻辑
  const analysis = {
    error: errorMessage,
    type: 'Unknown',
    severity: 'medium',
    suggestions: [],
    timestamp: new Date().toISOString()
  };

  if (errorMessage.includes('Cannot read property') || errorMessage.includes('of undefined')) {
    analysis.type = 'Null Reference';
    analysis.severity = 'high';
    analysis.suggestions = [
      '使用可选链操作符 (?.)',
      '添加空值检查',
      '使用TypeScript严格模式'
    ];
  } else if (errorMessage.includes('not found') || errorMessage.includes('Cannot find module')) {
    analysis.type = 'Module Not Found';
    analysis.severity = 'high';
    analysis.suggestions = [
      '检查模块名称拼写',
      '运行 npm install 安装依赖',
      '检查文件路径是否正确'
    ];
  }

  log(`📊 分析结果:\n`, 'bright');
  log(`  错误类型: ${analysis.type}`, 'cyan');
  log(`  严重程度: ${analysis.severity}`, analysis.severity === 'high' ? 'red' : 'yellow');
  log(`\n💡 修复建议:`, 'bright');
  analysis.suggestions.forEach((suggestion, i) => {
    log(`  ${i + 1}. ${suggestion}`, 'green');
  });

  // 保存分析报告
  const outputDir = path.join(__dirname, '..', 'workspace', 'debug-reports');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const reportFile = path.join(outputDir, `debug-report-${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(analysis, null, 2));
  log(`\n📁 报告已保存: ${reportFile}`, 'cyan');
}

function showStatus() {
  try {
    const result = execSync(`node "${CORE_SYSTEM_PATH}" status`, { 
      encoding: 'utf8',
      cwd: path.dirname(CORE_SYSTEM_PATH)
    });
    console.log(result);
  } catch (error) {
    log('\n🐛 Debug Agent 状态:', 'bright');
    log('  状态: 🟢 就绪', 'green');
    log('  功能: 错误分析、修复建议、代码检查', 'cyan');
  }
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'analyze':
    case 'a':
      showBanner();
      analyzeError(args[1]);
      break;
    case 'fix':
    case 'f':
      showBanner();
      analyzeError(args[1]);
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
