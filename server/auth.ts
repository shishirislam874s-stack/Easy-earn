import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { User } from './types';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'slshishir';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '#FFHUDT6O3jojE8uJPo7eO';
const SESSION_SECRET = process.env.SESSION_SECRET || 'earn_app_default_session_secret_2026_xyz';

import fs from 'fs';
import path from 'path';

// Admin rate limiting: lock for 5 minutes after 5 failed attempts
interface FailedAttemptInfo {
  count: number;
  lockedUntil: number; // epoch ms
}
const adminFailedAttempts = new Map<string, FailedAttemptInfo>();

export function checkAdminRateLimit(ip: string): { isLocked: boolean; remainingSeconds: number } {
  const info = adminFailedAttempts.get(ip);
  if (!info) return { isLocked: false, remainingSeconds: 0 };

  const now = Date.now();
  if (info.lockedUntil > now) {
    const remainingSeconds = Math.ceil((info.lockedUntil - now) / 1000);
    return { isLocked: true, remainingSeconds };
  }

  if (info.lockedUntil <= now && info.count >= 5) {
    // Lock period expired, reset
    adminFailedAttempts.delete(ip);
    return { isLocked: false, remainingSeconds: 0 };
  }

  return { isLocked: false, remainingSeconds: 0 };
}

export function recordAdminLoginAttempt(ip: string, success: boolean): void {
  if (success) {
    adminFailedAttempts.delete(ip);
    return;
  }

  const now = Date.now();
  const info = adminFailedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  info.count += 1;
  if (info.count >= 5) {
    info.lockedUntil = now + 5 * 60 * 1000; // 5 minutes lockout
  }
  adminFailedAttempts.set(ip, info);
}

// Active sessions with timestamp for 30-min auto-logout
interface SessionData {
  userId?: string;
  isAdmin?: boolean;
  lastActivity: number;
}

const userSessions = new Map<string, SessionData>();
const adminSessions = new Map<string, SessionData>();

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = isServerless
  ? path.resolve('/tmp', 'earn_app_data')
  : path.resolve(process.cwd(), 'data');
const SESSIONS_FILE = path.resolve(DATA_DIR, 'sessions.json');

function initSessionsPersistence() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(SESSIONS_FILE)) {
      const seedFile = path.resolve(process.cwd(), 'data', 'sessions.json');
      if (fs.existsSync(seedFile)) {
        try {
          fs.writeFileSync(SESSIONS_FILE, fs.readFileSync(seedFile, 'utf-8'), 'utf-8');
        } catch {}
      }
    }
    if (fs.existsSync(SESSIONS_FILE)) {
      const content = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && data.userSessions) {
        for (const [k, v] of Object.entries(data.userSessions)) {
          userSessions.set(k, v as SessionData);
        }
      }
      if (data && data.adminSessions) {
        for (const [k, v] of Object.entries(data.adminSessions)) {
          adminSessions.set(k, v as SessionData);
        }
      }
    }
  } catch (err) {
    console.error('Failed to load session persistence:', err);
  }
}

initSessionsPersistence();

function persistSessions() {
  try {
    const userObj: Record<string, SessionData> = {};
    const adminObj: Record<string, SessionData> = {};
    for (const [k, v] of userSessions.entries()) userObj[k] = v;
    for (const [k, v] of adminSessions.entries()) adminObj[k] = v;
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify({ userSessions: userObj, adminSessions: adminObj }));
  } catch (err) {
    console.error('Failed to save session persistence:', err);
  }
}

export function createAdminSession(): string {
  const token = crypto.randomBytes(32).toString('hex');
  adminSessions.set(token, {
    isAdmin: true,
    lastActivity: Date.now(),
  });
  persistSessions();
  return token;
}

export function createUserSession(userId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  userSessions.set(token, {
    userId,
    lastActivity: Date.now(),
  });
  persistSessions();
  return token;
}

export function verifyAdminPassword(inputUsername: string, inputPass: string): boolean {
  if (inputUsername.trim() !== ADMIN_USERNAME.trim()) {
    return false;
  }

  // Timing safe comparison
  const inputBuffer = Buffer.from(inputPass);
  const targetBuffer = Buffer.from(ADMIN_PASSWORD);

  if (inputBuffer.length !== targetBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(inputBuffer, targetBuffer);
}

// Express auth middlewares
export interface AuthenticatedRequest extends Request {
  user?: User;
  userSessionToken?: string;
}

export function userAuthMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Check Authorization header, x-session-token header, or cookie
  const authHeader = req.headers.authorization;
  let token = req.headers['x-session-token'] as string | undefined;

  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    token = req.cookies?.earn_user_session;
  }

  if (!token) {
    return next();
  }

  const session = userSessions.get(token);
  if (!session || !session.userId) {
    res.clearCookie('earn_user_session');
    return next();
  }

  // User session activity update (keep alive)
  session.lastActivity = Date.now();
  userSessions.set(token, session);

  const snapshot = db.getSnapshot();
  const user = snapshot.users.find((u) => u.id === session.userId);
  if (user && !user.isBlocked) {
    req.user = user;
    req.userSessionToken = token;
  } else {
    userSessions.delete(token);
    res.clearCookie('earn_user_session');
  }

  next();
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

export function requireActiveUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  if (!req.user.isActive) {
    return res.status(403).json({
      error: 'Account not active. Activate your ID first.',
      code: 'ID_INACTIVE',
    });
  }
  next();
}

export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  let token = req.headers['x-admin-token'] as string | undefined;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    const candidate = req.headers.authorization.substring(7).trim();
    if (adminSessions.has(candidate)) {
      token = candidate;
    }
  }

  if (!token) {
    token = req.cookies?.earn_admin_session;
  }

  if (!token) {
    return res.status(401).json({ error: 'Admin unauthorized' });
  }

  const session = adminSessions.get(token);
  if (!session || !session.isAdmin) {
    res.clearCookie('earn_admin_session');
    return res.status(401).json({ error: 'Admin session invalid' });
  }

  // 30-minute inactivity auto-logout
  const THIRTY_MINUTES = 30 * 60 * 1000;
  if (Date.now() - session.lastActivity > THIRTY_MINUTES) {
    adminSessions.delete(token);
    res.clearCookie('earn_admin_session');
    return res.status(401).json({ error: 'Admin session expired due to 30 minutes of inactivity' });
  }

  session.lastActivity = Date.now();
  adminSessions.set(token, session);
  next();
}

export function destroyUserSession(token: string): void {
  userSessions.delete(token);
  persistSessions();
}

export function destroyAdminSession(token: string): void {
  adminSessions.delete(token);
  persistSessions();
}
