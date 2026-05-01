import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/database.js';
import { config } from '../config/index.js';

export interface JwtPayload {
  userId: string;
  username: string;
  role?: string;
  isAdmin?: boolean;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email?: string;
    role?: string;
    balance?: number;
    points?: number;
    total_recharge?: number;
    vip_level?: number;
    created_at?: Date | string;
  };
  admin?: JwtPayload;
}

function getJwtSecret(): string {
  return config.jwt.secret || process.env.JWT_SECRET || 'default_secret';
}

function buildUnauthorized(res: Response, message: string): void {
  res.status(401).json({
    success: false,
    message,
  });
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      buildUnauthorized(res, 'Unauthorized. Please log in first.');
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
      const users = await db.query<any[]>(
        `SELECT id, username, email, role, points, total_recharge, vip_level, created_at
         FROM users
         WHERE id = ?
           AND (status = 'active' OR status IS NULL)`,
        [decoded.userId],
      );

      if (users.length === 0) {
        buildUnauthorized(res, 'User does not exist or has been disabled.');
        return;
      }

      req.user = users[0];
      next();
    } catch (jwtError: any) {
      if (jwtError?.name === 'TokenExpiredError') {
        buildUnauthorized(res, 'Session expired. Please log in again.');
        return;
      }

      buildUnauthorized(res, 'Invalid login token.');
    }
  } catch (error) {
    next(error);
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
      const users = await db.query<any[]>(
        `SELECT id, username, email, role, points, total_recharge, vip_level, created_at
         FROM users
         WHERE id = ?
           AND (status = 'active' OR status IS NULL)`,
        [decoded.userId],
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    } catch {
      // Ignore optional auth failures.
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const adminAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      buildUnauthorized(res, 'Unauthorized. Please log in first.');
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, getJwtSecret()) as JwtPayload;
      const role = decoded.role;
      const isAdminRole = role === 'admin' || role === 'rootadmin' || role === 'super_admin';

      if (!decoded.isAdmin && !isAdminRole) {
        res.status(403).json({
          success: false,
          message: 'Admin permission required.',
        });
        return;
      }

      req.admin = decoded;
      next();
    } catch {
      buildUnauthorized(res, 'Invalid admin token.');
    }
  } catch (error) {
    next(error);
  }
};

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as object, getJwtSecret(), {
    expiresIn: config.jwt.expiresIn,
  } as jwt.SignOptions);
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtPayload;
  } catch {
    return null;
  }
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload as object, getJwtSecret(), {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};
