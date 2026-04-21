import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import agentLoopRoutes from './agentLoopRoutes.js';
import mcpRoutes from './mcpRoutes.js';
import pluginRoutes from './pluginRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
const WORKSPACE_ROOT = path.join(__dirname, '..', 'workspace');

// 辅助函数：解析文件路径，支持绝对路径和相对路径
function resolveFilePath(filePath: string): string {
  if (!filePath) return WORKSPACE_ROOT;
  // 如果是绝对路径（Windows: D:\... 或 Unix: /...）
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  // 相对路径，基于工作目录
  return path.join(WORKSPACE_ROOT, filePath);
}

const app = express();
const PORT = 3003;
const JWT_SECRET = 'code-editor-secret-key-2026';

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:3000'],
  credentials: true,
}));

app.use(express.json());

interface User {
  id: string;
  username: string;
  passwordHash: string;
  email?: string;
  nickname: string;
  role: string;
  createdAt: Date;
}

const users: Map<string, User> = new Map();
const refreshTokens: Set<string> = new Set();

const demoUser: User = {
  id: 'demo-user-001',
  username: 'demo',
  passwordHash: bcrypt.hashSync('demo123', 10),
  nickname: 'Demo User',
  role: 'user',
  createdAt: new Date(),
};
users.set('demo', demoUser);

function generateToken(user: User): string {
  return jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function generateRefreshToken(user: User): string {
  const token = jwt.sign(
    { userId: user.id, username: user.username, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  refreshTokens.add(token);
  return token;
}

interface AuthRequest extends Request {
  user?: { userId: string; username: string; role: string };
}

// 演示模式 - 允许匿名访问
const DEMO_MODE = true;

function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // 演示模式下，如果没有 token，使用默认演示用户
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (DEMO_MODE) {
      // 演示模式：使用默认用户
      req.user = { userId: 'demo-user', username: 'demo', role: 'user' };
      next();
      return;
    }
    res.status(401).json({ success: false, message: '未授权访问' });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = { userId: decoded.userId, username: decoded.username, role: decoded.role };
    next();
  } catch {
    if (DEMO_MODE) {
      // 演示模式：token 无效时使用默认用户
      req.user = { userId: 'demo-user', username: 'demo', role: 'user' };
      next();
      return;
    }
    res.status(401).json({ success: false, message: 'Token无效或已过期' });
  }
}

app.post('/api/auth/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email, nickname, referralCode } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      return;
    }

    if (username.length < 3) {
      res.status(400).json({ success: false, message: '用户名至少3位' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ success: false, message: '密码至少6位' });
      return;
    }

    for (const user of users.values()) {
      if (user.username === username) {
        res.status(400).json({ success: false, message: '用户名已存在' });
        return;
      }
    }

    const userId = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);
    const userReferralCode = 'CE' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const newUser: User = {
      id: userId,
      username,
      passwordHash,
      email: email || undefined,
      nickname: nickname || username,
      role: 'user',
      createdAt: new Date(),
    };

    users.set(username, newUser);

    const token = generateToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    res.status(201).json({
      success: true,
      data: {
        user: {
          userId: newUser.id,
          username: newUser.username,
          nickname: newUser.nickname,
          role: newUser.role,
          referralCode: userReferralCode,
        },
        token,
        refreshToken,
        welcomeBonus: {
          totalPoints: 550,
          durationDays: 5,
        },
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: '注册失败' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, hasPassword: !!password });

    if (!username || !password) {
      res.status(400).json({ success: false, message: '用户名和密码不能为空' });
      return;
    }

    const user = users.get(username);
    if (!user) {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ success: false, message: '用户名或密码错误' });
      return;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user: {
          userId: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

app.post('/api/auth/phone/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body;

    if (!phone || !code) {
      res.status(400).json({ success: false, message: '手机号和验证码不能为空' });
      return;
    }

    if (code !== '123456') {
      res.status(401).json({ success: false, message: '验证码错误' });
      return;
    }

    let user: User | undefined;
    for (const u of users.values()) {
      if (u.email === phone) {
        user = u;
        break;
      }
    }

    if (!user) {
      const userId = uuidv4();
      const newUser: User = {
        id: userId,
        username: `user_${phone.slice(-4)}`,
        passwordHash: '',
        email: phone,
        nickname: `用户${phone.slice(-4)}`,
        role: 'user',
        createdAt: new Date(),
      };
      users.set(newUser.username, newUser);
      user = newUser;
    }

    const token = generateToken(user);
    const refreshToken = generateRefreshToken(user);

    res.json({
      success: true,
      data: {
        user: {
          userId: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Phone login error:', error);
    res.status(500).json({ success: false, message: '登录失败' });
  }
});

app.post('/api/auth/phone/code', (req: Request, res: Response): void => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ success: false, message: '手机号不能为空' });
    return;
  }
  res.json({
    success: true,
    message: '验证码已发送',
    data: { demoCode: '123456' },
  });
});

app.post('/api/auth/wechat/login', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      authUrl: 'https://open.weixin.qq.com/connect/qrconnect?appid=demo&redirect_uri=demo',
    },
  });
});

app.post('/api/auth/email/code', (req: Request, res: Response): void => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, message: '邮箱不能为空' });
    return;
  }
  res.json({
    success: true,
    message: '验证码已发送',
    data: { demoCode: '654321' },
  });
});

app.post('/api/auth/forgot-password', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, newPassword, code } = req.body;

    if (code !== '654321') {
      res.status(400).json({ success: false, message: '验证码错误' });
      return;
    }

    for (const user of users.values()) {
      if (user.email === email) {
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        res.json({ success: true, message: '密码重置成功' });
        return;
      }
    }

    res.status(404).json({ success: false, message: '邮箱未注册' });
  } catch (error) {
    res.status(500).json({ success: false, message: '重置失败' });
  }
});

app.get('/api/auth/profile', authMiddleware, (req: AuthRequest, res: Response): void => {
  const user = Array.from(users.values()).find(u => u.id === req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, message: '用户不存在' });
    return;
  }

  res.json({
    success: true,
    data: {
      userId: user.id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

app.get('/api/auth/check-recharge', authMiddleware, (req: AuthRequest, res: Response): void => {
  res.json({
    success: true,
    data: {
      needsRecharge: false,
      totalRecharge: 0,
      hasActiveMembership: true,
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      points: 550,
    },
  });
});

// Agent 扫描接口
app.get('/api/agents/scan', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const agentsDir = path.join(__dirname, '..', 'agents');
    const agents: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      version: string;
      status: 'active' | 'inactive';
    }> = [];

    // 扫描 agents 目录
    try {
      const entries = await fs.readdir(agentsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const agentId = entry.name;
          const skillPath = path.join(agentsDir, agentId, 'SKILL.md');
          let name = agentId;
          let description = '';
          let category = 'general';
          let version = '1.0.0';

          try {
            const skillContent = await fs.readFile(skillPath, 'utf-8');
            const nameMatch = skillContent.match(/^#\s+(.+)$/m);
            const descMatch = skillContent.match(/^##\s+Description\s*\n+([^#]+)/m);
            const catMatch = skillContent.match(/^##\s+Category\s*\n+(.+)$/m);
            const verMatch = skillContent.match(/^##\s+Version\s*\n+(.+)$/m);

            if (nameMatch) name = nameMatch[1].trim();
            if (descMatch) description = descMatch[1].trim();
            if (catMatch) category = catMatch[1].trim();
            if (verMatch) version = verMatch[1].trim();
          } catch {
            // 没有 SKILL.md 文件，使用默认值
          }

          agents.push({
            id: agentId,
            name,
            description,
            category,
            version,
            status: 'active',
          });
        }
      }
    } catch {
      // agents 目录不存在
    }

    res.json({
      success: true,
      data: {
        agents,
        total: agents.length,
        scannedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '扫描失败',
    });
  }
});

async function ensureWorkspace(): Promise<void> {
  try {
    await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  } catch {
    // ignore
  }
}

app.post('/api/agent/tool', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureWorkspace();
    const { tool, args } = req.body;

    if (!tool) {
      res.status(400).json({ success: false, error: '工具名称不能为空' });
      return;
    }

    let result: { success: boolean; output?: string; error?: string };

    switch (tool) {
      case 'read': {
        const { path: filePath, startLine, endLine } = args;
        const fullPath = resolveFilePath(filePath || '');
        
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory()) {
            const files = await fs.readdir(fullPath);
            result = { success: true, output: `目录内容:\n${files.join('\n')}` };
          } else {
            let content = await fs.readFile(fullPath, 'utf-8');
            if (startLine || endLine) {
              const lines = content.split('\n');
              const start = (startLine || 1) - 1;
              const end = endLine || lines.length;
              content = lines.slice(start, end).join('\n');
            }
            result = { success: true, output: content };
          }
        } catch (e: any) {
          result = { success: false, error: `读取失败: ${e.message}` };
        }
        break;
      }

      case 'write': {
        const { path: filePath, content } = args;
        const fullPath = resolveFilePath(filePath || '');
        
        console.log('[Write Tool] Input path:', filePath);
        console.log('[Write Tool] Resolved path:', fullPath);
        console.log('[Write Tool] Content length:', content?.length || 0);
        
        try {
          const dir = path.dirname(fullPath);
          console.log('[Write Tool] Creating directory:', dir);
          await fs.mkdir(dir, { recursive: true });
          console.log('[Write Tool] Writing file...');
          await fs.writeFile(fullPath, content, 'utf-8');
          console.log('[Write Tool] File written successfully');
          result = { success: true, output: `文件已写入: ${filePath} (完整路径: ${fullPath})` };
        } catch (e: any) {
          console.error('[Write Tool] Error:', e);
          result = { success: false, error: `写入失败: ${e.message}` };
        }
        break;
      }

      case 'search_replace': {
        const { path: filePath, search, replace, useRegex } = args;
        const fullPath = resolveFilePath(filePath || '');
        
        try {
          let content = await fs.readFile(fullPath, 'utf-8');
          if (useRegex) {
            const regex = new RegExp(search, 'g');
            content = content.replace(regex, replace);
          } else {
            content = content.split(search).join(replace);
          }
          await fs.writeFile(fullPath, content, 'utf-8');
          result = { success: true, output: `替换完成: ${filePath}` };
        } catch (e: any) {
          result = { success: false, error: `替换失败: ${e.message}` };
        }
        break;
      }

      case 'delete': {
        const { path: filePath, recursive } = args;
        const fullPath = resolveFilePath(filePath || '');
        
        try {
          const stat = await fs.stat(fullPath);
          if (stat.isDirectory() && recursive) {
            await fs.rm(fullPath, { recursive: true });
          } else if (stat.isDirectory()) {
            await fs.rmdir(fullPath);
          } else {
            await fs.unlink(fullPath);
          }
          result = { success: true, output: `已删除: ${filePath}` };
        } catch (e: any) {
          result = { success: false, error: `删除失败: ${e.message}` };
        }
        break;
      }

      case 'glob': {
        const { pattern, basePath: searchBase } = args;
        const searchPath = searchBase ? resolveFilePath(searchBase) : WORKSPACE_ROOT;
        
        try {
          const { stdout } = await execAsync(
            `powershell -Command "Get-ChildItem -Path '${searchPath}' -Recurse -Filter '${pattern}' | Select-Object -ExpandProperty FullName"`,
            { maxBuffer: 1024 * 1024 * 10 }
          );
          const files = stdout.trim().split('\n').filter(Boolean);
          const relativeFiles = files.map(f => path.relative(WORKSPACE_ROOT, f));
          result = { success: true, output: `找到 ${files.length} 个文件:\n${relativeFiles.join('\n')}` };
        } catch (e: any) {
          result = { success: true, output: '未找到匹配文件' };
        }
        break;
      }

      case 'grep': {
        const { pattern, caseSensitive, basePath: searchBase } = args;
        const searchPath = searchBase ? resolveFilePath(searchBase) : WORKSPACE_ROOT;
        
        try {
          const caseFlag = caseSensitive ? '' : '-CaseSensitive:$false';
          const { stdout } = await execAsync(
            `powershell -Command "Get-ChildItem -Path '${searchPath}' -Recurse -File | Select-String -Pattern '${pattern}' ${caseFlag} | Select-Object -First 50 | ForEach-Object { \\"$($_.Filename):$($_.LineNumber): $($_.Line)\\" }"`,
            { maxBuffer: 1024 * 1024 * 10 }
          );
          result = { success: true, output: stdout.trim() || '未找到匹配内容' };
        } catch (e: any) {
          result = { success: true, output: '未找到匹配内容' };
        }
        break;
      }

      case 'ls': {
        const { path: dirPath, showHidden } = args;
        const fullPath = dirPath ? resolveFilePath(dirPath) : WORKSPACE_ROOT;
        
        try {
          const files = await fs.readdir(fullPath, { withFileTypes: true });
          let items = files.map(f => {
            const isDir = f.isDirectory();
            return `${isDir ? '📁' : '📄'} ${f.name}`;
          });
          if (!showHidden) {
            items = items.filter(i => !i.startsWith('.') && !i.includes('/.'));
          }
          result = { success: true, output: `目录列表:\n${items.join('\n')}` };
        } catch (e: any) {
          result = { success: false, error: `列出目录失败: ${e.message}` };
        }
        break;
      }

      case 'mkdir': {
        const { path: dirPath } = args;
        const fullPath = resolveFilePath(dirPath || '');
        
        try {
          await fs.mkdir(fullPath, { recursive: true });
          result = { success: true, output: `目录已创建: ${dirPath}` };
        } catch (e: any) {
          result = { success: false, error: `创建目录失败: ${e.message}` };
        }
        break;
      }

      case 'run_command': {
        const { command, cwd, timeout = 60000 } = args;
        const workDir = cwd ? resolveFilePath(cwd) : WORKSPACE_ROOT;

        try {
          const isWindows = process.platform === 'win32';

          const convertToWindowsCommand = (cmd: string): string => {
            let converted = cmd;

            const isCmdSyntax = (
              cmd.includes('if not exist') ||
              cmd.includes('if exist') ||
              (cmd.includes('&&') && !cmd.includes(';')) ||
              cmd.includes('||') ||
              cmd.includes('%') ||
              cmd.includes('@echo') ||
              cmd.includes('call ')
            );

            if (isCmdSyntax) {
              return `cmd /c "${cmd.replace(/"/g, '""')}"`;
            }

            const mkdirMatch = converted.match(/mkdir\s+-p\s+([^\s;&|]+)/);
            if (mkdirMatch) {
              const targetPath = mkdirMatch[1].replace(/\/d\//i, 'D:\\').replace(/\//g, '\\');
              converted = `New-Item -ItemType Directory -Path "${targetPath}" -Force`;
            }

            converted = converted.replace(/\s*2>\/dev\/null/g, '');
            converted = converted.replace(/\s*2>nul/g, '');
            converted = converted.replace(/\s*\|\|.*$/g, '');

            const rmMatch = converted.match(/rm\s+-rf\s+([^\s;&|]+)/);
            if (rmMatch) {
              converted = `Remove-Item "${rmMatch[1]}" -Recurse -Force -ErrorAction SilentlyContinue`;
            }

            if (converted === 'ls' || converted === 'ls -la' || converted === 'ls -l') {
              converted = 'Get-ChildItem';
            }

            const catMatch = converted.match(/^cat\s+(.+)$/);
            if (catMatch) {
              converted = `Get-Content "${catMatch[1]}"`;
            }

            const touchMatch = converted.match(/^touch\s+(.+)$/);
            if (touchMatch) {
              converted = `New-Item -ItemType File -Path "${touchMatch[1]}" -Force`;
            }

            return converted;
          };

          let finalCommand: string;
          if (isWindows) {
            const convertedCommand = convertToWindowsCommand(command);
            finalCommand = `powershell -Command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ${convertedCommand}"`;
          } else {
            finalCommand = command;
          }

          const { stdout, stderr } = await execAsync(finalCommand, {
            cwd: workDir,
            timeout,
            maxBuffer: 1024 * 1024 * 10,
            encoding: 'utf8',
          });
          result = {
            success: true,
            output: stdout || stderr || '命令执行完成（无输出）',
          };
        } catch (e: any) {
          result = {
            success: false,
            error: `命令执行失败: ${e.message}\n${e.stderr || ''}`,
          };
        }
        break;
      }

      case 'diff': {
        const { original, modified } = args;
        try {
          let originalContent: string;
          let modifiedContent: string;
          
          try {
            originalContent = await fs.readFile(path.join(WORKSPACE_ROOT, original), 'utf-8');
          } catch {
            originalContent = original;
          }
          
          try {
            modifiedContent = await fs.readFile(path.join(WORKSPACE_ROOT, modified), 'utf-8');
          } catch {
            modifiedContent = modified;
          }
          
          const origLines = originalContent.split('\n');
          const modLines = modifiedContent.split('\n');
          
          let diff = '--- 原始\n+++ 修改后\n';
          const maxLines = Math.max(origLines.length, modLines.length);
          
          for (let i = 0; i < maxLines; i++) {
            const orig = origLines[i];
            const mod = modLines[i];
            
            if (orig !== mod) {
              if (orig !== undefined) diff += `- ${orig}\n`;
              if (mod !== undefined) diff += `+ ${mod}\n`;
            }
          }
          
          result = { success: true, output: diff };
        } catch (e: any) {
          result = { success: false, error: `比较失败: ${e.message}` };
        }
        break;
      }

      default:
        result = { success: false, error: `未知工具: ${tool}` };
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/agent/workspace', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ensureWorkspace();
    
    const buildTree = async (dir: string): Promise<any[]> => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const result: any[] = [];
      
      for (const item of items) {
        if (item.name.startsWith('.')) continue;
        
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(WORKSPACE_ROOT, fullPath);
        
        if (item.isDirectory()) {
          result.push({
            name: item.name,
            type: 'directory',
            path: relativePath,
            children: await buildTree(fullPath),
          });
        } else {
          result.push({
            name: item.name,
            type: 'file',
            path: relativePath,
          });
        }
      }
      
      return result.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    };
    
    const tree = await buildTree(WORKSPACE_ROOT);
    res.json({ success: true, data: tree });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/health', (_req: Request, res: Response): void => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    users: users.size,
  });
});

app.get('/api/fs/drives', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stdout } = await execAsync(
      'powershell -Command "Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{N=\'Size\';E={[math]::Round($_.Used/1GB,2)}}, @{N=\'Free\';E={[math]::Round($_.Free/1GB,2)}} | ConvertTo-Json"'
    );
    
    let drives;
    try {
      drives = JSON.parse(stdout);
      if (!Array.isArray(drives)) drives = [drives];
    } catch {
      drives = [];
    }
    
    const result = drives.map((d: any) => ({
      name: d.Name,
      path: `${d.Name}:\\`,
      sizeGB: d.Size || 0,
      freeGB: d.Free || 0,
      usedGB: (d.Size || 0) - (d.Free || 0),
    }));
    
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fs/list', async (req: Request, res: Response): Promise<void> => {
  try {
    const dirPath = req.query.path as string || 'D:\\';
    
    // 安全检查：防止访问系统目录
    const normalizedPath = dirPath.replace(/\\/g, '\\').toUpperCase();
    if (normalizedPath.includes('$RECYCLE.BIN') || 
        normalizedPath.includes('SYSTEM VOLUME INFORMATION') ||
        normalizedPath.includes(':\\Windows\\System32') ||
        normalizedPath.includes(':\\Program Files'.toUpperCase())) {
      res.status(403).json({ success: false, error: '禁止访问系统目录' });
      return;
    }
    
    const items = await fs.readdir(dirPath, { withFileTypes: true });
    const result: any[] = [];
    
    for (const item of items) {
      try {
        const fullPath = path.join(dirPath, item.name);
        const stats = await fs.stat(fullPath);
        
        result.push({
          name: item.name,
          type: item.isDirectory() ? 'directory' : 'file',
          path: fullPath,
          size: item.isFile() ? stats.size : undefined,
          modified: stats.mtime,
          extension: item.isFile() ? path.extname(item.name).toLowerCase() : undefined,
        });
      } catch {
        // Skip files we can't access
      }
    }
    
    result.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    
    res.json({ success: true, data: result, path: dirPath });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fs/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = req.query.path as string;
    if (!filePath) {
      res.status(400).json({ success: false, error: '文件路径不能为空' });
      return;
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    res.json({ success: true, data: content });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/fs/create', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { path: filePath, type = 'file', content = '' } = req.body;
    
    console.log('Create request:', { filePath, type, content: content?.substring(0, 50) });
    
    if (!filePath) {
      res.status(400).json({ success: false, error: '路径不能为空' });
      return;
    }

    if (type === 'directory') {
      await fs.mkdir(filePath, { recursive: true });
      console.log('Directory created:', filePath);
    } else {
      await fs.writeFile(filePath, content, 'utf-8');
      console.log('File created:', filePath);
    }
    
    res.json({ success: true, message: '创建成功' });
  } catch (error: any) {
    console.error('Create error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/fs/delete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { path: filePath } = req.body;
    
    if (!filePath) {
      res.status(400).json({ success: false, error: '路径不能为空' });
      return;
    }

    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      await fs.rm(filePath, { recursive: true, force: true });
    } else {
      await fs.unlink(filePath);
    }
    
    res.json({ success: true, message: '删除成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// LLM API 代理路由
app.post('/api/llm/chat', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  let proxyReq: http.ClientRequest | null = null;
  let isAborted = false;

  const cleanup = () => {
    if (proxyReq && !isAborted) {
      isAborted = true;
      proxyReq.destroy();
    }
  };

  req.on('close', () => {
    console.log('[LLM Proxy] Client disconnected');
    cleanup();
  });

  req.on('aborted', () => {
    console.log('[LLM Proxy] Request aborted by client');
    cleanup();
  });

  try {
    const { targetUrl, apiKey, model, messages, stream, max_tokens, temperature, customHeaders } = req.body;

    console.log('[LLM Proxy] Request body:', { targetUrl, hasApiKey: !!apiKey, model, messagesCount: messages?.length, stream });

    if (!targetUrl || !apiKey) {
      console.log('[LLM Proxy] Missing params:', { targetUrl: !!targetUrl, apiKey: !!apiKey });
      res.status(400).json({ success: false, error: '缺少必要参数' });
      return;
    }

    console.log('[LLM Proxy] Starting request to:', targetUrl);

    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(customHeaders || {}),
      },
    };

    const requestBody = JSON.stringify({
      model,
      messages,
      stream: stream ?? true,
      max_tokens,
      temperature,
    });

    const client = url.protocol === 'https:' ? https : http;

    proxyReq = client.request(options, (proxyRes) => {
      if (isAborted) {
        proxyRes.destroy();
        return;
      }

      console.log('[LLM Proxy] Response status:', proxyRes.statusCode);
      res.status(proxyRes.statusCode || 200);
      
      // 设置流式响应头
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // 直接转发数据
      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });

      proxyRes.on('end', () => {
        console.log('[LLM Proxy] Stream ended');
        res.end();
      });

      proxyRes.on('error', (error) => {
        console.error('[LLM Proxy] Response error:', error.message);
        if (!res.headersSent) {
          res.status(500).json({ success: false, error: '响应错误' });
        } else {
          res.end();
        }
      });
    });

    proxyReq.setTimeout(5 * 60 * 1000, () => {
      console.error('[LLM Proxy] Timeout after 5 minutes');
      cleanup();
      if (!res.headersSent) {
        res.status(504).json({ success: false, error: '请求超时' });
      }
    });

    proxyReq.on('error', (error) => {
      console.error('[LLM Proxy] Error:', error.message);
      cleanup();
      if (!res.headersSent && !isAborted) {
        res.status(500).json({ success: false, error: '代理请求失败' });
      }
    });

    proxyReq.write(requestBody);
    proxyReq.end();
  } catch (error: any) {
    console.error('[LLM Proxy] Exception:', error.message, error.stack);
    cleanup();
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

app.put('/api/fs/rename', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { oldPath, newPath } = req.body;
    
    if (!oldPath || !newPath) {
      res.status(400).json({ success: false, error: '路径不能为空' });
      return;
    }

    await fs.rename(oldPath, newPath);
    res.json({ success: true, message: '重命名成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/fs/move', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { source, destination } = req.body;
    
    if (!source || !destination) {
      res.status(400).json({ success: false, error: '源路径和目标路径不能为空' });
      return;
    }

    await fs.rename(source, destination);
    res.json({ success: true, message: '移动成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/fs/download', async (req: Request, res: Response): Promise<void> => {
  try {
    const filePath = req.query.path as string;
    
    if (!filePath) {
      res.status(400).json({ success: false, error: '文件路径不能为空' });
      return;
    }

    const stats = await fs.stat(filePath);
    
    if (stats.isDirectory()) {
      res.status(400).json({ success: false, error: '不能下载目录' });
      return;
    }

    res.download(filePath);
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/terminal/execute', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { command, cwd } = req.body;
    
    if (!command) {
      res.status(400).json({ success: false, error: '命令不能为空' });
      return;
    }

    const workDir = cwd || 'D:\\';
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: workDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      windowsHide: true,
    });

    res.json({
      success: true,
      data: {
        stdout: stdout || '',
        stderr: stderr || '',
        cwd: workDir,
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      data: {
        stdout: '',
        stderr: error.message || '命令执行失败',
        cwd: req.body.cwd || 'D:\\',
      }
    });
  }
});

app.post('/api/terminal/start-shell', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cwd } = req.body;
    const workDir = cwd || 'D:\\';
    
    const { stdout } = await execAsync('echo %cd%', {
      cwd: workDir,
      timeout: 5000,
    });

    res.json({
      success: true,
      data: {
        cwd: stdout.trim() || workDir,
        shell: 'powershell',
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Code Editor IDE API 服务运行中',
    version: '1.0.0',
    demo: { username: 'demo', password: 'demo123' },
  });
});

// Agent Loop 路由
app.use('/api/agent-loop', authMiddleware, agentLoopRoutes);

// MCP 路由
app.use('/api/mcp', authMiddleware, mcpRoutes);

// 插件路由
app.use('/api/plugins', authMiddleware, pluginRoutes);

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ success: false, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  Code Editor IDE 后端服务已启动`);
  console.log(`  端口: ${PORT}`);
  console.log(`  时间: ${new Date().toLocaleString()}`);
  console.log(`========================================\n`);
  console.log(`演示账号: demo / demo123`);
});
