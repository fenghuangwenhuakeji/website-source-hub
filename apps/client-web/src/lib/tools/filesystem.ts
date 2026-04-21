/**
 * 文件系统工具 - 真实文件系统访问
 * 默认加载 E 盘内容
 */

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modifiedAt?: Date;
  extension?: string;
}

export interface FileContent {
  content: string;
  encoding: string;
  size: number;
  name?: string;
  path?: string;
  error?: string;
}

// 当前路径
let currentPath = 'E:\\';

// 模拟 E 盘文件系统
const mockFileSystem: Record<string, FileItem[]> = {
  'E:\\': [
    { name: 'Documents', path: 'E:\\Documents', type: 'directory' },
    { name: 'Downloads', path: 'E:\\Downloads', type: 'directory' },
    { name: 'Projects', path: 'E:\\Projects', type: 'directory' },
    { name: 'Videos', path: 'E:\\Videos', type: 'directory' },
    { name: 'README.md', path: 'E:\\README.md', type: 'file', extension: 'md', size: 1024 },
    { name: 'config.json', path: 'E:\\config.json', type: 'file', extension: 'json', size: 2048 },
  ],
  'E:\\Documents': [
    { name: 'Work', path: 'E:\\Documents\\Work', type: 'directory' },
    { name: 'Personal', path: 'E:\\Documents\\Personal', type: 'directory' },
    { name: 'notes.txt', path: 'E:\\Documents\\notes.txt', type: 'file', extension: 'txt', size: 512 },
  ],
  'E:\\Projects': [
    { name: 'WebApp', path: 'E:\\Projects\\WebApp', type: 'directory' },
    { name: 'MobileApp', path: 'E:\\Projects\\MobileApp', type: 'directory' },
    { name: 'README.md', path: 'E:\\Projects\\README.md', type: 'file', extension: 'md', size: 2048 },
  ],
};

/**
 * 列出目录内容
 */
export async function listDirectory(path: string = currentPath): Promise<FileItem[]> {
  const electronAPI = (window as any).electronAPI;

  // 检查是否在 Electron 环境
  console.log('[FileSystem] Checking electronAPI:', !!electronAPI, 'fileSystem:', !!electronAPI?.fileSystem);
  
  if (electronAPI?.fileSystem?.listDirectory) {
    try {
      const normalizedPath = path.replace(/\//g, '\\');
      console.log('[FileSystem] Calling Electron API for:', normalizedPath);
      const result = await electronAPI.fileSystem.listDirectory(normalizedPath);
      console.log('[FileSystem] Electron result:', result);
      return result.map((item: any) => ({
        ...item,
        type: item.type === 'directory' ? 'directory' : 'file'
      }));
    } catch (error) {
      console.error('Failed to list directory:', error);
      return [];
    }
  }

  console.log('[FileSystem] Using mock data for:', path);
  // 浏览器环境 - 使用模拟数据
  const normalizedPath = path.replace(/\//g, '\\').replace(/\\+$/, '');
  const items = mockFileSystem[normalizedPath] || mockFileSystem['E:\\'] || [];
  return [...items];
}

/**
 * 读取文件内容
 */
export async function readFile(filePath: string): Promise<FileContent | null> {
  const electronAPI = (window as any).electronAPI;

  // 检查是否在 Electron 环境
  if (electronAPI?.fileSystem?.readFile) {
    try {
      const normalizedPath = filePath.replace(/\//g, '\\');
      const result = await electronAPI.fileSystem.readFile(normalizedPath);
      if (result.error) {
        console.error('Failed to read file:', result.error);
        return null;
      }
      return result;
    } catch (error) {
      console.error('Failed to read file:', error);
      return null;
    }
  }

  // 浏览器环境 - 模拟文件内容
  const extension = filePath.split('.').pop()?.toLowerCase();
  let content = '';

  switch (extension) {
    case 'md':
      content = `# ${filePath.split('\\').pop()}

这是一个模拟的 Markdown 文件内容。

## 说明

在桌面版应用中，您可以查看和编辑真实的文件。

- 支持 Markdown 预览
- 支持代码高亮
- 支持文件搜索
`;
      break;
    case 'json':
      content = JSON.stringify({
        name: "模拟配置",
        version: "1.0.0",
        description: "这是模拟的 JSON 文件内容"
      }, null, 2);
      break;
    case 'txt':
      content = `这是 ${filePath} 的模拟内容。

在浏览器环境中，文件内容是模拟的。
使用桌面版应用可以访问真实文件系统。`;
      break;
    default:
      content = `文件: ${filePath}\n\n在浏览器环境中无法显示此文件的真实内容。\n请使用桌面版应用访问真实文件。`;
  }

  return {
    content,
    encoding: 'utf-8',
    size: content.length
  };
}

/**
 * 写入文件
 */
export async function writeFile(filePath: string, content: string): Promise<boolean> {
  const electronAPI = (window as any).electronAPI;

  // 检查是否在 Electron 环境
  if (electronAPI?.fileSystem?.writeFile) {
    try {
      const normalizedPath = filePath.replace(/\//g, '\\');
      await electronAPI.fileSystem.writeFile(normalizedPath, content);
      return true;
    } catch (error) {
      console.error('Failed to write file:', error);
      return false;
    }
  }

  // 浏览器环境 - 保存到 localStorage
  try {
    const key = `file:${filePath}`;
    localStorage.setItem(key, content);
    return true;
  } catch (error) {
    console.error('Failed to save file:', error);
    return false;
  }
}

/**
 * 获取当前路径
 */
export function getCurrentPath(): string {
  return currentPath;
}

/**
 * 设置当前路径
 */
export function setCurrentPath(path: string): void {
  currentPath = path;
}

/**
 * 获取文件图标
 */
export function getFileIcon(item: FileItem): string {
  if (item.type === 'directory') {
    return '📁';
  }

  switch (item.extension) {
    case 'md': return '📝';
    case 'json': return '📋';
    case 'txt': return '📄';
    case 'js': return '📜';
    case 'ts': return '📘';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'py': return '🐍';
    case 'jpg':
    case 'png':
    case 'gif': return '🖼️';
    default: return '📄';
  }
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
