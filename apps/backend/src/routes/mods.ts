import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import { query } from '../config/database.js';

const router = Router();

const defaultMods = [
  { id: 'base', name: '基础模块', version: '1.0.0', enabled: true },
  { id: 'adventure', name: '冒险模块', version: '1.0.0', enabled: true },
  { id: 'chat', name: '聊天模块', version: '1.0.0', enabled: true },
  { id: 'memory', name: '记忆模块', version: '1.0.0', enabled: true },
];

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: defaultMods });
  } catch (error) {
    console.error('Mods error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/enable', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const modId = req.params.id;
    res.json({ success: true, message: `Mod ${modId} enabled` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/:id/disable', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const modId = req.params.id;
    res.json({ success: true, message: `Mod ${modId} disabled` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
