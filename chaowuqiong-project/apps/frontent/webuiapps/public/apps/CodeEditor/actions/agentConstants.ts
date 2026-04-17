/**
 * IDE Agent Constants
 * IDE Agent - 支持工具调用的 AI 助手
 */

export const APP_ID = 34;
export const APP_NAME = 'codeEditor';
export const STATE_FILE = '/code_editor_state.json';
export const CONFIG_FILE = '/code_editor_agent_config.json';

export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'minimax' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  customHeaders?: string;
}

export const DEFAULT_CONFIGS: Record<LLMProvider, Omit<LLMConfig, 'apiKey' | 'temperature' | 'maxTokens' | 'systemPrompt' | 'customHeaders'>> = {
  openai: {
    provider: 'openai',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
  },
  anthropic: {
    provider: 'anthropic',
    baseUrl: 'https://api.anthropic.com',
    model: 'claude-sonnet-4-20250514',
  },
  deepseek: {
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-chat',
  },
  minimax: {
    provider: 'minimax',
    baseUrl: 'https://api.minimax.chat',
    model: 'MiniMax-Text-01',
  },
  custom: {
    provider: 'custom',
    baseUrl: '',
    model: '',
  },
};

export const DEFAULT_LLM_CONFIG: LLMConfig = {
  provider: 'deepseek',
  apiKey: '',
  baseUrl: 'https://api.deepseek.com',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 4096,
  systemPrompt: `你是一个强大的代码助手，拥有完整的文件操作能力。

## 可用工具
你可以通过返回特定格式的 JSON 来调用工具：

\`\`\`json
{
  "tool": "工具名称",
  "args": {
    "参数名": "参数值"
  }
}
\`\`\`

## 工具列表

### read - 读取文件
读取文件内容，支持行范围。
参数：path(必填), startLine(可选), endLine(可选)

### write - 写入文件
创建或修改文件，自动创建目录。
参数：path(必填), content(必填)

### search_replace - 搜索替换
搜索文件内容并替换。
参数：path(必填), search(必填), replace(必填), useRegex(可选)

### delete - 删除文件
删除文件或目录。
参数：path(必填), recursive(可选)

### glob - 文件查找
使用通配符查找文件。
参数：pattern(必填), basePath(可选)

### grep - 内容搜索
使用正则搜索文件内容。
参数：pattern(必填), caseSensitive(可选), basePath(可选)

### ls - 目录列表
列出目录内容。
参数：path(可选), showHidden(可选)

### diff - 文件比较
比较两个文件的差异。
参数：original(必填), modified(必填)

### run_command - 执行命令
执行终端命令。
参数：command(必填), cwd(可选), timeout(可选)

## 工作流程
1. 理解用户需求
2. 决定是否需要调用工具
3. 如果需要工具调用，返回工具调用请求
4. 等待工具执行结果
5. 根据结果继续思考或回复用户

## 重要提示
- 始终以 JSON 格式返回工具调用
- 每个工具调用必须包含 tool 和 args 字段
- 不需要工具时，直接回复用户
- 代码修改后简要说明做了什么`,
};

export interface AgentMessage {
  id: string;
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'error';
}

export interface ToolResult {
  toolCallId: string;
  success: boolean;
  output?: string;
  error?: string;
}

export const MAX_AGENT_LOOPS = 20;
export const TOOL_CALL_TIMEOUT = 30000;
