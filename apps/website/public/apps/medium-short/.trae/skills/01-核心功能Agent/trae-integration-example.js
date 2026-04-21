#!/usr/bin/env node
/**
 * Trae Integration Example - 在Trae对话中使用Agent的示例
 * 
 * 这个文件展示了如何在Trae对话中直接调用和监督Agent
 */

const { run, smart, flow, batch, report, list } = require('./trae-agent-supervisor');

// 示例1: 直接执行Agent
async function example1() {
  console.log('=== 示例1: 直接执行Agent ===\n');
  
  // 生成一个Agent
  await run('agent-generator', 'generate', { name: 'example-agent' });
}

// 示例2: 智能执行（自动选择Agent）
async function example2() {
  console.log('\n=== 示例2: 智能执行 ===\n');
  
  // 系统会自动选择合适的Agent
  await smart('生成一个测试Agent');
}

// 示例3: 执行工作流
async function example3() {
  console.log('\n=== 示例3: 执行工作流 ===\n');
  
  // 执行创建Agent的完整工作流
  await flow('create-agent', { name: 'workflow-agent' });
}

// 示例4: 批量执行
async function example4() {
  console.log('\n=== 示例4: 批量执行 ===\n');
  
  const tasks = [
    { agent: 'agent-generator', command: 'generate', args: { name: 'agent-1' } },
    { agent: 'plan-agent', command: 'create', args: { name: 'plan-1' } },
    { agent: 'spec-agent', command: 'create', args: { name: 'spec-1' } }
  ];
  
  await batch(tasks);
}

// 示例5: 查看状态
async function example5() {
  console.log('\n=== 示例5: 查看执行状态 ===\n');
  
  report();
}

// 示例6: 列出Agent
async function example6() {
  console.log('\n=== 示例6: 列出可用Agent ===\n');
  
  list();
}

// 主函数
async function main() {
  const examples = {
    '1': example1,
    '2': example2,
    '3': example3,
    '4': example4,
    '5': example5,
    '6': example6,
    'all': async () => {
      await example1();
      await example2();
      await example3();
      await example4();
      await example5();
      await example6();
    }
  };

  const args = process.argv.slice(2);
  const exampleNum = args[0] || 'all';

  if (examples[exampleNum]) {
    await examples[exampleNum]();
  } else {
    console.log('Trae Agent Integration Example');
    console.log('\n用法: node trae-integration-example.js [示例编号]');
    console.log('\n可用示例:');
    console.log('  1 - 直接执行Agent');
    console.log('  2 - 智能执行（自动选择Agent）');
    console.log('  3 - 执行工作流');
    console.log('  4 - 批量执行');
    console.log('  5 - 查看状态');
    console.log('  6 - 列出Agent');
    console.log('  all - 运行所有示例');
  }
}

main().catch(console.error);
