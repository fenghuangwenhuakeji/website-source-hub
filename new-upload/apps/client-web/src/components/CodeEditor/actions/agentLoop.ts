import { generateId, createAppFileApi } from '@/lib';
import {
  type LLMConfig,
  type AgentMessage,
  type ToolCall,
  type ToolResult,
  MAX_AGENT_LOOPS,
} from './agentConstants';
import { executeTool, TOOL_NAMES } from './agentTools';

const fileApi = createAppFileApi('codeEditor');

// Agent 流式输出回调
export interface AgentStreamCallbacks {
  onStart: () => void;
  onToken: (token: string, fullContent: string) => void;
  onToolCall: (toolCall: ToolCall) => void;
  onToolResult: (result: ToolResult) => void;
  onComplete: (finalContent: string) => void;
  onError: (error: string) => void;
}

// 解析工具调用
interface ParsedToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

function parseToolCallsFromContent(content: string): ParsedToolCall[] {
  const toolCalls: ParsedToolCall[] = [];

  // 匹配 ```json 代码块
  const jsonMatches = content.matchAll(/```(?:json)?\s*\n?([\s\S]*?)\n?```/g);
  for (const match of jsonMatches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (parsed.tool && TOOL_NAMES.includes(parsed.tool)) {
        toolCalls.push({
          name: parsed.tool,
          arguments: parsed.args || {},
        });
      }
    } catch {
      // 忽略解析错误
    }
  }

  // 匹配内联 JSON
  if (toolCalls.length === 0) {
    const inlineMatch = content.match(/\{\s*"tool"\s*:\s*"(\w+)"[\s\S]*?"args"\s*:\s*(\{[\s\S]*?\})\s*\}/);
    if (inlineMatch) {
      try {
        toolCalls.push({
          name: inlineMatch[1],
          arguments: JSON.parse(inlineMatch[2]),
        });
      } catch {
        // 忽略
      }
    }
  }

  return toolCalls;
}

// 流式调用 LLM
export async function streamLLM(
  messages: { role: string; content: string }[],
  config: LLMConfig,
  callbacks: AgentStreamCallbacks
): Promise<void> {
  const { onStart, onToken, onComplete, onError } = callbacks;

  try {
    onStart();

    // 构建目标URL
    let targetUrl = config.baseUrl;
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.slice(0, -1);
    }
    const hasVersion = /\/(v\d+|chat)\/?$/.test(targetUrl);
    if (!hasVersion) {
      targetUrl = `${targetUrl}/v1/chat/completions`;
    } else if (!targetUrl.includes('/chat/completions')) {
      targetUrl = `${targetUrl}/chat/completions`;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        ...(config.customHeaders ? parseCustomHeaders(config.customHeaders) : {}),
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: config.systemPrompt },
          ...messages,
        ],
        stream: true,
        max_tokens: config.maxTokens,
        temperature: config.temperature,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error?.message || `API错误: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    if (!reader) {
      throw new Error('无法读取响应流');
    }

    // 实时流式读取
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.text || '';
            if (content) {
              fullContent += content;
              // 实时回调每个 token
              onToken(content, fullContent);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

    onComplete(fullContent);
  } catch (error) {
    onError(error instanceof Error ? error.message : String(error));
  }
}

// 运行 Agent Loop（支持实时流式输出）
export async function runAgentLoop(
  userMessage: string,
  history: AgentMessage[],
  config: LLMConfig,
  callbacks: AgentStreamCallbacks & {
    onThinking?: () => void;
  }
): Promise<void> {
  const { onThinking, onToolCall, onToolResult } = callbacks;

  let loopCount = 0;
  const conversationHistory = [...history];

  // 添加用户消息到历史
  conversationHistory.push({
    id: generateId(),
    role: 'user',
    content: userMessage,
    timestamp: Date.now(),
  });

  while (loopCount < MAX_AGENT_LOOPS) {
    loopCount++;
    onThinking?.();

    // 构建 API 消息格式
    const apiMessages = conversationHistory
      .filter((m) => m.role !== 'tool')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

    // 用于收集本次 LLM 的完整回复
    let assistantContent = '';
    let hasToolCall = false;

    // 流式调用 LLM
    await new Promise<void>((resolve, reject) => {
      streamLLM(apiMessages, config, {
        onStart: () => {
          callbacks.onStart();
        },
        onToken: (token, fullContent) => {
          assistantContent = fullContent;
          callbacks.onToken(token, fullContent);
        },
        onComplete: (finalContent) => {
          assistantContent = finalContent;
          resolve();
        },
        onError: (error) => {
          callbacks.onError(error);
          reject(new Error(error));
        },
      });
    });

    if (!assistantContent.trim()) {
      callbacks.onComplete('抱歉，我没有收到有效的回复。');
      return;
    }

    // 解析工具调用
    const toolCalls = parseToolCallsFromContent(assistantContent);

    if (toolCalls.length === 0) {
      // 没有工具调用，直接完成
      conversationHistory.push({
        id: generateId(),
        role: 'assistant',
        content: assistantContent,
        timestamp: Date.now(),
      });
      callbacks.onComplete(assistantContent);
      return;
    }

    // 有工具调用，执行工具
    hasToolCall = true;

    // 添加助手消息到历史
    conversationHistory.push({
      id: generateId(),
      role: 'assistant',
      content: assistantContent,
      timestamp: Date.now(),
    });

    // 执行每个工具调用
    for (const tc of toolCalls) {
      const toolCall: ToolCall = {
        id: generateId(),
        name: tc.name,
        arguments: tc.arguments,
        status: 'executing',
      };

      onToolCall?.(toolCall);

      // 执行工具
      const result = await executeTool({
        id: toolCall.id,
        name: tc.name,
        arguments: tc.arguments,
        status: 'executing',
        startTime: Date.now(),
      });

      const toolResult: ToolResult = {
        toolCallId: toolCall.id,
        success: result.success,
        output: result.output,
        error: result.error,
      };

      toolCall.status = result.success ? 'completed' : 'error';
      toolCall.result = result.output;
      toolCall.error = result.error;

      onToolResult?.(toolResult);

      // 添加工具结果到历史（作为用户消息）
      conversationHistory.push({
        id: generateId(),
        role: 'tool',
        content: result.success
          ? `工具 ${tc.name} 执行结果:\n${result.output}`
          : `工具 ${tc.name} 执行失败:\n${result.error}`,
        timestamp: Date.now(),
      });
    }
  }

  if (loopCount >= MAX_AGENT_LOOPS) {
    callbacks.onComplete('已达到最大循环次数，代理已停止。');
  }
}

// 测试连接
export async function testAgentConnection(config: LLMConfig): Promise<{ success: boolean; message: string }> {
  if (!config.apiKey) {
    return { success: false, message: 'API 密钥不能为空' };
  }

  try {
    let targetUrl = config.baseUrl;
    if (targetUrl.endsWith('/')) {
      targetUrl = targetUrl.slice(0, -1);
    }
    const hasVersion = /\/(v\d+|chat)\/?$/.test(targetUrl);
    if (!hasVersion) {
      targetUrl = `${targetUrl}/v1/chat/completions`;
    } else if (!targetUrl.includes('/chat/completions')) {
      targetUrl = `${targetUrl}/chat/completions`;
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });

    if (response.ok) {
      return { success: true, message: '连接成功' };
    } else {
      const errorData = await response.json().catch(() => null);
      return { success: false, message: errorData?.error?.message || '连接失败' };
    }
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : '连接失败' };
  }
}

function parseCustomHeaders(headersStr: string): Record<string, string> {
  const headers: Record<string, string> = {};
  const pairs = headersStr.split(',');
  for (const pair of pairs) {
    const [key, value] = pair.split(':').map((s) => s.trim());
    if (key && value) {
      headers[key] = value;
    }
  }
  return headers;
}
