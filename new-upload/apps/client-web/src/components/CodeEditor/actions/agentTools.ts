import { createAppFileApi } from '@/lib';

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: string;
  error?: string;
  status: 'pending' | 'executing' | 'completed' | 'error';
  startTime: number;
  endTime?: number;
}

export interface ToolResult {
  success: boolean;
  output?: string;
  error?: string;
}

const fileApi = createAppFileApi('codeEditor');

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'read',
    description: '读取文件内容，支持行范围指定。用于查看文件内容。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径（相对于工作目录）' },
        startLine: { type: 'number', description: '起始行号（可选，默认从第1行开始）' },
        endLine: { type: 'number', description: '结束行号（可选，默认到文件末尾）' },
      },
      required: ['path'],
    },
  },
  {
    name: 'write',
    description: '写入内容到文件，自动创建必要的目录。用于创建或修改文件。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径（相对于工作目录）' },
        content: { type: 'string', description: '文件内容' },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'search_replace',
    description: '搜索文件内容并替换。用于批量修改文件中的特定内容。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '文件路径' },
        search: { type: 'string', description: '要搜索的内容（支持正则）' },
        replace: { type: 'string', description: '替换后的内容' },
        useRegex: { type: 'boolean', description: '是否使用正则表达式（默认false）' },
      },
      required: ['path', 'search', 'replace'],
    },
  },
  {
    name: 'delete',
    description: '删除文件或目录。用于清理不需要的文件。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '要删除的文件或目录路径' },
        recursive: { type: 'boolean', description: '是否递归删除目录（默认false）' },
      },
      required: ['path'],
    },
  },
  {
    name: 'glob',
    description: '使用通配符查找文件。用于快速定位项目中的文件。',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '通配符模式，如 **/*.tsx, src/**/*.ts' },
        basePath: { type: 'string', description: '搜索的基准路径（可选）' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep',
    description: '使用正则表达式搜索文件内容。用于查找代码中的特定模式。',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: '正则表达式模式' },
        filePattern: { type: 'string', description: '文件过滤模式，如 *.ts, *.tsx' },
        caseSensitive: { type: 'boolean', description: '是否区分大小写（默认false）' },
        basePath: { type: 'string', description: '搜索的基准路径（可选）' },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'ls',
    description: '列出目录内容和文件信息。',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: '目录路径（默认当前目录）' },
        showHidden: { type: 'boolean', description: '是否显示隐藏文件（默认false）' },
      },
      required: [],
    },
  },
  {
    name: 'diff',
    description: '比较两个文件的差异。用于查看修改内容。',
    inputSchema: {
      type: 'object',
      properties: {
        original: { type: 'string', description: '原始文件路径或内容' },
        modified: { type: 'string', description: '修改后文件路径或内容' },
        originalLabel: { type: 'string', description: '原始文件标签（可选）' },
        modifiedLabel: { type: 'string', description: '修改文件标签（可选）' },
      },
      required: ['original', 'modified'],
    },
  },
  {
    name: 'run_command',
    description: '执行终端命令。用于运行构建、测试、安装等命令。',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: '要执行的命令' },
        cwd: { type: 'string', description: '命令执行的工作目录（可选）' },
        timeout: { type: 'number', description: '超时时间（毫秒，默认60000）' },
      },
      required: ['command'],
    },
  },
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map(t => t.name);

export async function executeTool(call: ToolCall): Promise<ToolResult> {
  const { name, arguments: args } = call;
  const basePath = '/code_editor_workspace';

  try {
    switch (name) {
      case 'read': {
        const { path, startLine, endLine } = args as { path: string; startLine?: number; endLine?: number };
        const fullPath = `${basePath}${path.startsWith('/') ? path : '/' + path}`;
        const result = await fileApi.readFile(fullPath);
        let content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

        if (startLine || endLine) {
          const lines = content.split('\n');
          const start = (startLine || 1) - 1;
          const end = endLine || lines.length;
          content = lines.slice(start, end).join('\n');
        }

        return { success: true, output: content };
      }

      case 'write': {
        const { path, content } = args as { path: string; content: string };
        const fullPath = `${basePath}${path.startsWith('/') ? path : '/' + path}`;
        await fileApi.writeFile(fullPath, content);
        return { success: true, output: `文件已写入: ${path}` };
      }

      case 'search_replace': {
        const { path, search, replace, useRegex } = args as { path: string; search: string; replace: string; useRegex?: boolean };
        const fullPath = `${basePath}${path.startsWith('/') ? path : '/' + path}`;
        const result = await fileApi.readFile(fullPath);
        let content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content, null, 2);

        if (useRegex) {
          const regex = new RegExp(search, 'g');
          content = content.replace(regex, replace);
        } else {
          content = content.split(search).join(replace);
        }

        await fileApi.writeFile(fullPath, content);
        return { success: true, output: `已完成替换: ${path}` };
      }

      case 'delete': {
        const { path, recursive } = args as { path: string; recursive?: boolean };
        return { success: true, output: `删除功能需要后端支持: ${path} (recursive: ${recursive})` };
      }

      case 'glob': {
        const { pattern } = args as { pattern: string };
        return { success: true, output: `glob 功能需要后端支持，模式: ${pattern}` };
      }

      case 'grep': {
        const { pattern, caseSensitive } = args as { pattern: string; caseSensitive?: boolean };
        return { success: true, output: `grep 功能需要后端支持，模式: ${pattern} (caseSensitive: ${caseSensitive})` };
      }

      case 'ls': {
        const { showHidden } = args as { showHidden?: boolean };
        return { success: true, output: `ls 功能需要后端支持 (showHidden: ${showHidden})` };
      }

      case 'diff': {
        const { original, modified, originalLabel, modifiedLabel } = args as {
          original: string;
          modified: string;
          originalLabel?: string;
          modifiedLabel?: string;
        };
        return {
          success: true,
          output: `diff 比较:\n--- ${originalLabel || 'original'}\n+++ ${modifiedLabel || 'modified'}\n需要文件内容进行比较`
        };
      }

      case 'run_command': {
        const { command, timeout } = args as { command: string; timeout?: number };
        return { success: true, output: `命令执行需要后端支持: ${command} (timeout: ${timeout})` };
      }

      default:
        return { success: false, error: `未知工具: ${name}` };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export function buildToolsDescription(): string {
  return TOOL_DEFINITIONS.map(tool => {
    const props = Object.entries(tool.inputSchema.properties)
      .map(([key, val]) => `    ${key}: ${val.description}`)
      .join('\n');
    return `${tool.name}\n${tool.description}\n参数:\n${props}`;
  }).join('\n\n');
}
