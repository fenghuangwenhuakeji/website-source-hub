import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

const CONFIG_DIR = process.env.CONFIG_DIR || '/var/www/chaowuqiong/config';
const LLM_CONFIG_FILE = path.join(CONFIG_DIR, 'llm-config.json');

const defaultConfig = {
  provider: 'openai',
  model: 'gpt-4',
  apiKey: '',
  baseUrl: '',
  temperature: 0.7,
  maxTokens: 4096,
};

const ensureConfigDir = async () => {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (e) {}
};

const normalizeScope = (value?: string | null): string => {
  const normalized = String(value || 'guest')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'guest';
};

const resolveScopedConfigFile = (req: Request): string => {
  const user = (req as any).user;
  const scope =
    user?.userId ||
    user?.id ||
    user?.username ||
    req.header('x-config-scope') ||
    'guest';

  return path.join(CONFIG_DIR, `llm-config.${normalizeScope(scope)}.json`);
};

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureConfigDir();
    const scopedConfigFile = resolveScopedConfigFile(req);
    try {
      const content = await fs.readFile(scopedConfigFile, 'utf-8');
      const config = JSON.parse(content);
      res.json({ success: true, data: config });
    } catch (e) {
      try {
        const legacyContent = await fs.readFile(LLM_CONFIG_FILE, 'utf-8');
        const legacyConfig = JSON.parse(legacyContent);
        res.json({ success: true, data: legacyConfig });
      } catch {
        res.json({ success: true, data: defaultConfig });
      }
    }
  } catch (error) {
    console.error('LLM config GET error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureConfigDir();
    const config = req.body;
    const scopedConfigFile = resolveScopedConfigFile(req);
    await fs.writeFile(scopedConfigFile, JSON.stringify(config, null, 2));
    res.json({ success: true, message: 'Config saved' });
  } catch (error) {
    console.error('LLM config POST error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
