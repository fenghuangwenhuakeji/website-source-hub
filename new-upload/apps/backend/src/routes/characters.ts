import { Router, Request, Response } from 'express';
import { optionalAuthMiddleware } from '../middleware/optionalAuth.js';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database.js';

const router = Router();

const defaultCharacters = [
  {
    id: 'assistant',
    name: 'AI助手',
    description: '一个智能助手，可以帮助你完成各种任务',
    avatar: '/characters/assistant.png',
    personality: '友好、专业、乐于助人',
    enabled: true
  },
  {
    id: 'adventurer',
    name: '冒险家',
    description: '一个勇敢的冒险者，喜欢探索未知的世界',
    avatar: '/characters/adventurer.png',
    personality: '勇敢、好奇、乐观',
    enabled: true
  },
  {
    id: 'storyteller',
    name: '故事讲述者',
    description: '一个擅长讲故事的老人，知道很多古老的传说',
    avatar: '/characters/storyteller.png',
    personality: '智慧、神秘、耐心',
    enabled: true
  }
];

router.get('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    
    if (userId) {
      try {
        const result = await query(
          'SELECT * FROM characters WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC',
          [userId]
        );
        if (result && result.length > 0) {
          return res.json({ success: true, data: result });
        }
      } catch (e) {}
    }
    
    res.json({ success: true, data: defaultCharacters });
  } catch (error) {
    console.error('Characters error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.post('/', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { name, description, personality, avatar } = req.body;
    
    const id = uuidv4();
    
    if (userId) {
      try {
        await query(
          'INSERT INTO characters (id, user_id, name, description, personality, avatar, enabled, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, NOW())',
          [id, userId, name, description, personality, avatar || '/characters/default.png']
        );
      } catch (e) {}
    }
    
    res.json({ success: true, data: { id, ...req.body } });
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.put('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    const { name, description, personality, avatar, enabled } = req.body;
    
    if (userId) {
      try {
        await query(
          'UPDATE characters SET name = ?, description = ?, personality = ?, avatar = ?, enabled = ? WHERE id = ? AND user_id = ?',
          [name, description, personality, avatar, enabled, id, userId]
        );
      } catch (e) {}
    }
    
    res.json({ success: true, message: 'Character updated' });
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.delete('/:id', optionalAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;
    
    if (userId) {
      try {
        await query('DELETE FROM characters WHERE id = ? AND user_id = ?', [id, userId]);
      } catch (e) {}
    }
    
    res.json({ success: true, message: 'Character deleted' });
  } catch (error) {
    console.error('Delete character error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

export default router;
