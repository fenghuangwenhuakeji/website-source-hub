/**
 * 智能体导入工具 - 支持 MD 文件导入
 */

import type { Agent } from '../aiPanelCore';

export interface ImportedAgent {
  name: string;
  description: string;
  systemPrompt: string;
  capabilities: string[];
  skills: string[];
  icon: string;
  category: string;
}

/**
 * 解析 Markdown 文件内容
 * 支持 YAML frontmatter 格式
 */
export function parseAgentMarkdown(content: string): ImportedAgent | null {
  try {
    // 提取 YAML frontmatter
    const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      // 没有 frontmatter，尝试从内容中提取
      return parseSimpleMarkdown(content);
    }
    
    const yamlContent = frontmatterMatch[1];
    const bodyContent = frontmatterMatch[2];
    
    // 解析 YAML
    const metadata = parseYaml(yamlContent);
    
    return {
      name: metadata.name || metadata.title || '未命名智能体',
      description: metadata.description || extractDescription(bodyContent),
      systemPrompt: metadata.systemPrompt || metadata.system_prompt || bodyContent,
      capabilities: parseArray(metadata.capabilities) || parseArray(metadata.abilities) || [],
      skills: parseArray(metadata.skills) || [],
      icon: metadata.icon || '🤖',
      category: metadata.category || 'custom',
    };
  } catch (error) {
    console.error('Failed to parse agent markdown:', error);
    return null;
  }
}

/**
 * 解析简单 Markdown（无 frontmatter）
 */
function parseSimpleMarkdown(content: string): ImportedAgent {
  // 提取标题
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const name = titleMatch ? titleMatch[1] : '未命名智能体';
  
  // 提取描述（第一个段落）
  const descMatch = content.match(/\n\n([^#\n].+?)(?:\n\n|$)/);
  const description = descMatch ? descMatch[1].trim() : '';
  
  return {
    name,
    description,
    systemPrompt: content,
    capabilities: [],
    skills: [],
    icon: '🤖',
    category: 'custom',
  };
}

/**
 * 解析 YAML 内容
 */
function parseYaml(yaml: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  const lines = yaml.split('\n');
  let currentKey = '';
  let currentValue = '';
  let inArray = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // 数组项
    if (trimmed.startsWith('- ')) {
      if (currentKey && !inArray) {
        result[currentKey] = [];
        inArray = true;
      }
      if (currentKey) {
        const item = trimmed.substring(2).trim();
        if (Array.isArray(result[currentKey])) {
          result[currentKey].push(item);
        }
      }
      continue;
    }
    
    // 键值对
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      if (currentKey && !inArray) {
        result[currentKey] = currentValue.trim();
      }
      currentKey = match[1];
      currentValue = match[2];
      inArray = false;
    } else if (currentKey && trimmed) {
      // 多行值
      currentValue += '\n' + line;
    }
  }
  
  if (currentKey && !inArray) {
    result[currentKey] = currentValue.trim();
  }
  
  return result;
}

/**
 * 解析数组
 */
function parseArray(value: any): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }
  return null;
}

/**
 * 提取描述
 */
function extractDescription(content: string): string {
  const match = content.match(/\n\n([^#\n].{0,200})/);
  return match ? match[1].trim() : '';
}

/**
 * 批量导入智能体
 */
export async function importAgentsFromFiles(files: File[]): Promise<ImportedAgent[]> {
  const agents: ImportedAgent[] = [];
  
  for (const file of files) {
    try {
      const content = await file.text();
      const agent = parseAgentMarkdown(content);
      if (agent) {
        agents.push(agent);
      }
    } catch (error) {
      console.error(`Failed to import ${file.name}:`, error);
    }
  }
  
  return agents;
}

/**
 * 将导入的智能体转换为 Agent 对象
 */
export function convertToAgent(imported: ImportedAgent, id?: string): Agent {
  return {
    id: id || `agent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: imported.name,
    icon: imported.icon,
    description: imported.description,
    category: imported.category,
    skills: imported.skills,
    capabilities: imported.capabilities,
    status: 'idle',
    provider: 'openai',
    systemPrompt: imported.systemPrompt,
    temperature: 0.7,
    maxTokens: 2000,
  };
}

/**
 * 导出智能体为 Markdown
 */
export function exportAgentToMarkdown(agent: Agent): string {
  const frontmatter = [
    '---',
    `name: ${agent.name}`,
    `description: ${agent.description}`,
    `icon: ${agent.icon}`,
    `category: ${agent.category}`,
    `capabilities:`,
    ...agent.capabilities.map(c => `  - ${c}`),
    `skills:`,
    ...agent.skills.map(s => `  - ${s}`),
    '---',
    '',
    agent.systemPrompt || '',
  ].join('\n');
  
  return frontmatter;
}

/**
 * 示例智能体 MD 文件模板
 */
export const agentTemplate = `---
name: 前端开发助手
description: React/Vue/Angular 专家，帮助解决前端开发问题
icon: 💻
category: development
capabilities:
  - 代码编写
  - 代码审查
  - 性能优化
  - 架构设计
skills:
  - React
  - Vue
  - Angular
  - TypeScript
  - CSS/Tailwind
---

你是一个专业的前端开发助手，精通 React、Vue、Angular 等主流框架。

你的职责包括：
1. 帮助编写高质量的前端代码
2. 审查代码并提供改进建议
3. 解答前端技术问题
4. 提供性能优化方案
5. 协助架构设计决策

回答时请：
- 提供具体的代码示例
- 解释技术原理
- 考虑最佳实践
- 关注代码可维护性
`;
