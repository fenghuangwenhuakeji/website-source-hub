import { Router, Request, Response } from 'express';
import {
  getDesktopVersionStatus,
  DESKTOP_DOWNLOAD_URL,
  DESKTOP_LATEST_VERSION,
  DESKTOP_MIN_SUPPORTED_VERSION,
} from '../utils/appVersion.js';

const router = Router();

router.get('/version', (req: Request, res: Response) => {
  const status = getDesktopVersionStatus(req);

  res.json({
    success: true,
    data: {
      ...status,
      latestVersion: DESKTOP_LATEST_VERSION,
      minSupportedVersion: DESKTOP_MIN_SUPPORTED_VERSION,
      downloadUrl: DESKTOP_DOWNLOAD_URL,
    },
  });
});

export default router;

