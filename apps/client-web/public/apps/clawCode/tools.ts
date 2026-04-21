/**
 * Claw Code Tools System
 * 工具系统 - 基于 Claw Code 架构实现
 */

import { PortingModule, ToolExecution, PortingBacklog, ToolPermissionContext } from './types';

const TOOLS_SNAPSHOT_KEY = 'claw-code-tools-snapshot';

const DEFAULT_TOOLS: PortingModule[] = [
  { name: 'AgentTool', sourceHint: 'tools/AgentTool', responsibility: '子代理管理工具', status: 'mirrored' },
  { name: 'AskUserQuestionTool', sourceHint: 'tools/AskUserQuestionTool', responsibility: '用户交互工具', status: 'mirrored' },
  { name: 'BashTool', sourceHint: 'tools/BashTool', responsibility: 'Shell 命令执行', status: 'mirrored' },
  { name: 'BriefTool', sourceHint: 'tools/BriefTool', responsibility: '简要摘要工具', status: 'mirrored' },
  { name: 'ConfigTool', sourceHint: 'tools/ConfigTool', responsibility: '配置管理工具', status: 'mirrored' },
  { name: 'EnterPlanModeTool', sourceHint: 'tools/EnterPlanModeTool', responsibility: '进入计划模式', status: 'mirrored' },
  { name: 'ExitPlanModeTool', sourceHint: 'tools/ExitPlanModeTool', responsibility: '退出计划模式', status: 'mirrored' },
  { name: 'EnterWorktreeTool', sourceHint: 'tools/EnterWorktreeTool', responsibility: '进入工作树', status: 'mirrored' },
  { name: 'ExitWorktreeTool', sourceHint: 'tools/ExitWorktreeTool', responsibility: '退出工作树', status: 'mirrored' },
  { name: 'FileEditTool', sourceHint: 'tools/FileEditTool', responsibility: '文件编辑工具', status: 'mirrored' },
  { name: 'FileReadTool', sourceHint: 'tools/FileReadTool', responsibility: '文件读取工具', status: 'mirrored' },
  { name: 'FileWriteTool', sourceHint: 'tools/FileWriteTool', responsibility: '文件写入工具', status: 'mirrored' },
  { name: 'GlobTool', sourceHint: 'tools/GlobTool', responsibility: '文件模式匹配', status: 'mirrored' },
  { name: 'GrepTool', sourceHint: 'tools/GrepTool', responsibility: '文本搜索工具', status: 'mirrored' },
  { name: 'LSPTool', sourceHint: 'tools/LSPTool', responsibility: '语言服务器工具', status: 'mirrored' },
  { name: 'MCPTool', sourceHint: 'tools/MCPTool', responsibility: 'MCP 协议工具', status: 'mirrored' },
  { name: 'McpAuthTool', sourceHint: 'tools/McpAuthTool', responsibility: 'MCP 认证工具', status: 'mirrored' },
  { name: 'NotebookEditTool', sourceHint: 'tools/NotebookEditTool', responsibility: 'Notebook 编辑', status: 'mirrored' },
  { name: 'PowerShellTool', sourceHint: 'tools/PowerShellTool', responsibility: 'PowerShell 执行', status: 'mirrored' },
  { name: 'ReadNotebookTool', sourceHint: 'tools/ReadNotebookTool', responsibility: 'Notebook 读取', status: 'mirrored' },
  { name: 'ReadRandomTool', sourceHint: 'tools/ReadRandomTool', responsibility: '随机读取工具', status: 'mirrored' },
  { name: 'ResumeAgentTool', sourceHint: 'tools/ResumeAgentTool', responsibility: '恢复代理', status: 'mirrored' },
  { name: 'SearchTool', sourceHint: 'tools/SearchTool', responsibility: '搜索工具', status: 'mirrored' },
  { name: 'SemanticSearchTool', sourceHint: 'tools/SemanticSearchTool', responsibility: '语义搜索', status: 'mirrored' },
  { name: 'SkillTool', sourceHint: 'tools/SkillTool', responsibility: '技能调用工具', status: 'mirrored' },
  { name: 'StopTool', sourceHint: 'tools/StopTool', responsibility: '停止执行', status: 'mirrored' },
  { name: 'TodoWriteTool', sourceHint: 'tools/TodoWriteTool', responsibility: '任务列表管理', status: 'mirrored' },
  { name: 'TokenCountTool', sourceHint: 'tools/TokenCountTool', responsibility: 'Token 计数', status: 'mirrored' },
  { name: 'WebFetchTool', sourceHint: 'tools/WebFetchTool', responsibility: '网页抓取', status: 'mirrored' },
  { name: 'WebSearchTool', sourceHint: 'tools/WebSearchTool', responsibility: '网页搜索', status: 'mirrored' },
];

let cachedTools: PortingModule[] | null = null;

export function loadToolSnapshot(): PortingModule[] {
  if (cachedTools) return cachedTools;
  
  try {
    const stored = localStorage.getItem(TOOLS_SNAPSHOT_KEY);
    if (stored) {
      cachedTools = JSON.parse(stored);
      return cachedTools!;
    }
  } catch (e) {
    console.warn('Failed to load tool snapshot from storage:', e);
  }
  
  cachedTools = DEFAULT_TOOLS;
  saveToolSnapshot(cachedTools);
  return cachedTools;
}

export function saveToolSnapshot(tools: PortingModule[]): void {
  try {
    localStorage.setItem(TOOLS_SNAPSHOT_KEY, JSON.stringify(tools));
    cachedTools = tools;
  } catch (e) {
    console.warn('Failed to save tool snapshot:', e);
  }
}

export const PORTED_TOOLS = loadToolSnapshot();

export function buildToolBacklog(): PortingBacklog {
  return {
    title: 'Tool Surface',
    modules: PORTED_TOOLS,
  };
}

export function toolNames(): string[] {
  return PORTED_TOOLS.map(m => m.name);
}

export function getTool(name: string): PortingModule | undefined {
  const needle = name.toLowerCase();
  return PORTED_TOOLS.find(m => m.name.toLowerCase() === needle);
}

export function createPermissionContext(
  deniedTools: string[] = [],
  deniedPrefixes: string[] = []
): ToolPermissionContext {
  return {
    deniedTools: new Set(deniedTools.map(t => t.toLowerCase())),
    deniedPrefixes: new Set(deniedPrefixes.map(p => p.toLowerCase())),
  };
}

export function filterToolsByPermissionContext(
  tools: PortingModule[],
  permissionContext?: ToolPermissionContext
): PortingModule[] {
  if (!permissionContext) return tools;
  
  return tools.filter(module => {
    const nameLower = module.name.toLowerCase();
    
    if (permissionContext.deniedTools.has(nameLower)) {
      return false;
    }
    
    for (const prefix of permissionContext.deniedPrefixes) {
      if (nameLower.startsWith(prefix)) {
        return false;
      }
    }
    
    return true;
  });
}

export interface GetToolsOptions {
  simpleMode?: boolean;
  includeMcp?: boolean;
  permissionContext?: ToolPermissionContext;
}

export function getTools(options: GetToolsOptions = {}): PortingModule[] {
  const { simpleMode = false, includeMcp = true, permissionContext } = options;
  
  let tools = [...PORTED_TOOLS];
  
  if (simpleMode) {
    tools = tools.filter(m => 
      ['BashTool', 'FileReadTool', 'FileEditTool'].includes(m.name)
    );
  }
  
  if (!includeMcp) {
    tools = tools.filter(m => 
      !m.name.toLowerCase().includes('mcp') && 
      !m.sourceHint.toLowerCase().includes('mcp')
    );
  }
  
  return filterToolsByPermissionContext(tools, permissionContext);
}

export function findTools(query: string, limit: number = 20): PortingModule[] {
  const needle = query.toLowerCase();
  return PORTED_TOOLS
    .filter(m => 
      m.name.toLowerCase().includes(needle) || 
      m.sourceHint.toLowerCase().includes(needle) ||
      m.responsibility.toLowerCase().includes(needle)
    )
    .slice(0, limit);
}

export function executeTool(name: string, payload: string = ''): ToolExecution {
  const module = getTool(name);
  
  if (!module) {
    return {
      name,
      sourceHint: '',
      payload,
      handled: false,
      message: `Unknown mirrored tool: ${name}`,
    };
  }
  
  return {
    name: module.name,
    sourceHint: module.sourceHint,
    payload,
    handled: true,
    message: `Tool '${module.name}' from ${module.sourceHint} would handle payload: "${payload}"`,
  };
}

export function renderToolIndex(limit: number = 20, query?: string): string {
  const modules = query ? findTools(query, limit) : PORTED_TOOLS.slice(0, limit);
  const lines = [
    `Tool entries: ${PORTED_TOOLS.length}`,
    '',
  ];
  
  if (query) {
    lines.push(`Filtered by: ${query}`);
    lines.push('');
  }
  
  modules.forEach(m => {
    lines.push(`- ${m.name} — ${m.sourceHint}`);
  });
  
  return lines.join('\n');
}

export function registerTool(module: PortingModule): void {
  const existing = getTool(module.name);
  if (existing) {
    Object.assign(existing, module);
  } else {
    PORTED_TOOLS.push(module);
  }
  saveToolSnapshot(PORTED_TOOLS);
}

export function unregisterTool(name: string): boolean {
  const index = PORTED_TOOLS.findIndex(m => m.name.toLowerCase() === name.toLowerCase());
  if (index !== -1) {
    PORTED_TOOLS.splice(index, 1);
    saveToolSnapshot(PORTED_TOOLS);
    return true;
  }
  return false;
}

export const DANGEROUS_TOOLS = ['BashTool', 'PowerShellTool', 'FileWriteTool', 'FileEditTool'];

export function isDangerousTool(name: string): boolean {
  return DANGEROUS_TOOLS.some(t => t.toLowerCase() === name.toLowerCase());
}
