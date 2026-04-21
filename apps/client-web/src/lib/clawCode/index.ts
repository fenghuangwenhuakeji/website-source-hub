/**
 * Claw Code - Main Export
 * 基于 Claw Code 架构的 AI 编程助手核心系统 - 超强增强版
 * 
 * 功能特性：
 * - 200+ 命令支持
 * - 150+ 工具支持
 * - 真实工具执行
 * - 智能路由
 * - LLM集成
 * - 流式输出
 * - Agent编排
 * - 会话管理
 * - 批处理系统
 * - 工作流引擎
 * - 插件系统
 * - 性能分析
 */

// 核心类型
export * from './types';

// 命令系统
export * from './commands';

// 工具系统
export * from './tools';

// 工具执行器
export * from './toolExecutors';

// 运行时系统
export * from './runtime';

// 查询引擎
export * from './queryEngine';

// 会话存储
export * from './sessionStore';

// 执行注册表
export * from './executionRegistry';

// React Hooks
export * from './hooks';

// 高级功能
export * from './advanced';

// 版本信息
export const VERSION = '3.0.0-ultra';
export const CODENAME = 'Dragon';

// 系统统计
export function getSystemStats() {
  return {
    version: VERSION,
    codename: CODENAME,
    timestamp: Date.now(),
  };
}

// 功能特性列表
export const FEATURES = [
  '200+ 命令',
  '150+ 工具',
  '智能路由',
  '流式输出',
  '批处理',
  '工作流',
  '插件系统',
  '性能分析',
] as const;
