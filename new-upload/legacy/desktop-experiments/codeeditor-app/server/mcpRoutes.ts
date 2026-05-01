import { Router, Request, Response } from 'express';
import { MCPClient } from '../mcp/client';
import { MCPServiceManager } from '../mcp/service';
import { MCPContextManager } from '../mcp/context';
import { MCPToolRegistry } from '../mcp/tools';

const router = Router();

const mcpClient = new MCPClient();
const serviceManager = new MCPServiceManager();
const contextManager = new MCPContextManager();
const toolRegistry = new MCPToolRegistry();

router.get('/connections', async (req: Request, res: Response) => {
  try {
    const connections = serviceManager.getAllServices();
    res.json({
      success: true,
      connections: connections.map((conn) => ({
        id: conn.id,
        name: conn.name,
        status: conn.status,
        type: conn.transport,
        connectedAt: conn.connectedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/connect', async (req: Request, res: Response) => {
  try {
    const { name, transport, config } = req.body;

    if (!name || !transport || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, transport, config',
      });
    }

    const service = await serviceManager.registerService({
      name,
      transport,
      config,
    });

    res.json({
      success: true,
      connection: {
        id: service.id,
        name: service.name,
        status: service.status,
        type: service.transport,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect',
    });
  }
});

router.post('/disconnect/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await serviceManager.unregisterService(id);

    res.json({
      success: true,
      message: `Connection ${id} disconnected`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disconnect',
    });
  }
});

router.get('/tools', async (req: Request, res: Response) => {
  try {
    const tools = toolRegistry.getAllTools();
    res.json({
      success: true,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/tools/call', async (req: Request, res: Response) => {
  try {
    const { name, arguments: args } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: name',
      });
    }

    const result = await toolRegistry.executeTool(name, args || {});

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Tool execution failed',
    });
  }
});

router.get('/context/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const context = contextManager.getContext(sessionId);

    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Context not found',
      });
    }

    res.json({
      success: true,
      context,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/context', async (req: Request, res: Response) => {
  try {
    const { sessionId, context } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: sessionId',
      });
    }

    contextManager.setContext(sessionId, context);

    res.json({
      success: true,
      message: 'Context updated',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update context',
    });
  }
});

router.post('/context/:sessionId/clear', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    contextManager.clearContext(sessionId);

    res.json({
      success: true,
      message: 'Context cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to clear context',
    });
  }
});

export default router;
