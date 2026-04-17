/**
 * CodeEditor Constants
 */

export const APP_ID = 34;
export const APP_NAME = 'codeEditor';

export const STATE_FILE = '/code_editor_state.json';

// FileExplorer 资源路径 - IDE 的默认资源加载地址
export const FILE_EXPLORER_RESOURCES_PATH = '/file_explorer_resources/';

export const DEFAULT_STATE = {
  openFiles: [] as string[],
  activeFile: null as string | null,
  files: {} as Record<string, FileItem>,
  sidebarWidth: 220,
  showSidebar: true,
};

export type FileItemType = 'file' | 'folder';

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: FileItemType;
  content?: string;
  language?: string;
  isModified?: boolean;
  isOpen?: boolean;
  children?: FileItem[];
}

// 兼容旧接口
export interface FileData {
  id: string;
  name: string;
  path: string;
  content: string;
  language: string;
  isModified: boolean;
}

export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  cs: 'csharp',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  swift: 'swift',
  kt: 'kotlin',
  scala: 'scala',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  xml: 'xml',
  yaml: 'yaml',
  yml: 'yaml',
  md: 'markdown',
  sql: 'sql',
  sh: 'shell',
  bash: 'shell',
  ps1: 'powershell',
  dockerfile: 'dockerfile',
  vue: 'vue',
  svelte: 'svelte',
};

export const DEFAULT_FILES: FileItem[] = [
  {
    id: 'agent-skills',
    name: '🤖 Agent Skills',
    path: '/agent-skills',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'agent-skills/app-builder-agent',
        name: 'app-builder-agent.md',
        path: '/agent-skills/app-builder-agent',
        type: 'file',
        content: '', // 内容在组件中动态加载
        language: 'markdown',
        isModified: false,
      },
    ],
  },
  {
    id: 'src',
    name: 'src',
    path: '/src',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'components',
        name: 'components',
        path: '/src/components',
        type: 'folder',
        isOpen: false,
        children: [
          {
            id: 'Button',
            name: 'Button.tsx',
            path: '/src/components/Button.tsx',
            type: 'file',
            content: `import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick,
  variant = 'primary'
}) => {
  return (
    <button 
      className={\`btn btn-\${variant}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`,
            language: 'typescript',
            isModified: false,
          },
          {
            id: 'Header',
            name: 'Header.tsx',
            path: '/src/components/Header.tsx',
            type: 'file',
            content: `import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="header">
      <h1>My App</h1>
    </header>
  );
};
`,
            language: 'typescript',
            isModified: false,
          },
        ],
      },
      {
        id: 'utils',
        name: 'utils',
        path: '/src/utils',
        type: 'folder',
        isOpen: false,
        children: [
          {
            id: 'helpers',
            name: 'helpers.ts',
            path: '/src/utils/helpers.ts',
            type: 'file',
            content: `export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('zh-CN');
};

export const capitalize = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};
`,
            language: 'typescript',
            isModified: false,
          },
        ],
      },
      {
        id: 'App',
        name: 'App.tsx',
        path: '/src/App.tsx',
        type: 'file',
        content: `import React from 'react';
import { Button } from './components/Button';
import { Header } from './components/Header';

function App() {
  return (
    <div className="App">
      <Header />
      <main>
        <h2>Welcome to VibeCoding</h2>
        <Button onClick={() => alert('Hello!')}>
          Click me
        </Button>
      </main>
    </div>
  );
}

export default App;
`,
        language: 'typescript',
        isModified: false,
      },
    ],
  },
  {
    id: 'public',
    name: 'public',
    path: '/public',
    type: 'folder',
    isOpen: false,
    children: [
      {
        id: 'index',
        name: 'index.html',
        path: '/public/index.html',
        type: 'file',
        content: `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeCoding App</title>
</head>
<body>
  <div id="root"></div>
  <script src="/bundle.js"></script>
</body>
</html>
`,
        language: 'html',
        isModified: false,
      },
    ],
  },
  {
    id: 'package',
    name: 'package.json',
    path: '/package.json',
    type: 'file',
    content: `{
  "name": "vibecoding-app",
  "version": "1.0.0",
  "description": "A VibeCoding project",
  "main": "index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
`,
    language: 'json',
    isModified: false,
  },
  {
    id: 'readme',
    name: 'README.md',
    path: '/README.md',
    type: 'file',
    content: `# VibeCoding Project

This is a sample project for VibeCoding IDE.

## Features

- React + TypeScript
- Component-based architecture
- Modern development workflow

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`
`,
    language: 'markdown',
    isModified: false,
  },
];
