import express, { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import fs from 'fs/promises';
import path from 'path';
import { resolveInsideRoot, storage } from '../config/storage.js';

const router = Router();

const SESSION_DIR = storage.sessionDir;
const DESKTOP_RUNTIME_ROOT = storage.storageRoot;

router.use(express.raw({ type: '*/*', limit: '50mb' }));

const ensureDir = async (filePath: string) => {
  const dir = path.dirname(filePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {}
};

const normalizeListPath = (value: string): string => value.replace(/\\/g, '/');
const normalizeRequestPath = (value: string): string => value.replace(/^[\\/]+/, '');
const resolveStorageRoot = (requestedPath: string): string => {
  const normalized = normalizeRequestPath(requestedPath);
  if (normalized.startsWith('desktop-runtime/')) {
    return DESKTOP_RUNTIME_ROOT;
  }
  return SESSION_DIR;
};

const listDirectory = async (rootPath: string): Promise<Array<{ path: string; type: number; size?: number }>> => {
  const results: Array<{ path: string; type: number; size?: number }> = [];

  const walk = async (currentPath: string, relativePath: string) => {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      const entryRel = relativePath ? path.posix.join(relativePath, entry.name) : entry.name;
      const entryPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        results.push({ path: normalizeListPath(entryRel), type: 1 });
        await walk(entryPath, entryRel);
      } else {
        const stat = await fs.stat(entryPath);
        results.push({ path: normalizeListPath(entryRel), type: 0, size: stat.size });
      }
    }
  };

  await walk(rootPath, '');
  return results;
};

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    const action = req.query.action as string;
    
    if (!filePath) {
      return res.json({ files: [], not_exists: true });
    }

    const normalizedPath = normalizeRequestPath(filePath);
    const storageRoot = resolveStorageRoot(normalizedPath);
    const fullPath = resolveInsideRoot(storageRoot, normalizedPath);
    
    if (action === 'list') {
      try {
        const stat = await fs.stat(fullPath).catch(() => null);
        if (!stat || !stat.isDirectory()) {
          return res.json({ files: [], not_exists: true });
        }
        const files = await listDirectory(fullPath);
        return res.json({ files, not_exists: false });
      } catch (e) {
        return res.json({ files: [], not_exists: true });
      }
    }

    try {
      const buffer = await fs.readFile(fullPath);
      const ext = path.extname(fullPath).toLowerCase();
      if (ext === '.json' || ext === '.txt' || ext === '.md' || ext === '.yaml' || ext === '.yml' || ext === '.html' || ext === '.css' || ext === '.js' || ext === '.ts') {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(buffer.toString('utf-8'));
      }
      return res.send(buffer);
    } catch (e) {
      return res.status(404).send('');
    }
  } catch (error) {
    console.error('Session data GET error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }

    const normalizedPath = normalizeRequestPath(filePath);
    const storageRoot = resolveStorageRoot(normalizedPath);
    const fullPath = resolveInsideRoot(storageRoot, normalizedPath);
    await ensureDir(fullPath);
    
    const content = req.body;
    if (Buffer.isBuffer(content)) {
      await fs.writeFile(fullPath, content);
    } else if (typeof content === 'string') {
      await fs.writeFile(fullPath, content);
    } else {
      await fs.writeFile(fullPath, JSON.stringify(content ?? {}, null, 2));
    }
    
    res.json({ success: true, message: 'Saved' });
  } catch (error) {
    console.error('Session data POST error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      return res.status(400).json({ success: false, message: 'Path is required' });
    }

    const normalizedPath = normalizeRequestPath(filePath);
    const storageRoot = resolveStorageRoot(normalizedPath);
    const fullPath = resolveInsideRoot(storageRoot, normalizedPath);
    
    try {
      await fs.unlink(fullPath);
    } catch (e) {}
    
    res.json({ success: true, message: 'Deleted' });
  } catch (error) {
    console.error('Session data DELETE error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
