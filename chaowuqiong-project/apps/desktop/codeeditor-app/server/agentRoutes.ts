import express from 'express';
import { agentRegistry } from './agentRegistry';
import { autoExecutionEngine } from './autoExecutionEngine';
import { agentRouter } from './agentRouter';
import type { AgentExecutionContext } from './agentRegistryTypes';

const router = express.Router();

router.get('/scan', async (req, res) => {
  try {
    const agents = agentRegistry.getAllAgents();
    res.json({
      success: true,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        tags: a.tags,
        icon: a.icon,
        capabilities: a.capabilities,
        priority: a.priority,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/execute', async (req, res) => {
  try {
    const { agentId, context, config } = req.body;

    const execContext: AgentExecutionContext = {
      taskId: context.taskId || `task-${Date.now()}`,
      userId: context.userId,
      projectId: context.projectId,
      currentFile: context.currentFile,
      selectedCode: context.selectedCode,
      language: context.language,
      workingDirectory: context.workingDirectory,
      environment: context.environment,
    };

    const result = await autoExecutionEngine.execute(agentId, execContext);

    res.json({
      success: result.success,
      output: result.output,
      error: result.error,
      toolCalls: result.toolCalls,
      toolResults: result.toolResults,
      metadata: result.metadata,
      duration: result.duration,
      agentUsed: result.agentUsed,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/execute-auto', async (req, res) => {
  try {
    const { message, context } = req.body;

    const execContext: AgentExecutionContext = {
      taskId: context.taskId || `auto-${Date.now()}`,
      userId: context.userId,
      projectId: context.projectId,
      currentFile: context.currentFile,
      selectedCode: context.selectedCode,
      language: context.language,
      workingDirectory: context.workingDirectory,
    };

    const result = await autoExecutionEngine.executeAuto(message, execContext);

    res.json({
      success: result.success,
      output: result.output,
      error: result.error,
      agentUsed: result.agentUsed,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/workflow/:workflowId', async (req, res) => {
  try {
    const { workflowId } = req.params;
    const { context } = req.body;

    const execContext: AgentExecutionContext = {
      taskId: context.taskId || `workflow-${Date.now()}`,
      userId: context.userId,
      projectId: context.projectId,
      currentFile: context.currentFile,
      selectedCode: context.selectedCode,
    };

    const results = await autoExecutionEngine.executeWorkflow(workflowId, execContext);

    res.json({
      success: results.every(r => r.success),
      results,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/agents', (req, res) => {
  try {
    const { category, capability, tags, search } = req.query;

    let agents = agentRegistry.getAllAgents();

    if (category && typeof category === 'string') {
      agents = agentRegistry.getAgentsByCategory(category);
    }

    if (capability && typeof capability === 'string') {
      agents = agentRegistry.getAgentsByCapability(capability);
    }

    if (tags && typeof tags === 'string') {
      agents = agentRegistry.getAgentsByTags(tags.split(','));
    }

    if (search && typeof search === 'string') {
      agents = agentRegistry.searchAgents(search);
    }

    res.json({
      success: true,
      agents: agents.map(a => ({
        id: a.id,
        name: a.name,
        description: a.description,
        category: a.category,
        tags: a.tags,
        icon: a.icon,
        priority: a.priority,
      })),
      total: agents.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/agents/:agentId', (req, res) => {
  try {
    const { agentId } = req.params;
    const agent = agentRegistry.getAgent(agentId);

    if (!agent) {
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const metrics = agentRegistry.getMetrics(agentId);

    res.json({
      success: true,
      agent,
      metrics,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/categories', (req, res) => {
  try {
    const categories = agentRegistry.getCategories();
    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/workflows', (req, res) => {
  try {
    const workflows = agentRegistry.getWorkflows();
    res.json({
      success: true,
      workflows,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/workflows/:workflowId', (req, res) => {
  try {
    const { workflowId } = req.params;
    const workflow = agentRegistry.getWorkflow(workflowId);

    if (!workflow) {
      return res.status(404).json({ success: false, error: 'Workflow not found' });
    }

    res.json({
      success: true,
      workflow,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/queue', (req, res) => {
  try {
    const status = autoExecutionEngine.getQueueStatus();
    res.json({
      success: true,
      ...status,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/logs', (req, res) => {
  try {
    const { agentId, limit = 100 } = req.query;

    const logs = agentId && typeof agentId === 'string'
      ? autoExecutionEngine.getAgentLogs(agentId, Number(limit))
      : autoExecutionEngine.getLogs(Number(limit));

    res.json({
      success: true,
      logs,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.get('/health', (req, res) => {
  try {
    const healthStatus = autoExecutionEngine.getHealthStatus();
    const healthArray = Array.from(healthStatus.values());

    res.json({
      success: true,
      health: healthArray,
      summary: {
        total: healthArray.length,
        healthy: healthArray.filter(h => h.status === 'healthy').length,
        degraded: healthArray.filter(h => h.status === 'degraded').length,
        unhealthy: healthArray.filter(h => h.status === 'unhealthy').length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/suggest', (req, res) => {
  try {
    const { message, context } = req.body;

    const execContext: AgentExecutionContext = {
      taskId: 'suggestion',
      currentFile: context?.currentFile,
      selectedCode: context?.selectedCode,
      language: context?.language,
    };

    const suggestions = agentRouter.suggestAgents(message || '', execContext);

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

router.post('/cancel/:executionId', (req, res) => {
  try {
    const { executionId } = req.params;
    const cancelled = autoExecutionEngine.cancelExecution(executionId);

    res.json({
      success: cancelled,
      message: cancelled ? '执行已取消' : '未找到执行任务',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

export default router;
