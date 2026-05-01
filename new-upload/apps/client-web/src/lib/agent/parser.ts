/**
 * Agent 文档解析器
 * 解析 SKILL.md 等标准文档格式
 */

import type { Agent, AgentType, AgentImportResult, AgentBulkImportResult } from './types';

// YAML Front Matter 解析
function parseYAMLFrontMatter(content: string): { frontMatter: Record<string, any>, body: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!match) {
    return { frontMatter: {}, body: content };
  }

  const yamlText = match[1];
  const body = match[2];
  const frontMatter: Record<string, any> = {};

  yamlText.split('\n').forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
      frontMatter[key] = value;
    }
  });

  return { frontMatter, body };
}

// 提取章节内容
function extractSection(content: string, sectionTitle: string): string {
  const regex = new RegExp(`## ${sectionTitle}\\s*\\n([\\s\\S]*?)(?=\\n## |\\n# |$)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : '';
}

// 识别 Agent 类型
function detectAgentType(content: string): AgentType {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('debug') || lowerContent.includes('调试')) return 'debug';
  if (lowerContent.includes('plan') || lowerContent.includes('规划')) return 'plan';
  if (lowerContent.includes('spec') || lowerContent.includes('规格')) return 'spec';
  if (lowerContent.includes('autopilot') || lowerContent.includes('自主')) return 'autopilot';
  if (lowerContent.includes('skill') || lowerContent.includes('技能')) return 'skill';
  
  return 'custom';
}

// 解析 SKILL.md
export function parseSkillDoc(content: string): Partial<Agent> {
  const { frontMatter, body } = parseYAMLFrontMatter(content);
  
  const agent: Partial<Agent> = {
    name: frontMatter.name || frontMatter.title || '未命名 Agent',
    description: frontMatter.description || '',
    type: detectAgentType(body),
    skillDoc: content,
  };

  // 提取系统提示词
  const coreIdea = extractSection(body, '核心理念');
  const workflow = extractSection(body, '核心工作流程');
  
  if (coreIdea || workflow) {
    agent.config = {
      model: 'gpt-4o',
      temperature: 0.7,
      maxTokens: 4000,
      systemPrompt: `${coreIdea}\n\n${workflow}`.trim(),
      tools: [],
    };
  }

  return agent;
}

// 解析 requirement.md
export function parseRequirementDoc(content: string): Partial<Agent> {
  const { frontMatter, body } = parseYAMLFrontMatter(content);
  
  return {
    requirementDoc: content,
    description: frontMatter.description || extractSection(body, '需求概述'),
  };
}

// 解析 design.md
export function parseDesignDoc(content: string): Partial<Agent> {
  return {
    designDoc: content,
  };
}

// 解析 tasks.md
export function parseTasksDoc(content: string): Partial<Agent> {
  return {
    tasksDoc: content,
  };
}

// 解析 checklist.md
export function parseChecklistDoc(content: string): Partial<Agent> {
  return {
    checklistDoc: content,
  };
}

// 从文件夹导入 Agent
export async function importAgentFromFolder(folderPath: string): Promise<AgentImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  try {
    // 检查是否在 Electron 环境
    const electronAPI = (window as any).electronAPI;
    let files: string[] = [];
    
    if (electronAPI?.fileSystem?.listDirectory) {
      const items = await electronAPI.fileSystem.listDirectory(folderPath);
      files = items.filter((item: any) => item.type === 'file').map((item: any) => item.name);
    } else {
      // 浏览器环境模拟
      errors.push('浏览器环境无法读取真实文件夹，请使用 Electron 桌面版');
      return { success: false, errors, warnings };
    }

    // 查找核心文档
    const skillFile = files.find(f => f.toLowerCase() === 'skill.md');
    const requirementFile = files.find(f => f.toLowerCase() === 'requirement.md');
    const designFile = files.find(f => f.toLowerCase() === 'design.md');
    const tasksFile = files.find(f => f.toLowerCase() === 'tasks.md');
    const checklistFile = files.find(f => f.toLowerCase() === 'checklist.md');

    if (!skillFile) {
      errors.push('未找到 SKILL.md 文件，这是必需的');
      return { success: false, errors, warnings };
    }

    // 读取文档内容
    const agent: Partial<Agent> = {};
    
    // 读取 SKILL.md
    const skillContent = await electronAPI.fileSystem.readFile(`${folderPath}/${skillFile}`);
    if (skillContent.error) {
      errors.push(`读取 SKILL.md 失败: ${skillContent.error}`);
      return { success: false, errors, warnings };
    }
    Object.assign(agent, parseSkillDoc(skillContent.content));

    // 读取其他文档
    if (requirementFile) {
      const reqContent = await electronAPI.fileSystem.readFile(`${folderPath}/${requirementFile}`);
      if (!reqContent.error) {
        Object.assign(agent, parseRequirementDoc(reqContent.content));
      }
    } else {
      warnings.push('未找到 requirement.md');
    }

    if (designFile) {
      const designContent = await electronAPI.fileSystem.readFile(`${folderPath}/${designFile}`);
      if (!designContent.error) {
        Object.assign(agent, parseDesignDoc(designContent.content));
      }
    }

    if (tasksFile) {
      const tasksContent = await electronAPI.fileSystem.readFile(`${folderPath}/${tasksFile}`);
      if (!tasksContent.error) {
        Object.assign(agent, parseTasksDoc(tasksContent.content));
      }
    }

    if (checklistFile) {
      const checklistContent = await electronAPI.fileSystem.readFile(`${folderPath}/${checklistFile}`);
      if (!checklistContent.error) {
        Object.assign(agent, parseChecklistDoc(checklistContent.content));
      }
    }

    // 生成完整 Agent 对象
    const fullAgent: Agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: agent.name || '未命名 Agent',
      description: agent.description || '',
      type: agent.type || 'custom',
      icon: getAgentIcon(agent.type || 'custom'),
      color: getAgentColor(agent.type || 'custom'),
      skillDoc: agent.skillDoc,
      requirementDoc: agent.requirementDoc,
      designDoc: agent.designDoc,
      tasksDoc: agent.tasksDoc,
      checklistDoc: agent.checklistDoc,
      config: agent.config || {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: '',
        tools: [],
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        successRate: 1,
      },
    };

    return {
      success: true,
      agent: fullAgent,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push(`导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return { success: false, errors, warnings };
  }
}

// 从根目录批量导入 Agent（遍历子文件夹）
export async function importAgentsFromRoot(
  rootPath: string,
  options?: { maxAgents?: number },
): Promise<AgentBulkImportResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const agents: Agent[] = [];

  try {
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.fileSystem?.listDirectory) {
      errors.push('浏览器环境无法读取真实文件夹，请使用 Electron 桌面版。');
      return { success: false, agents, total: 0, errors, warnings };
    }

    const items = await electronAPI.fileSystem.listDirectory(rootPath);
    const directories = items.filter((item: any) => item.type === 'directory').map((item: any) => item.name);
    const total = directories.length;
    const limit = options?.maxAgents && options.maxAgents > 0 ? options.maxAgents : total;

    for (const dir of directories.slice(0, limit)) {
      const result = await importAgentFromFolder(`${rootPath}/${dir}`);
      if (result.success && result.agent) {
        agents.push(result.agent);
        if (result.warnings.length) {
          warnings.push(...result.warnings.map((warn) => `${dir}: ${warn}`));
        }
      } else if (result.errors.length) {
        errors.push(...result.errors.map((err) => `${dir}: ${err}`));
      }
    }

    return {
      success: agents.length > 0,
      agents,
      total,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`批量导入失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return { success: false, agents, total: 0, errors, warnings };
  }
}

// 从文本导入 Agent（直接粘贴 SKILL.md 内容）
export function importAgentFromText(skillContent: string, name?: string): AgentImportResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const parsed = parseSkillDoc(skillContent);
    
    const agent: Agent = {
      id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || parsed.name || '未命名 Agent',
      description: parsed.description || '',
      type: parsed.type || 'custom',
      icon: getAgentIcon(parsed.type || 'custom'),
      color: getAgentColor(parsed.type || 'custom'),
      skillDoc: skillContent,
      config: parsed.config || {
        model: 'gpt-4o',
        temperature: 0.7,
        maxTokens: 4000,
        systemPrompt: '',
        tools: [],
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
      stats: {
        totalConversations: 0,
        totalMessages: 0,
        avgResponseTime: 0,
        successRate: 1,
      },
    };

    warnings.push('仅导入 SKILL.md，其他文档未包含');

    return {
      success: true,
      agent,
      errors,
      warnings,
    };

  } catch (error) {
    errors.push(`解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    return { success: false, errors, warnings };
  }
}

// 获取 Agent 图标
function getAgentIcon(type: string): string {
  const icons: Record<string, string> = {
    skill: '🎯',
    debug: '🐛',
    plan: '📋',
    spec: '📐',
    autopilot: '🚀',
    custom: '🤖',
  };
  return icons[type] || '🤖';
}

// 获取 Agent 颜色
function getAgentColor(type: string): string {
  const colors: Record<string, string> = {
    skill: '#4CAF50',
    debug: '#f44336',
    plan: '#2196F3',
    spec: '#9C27B0',
    autopilot: '#FF9800',
    custom: '#607D8B',
  };
  return colors[type] || '#607D8B';
}
