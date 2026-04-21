import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const PLUGINS_DIR = path.join(__dirname, '..', 'plugins');
const INSTALLED_PLUGINS_FILE = path.join(__dirname, '..', 'data', 'installed-plugins.json');

interface Plugin {
  id: string;
  name: string;
  displayName: string;
  description: string;
  version: string;
  publisher: {
    name: string;
    verified: boolean;
  };
  icon?: string;
  categories: string[];
  tags: string[];
  downloads: number;
  rating: number;
  ratingCount: number;
  installed: boolean;
  enabled: boolean;
  updatedAt: string;
}

const mockPlugins: Plugin[] = [
  {
    id: 'theme-dark-plus',
    name: 'theme-dark-plus',
    displayName: 'Dark+ Theme',
    description: '深色主题，优化代码可读性和眼睛舒适度',
    version: '1.0.0',
    publisher: { name: 'CodeEditor', verified: true },
    categories: ['themes'],
    tags: ['theme', 'dark', 'color'],
    downloads: 150000,
    rating: 4.8,
    ratingCount: 1200,
    installed: true,
    enabled: true,
    updatedAt: '2026-03-15',
  },
  {
    id: 'python-extension',
    name: 'python-extension',
    displayName: 'Python',
    description: 'Python 语言支持，包括智能提示、调试、代码格式化',
    version: '2026.3.1',
    publisher: { name: 'Microsoft', verified: true },
    categories: ['languages', 'debuggers', 'linters'],
    tags: ['python', 'debugging', 'linting'],
    downloads: 850000,
    rating: 4.9,
    ratingCount: 5600,
    installed: true,
    enabled: true,
    updatedAt: '2026-03-28',
  },
  {
    id: 'prettier-formatter',
    name: 'prettier-formatter',
    displayName: 'Prettier',
    description: '代码格式化工具，支持多种语言',
    version: '10.2.0',
    publisher: { name: 'Prettier', verified: true },
    categories: ['formatters'],
    tags: ['formatting', 'prettier', 'javascript'],
    downloads: 620000,
    rating: 4.7,
    ratingCount: 3200,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-20',
  },
  {
    id: 'git-lens',
    name: 'git-lens',
    displayName: 'GitLens',
    description: 'Git 增强工具，显示代码作者、历史、比较',
    version: '14.5.0',
    publisher: { name: 'GitKraken', verified: true },
    categories: ['productivity'],
    tags: ['git', 'blame', 'history'],
    downloads: 980000,
    rating: 4.8,
    ratingCount: 8900,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-25',
  },
  {
    id: 'eslint-linter',
    name: 'eslint-linter',
    displayName: 'ESLint',
    description: 'JavaScript 和 TypeScript 代码检查工具',
    version: '2.4.0',
    publisher: { name: 'Microsoft', verified: true },
    categories: ['linters'],
    tags: ['eslint', 'linting', 'javascript'],
    downloads: 750000,
    rating: 4.6,
    ratingCount: 4100,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-22',
  },
  {
    id: 'rust-analyzer',
    name: 'rust-analyzer',
    displayName: 'rust-analyzer',
    description: 'Rust 语言服务器，提供智能提示、代码补全、重构等功能',
    version: '0.3.2026',
    publisher: { name: 'rust-analyzer', verified: true },
    categories: ['languages'],
    tags: ['rust', 'lsp', 'intellisense'],
    downloads: 420000,
    rating: 4.9,
    ratingCount: 2800,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-30',
  },
  {
    id: 'docker-support',
    name: 'docker-support',
    displayName: 'Docker',
    description: 'Docker 容器支持，管理镜像、容器、编排',
    version: '1.26.0',
    publisher: { name: 'Microsoft', verified: true },
    categories: ['productivity'],
    tags: ['docker', 'containers', 'devops'],
    downloads: 580000,
    rating: 4.7,
    ratingCount: 3500,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-18',
  },
  {
    id: 'tailwind-intellisense',
    name: 'tailwind-intellisense',
    displayName: 'Tailwind CSS IntelliSense',
    description: 'Tailwind CSS 智能提示、语法高亮、类名补全',
    version: '0.9.0',
    publisher: { name: 'Tailwind Labs', verified: true },
    categories: ['productivity'],
    tags: ['tailwind', 'css', 'intellisense'],
    downloads: 890000,
    rating: 4.8,
    ratingCount: 6200,
    installed: false,
    enabled: false,
    updatedAt: '2026-03-27',
  },
];

function getInstalledPlugins(): Record<string, { enabled: boolean }> {
  try {
    if (fs.existsSync(INSTALLED_PLUGINS_FILE)) {
      const data = fs.readFileSync(INSTALLED_PLUGINS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to read installed plugins:', error);
  }
  return {};
}

function saveInstalledPlugins(installed: Record<string, { enabled: boolean }>): void {
  try {
    const dataDir = path.dirname(INSTALLED_PLUGINS_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(INSTALLED_PLUGINS_FILE, JSON.stringify(installed, null, 2));
  } catch (error) {
    console.error('Failed to save installed plugins:', error);
  }
}

router.get('/marketplace', async (req: Request, res: Response) => {
  try {
    const installed = getInstalledPlugins();

    const plugins = mockPlugins.map((plugin) => ({
      ...plugin,
      installed: !!installed[plugin.id],
      enabled: installed[plugin.id]?.enabled ?? false,
    }));

    res.json({
      success: true,
      plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/installed', async (req: Request, res: Response) => {
  try {
    const installed = getInstalledPlugins();

    const plugins = mockPlugins
      .filter((plugin) => installed[plugin.id])
      .map((plugin) => ({
        ...plugin,
        installed: true,
        enabled: installed[plugin.id]?.enabled ?? false,
      }));

    res.json({
      success: true,
      plugins,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/install/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plugin = mockPlugins.find((p) => p.id === id);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found',
      });
    }

    const installed = getInstalledPlugins();
    installed[id] = { enabled: true };
    saveInstalledPlugins(installed);

    res.json({
      success: true,
      message: `Plugin ${id} installed successfully`,
      plugin: {
        ...plugin,
        installed: true,
        enabled: true,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to install plugin',
    });
  }
});

router.post('/uninstall/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const installed = getInstalledPlugins();
    if (!installed[id]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not installed',
      });
    }

    delete installed[id];
    saveInstalledPlugins(installed);

    res.json({
      success: true,
      message: `Plugin ${id} uninstalled successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to uninstall plugin',
    });
  }
});

router.post('/enable/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const installed = getInstalledPlugins();
    if (!installed[id]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not installed',
      });
    }

    installed[id].enabled = true;
    saveInstalledPlugins(installed);

    res.json({
      success: true,
      message: `Plugin ${id} enabled`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enable plugin',
    });
  }
});

router.post('/disable/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const installed = getInstalledPlugins();
    if (!installed[id]) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not installed',
      });
    }

    installed[id].enabled = false;
    saveInstalledPlugins(installed);

    res.json({
      success: true,
      message: `Plugin ${id} disabled`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to disable plugin',
    });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const plugin = mockPlugins.find((p) => p.id === id);
    if (!plugin) {
      return res.status(404).json({
        success: false,
        error: 'Plugin not found',
      });
    }

    const installed = getInstalledPlugins();

    res.json({
      success: true,
      plugin: {
        ...plugin,
        installed: !!installed[id],
        enabled: installed[id]?.enabled ?? false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
