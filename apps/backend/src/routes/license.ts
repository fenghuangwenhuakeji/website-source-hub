import { Router, Request, Response, NextFunction } from 'express';
import { transaction } from '../config/database.js';
import { authMiddleware } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import {
  DEFAULT_LICENSE_PRODUCT_ID,
  activateDeviceForProduct,
  createLicenseCodes,
  getProductAccessStatus,
  heartbeatLicenseSession,
  issueLocalLicense,
  redeemLicenseCodeForUser,
  releaseLicenseSeat,
} from '../utils/licenseCenter.js';

const router = Router();
const adminRoles = new Set(['admin', 'rootadmin', 'super_admin']);

function requireAdmin(req: Request): void {
  const role = String((req as any).user?.role || '').toLowerCase();
  if (!adminRoles.has(role)) {
    throw new AppError(403, 'Admin permission required.');
  }
}

function productIdFromRequest(req: Request): string {
  return String(req.params.productId || DEFAULT_LICENSE_PRODUCT_ID);
}

router.get('/products/:productId/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const status = await getProductAccessStatus(user.id, productIdFromRequest(req), user.role);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/activate-device', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const result = await activateDeviceForProduct({
      userId: user.id,
      role: user.role,
      productId: productIdFromRequest(req),
      deviceId: req.body?.deviceId,
      deviceName: req.body?.deviceName,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/issue', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const license = await issueLocalLicense({
      userId: user.id,
      role: user.role,
      productId: productIdFromRequest(req),
      deviceId: req.body?.deviceId,
      deviceName: req.body?.deviceName,
      sessionId: req.body?.sessionId,
    });
    res.json({ success: true, data: { license } });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/redeem-code', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const productId = productIdFromRequest(req);
    const redemption = await transaction((connection) =>
      redeemLicenseCodeForUser(
        {
          userId: user.id,
          productId,
          code: req.body?.code,
        },
        connection
      )
    );
    const status = await getProductAccessStatus(user.id, productId, user.role);
    res.json({ success: true, message: '卡密兑换成功。', data: { redemption, status } });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/heartbeat', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    const result = await heartbeatLicenseSession({
      userId: user.id,
      role: user.role,
      productId: productIdFromRequest(req),
      deviceId: req.body?.deviceId,
      deviceName: req.body?.deviceName,
      sessionId: req.body?.sessionId,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/products/:productId/release-seat', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    await releaseLicenseSeat({
      userId: user.id,
      productId: productIdFromRequest(req),
      sessionId: req.body?.sessionId,
      deviceId: req.body?.deviceId,
    });
    res.json({ success: true, message: '席位已释放。' });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/license-codes', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireAdmin(req);
    const user = (req as any).user;
    const codes = await createLicenseCodes({
      productId: req.body?.productId || DEFAULT_LICENSE_PRODUCT_ID,
      planName: req.body?.planName,
      durationDays: Number(req.body?.durationDays || 30),
      seatLimit: Number(req.body?.seatLimit || 1),
      deviceLimit: Number(req.body?.deviceLimit || 1),
      quantity: Number(req.body?.quantity || 1),
      prefix: req.body?.prefix,
      generatedBy: user.id,
      note: req.body?.note,
      expiresInDays: req.body?.expiresInDays ? Number(req.body.expiresInDays) : undefined,
      isPermanent: Boolean(req.body?.isPermanent),
    });
    res.json({ success: true, data: { codes } });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/products/:productId/status/:userId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    requireAdmin(req);
    const status = await getProductAccessStatus(req.params.userId, req.params.productId);
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

export default router;
