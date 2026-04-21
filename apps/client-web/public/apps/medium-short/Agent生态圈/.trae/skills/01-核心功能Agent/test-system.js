#!/usr/bin/env node
/**
 * 核心Agent系统测试脚本
 */

const { CoreAgentSystem, CORE_AGENTS, WORKFLOWS } = require('./core-agent-system');

async function runTests() {
  console.log('🧪 开始测试核心Agent系统...\n');

  const system = new CoreAgentSystem();
  
  // 测试1: 系统状态
  console.log('测试1: 系统状态检查');
  const stats = system.getSystemStats();
  console.log('✅ 系统状态:', stats);
  console.log();

  // 测试2: 添加单个任务
  console.log('测试2: 添加单个任务');
  const taskId = system.addTask('generate-agent', 'agent-generator', {
    name: 'test-agent',
    title: 'Test Agent',
    description: 'A test agent for validation'
  }, 'high');
  console.log('✅ 任务已添加:', taskId);
  console.log();

  // 测试3: 批量添加任务
  console.log('测试3: 批量添加任务');
  const taskIds = system.addTasks([
    { type: 'create-plan', agent: 'plan-agent', config: { project: 'Test Project' } },
    { type: 'write-spec', agent: 'spec-agent', config: { title: 'Test Spec' } }
  ]);
  console.log('✅ 批量任务已添加:', taskIds);
  console.log();

  // 测试4: 检查任务状态
  console.log('测试4: 检查任务状态');
  const taskStatus = system.getTaskStatus(taskId);
  console.log('✅ 任务状态:', taskStatus ? taskStatus.status : 'not found');
  console.log();

  // 测试5: 系统事件监听
  console.log('测试5: 系统事件监听');
  system.on('taskAdded', (task) => {
    console.log('📢 事件: 任务已添加', task.id);
  });
  system.on('taskCompleted', (task) => {
    console.log('📢 事件: 任务已完成', task.id);
  });
  
  const eventTaskId = system.addTask('debug-code', 'debug-agent', {
    issues: ['Test issue']
  }, 'medium');
  console.log('✅ 事件监听测试任务:', eventTaskId);
  console.log();

  // 显示最终状态
  console.log('最终系统状态:');
  system.showSystemStatus();

  console.log('✅ 所有测试完成!');
}

runTests().catch(err => {
  console.error('❌ 测试失败:', err);
  process.exit(1);
});