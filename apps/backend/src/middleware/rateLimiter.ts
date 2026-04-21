import { Request, Response, NextFunction } from 'express';

interface RateLimiterStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimiterStore = {};

export function rateLimiter(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const routeKey = `${req.baseUrl || ''}:${req.route?.path || req.path || ''}`;
    const key = `${req.ip || 'unknown'}:${routeKey}`;
    const now = Date.now();

    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 1,
        resetTime: now + windowMs,
      };
      next();
      return;
    }

    store[key].count++;

    if (store[key].count > maxRequests) {
      res.status(429).json({
        success: false,
        message: '请求过于频繁，请稍后再试',
      });
      return;
    }

    next();
  };
}

export const authRateLimiter = rateLimiter(100, 60 * 1000);
export const apiRateLimiter = rateLimiter(300, 60 * 1000);
export const paymentRateLimiter = rateLimiter(20, 60 * 1000);
