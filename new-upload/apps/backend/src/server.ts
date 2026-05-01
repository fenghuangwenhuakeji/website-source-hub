import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dayjs from 'dayjs';
import { config } from './config/index.js';
import { runAuthSystemMigrations } from './config/authMigrations.js';
import { initializeDatabase, isDatabaseConnected } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRateLimiter, apiRateLimiter } from './middleware/rateLimiter.js';

import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import rechargeRouter from './routes/recharge.js';
import paymentRouter from './routes/payment.js';
import electionRouter from './routes/election.js';
import novelsRouter from './routes/novels.js';
import vipRouter from './routes/vip.js';
import ordersRouter from './routes/orders.js';
import pointsRouter from './routes/points.js';
import referralRouter from './routes/referral.js';
import durationRouter from './routes/duration.js';
import adminRouter from './routes/admin.js';
import sessionDataRouter from './routes/sessionData.js';
import modsRouter from './routes/mods.js';
import llmConfigRouter from './routes/llmConfig.js';
import charactersRouter from './routes/characters.js';
import llmProxyRouter from './routes/llmProxy.js';
import smsAuthRouter from './routes/smsAuth.js';
import wechatAuthRouter from './routes/wechatAuth.js';
import fsRouter from './routes/fs.js';

const app = express();
const WECHAT_APP_SECRET_PATTERN = /^[A-Za-z0-9]{32}$/;

app.use(compression());

const defaultCorsOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  'http://localhost:4174',
  'http://localhost:5182',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:4173',
  'http://127.0.0.1:4174',
  'http://127.0.0.1:5182',
  'http://fhwhkj.top',
  'https://fhwhkj.top',
  'http://www.fhwhkj.top',
  'https://www.fhwhkj.top',
  'http://115.190.158.182',
  'https://115.190.158.182',
  'http://115.190.158.182:3000',
  'https://115.190.158.182:3000',
];
const corsOrigins = new Set(
  (process.env.CORS_ORIGIN || defaultCorsOrigins.join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || corsOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Config-Scope'],
}));

app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf.toString('utf8');
  },
}));
app.use(express.urlencoded({
  extended: true,
  limit: '10mb',
  verify: (req, _res, buf) => {
    (req as any).rawBody = buf.toString('utf8');
  },
}));

app.use((req, _res, next) => {
  console.log(`[${dayjs().format('YYYY-MM-DD HH:mm:ss')}] ${req.method} ${req.path}`);
  next();
});

app.use('/api/auth', authRateLimiter, authRouter);
app.use('/api/user', apiRateLimiter, userRouter);
app.use('/api/recharge', apiRateLimiter, rechargeRouter);
app.use('/api/payment', paymentRouter);
app.use('/api/election', apiRateLimiter, electionRouter);
app.use('/api/novels', apiRateLimiter, novelsRouter);
app.use('/api/vip', apiRateLimiter, vipRouter);
app.use('/api/orders', apiRateLimiter, ordersRouter);
app.use('/api/points', apiRateLimiter, pointsRouter);
app.use('/api/referral', apiRateLimiter, referralRouter);
app.use('/api/duration', apiRateLimiter, durationRouter);
app.use('/api', apiRateLimiter, adminRouter);
app.use('/api/session-data', apiRateLimiter, sessionDataRouter);
app.use('/api/mods', apiRateLimiter, modsRouter);
app.use('/api/llm-config', apiRateLimiter, llmConfigRouter);
app.use('/api/characters', apiRateLimiter, charactersRouter);
app.use('/api/llm-proxy', apiRateLimiter, llmProxyRouter);
app.use('/api/llm/chat', apiRateLimiter, llmProxyRouter);
app.use('/api/sms', authRateLimiter, smsAuthRouter);
app.use('/api/wechat', wechatAuthRouter);
app.use('/api/fs', apiRateLimiter, fsRouter);

// Agent APIs placeholder to prevent 404 from embedded apps
app.all('/api/agent/*', apiRateLimiter, (_req, res) => {
  res.json({ success: true, data: null });
});

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: dayjs().format('YYYY-MM-DD HH:mm:ss'),
    uptime: process.uptime(),
    version: '1.0.0',
    database: isDatabaseConnected() ? 'connected' : 'disconnected',
    redis: 'connected',
  });
});

app.get('/', (_req, res) => {
  res.json({
    success: true,
    message: 'Chaowuqiong API service is running.',
    version: '1.0.0',
    docs: '/api',
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

function getWechatLoginConfigStatus(): 'missing' | 'configured' | 'invalid-secret-format' {
  if (!config.wechatLogin.appId || !config.wechatLogin.appSecret) {
    return 'missing';
  }

  return WECHAT_APP_SECRET_PATTERN.test(config.wechatLogin.appSecret)
    ? 'configured'
    : 'invalid-secret-format';
}

async function startServer() {
  const dbConnected = await initializeDatabase();
  if (dbConnected) {
    await runAuthSystemMigrations();
    console.log('Database initialized successfully');
  } else {
    console.log('Database unavailable, backend will continue in limited mode');
  }

  try {
    await initializeRedis();
    console.log('Redis initialized successfully');
  } catch {
    console.warn('Redis connection failed, falling back to in-memory cache');
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('  Chaowuqiong backend started');
    console.log(`  Port: ${config.port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Time: ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`);
    console.log('========================================\n');
    console.log(`Database: ${dbConnected ? 'connected' : 'disconnected (limited mode)'}`);
    console.log(`WeChat pay config: ${config.wechat.appId ? 'configured' : 'missing'}`);
    console.log(`WeChat login config: ${getWechatLoginConfigStatus()}`);
    console.log(`Alipay config: ${config.alipay.appId ? 'configured' : 'missing'}`);
  });
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

startServer();

export default app;
