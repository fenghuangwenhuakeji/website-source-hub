/**
 * Agent Loop API 路由
 * 处理文件操作Agent的HTTP请求
 */

import express from 'express';
import { FileOperationsAgent } from '../agents/file-operations-agent';
import { ExecutionContext, AgentThought, ExecutionStep } from '../agents/file-operations-agent/types';

const router = express.Router();

// 存储正在执行的任务（用于流式响应）
const activeExecutions = new Map<string, {
  agent: FileOperationsAgent;
  steps: ExecutionStep[];
  thoughts: Array<AgentThought & { iteration: number }>;
  isComplete: boolean;
  result?: any;
}>();

/**
 * POST /api/agent-loop/execute
 * 执行Agent Loop任务
 */
router.post('/execute', async (req, res) => {
  try {
    const { task, context = {}, enableStreaming = false } = req.body;

    if (!task || typeof task !== 'string') {
      return res.status(400).json({
        success: false,
        error: '缺少任务参数'
      });
    }

    // 创建执行上下文
    const executionContext: ExecutionContext = {
      workingDirectory: context.workingDirectory || process.cwd(),
      variables: context.variables || {},
      history: []
    };

    // 创建Agent实例
    const agent = new FileOperationsAgent();

    // 如果需要流式响应
    if (enableStreaming) {
      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 设置SSE响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const steps: ExecutionStep[] = [];
      const thoughts: Array<AgentThought & { iteration: number }> = [];

      // 存储执行状态
      activeExecutions.set(executionId, {
        agent,
        steps,
        thoughts,
        isComplete: false
      });

      // 发送执行ID
      res.write(`data: ${JSON.stringify({ type: 'init', executionId })}\n\n`);

      try {
        // 执行Agent Loop，使用回调收集中间状态
        const result = await agent.execute(task, {
          ...executionContext,
          onThink: (thought: AgentThought, iteration: number) => {
            const thoughtWithIteration = { ...thought, iteration };
            thoughts.push(thoughtWithIteration);

            // 发送思考事件
            res.write(`data: ${JSON.stringify({
              type: 'think',
              thought: thoughtWithIteration,
              iteration
            })}\n\n`);
          },
          onStep: (step: ExecutionStep, iteration: number) => {
            steps.push(step);

            // 发送步骤事件
            res.write(`data: ${JSON.stringify({
              type: 'step',
              step,
              iteration
            })}\n\n`);
          }
        });

        // 发送完成事件
        res.write(`data: ${JSON.stringify({
          type: 'complete',
          result
        })}\n\n`);

        // 更新执行状态
        const execution = activeExecutions.get(executionId);
        if (execution) {
          execution.isComplete = true;
          execution.result = result;
        }

        res.end();
      } catch (error: any) {
        // 发送错误事件
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: error.message
        })}\n\n`);
        res.end();
      }

      // 清理执行状态（5分钟后）
      setTimeout(() => {
        activeExecutions.delete(executionId);
      }, 5 * 60 * 1000);

      return;
    }

    // 非流式响应
    const steps: ExecutionStep[] = [];
    const thoughts: Array<AgentThought & { iteration: number }> = [];

    const result = await agent.execute(task, executionContext);

    // 返回结果
    res.json({
      success: result.success,
      result: result.result,
      error: result.error,
      steps: result.steps,
      thoughts,
      totalIterations: result.totalIterations,
      executionTime: result.executionTime
    });

  } catch (error: any) {
    console.error('Agent Loop execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '执行失败'
    });
  }
});

/**
 * GET /api/agent-loop/execution/:id
 * 获取执行状态（用于轮询）
 */
router.get('/execution/:id', (req, res) => {
  const { id } = req.params;
  const execution = activeExecutions.get(id);

  if (!execution) {
    return res.status(404).json({
      success: false,
      error: '执行不存在或已过期'
    });
  }

  res.json({
    success: true,
    isComplete: execution.isComplete,
    steps: execution.steps,
    thoughts: execution.thoughts,
    result: execution.result
  });
});

/**
 * GET /api/agent-loop/tools
 * 获取可用工具列表
 */
router.get('/tools', (req, res) => {
  try {
    const agent = new FileOperationsAgent();
    const tools = agent.getAvailableTools();

    res.json({
      success: true,
      tools: tools.map(name => ({
        name,
        icon: getToolIcon(name),
        color: getToolColor(name)
      }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-loop/tool/:name
 * 直接调用特定工具
 */
router.post('/tool/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const params = req.body;

    const agent = new FileOperationsAgent();
    const result = await agent.callTool(name, params);

    res.json({
      success: result.success,
      data: result.data,
      error: result.error,
      metadata: result.metadata
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/agent-loop/cancel/:id
 * 取消执行
 */
router.post('/cancel/:id', (req, res) => {
  const { id } = req.params;

  if (activeExecutions.has(id)) {
    activeExecutions.delete(id);
    res.json({ success: true, message: '执行已取消' });
  } else {
    res.status(404).json({
      success: false,
      error: '执行不存在'
    });
  }
});

// 辅助函数：获取工具图标
function getToolIcon(toolName: string): string {
  const icons: Record<string, string> = {
    read_file: 'FileText',
    write_file: 'Edit3',
    search_replace: 'Search',
    delete_file: 'Trash2',
    glob: 'FolderOpen',
    grep: 'Search',
    list_directory: 'FolderOpen',
    diff: 'GitCompare',
    run_command: 'Command'
  };
  return icons[toolName] || 'Zap';
}

// 辅助函数：获取工具颜色
function getToolColor(toolName: string): string {
  const colors: Record<string, string> = {
    read_file: '#3b82f6',
    write_file: '#10b981',
    search_replace: '#f59e0b',
    delete_file: '#ef4444',
    glob: '#8b5cf6',
    grep: '#ec4899',
    list_directory: '#06b6d4',
    diff: '#f97316',
    run_command: '#6366f1'
  };
  return colors[toolName] || '#666';
}

export default router;
