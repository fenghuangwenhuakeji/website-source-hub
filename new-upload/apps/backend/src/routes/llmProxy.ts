import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';

const router = Router();

type ProxyMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_call_id?: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: {
      name: string;
      arguments: string;
    };
  }>;
};

type ProxyTool = {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

const OPENAI_DEFAULT_BASE_URL = 'https://api.openai.com';

function resolveChatCompletionsEndpoint(baseUrl: string): string {
  let url = (baseUrl || OPENAI_DEFAULT_BASE_URL).trim();
  if (!url) {
    url = OPENAI_DEFAULT_BASE_URL;
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  // 如果已经包含 /chat/completions，直接返回，避免重复拼接
  if (url.includes('/chat/completions')) {
    return url;
  }
  const hasVersion = /\/(v\d+|chat)\/?$/.test(url);
  if (!hasVersion) {
    return `${url}/v1/chat/completions`;
  }
  return `${url}/chat/completions`;
}

function resolveAnthropicEndpoint(baseUrl: string): string {
  let url = (baseUrl || 'https://api.anthropic.com').trim();
  if (!url) {
    url = 'https://api.anthropic.com';
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.includes('/v1/messages')) {
    return `${url}/v1/messages`;
  }
  return url;
}

function resolveMiniMaxEndpoint(baseUrl: string): string {
  let url = (baseUrl || 'https://api.minimaxi.com/v1').trim();
  if (!url) {
    url = 'https://api.minimaxi.com/v1';
  }
  if (url.endsWith('/')) {
    url = url.slice(0, -1);
  }
  if (!url.includes('/text/chatcompletion_v2')) {
    return `${url}/text/chatcompletion_v2`;
  }
  return url;
}

function parseHeaderPairs(input: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const delimiter = input.includes('\n') ? /\r?\n/ : input.includes(';') ? /;/ : /,/;
  const lines = input.split(delimiter);
  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(':') >= 0 ? trimmed.indexOf(':') : trimmed.indexOf('=');
    if (separatorIndex <= 0) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const val = trimmed.slice(separatorIndex + 1).trim();
    if (!key) continue;
    headers[key] = val;
  }
  return headers;
}

function parseCustomHeaders(raw?: unknown): Record<string, string> {
  if (!raw) return {};
  if (typeof raw === 'object' && raw !== null) {
    return Object.entries(raw as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, value]) => {
      if (!key) return acc;
      acc[key] = String(value);
      return acc;
    }, {});
  }
  if (typeof raw !== 'string') return {};
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.startsWith('{')) {
    try {
      return parseCustomHeaders(JSON.parse(trimmed));
    } catch {
      return parseHeaderPairs(trimmed);
    }
  }
  return parseHeaderPairs(trimmed);
}

function normalizeAnthropicMessages(messages: ProxyMessage[] = []) {
  const system = messages
    .filter((message) => message.role === 'system' && message.content)
    .map((message) => message.content)
    .join('\n\n');

  const normalizedMessages = messages
    .filter((message) => message.role !== 'system')
    .map((message) => {
      if (message.role === 'tool') {
        return {
          role: 'user' as const,
          content: [
            {
              type: 'tool_result' as const,
              tool_use_id: message.tool_call_id,
              content: message.content,
            },
          ],
        };
      }

      if (message.role === 'assistant' && Array.isArray(message.tool_calls) && message.tool_calls.length > 0) {
        return {
          role: 'assistant' as const,
          content: [
            ...(message.content ? [{ type: 'text' as const, text: message.content }] : []),
            ...message.tool_calls.map((toolCall) => ({
              type: 'tool_use' as const,
              id: toolCall.id,
              name: toolCall.function.name,
              input: JSON.parse(toolCall.function.arguments || '{}'),
            })),
          ],
        };
      }

      return {
        role: message.role as 'user' | 'assistant',
        content: message.content,
      };
    });

  return { system, normalizedMessages };
}

function normalizeAnthropicTools(tools: ProxyTool[] = []) {
  return tools.map((tool) => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters,
  }));
}

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const {
      messages,
      model,
      stream,
      temperature,
      max_tokens,
      maxTokens,
      provider,
      baseUrl: reqBaseUrl,
      targetUrl,
      apiKey: reqApiKey,
      customHeaders,
      tools,
    } = req.body as {
      messages?: ProxyMessage[];
      model?: string;
      stream?: boolean;
      temperature?: number;
      max_tokens?: number;
      maxTokens?: number;
      provider?: string;
      baseUrl?: string;
      targetUrl?: string;
      apiKey?: string;
      customHeaders?: string | Record<string, unknown>;
      tools?: ProxyTool[];
    };

    const apiKey = reqApiKey || process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';
    const requestedBaseUrl = reqBaseUrl || targetUrl || process.env.LLM_BASE_URL || OPENAI_DEFAULT_BASE_URL;
    const modelName = model || process.env.LLM_MODEL || 'gpt-4o';
    const reqProvider = provider || 'openai';
    const resolvedMaxTokens =
      typeof max_tokens === 'number'
        ? max_tokens
        : typeof maxTokens === 'number'
          ? maxTokens
          : 4096;

    if (!apiKey) {
      return res.json({
        success: true,
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: 'LLM API 未配置，请先在设置中填写密钥与地址。',
            },
          }],
        },
      });
    }

    let apiUrl = resolveChatCompletionsEndpoint(requestedBaseUrl);
    let requestBody: Record<string, unknown> = {
      model: modelName,
      messages: messages || [],
      stream: stream || false,
      temperature: typeof temperature === 'number' ? temperature : 0.7,
      max_tokens: resolvedMaxTokens,
    };

    if (Array.isArray(tools) && tools.length > 0 && reqProvider !== 'minimax') {
      requestBody.tools = tools;
    }

    if (reqProvider === 'minimax' || requestedBaseUrl.includes('minimaxi')) {
      apiUrl = resolveMiniMaxEndpoint(requestedBaseUrl);
      requestBody = {
        model: modelName,
        messages: messages || [],
        temperature: typeof temperature === 'number' ? temperature : 0.7,
        max_tokens: resolvedMaxTokens,
      };
    } else if (reqProvider === 'anthropic') {
      const { system, normalizedMessages } = normalizeAnthropicMessages(messages || []);
      const anthropicTools = normalizeAnthropicTools(tools || []);

      apiUrl = resolveAnthropicEndpoint(requestedBaseUrl);
      requestBody = {
        model: modelName,
        max_tokens: resolvedMaxTokens || 4096,
        messages: normalizedMessages,
      };

      if (typeof temperature === 'number') {
        requestBody.temperature = temperature;
      }
      if (system) {
        requestBody.system = system;
      }
      if (anthropicTools.length > 0) {
        requestBody.tools = anthropicTools;
      }
    }

    console.log(`LLM Proxy: Calling ${apiUrl} with model ${modelName} (provider: ${reqProvider})`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    };

    if (reqProvider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = '2023-06-01';
      delete headers.Authorization;
    }

    Object.assign(headers, parseCustomHeaders(customHeaders));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('LLM API error:', errorText);
      return res.json({
        success: true,
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content: `LLM API 调用失败: ${response.status} - ${errorText}`,
            },
          }],
        },
      });
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const reader = response.body?.getReader();
      if (!reader) {
        res.write(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
        return res.end();
      }

      const decoder = new TextDecoder();
      let chunkIndex = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunkIndex++;
        const chunk = decoder.decode(value, { stream: true });
        console.log(`[LLM Stream] Chunk ${chunkIndex} (${chunk.length} chars):`, chunk.substring(0, 300).replace(/\n/g, '\\n'));
        res.write(chunk);
      }
      res.write(decoder.decode());
      console.log(`[LLM Stream] Finished after ${chunkIndex} chunks`);
      res.end();
      return;
    }

    const data = await response.json() as any;

    if (reqProvider === 'anthropic') {
      let content = '';
      const toolCalls: any[] = [];

      for (const block of data.content || []) {
        if (block.type === 'text') {
          content += block.text;
        } else if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            type: 'function',
            function: {
              name: block.name,
              arguments: JSON.stringify(block.input),
            },
          });
        }
      }

      return res.json({
        success: true,
        data: {
          choices: [{
            message: {
              role: 'assistant',
              content,
              tool_calls: toolCalls,
            },
          }],
        },
      });
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('LLM proxy error:', error);
    return res.json({
      success: true,
      data: {
        choices: [{
          message: {
            role: 'assistant',
            content: `LLM 代理错误: ${error.message}`,
          },
        }],
      },
    });
  }
});

router.post('/stream', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { messages, model, temperature, max_tokens } = req.body;

    const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY || '';
    const baseUrl = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'LLM API key not configured',
      });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model || 'gpt-3.5-turbo',
        messages: messages || [],
        stream: true,
        temperature: temperature || 0.7,
        max_tokens: max_tokens || 2000,
      }),
    });

    if (!response.ok) {
      res.write(`data: ${JSON.stringify({ error: 'API request failed' })}\n\n`);
      return res.end();
    }

    const reader = response.body?.getReader();
    if (!reader) {
      res.write(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`);
      return res.end();
    }

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value));
    }
    res.end();
  } catch (error: any) {
    console.error('LLM proxy stream error:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

export default router;
