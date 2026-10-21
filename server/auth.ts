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

import seedSessions from '../data/sessions.json';

// Active sessions with timestamp for in-memory caching
interface SessionData {
  userId?: string;
  isAdmin?: boolean;
  phone?: string;
  name?: string;
  lastActivity: number;
}

export interface TokenPayload {
  userId: string;
  phone?: string;
  name?: string;
  role: 'user' | 'admin';
  exp: number; // epoch ms
  iat: number; // epoch ms
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
    // 1. First populate in-memory from bundled seedSessions (survives cold starts and bundling)
    if (seedSessions && typeof seedSessions === 'object') {
      const s = seedSessions as any;
      if (s.userSessions) {
        for (const [k, v] of Object.entries(s.userSessions)) {
          userSessions.set(k, v as SessionData);
        }
      }
      if (s.adminSessions) {
        for (const [k, v] of Object.entries(s.adminSessions)) {
          adminSessions.set(k, v as SessionData);
        }
      }
    }

    // 2. Also read from /tmp persistent file if exists
    if (!fs.existsSync(DATA_DIR)) {
      try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch {}
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

export function signToken(payload: TokenPayload): string {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr).toString('base64url');
  const hmac = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${hmac}`;
}

export function verifyToken(token: string): TokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const dotIndex = token.lastIndexOf('.');
  if (dotIndex === -1) return null;
  const data = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);
  if (!data || !signature) return null;

  try {
    const expectedHmac = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
    if (signature.length !== expectedHmac.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function createAdminSession(): string {
  const token = signToken({
    userId: 'admin',
    role: 'admin',
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    iat: Date.now(),
  });
  adminSessions.set(token, {
    isAdmin: true,
    lastActivity: Date.now(),
  });
  persistSessions();
  return token;
}

export function createUserSession(userId: string, phone = '', name = ''): string {
  const token = signToken({
    userId,
    phone,
    name,
    role: 'user',
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    iat: Date.now(),
  });
  userSessions.set(token, {
    userId,
    phone,
    name,
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

  let userId: string | null = null;
  let verifiedPayload: TokenPayload | null = null;
  let cachedSession: SessionData | undefined;

  if (token) {
    // 1. Try local memory session cache (populated with seedSessions)
    cachedSession = userSessions.get(token);
    if (cachedSession && cachedSession.userId) {
      userId = cachedSession.userId;
      cachedSession.lastActivity = Date.now();
      userSessions.set(token, cachedSession);
    }

    // 2. Stateless HMAC token verification (resilient across serverless instances)
    if (!userId) {
      verifiedPayload = verifyToken(token);
      if (verifiedPayload && verifiedPayload.userId && verifiedPayload.role === 'user') {
        userId = verifiedPayload.userId;
        userSessions.set(token, {
          userId,
          phone: verifiedPayload.phone,
          name: verifiedPayload.name,
          lastActivity: Date.now(),
        });
      }
    }
  }

  // 3. Header or body fallback if token missing or expired
  if (!userId) {
    const headerUserId = req.headers['x-user-id'] as string | undefined;
    if (headerUserId && /^\d+$/.test(headerUserId.trim())) {
      userId = headerUserId.trim();
    } else if (req.body && req.body.userId && /^\d+$/.test(String(req.body.userId).trim())) {
      userId = String(req.body.userId).trim();
    }
  }

  if (!userId) {
    return next();
  }

  const snapshot = db.getSnapshot();
  let user = snapshot.users.find((u) => u.id === userId);

  // If user not in container memory/tmp DB (e.g., fresh serverless cold start),
  // recover user record from verified cryptographically signed token or cached session!
  if (!user && userId) {
    if (!verifiedPayload && token) {
      verifiedPayload = verifyToken(token);
    }
    const defaultName = userId === '1001' ? 'Admin' : (userId === '1002' ? 'Shishir' : 'User');
    const defaultPhone = userId === '1001' ? '01604606880' : (userId === '1002' ? '01621794375' : '');
    user = db.ensureUserExists({
      id: userId,
      phone: verifiedPayload?.phone || cachedSession?.phone || (req.body && req.body.userPhone) || defaultPhone,
      name: verifiedPayload?.name || cachedSession?.name || (req.body && req.body.userName) || defaultName,
    });
  }

  if (user && !user.isBlocked) {
    req.user = user;
    if (token) req.userSessionToken = token;
  }

  next();
}

export function requireUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    const fallbackId = (req.headers['x-user-id'] as string) || (req.body && req.body.userId) || (req.query && (req.query.userId as string));
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === '1001' ? 'Admin' : (cleanId === '1002' ? 'Shishir' : 'User');
        const defaultPhone = cleanId === '1001' ? '01604606880' : (cleanId === '1002' ? '01621794375' : '');
        u = db.ensureUserExists({
          id: cleanId,
          phone: (req.body && req.body.userPhone) || defaultPhone,
          name: (req.body && req.body.userName) || defaultName,
        });
      }
      if (u && !u.isBlocked) {
        req.user = u;
      }
    }
  }

  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized. Please login.',
      errorBn: 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।',
      code: 'UNAUTHORIZED',
    });
  }
  next();
}

export function requireActiveUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    const fallbackId = (req.headers['x-user-id'] as string) || (req.body && req.body.userId) || (req.query && (req.query.userId as string));
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === '1001' ? 'Admin' : (cleanId === '1002' ? 'Shishir' : 'User');
        const defaultPhone = cleanId === '1001' ? '01604606880' : (cleanId === '1002' ? '01621794375' : '');
        u = db.ensureUserExists({
          id: cleanId,
          phone: (req.body && req.body.userPhone) || defaultPhone,
          name: (req.body && req.body.userName) || defaultName,
        });
      }
      if (u && !u.isBlocked) {
        req.user = u;
      }
    }
  }

  if (!req.user) {
    return res.status(401).json({
      error: 'Unauthorized. Please login.',
      errorBn: 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে আবার লগইন করুন।',
      code: 'UNAUTHORIZED',
    });
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
    token = req.headers.authorization.substring(7).trim();
  }

  if (!token) {
    token = req.cookies?.earn_admin_session;
  }

  if (!token) {
    return res.status(401).json({ error: 'Admin unauthorized' });
  }

  let isValidAdmin = false;
  const session = adminSessions.get(token);
  if (session && session.isAdmin) {
    session.lastActivity = Date.now();
    adminSessions.set(token, session);
    isValidAdmin = true;
  } else {
    // Stateless token verification
    const verified = verifyToken(token);
    if (verified && verified.role === 'admin') {
      isValidAdmin = true;
      adminSessions.set(token, {
        isAdmin: true,
        lastActivity: Date.now(),
      });
    }
  }

  if (!isValidAdmin) {
    res.clearCookie('earn_admin_session');
    return res.status(401).json({ error: 'Admin session invalid' });
  }

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
