import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import { db } from '../config/database.js';
import { authMiddleware, AuthRequest, generateToken } from '../middleware/auth.js';
import { ApiError } from '../middleware/errorHandler.js';
import { RowDataPacket } from 'mysql2/promise';

const router = Router();

router.post(
  '/register',
  body('username').isLength({ min: 3, max: 20 }).withMessage('用户名长度3-20字符'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ApiError.badRequest(errors.array()[0].msg as string);
      }

      const { username, password, email } = req.body;

      const existing = await db.query<RowDataPacket[]>(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email || '']
      );

      if (existing.length > 0) {
        throw ApiError.badRequest('用户名或邮箱已存在');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const result = await db.execute(
        'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
        [username, passwordHash, email || null]
      );

      const userId = String(result.insertId);
      const token = generateToken({ userId, username });

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: {
          token,
          user: {
            id: userId,
            username,
            balance: 0
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/login',
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').notEmpty().withMessage('密码不能为空'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw ApiError.badRequest(errors.array()[0].msg as string);
      }

      const { username, password } = req.body;

      const users = await db.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE username = ?',
        [username]
      );

      if (users.length === 0) {
        throw ApiError.unauthorized('用户名或密码错误');
      }

      const user = users[0] as any;
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        throw ApiError.unauthorized('用户名或密码错误');
      }

      await db.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      const token = generateToken({ userId: String(user.id), username: user.username });

      res.json({
        success: true,
        message: '登录成功',
        data: {
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            balance: user.balance,
            total_recharge: user.total_recharge,
            vip_level: user.vip_level
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    res.json({
      success: true,
      data: {
        id: authReq.user!.id,
        username: authReq.user!.username,
        email: authReq.user!.email,
        balance: authReq.user!.balance,
        total_recharge: authReq.user!.total_recharge,
        vip_level: authReq.user!.vip_level,
        created_at: authReq.user!.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

router.put(
  '/profile',
  authMiddleware,
  body('email').optional().isEmail().withMessage('邮箱格式不正确'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authReq = req as AuthRequest;
      const { email, phone } = req.body;

      await db.execute(
        'UPDATE users SET email = ?, phone = ? WHERE id = ?',
        [email || null, phone || null, authReq.user!.id]
      );

      res.json({
        success: true,
        message: '资料更新成功'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/balance', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const users = await db.query<RowDataPacket[]>(
      'SELECT balance, total_recharge, vip_level FROM users WHERE id = ?',
      [authReq.user!.id]
    );

    res.json({
      success: true,
      data: {
        balance: users[0]?.balance || 0,
        total_recharge: users[0]?.total_recharge || 0,
        vip_level: users[0]?.vip_level || 0
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/items', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const items = await db.query<RowDataPacket[]>(
      'SELECT * FROM user_items WHERE user_id = ? ORDER BY created_at DESC',
      [authReq.user!.id]
    );

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    next(error);
  }
});

router.get('/records', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const records = await db.query<RowDataPacket[]>(
      `SELECT gr.*, gp.name as pool_name
       FROM gacha_records gr
       JOIN gacha_pools gp ON gr.pool_id = gp.id
       WHERE gr.user_id = ?
       ORDER BY gr.created_at DESC
       LIMIT ? OFFSET ?`,
      [authReq.user!.id, limit, offset]
    );

    const total = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM gacha_records WHERE user_id = ?',
      [authReq.user!.id]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: total[0]?.count || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/consumption', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const records = await db.query<RowDataPacket[]>(
      'SELECT * FROM consumption_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [authReq.user!.id, limit, offset]
    );

    const total = await db.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM consumption_records WHERE user_id = ?',
      [authReq.user!.id]
    );

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: total[0]?.count || 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
