/**
 * Skills 管理工具 - 可编辑的技能系统
 */

import { readScopedStorageValue, writeScopedStorageValue } from '../userScopedStorage';

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  code: string; // 技能代码/实现
  parameters: SkillParameter[];
  enabled: boolean;
}

export interface SkillParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
  default?: any;
}

const SKILLS_STORAGE_KEY = 'ai-panel-skills-v1';

// 默认技能列表
const defaultSkills: Skill[] = [
  {
    id: 'skill-read-file',
    name: '读取文件',
    description: '读取指定路径的文件内容',
    category: '文件操作',
    icon: '📄',
    code: `async function readFile(path) {
  // 实现文件读取逻辑
  return await window.electronAPI.readFile(path);
}`,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true }
    ],
    enabled: true,
  },
  {
    id: 'skill-write-file',
    name: '写入文件',
    description: '将内容写入指定文件',
    category: '文件操作',
    icon: '✏️',
    code: `async function writeFile(path, content) {
  // 实现文件写入逻辑
  return await window.electronAPI.writeFile(path, content);
}`,
    parameters: [
      { name: 'path', type: 'string', description: '文件路径', required: true },
      { name: 'content', type: 'string', description: '文件内容', required: true }
    ],
    enabled: true,
  },
  {
    id: 'skill-execute-command',
    name: '执行命令',
    description: '在终端执行系统命令',
    category: '系统',
    icon: '⚡',
    code: `async function executeCommand(command, cwd) {
  // 实现命令执行逻辑
  return await window.electronAPI.executeCommand({ command, cwd });
}`,
    parameters: [
      { name: 'command', type: 'string', description: '要执行的命令', required: true },
      { name: 'cwd', type: 'string', description: '工作目录', required: false, default: 'E:\\' }
    ],
    enabled: true,
  },
  {
    id: 'skill-web-search',
    name: '网络搜索',
    description: '使用搜索引擎查询信息',
    category: '网络',
    icon: '🔍',
    code: `async function webSearch(query) {
  // 实现搜索逻辑
  const response = await fetch('/api/search?q=' + encodeURIComponent(query));
  return await response.json();
}`,
    parameters: [
      { name: 'query', type: 'string', description: '搜索关键词', required: true }
    ],
    enabled: true,
  },
  {
    id: 'skill-web-fetch',
    name: '网页获取',
    description: '获取指定 URL 的网页内容',
    category: '网络',
    icon: '🌐',
    code: `async function webFetch(url) {
  // 实现网页获取逻辑
  const response = await fetch(url);
  return await response.text();
}`,
    parameters: [
      { name: 'url', type: 'string', description: '网页 URL', required: true }
    ],
    enabled: true,
  },
];

/**
 * 加载所有技能
 */
export function loadSkills(): Skill[] {
  try {
    const saved = readScopedStorageValue(SKILLS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 合并默认技能和新保存的技能
      const savedIds = new Set(parsed.map((s: Skill) => s.id));
      const newDefaults = defaultSkills.filter(s => !savedIds.has(s.id));
      return [...parsed, ...newDefaults];
    }
  } catch (error) {
    console.error('Failed to load skills:', error);
  }
  return [...defaultSkills];
}

/**
 * 保存技能列表
 */
export function saveSkills(skills: Skill[]): boolean {
  try {
    writeScopedStorageValue(SKILLS_STORAGE_KEY, JSON.stringify(skills));
    return true;
  } catch (error) {
    console.error('Failed to save skills:', error);
    return false;
  }
}

/**
 * 添加新技能
 */
export function addSkill(skill: Omit<Skill, 'id'>): Skill {
  const newSkill: Skill = {
    ...skill,
    id: `skill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  const skills = loadSkills();
  skills.push(newSkill);
  saveSkills(skills);
  return newSkill;
}

/**
 * 更新技能
 */
export function updateSkill(id: string, updates: Partial<Skill>): Skill | null {
  const skills = loadSkills();
  const index = skills.findIndex(s => s.id === id);
  if (index === -1) return null;
  
  skills[index] = { ...skills[index], ...updates };
  saveSkills(skills);
  return skills[index];
}

/**
 * 删除技能
 */
export function deleteSkill(id: string): boolean {
  const skills = loadSkills();
  const filtered = skills.filter(s => s.id !== id);
  if (filtered.length === skills.length) return false;
  saveSkills(filtered);
  return true;
}

/**
 * 切换技能启用状态
 */
export function toggleSkill(id: string): boolean {
  const skills = loadSkills();
  const skill = skills.find(s => s.id === id);
  if (!skill) return false;
  
  skill.enabled = !skill.enabled;
  saveSkills(skills);
  return skill.enabled;
}

/**
 * 获取技能分类列表
 */
export function getSkillCategories(): string[] {
  const skills = loadSkills();
  const categories = new Set(skills.map(s => s.category));
  return Array.from(categories);
}

/**
 * 按分类获取技能
 */
export function getSkillsByCategory(category: string): Skill[] {
  const skills = loadSkills();
  return skills.filter(s => s.category === category);
}

/**
 * 获取启用的技能
 */
export function getEnabledSkills(): Skill[] {
  const skills = loadSkills();
  return skills.filter(s => s.enabled);
}

/**
 * 创建技能模板
 */
export function createSkillTemplate(): Omit<Skill, 'id'> {
  return {
    name: '新技能',
    description: '描述这个技能的功能',
    category: '自定义',
    icon: '🔧',
    code: `async function execute(params) {
  // 在这里实现技能逻辑
  // params 包含调用时传入的参数
  
  return {
    success: true,
    data: '执行结果'
  };
}`,
    parameters: [
      { name: 'param1', type: 'string', description: '参数说明', required: true }
    ],
    enabled: true,
  };
}

/**
 * 验证技能代码
 */
export function validateSkillCode(code: string): { valid: boolean; error?: string } {
  try {
    // 检查是否为有效的 JavaScript/TypeScript 函数
    new Function('params', code);
    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : '代码语法错误' 
    };
  }
}

/**
 * 导出技能为 JSON
 */
export function exportSkill(skill: Skill): string {
  return JSON.stringify(skill, null, 2);
}

/**
 * 从 JSON 导入技能
 */
export function importSkill(json: string): Skill | null {
  try {
    const skill = JSON.parse(json);
    // 移除 id，让系统生成新的
    delete skill.id;
    return addSkill(skill);
  } catch (error) {
    console.error('Failed to import skill:', error);
    return null;
  }
}

/**
 * 技能代码模板
 */
export const skillCodeTemplates = {
  basic: `async function execute(params) {
  // 基础模板
  // params 包含所有传入的参数
  
  return {
    success: true,
    data: '执行成功'
  };
}`,
  fileOperation: `async function execute(params) {
  // 文件操作模板
  const { filePath, content } = params;
  
  try {
    // 使用 Electron API 进行文件操作
    const result = await window.electronAPI.readFile(filePath);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}`,
  apiCall: `async function execute(params) {
  // API 调用模板
  const { url, method = 'GET', body } = params;
  
  try {
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    return {
      success: response.ok,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}`,
};
