import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import { resolveInsideRoot, storage } from '../config/storage.js';

const router = Router();

const USER_FILES_ROOT = storage.userFilesRoot;
const DEFAULT_WORKSPACE = path.join(USER_FILES_ROOT, 'workspace');

const ensureDir = async (dirPath: string) => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch {}
};

const normalizeRequestPath = (value: string): string => value.replace(/^[\\/]+/, '');

const resolveWorkspacePath = (requestedPath: string): string => {
  const normalized = normalizeRequestPath(requestedPath);
  if (normalized.startsWith('user-files/')) {
    return resolveInsideRoot(USER_FILES_ROOT, normalized.slice('user-files/'.length));
  }
  return resolveInsideRoot(DEFAULT_WORKSPACE, normalized);
};

const getAvailableDrives = () => {
  if (process.platform === 'win32') {
    return Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))
      .map((letter) => `${letter}:\\`)
      .filter((drive) => {
        try {
          fs.access(drive);
          return true;
        } catch {
          return false;
        }
      })
      .map((drive) => ({
        name: `${drive.slice(0, 2)} 驱动器`,
        path: drive,
        sizeGB: 0,
        freeGB: 0,
        usedGB: 0,
      }));
  }
  return [{ name: '根目录', path: '/', sizeGB: 0, freeGB: 0, usedGB: 0 }];
};

/**
 * GET /api/fs/drives
 */
router.get('/drives', optionalAuthMiddleware, async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: getAvailableDrives() });
  } catch (error) {
    console.error('[FS API] drives error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/fs/list?path=...
 * Response: { files: [{ path, type, size? }], not_exists }
 *   type: 0 = file, 1 = directory
 */
router.get('/list', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requestedPath = (req.query.path as string) || '';
    const fullPath = resolveWorkspacePath(requestedPath);

    try {
      const stat = await fs.stat(fullPath);
      if (!stat.isDirectory()) {
        return res.json({ files: [], not_exists: true });
      }
    } catch {
      return res.json({ files: [], not_exists: true });
    }

    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(fullPath, entry.name);
        let size: number | undefined;
        if (entry.isFile()) {
          try {
            const s = await fs.stat(entryPath);
            size = s.size;
          } catch {}
        }
        return {
          path: entry.name,
          type: entry.isDirectory() ? 1 : 0,
          ...(size !== undefined ? { size } : {}),
        };
      }),
    );

    res.json({ files, not_exists: false });
  } catch (error) {
    console.error('[FS API] list error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/fs/read?path=...
 */
router.get('/read', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requestedPath = req.query.path as string;
    if (!requestedPath) {
      return res.status(400).json({ success: false, error: 'Missing path parameter' });
    }

    const fullPath = resolveWorkspacePath(requestedPath);
    const content = await fs.readFile(fullPath, 'utf8');
    const stat = await fs.stat(fullPath);

    res.json({
      success: true,
      data: content,
      content,
      encoding: 'utf-8',
      size: Buffer.byteLength(content),
      name: path.basename(fullPath),
      path: requestedPath,
      modified: stat.mtime.toISOString(),
    });
  } catch (error) {
    console.error('[FS API] read error:', error);
    res.status(404).json({ success: false, error: 'File not found or unreadable' });
  }
});

/**
 * GET /api/fs/stats?path=...
 */
router.get('/stats', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const requestedPath = req.query.path as string;
    if (!requestedPath) {
      return res.status(400).json({ success: false, error: 'Missing path parameter' });
    }

    const fullPath = resolveWorkspacePath(requestedPath);
    const stat = await fs.stat(fullPath);

    res.json({
      success: true,
      data: {
        path: requestedPath,
        name: path.basename(fullPath),
        size: stat.size,
        isDirectory: stat.isDirectory(),
        isFile: stat.isFile(),
        modified: stat.mtime.toISOString(),
        created: stat.birthtime.toISOString(),
      },
    });
  } catch (error) {
    console.error('[FS API] stats error:', error);
    res.status(404).json({ success: false, error: 'File not found' });
  }
});

/**
 * POST /api/fs/write
 * Body: { path, content }
 */
router.post('/write', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { path: filePath, content } = req.body;
    if (!filePath) {
      return res.status(400).json({ success: false, error: 'Missing path' });
    }

    const fullPath = resolveWorkspacePath(filePath);
    await ensureDir(path.dirname(fullPath));

    const contentStr = typeof content === 'string' ? content : JSON.stringify(content ?? {}, null, 2);
    await fs.writeFile(fullPath, contentStr, 'utf8');

    res.json({ success: true, path: filePath });
  } catch (error) {
    console.error('[FS API] write error:', error);
    res.status(500).json({ success: false, error: 'Write failed' });
  }
});

/**
 * POST /api/fs/delete
 * Body: { paths: string[] } or { path: string }
 */
router.post('/delete', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const paths = req.body.paths || (req.body.path ? [req.body.path] : []);
    if (!Array.isArray(paths) || paths.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing paths' });
    }

    for (const filePath of paths) {
      try {
        const fullPath = resolveWorkspacePath(filePath);
        await fs.unlink(fullPath);
      } catch (e) {
        // ignore individual deletion errors
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[FS API] delete error:', error);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

/**
 * GET /api/fs/search?query=...
 */
router.get('/search', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const query = (req.query.query as string) || '';
    if (!query) {
      return res.json({ success: true, data: [] });
    }

    const results: Array<{ path: string; name: string; type: string }> = [];

    const searchDir = async (dirPath: string, relativePath: string) => {
      const entries = await fs.readdir(dirPath, { withFileTypes: true }).catch(() => []);
      for (const entry of entries) {
        const entryRel = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        const entryFull = path.join(dirPath, entry.name);
        if (entry.name.toLowerCase().includes(query.toLowerCase())) {
          results.push({
            path: `/${entryRel}`,
            name: entry.name,
            type: entry.isDirectory() ? 'folder' : 'file',
          });
        }
        if (entry.isDirectory()) {
          await searchDir(entryFull, entryRel);
        }
      }
    };

    await searchDir(DEFAULT_WORKSPACE, '');
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[FS API] search error:', error);
    res.status(500).json({ success: false, error: 'Search failed' });
  }
});

export default router;
