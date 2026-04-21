#!/usr/bin/env node
/**
 * Trae Agent Supervisor 演示执行脚本
 */

const { run, smart, flow, report, list } = require('./trae-agent-supervisor');

async function main() {
  console.log('🚀 启动 Trae Agent Supervisor 演示\n');
  
  // 1. 首先列出可用Agent
  console.log('📋 步骤1: 列出可用Agent');
  list();
  
  // 2. 直接执行Agent生成
  console.log('\n🤖 步骤2: 直接执行Agent生成');
  try {
    await run('agent-generator', 'generate', { name: 'trae-demo-agent' });
  } catch (e) {
    console.log('执行失败:', e.message);
  }
  
  // 3. 智能执行
  console.log('\n🧠 步骤3: 智能执行（自动选择Agent）');
  try {
    await smart('生成一个测试Agent');
  } catch (e) {
    console.log('执行失败:', e.message);
  }
  
  // 4. 执行工作流
  console.log('\n🔄 步骤4: 执行工作流');
  try {
    await flow('create-agent', { name: 'workflow-test-agent' });
  } catch (e) {
    console.log('执行失败:', e.message);
  }
  
  // 5. 查看状态报告
  console.log('\n📊 步骤5: 查看执行状态报告');
  report();
  
  console.log('\n✅ 演示完成！');
}

main().catch(console.error);
