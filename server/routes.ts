import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db, markUserActiveInStore, saveActivationRequestToStore, activationRequestsStore, activeUsersStore } from './db';
import {
  createUserSession,
  createAdminSession,
  destroyUserSession,
  destroyAdminSession,
  verifyAdminPassword,
  checkAdminRateLimit,
  recordAdminLoginAttempt,
  requireUser,
  requireActiveUser,
  adminAuthMiddleware,
  AuthenticatedRequest,
} from './auth';
import {
  getBangladeshNow,
  getBangladeshDateString,
  addDaysToBangladeshDate,
  formatBangladeshDateTime,
} from './dateUtils';
import {
  User,
  CategoryType,
  VideoSubmission,
  ActivationRequest,
  WithdrawRequest,
  TeamBonus,
  HistoryRecord,
  AppNotification,
  Broadcast,
} from './types';

const router = Router();

// -------------------------------------------------------------
// PUBLIC / CONFIG ENDPOINTS
// -------------------------------------------------------------
router.get('/config', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || '';
  res.json({
    settings: snapshot.settings,
    publicSiteUrl,
    categories: [
      {
        id: 'A',
        nameEn: 'Category A',
        nameBn: 'ক্যাটাগরি A',
        fee: snapshot.settings.fee_category_a,
        dailyLimit: snapshot.settings.limit_category_a,
        extensionDays: snapshot.settings.w1_days,
        teamBonus: snapshot.settings.t1_bonus,
      },
      {
        id: 'B',
        nameEn: 'Category B',
        nameBn: 'ক্যাটাগরি B',
        fee: snapshot.settings.fee_category_b,
        dailyLimit: snapshot.settings.limit_category_b,
        extensionDays: snapshot.settings.w2_days,
        teamBonus: snapshot.settings.t2_bonus,
      },
      {
        id: 'C',
        nameEn: 'Category C',
        nameBn: 'ক্যাটাগরি C',
        fee: snapshot.settings.fee_category_c,
        dailyLimit: snapshot.settings.limit_category_c,
        extensionDays: snapshot.settings.w3_days,
        teamBonus: snapshot.settings.t3_bonus,
      },
    ],
    paymentMethods: [
      {
        id: 'bKash',
        name: 'bKash',
        nameBn: 'বিকাশ',
        number: snapshot.settings.payment_number_bkash,
        logo: '/logos/bkash.svg',
        color: '#E2136E',
      },
      {
        id: 'Nagad',
        name: 'Nagad',
        nameBn: 'নগদ',
        number: snapshot.settings.payment_number_nagad,
        logo: '/logos/nagad.svg',
        color: '#F7931E',
      },
      {
        id: 'Rocket',
        name: 'Rocket',
        nameBn: 'রকেট',
        number: snapshot.settings.payment_number_rocket,
        logo: '/logos/rocket.svg',
        color: '#8E2DE2',
      },
    ],
  });
});

function normalizePhoneNumber(raw: any): string {
  let s = (raw || '').toString().trim().replace(/[\s\-\(\)\.]/g, '');
  if (s.startsWith('+880')) {
    s = '0' + s.substring(4);
  } else if (s.startsWith('880') && s.length === 13) {
    s = '0' + s.substring(3);
  }
  return s;
}

// -------------------------------------------------------------
// USER AUTH
// -------------------------------------------------------------
router.post('/auth/register', async (req: Request, res: Response) => {
  const { name, phone, password, refCode } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter a valid name / অনুগ্রহ করে নাম লিখুন' });
  }

  const cleanPhone = normalizePhoneNumber(phone);
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: 'Please enter a valid phone number / সঠিক ফোন নম্বর দিন' });
  }

  if (!password || typeof password !== 'string' || password.length < 4) {
    return res.status(400).json({ error: 'Password must be at least 4 characters / পাসওয়ার্ড অন্তত ৪ অক্ষরের হতে হবে' });
  }

  try {
    const result = await db.withTransaction(async (schema) => {
      // Check phone uniqueness with normalization
      const existing = schema.users.find((u) => normalizePhoneNumber(u.phone) === cleanPhone);
      if (existing) {
        throw new Error('This phone number is already registered / এই ফোন নম্বর দিয়ে আগেই অ্যাকাউন্ট খোলা হয়েছে');
      }

      // Enforce mandatory referral code
      if (!refCode || typeof refCode !== 'string' || !refCode.trim()) {
        throw new Error('রেজিস্ট্রেশনের জন্য রেফারাল কোড দেওয়া বাধ্যতামূলক / Referral code is required to register');
      }

      const cleanRef = refCode.trim();
      const cleanRefLower = cleanRef.toLowerCase();

      // Check if admin master referral code
      const isAdminMasterRef =
        cleanRefLower === 'admin' ||
        cleanRefLower === 'slshishir' ||
        cleanRefLower === 'earnadmin' ||
        cleanRefLower === 'earn1000';

      let referrerId: string | null = null;
      let referrerUser: User | null = null;

      if (isAdminMasterRef) {
        // Admin master referral code is ALWAYS valid
        const adminUserInDb = schema.users.find(
          (u) => u.referralCode.toLowerCase() === 'admin' || u.referralCode.toLowerCase() === 'earn1001'
        );
        if (adminUserInDb) {
          referrerId = adminUserInDb.id;
          referrerUser = adminUserInDb;
        } else {
          referrerId = 'ADMIN';
        }
      } else {
        const found = schema.users.find(
          (u) => u.referralCode.toLowerCase() === cleanRefLower || u.id === cleanRef
        );

        if (!found) {
          throw new Error('ভুল রেফারাল কোড! সঠিক রেফারাল কোড প্রদান করুন (এডমিন রেফার কোড: ADMIN) / Invalid referral code. (Admin code: ADMIN)');
        }

        referrerId = found.id;
        referrerUser = found;
      }

      const newId = String(schema.users.length + 1001);
      const referralCode = `EARN${newId}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      const nowIso = new Date().toISOString();

      const newUser: User = {
        id: newId,
        name: name.trim(),
        phone: cleanPhone,
        passwordHash,
        category: null,
        isActive: false,
        isBlocked: false,
        balance: 0,
        referredBy: referrerId,
        referralCode,
        workUntil: null,
        isTeamLeader: false,
        activatedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      schema.users.push(newUser);

      // Handle referral bonus (+1 taka on join)
      if (referrerUser) {
        const joinBonus = schema.settings.ref_join || 1;
        referrerUser.balance += joinBonus;
        referrerUser.updatedAt = nowIso;

        schema.history.unshift({
          id: `hist-join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: referrerUser.id,
          type: 'referral_join',
          titleEn: `Referral Join Bonus (+৳${joinBonus}) from ${newUser.name}`,
          titleBn: `${newUser.name} রেফারাল লিংকে জয়েন করার বোনাস (+৳${joinBonus})`,
          amount: joinBonus,
          status: 'completed',
          createdAt: nowIso,
        });

        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: referrerUser.id,
          titleEn: 'New Referral Joined!',
          titleBn: 'নতুন রেফারাল জয়েন করেছে!',
          messageEn: `${newUser.name} joined using your referral link. +৳${joinBonus} added to balance.`,
          messageBn: `${newUser.name} আপনার রেফারাল লিংকে জয়েন করেছে। ব্যালেন্সে +৳${joinBonus} যোগ হয়েছে।`,
          type: 'referral',
          isRead: false,
          createdAt: nowIso,
        });

        // Check if referrer's initial 5 days are over
        const todayBangla = getBangladeshDateString();
        const isInitialFiveDaysOver = Boolean(
          referrerUser.initialWorkUntil && todayBangla > referrerUser.initialWorkUntil
        );

        // Referrals made during initial 5 days are NOT counted towards work days
        if (isInitialFiveDaysOver) {
          referrerUser.referralsTowardsWork = (referrerUser.referralsTowardsWork || 0) + 1;
          referrerUser.totalReferralsAfterInitial = (referrerUser.totalReferralsAfterInitial || 0) + 1;

          // When referrer reaches 5 referrals after initial period, unlock work
          if (referrerUser.referralsTowardsWork >= 5) {
            referrerUser.referralsTowardsWork = 0; // reset for next cycle

            // Cat A = 2 days (w1_days), Cat B = 3 days (w2_days), Cat C = 4 days (w3_days)
            let extensionDays = schema.settings.w1_days || 2;
            if (referrerUser.category === 'B') extensionDays = schema.settings.w2_days || 3;
            else if (referrerUser.category === 'C') extensionDays = schema.settings.w3_days || 4;

            if (referrerUser.workUntil && referrerUser.workUntil >= todayBangla) {
              referrerUser.workUntil = addDaysToBangladeshDate(referrerUser.workUntil, extensionDays);
            } else {
              referrerUser.workUntil = addDaysToBangladeshDate(todayBangla, extensionDays - 1);
            }

            schema.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId: referrerUser.id,
              titleEn: `5 Referrals Completed! Work Unlocked for ${extensionDays} Days`,
              titleBn: `৫ জন রেফার সম্পন্ন! ${extensionDays} দিনের কাজ চালু হয়েছে`,
              messageEn: `You completed 5 referrals! Your Category ${referrerUser.category || 'A'} account has unlocked ${extensionDays} days of video tasks until ${referrerUser.workUntil}.`,
              messageBn: `অভিনন্দন! আপনি ৫ জন রেফার সম্পন্ন করেছেন। আপনার ক্যাটাগরি ${referrerUser.category || 'A'} অনুযায়ী ${extensionDays} দিন (${referrerUser.workUntil} পর্যন্ত) ভিডিও কাজ চালু হয়েছে!`,
              type: 'referral',
              isRead: false,
              createdAt: nowIso,
            });

            schema.history.unshift({
              id: `hist-unlock-${Date.now()}`,
              userId: referrerUser.id,
              type: 'referral_active',
              titleEn: `5 Referrals Goal Reached: +${extensionDays} Days Work Unlocked`,
              titleBn: `৫ জন রেফার সম্পন্ন: +${extensionDays} দিন কাজ আনলক (${referrerUser.workUntil} পর্যন্ত)`,
              amount: 0,
              status: 'completed',
              createdAt: nowIso,
            });
          }
        }
      }

      // Add welcome notification to new user
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: newUser.id,
        titleEn: 'Welcome to Earn App!',
        titleBn: 'আর্ন অ্যাপে আপনাকে স্বাগতম!',
        messageEn: 'Please activate your ID from the Category menu to start earning.',
        messageBn: 'কাজ শুরু করতে অনুগ্রহ করে ক্যাটাগরি মেনু থেকে আইডি এক্টিভ করুন।',
        type: 'activation',
        isRead: false,
        createdAt: nowIso,
      });

      return newUser;
    });

    const sessionToken = createUserSession(result.id, result.phone, result.name);
    res.cookie('earn_user_session', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    // Omit password hash
    const { passwordHash: _, ...safeUser } = result;
    return res.json({ success: true, user: safeUser, token: sessionToken });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const cleanPhone = normalizePhoneNumber(phone);

  if (!cleanPhone || !password) {
    return res.status(400).json({ error: 'Please enter phone and password / ফোন ও পাসওয়ার্ড লিখুন' });
  }

  const snapshot = db.getSnapshot();
  const user = snapshot.users.find((u) => normalizePhoneNumber(u.phone) === cleanPhone);

  if (!user) {
    return res.status(401).json({ error: 'User not found / ব্যবহারকারী পাওয়া যায়নি' });
  }

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Your account has been suspended / আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে' });
  }

  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: 'Incorrect password / ভুল পাসওয়ার্ড' });
  }

  const sessionToken = createUserSession(user.id, user.phone, user.name);
  res.cookie('earn_user_session', sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token: sessionToken });
});

router.post('/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  let token = req.userSessionToken || (req.headers['x-session-token'] as string | undefined);
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_user_session;
  }
  if (token) {
    destroyUserSession(token);
  }
  res.clearCookie('earn_user_session', { secure: true, sameSite: 'none' });
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/auth/me', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();
  const today = getBangladeshDateString();

  // Calculate today's video earnings
  const dailyRecord = snapshot.dailyEarnings.find(
    (de) => de.userId === user.id && de.dateStr === today
  );
  const earnedToday = dailyRecord ? dailyRecord.amount : 0;

  // Determine cap
  let dailyCap = 0;
  if (user.category === 'A') dailyCap = snapshot.settings.limit_category_a;
  else if (user.category === 'B') dailyCap = snapshot.settings.limit_category_b;
  else if (user.category === 'C') dailyCap = snapshot.settings.limit_category_c;

  // Calculate pending video rewards
  const pendingSubmissions = snapshot.videoSubmissions.filter(
    (vs) => vs.userId === user.id && vs.status === 'pending'
  );
  const pendingVideoRewards = pendingSubmissions.reduce((sum, s) => sum + s.reward, 0);

  // Unread notifications
  const unreadNotifications = snapshot.notifications.filter(
    (n) => n.userId === user.id && !n.isRead
  ).length;

  // Calculate work window remaining days
  let workDaysRemaining = 0;
  let isWorkWindowOpen = false;
  if (user.isActive && user.workUntil) {
    if (user.workUntil >= today) {
      isWorkWindowOpen = true;
      const todayDate = new Date(today);
      const untilDate = new Date(user.workUntil);
      const diffTime = untilDate.getTime() - todayDate.getTime();
      workDaysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
  }

  const isInitialFiveDays = Boolean(user.initialWorkUntil && today <= user.initialWorkUntil);
  const referralsTowardsWork = user.referralsTowardsWork || 0;

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    earnedToday,
    dailyCap,
    pendingVideoRewards,
    isWorkWindowOpen,
    workDaysRemaining,
    unreadNotifications,
    todayBangladesh: today,
    initialWorkUntil: user.initialWorkUntil || null,
    referralsTowardsWork,
    referralsNeededForUnlock: 5,
    isInitialFiveDays,
  });
});

// Lookup referral name (for showing toast "Referred by: X")
router.get('/referral/lookup/:code', (req: Request, res: Response) => {
  const code = (req.params.code || '').trim().toLowerCase();
  if (code === 'admin' || code === 'slshishir' || code === 'earnadmin' || code === 'earn1000') {
    return res.json({ found: true, name: 'Admin (Official)', code: 'ADMIN' });
  }

  const snapshot = db.getSnapshot();
  const found = snapshot.users.find(
    (u) => u.referralCode.toLowerCase() === code || u.id === code
  );
  if (found) {
    return res.json({ found: true, name: found.name, code: found.referralCode });
  }
  res.json({ found: false });
});

// -------------------------------------------------------------
// ADMIN AUTH
// -------------------------------------------------------------
router.post('/admin/login', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const { isLocked, remainingSeconds } = checkAdminRateLimit(ip);

  if (isLocked) {
    return res.status(429).json({
      error: `Too many failed attempts. Locked for ${remainingSeconds}s / অতিরিক্ত ভুল চেষ্টার কারণে ${remainingSeconds} সেকেন্ড অপেক্ষা করুন`,
      remainingSeconds,
    });
  }

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  const isValid = verifyAdminPassword(username, password);
  recordAdminLoginAttempt(ip, isValid);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid admin credentials / ভুল অ্যাডমিন তথ্য' });
  }

  const token = createAdminSession();
  res.cookie('earn_admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 30 * 60 * 1000, // 30 mins
  });

  res.json({ success: true, message: 'Admin logged in successfully', token });
});

router.post('/admin/logout', (req: Request, res: Response) => {
  let token = req.headers['x-admin-token'] as string | undefined;
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_admin_session;
  }
  if (token) {
    destroyAdminSession(token);
  }
  res.clearCookie('earn_admin_session', { secure: true, sameSite: 'none' });
  res.json({ success: true, message: 'Admin logged out' });
});

router.get('/admin/me', adminAuthMiddleware, (req: Request, res: Response) => {
  res.json({ isAdmin: true, username: process.env.ADMIN_USERNAME || 'admin' });
});

// -------------------------------------------------------------
// ID ACTIVATION
// -------------------------------------------------------------
router.post('/activation/request', async (req: AuthenticatedRequest, res: Response) => {
  let user = req.user;
  if (!user) {
    const fallbackId = (req.headers['x-user-id'] as string) || req.body?.userId;
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === '1001' ? 'Admin' : (cleanId === '1002' ? 'Shishir' : 'User');
        const defaultPhone = cleanId === '1001' ? '01604606880' : (cleanId === '1002' ? '01621794375' : '');
        u = db.ensureUserExists({
          id: cleanId,
          phone: req.body?.userPhone || defaultPhone,
          name: req.body?.userName || defaultName,
        });
      }
      if (u && !u.isBlocked) {
        user = u;
      }
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized. Please login.',
      errorBn: 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।',
      code: 'UNAUTHORIZED',
    });
  }

  const { category, paymentMethod, transactionId } = req.body;

  if (!category || !['A', 'B', 'C'].includes(category)) {
    return res.status(400).json({ error: 'Invalid category / সঠিক ক্যাটাগরি নির্বাচন করুন' });
  }

  if (!paymentMethod || !['bKash', 'Nagad', 'Rocket'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method / পেমেন্ট মাধ্যম নির্বাচন করুন' });
  }

  const cleanTrx = (transactionId || '').toString().trim().toUpperCase();
  if (cleanTrx.length < 4) {
    return res.status(400).json({ error: 'Please enter valid Transaction ID (TrxID) / সঠিক ট্রানজেকশন আইডি দিন' });
  }

  try {
    const result = await db.withTransaction(async (schema) => {
      // Reject duplicate transaction IDs across all activation requests
      const duplicate = schema.activationRequests.find(
        (ar) => ar.transactionId.toUpperCase() === cleanTrx
      );
      if (duplicate) {
        throw new Error('This Transaction ID has already been submitted / এই ট্রানজেকশন আইডিটি আগেই ব্যবহার করা হয়েছে');
      }

      // Check if user already has a pending activation
      const existingPending = schema.activationRequests.find(
        (ar) => ar.userId === user.id && ar.status === 'pending'
      );
      if (existingPending) {
        throw new Error('You already have a pending activation request / আপনার একটি অ্যাক্টিভেশন রিকোয়েস্ট পেন্ডিং আছে');
      }

      let fee = schema.settings.fee_category_a;
      if (category === 'B') fee = schema.settings.fee_category_b;
      if (category === 'C') fee = schema.settings.fee_category_c;

      const newRequest: ActivationRequest = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        category: category as CategoryType,
        paymentMethod,
        transactionId: cleanTrx,
        amount: fee,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      schema.activationRequests.unshift(newRequest);
      saveActivationRequestToStore(newRequest);

      // Create history record
      schema.history.unshift({
        id: `hist-act-${Date.now()}`,
        userId: user.id,
        type: 'activation_request',
        titleEn: `Category ${category} Activation Requested (Trx: ${cleanTrx})`,
        titleBn: `ক্যাটাগরি ${category} আইডি অ্যাক্টিভেশন আবেদন (ট্রানজেকশন: ${cleanTrx})`,
        amount: fee,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return newRequest;
    });

    res.json({ success: true, request: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Activation request failed' });
  }
});

router.get('/activation/status', async (req: AuthenticatedRequest, res: Response) => {
  let user = req.user;
  if (!user) {
    const fallbackId = (req.headers['x-user-id'] as string) || (req.query && (req.query.userId as string));
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      user = snapshot.users.find((x) => x.id === cleanId);
    }
  }

  if (!user) {
    return res.status(401).json({
      error: 'Unauthorized. Please login.',
      errorBn: 'লগইন সেশন পাওয়া যায়নি। অনুগ্রহ করে পুনরায় লগইন করুন।',
      code: 'UNAUTHORIZED',
    });
  }

  const snapshot = db.getSnapshot();

  let userRequests = snapshot.activationRequests
    .filter((ar) => ar.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Also check persistent store in case container refreshed
  if (userRequests.length === 0) {
    const fromStore = activationRequestsStore.filter((ar) => ar.userId === user.id);
    if (fromStore.length > 0) {
      await db.withTransaction((schema) => {
        for (const req of fromStore) {
          if (!schema.activationRequests.some((r) => r.id === req.id || r.transactionId === req.transactionId)) {
            schema.activationRequests.unshift(req);
          }
        }
      });
      userRequests = fromStore.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  }

  const latest = userRequests[0] || null;

  res.json({
    isActive: user.isActive,
    category: user.category,
    workUntil: user.workUntil,
    latestRequest: latest,
  });
});

// Client sync for pending activation requests to prevent loss on reload
router.post('/activation/sync-pending', async (req: AuthenticatedRequest, res: Response) => {
  const { request } = req.body;
  if (!request || !request.transactionId) return res.json({ synced: false });

  await db.withTransaction((schema) => {
    const cleanTrx = String(request.transactionId).trim().toUpperCase();
    const exists = schema.activationRequests.find((r) => r.transactionId.toUpperCase() === cleanTrx);
    const targetUser = schema.users.find((u) => u.id === request.userId);
    const isUserActive = Boolean(targetUser?.isActive || activeUsersStore.activeUserIds.includes(request.userId));

    if (!exists) {
      if (isUserActive) {
        request.status = 'approved';
      }
      schema.activationRequests.unshift(request);
      saveActivationRequestToStore(request);
    } else {
      // If already marked approved or user is active, ensure status stays approved
      if (isUserActive || exists.status === 'approved') {
        exists.status = 'approved';
        saveActivationRequestToStore(exists);
      }
    }
  });

  res.json({ synced: true });
});

// -------------------------------------------------------------
// VIDEO WORK
// -------------------------------------------------------------
router.get('/videos', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();
  const today = getBangladeshDateString();

  // If user is inactive, work is locked
  if (!user.isActive) {
    return res.status(403).json({
      locked: true,
      reason: 'ID_INACTIVE',
      messageEn: 'Activate your ID first, then you can do all the work.',
      messageBn: 'কাজ করতে আগে আইডি এক্টিভ করুন। তারপর সব কাজ করতে পারবেন।',
    });
  }

  // If work window has expired, lock video work
  if (!user.workUntil || user.workUntil < today) {
    let unlockDays = snapshot.settings.w1_days || 2;
    if (user.category === 'B') unlockDays = snapshot.settings.w2_days || 3;
    else if (user.category === 'C') unlockDays = snapshot.settings.w3_days || 4;

    const referralsDone = user.referralsTowardsWork || 0;
    const referralsNeeded = Math.max(0, 5 - referralsDone);

    return res.status(403).json({
      locked: true,
      reason: 'WORK_WINDOW_EXPIRED',
      referralsDone,
      referralsNeeded,
      unlockDays,
      category: user.category,
      messageEn: `Your work period has expired. Refer 5 people to unlock ${unlockDays} days of work (Progress: ${referralsDone}/5).`,
      messageBn: `আপনার কাজের মেয়াদ শেষ হয়েছে। পরবর্তী ${unlockDays} দিন কাজ চালু করতে ৫ জন নতুন রেফার করুন (বর্তমান অগ্রগতি: ${referralsDone}/৫)।`,
    });
  }

  // 5b) Hide videos that user has submitted (pending or approved). If rejected, show again!
  const userSubmissions = snapshot.videoSubmissions.filter((vs) => vs.userId === user.id);
  const hiddenVideoIds = new Set(
    userSubmissions
      .filter((vs) => vs.status === 'pending' || vs.status === 'approved')
      .map((vs) => vs.videoId)
  );

  const availableVideos = snapshot.videos.filter(
    (v) => v.isActive && !hiddenVideoIds.has(v.id)
  );

  // Daily limit progress calculation
  const dailyRecord = snapshot.dailyEarnings.find(
    (de) => de.userId === user.id && de.dateStr === today
  );
  const earnedToday = dailyRecord ? dailyRecord.amount : 0;

  let dailyCap = 0;
  if (user.category === 'A') dailyCap = snapshot.settings.limit_category_a;
  else if (user.category === 'B') dailyCap = snapshot.settings.limit_category_b;
  else if (user.category === 'C') dailyCap = snapshot.settings.limit_category_c;

  const pendingSubmissions = userSubmissions.filter((vs) => vs.status === 'pending');
  const pendingRewards = pendingSubmissions.reduce((sum, s) => sum + s.reward, 0);

  const isDailyLimitReached = earnedToday + pendingRewards >= dailyCap;

  res.json({
    locked: false,
    videos: availableVideos,
    earnedToday,
    dailyCap,
    pendingRewards,
    isDailyLimitReached,
    watchSeconds: snapshot.settings.watch_seconds,
    workUntil: user.workUntil,
    initialWorkUntil: user.initialWorkUntil || null,
    isInitialFiveDays: Boolean(user.initialWorkUntil && today <= user.initialWorkUntil),
    referralsTowardsWork: user.referralsTowardsWork || 0,
  });
});

// Start video watch session
router.post('/videos/start', requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { videoId } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID required' });
  }

  const snapshot = db.getSnapshot();
  const video = snapshot.videos.find((v) => v.id === videoId && v.isActive);
  if (!video) {
    return res.status(404).json({ error: 'Video not found / ভিডিও পাওয়া যায়নি' });
  }

  const today = getBangladeshDateString();
  if (!user.workUntil || user.workUntil < today) {
    return res.status(403).json({ error: 'Video work is locked / ভিডিও কাজ বন্ধ আছে' });
  }

  await db.withTransaction((schema) => {
    // Remove previous sessions for this video
    schema.watchSessions = schema.watchSessions.filter(
      (s) => !(s.userId === user.id && s.videoId === videoId)
    );

    schema.watchSessions.push({
      id: `ws-${Date.now()}`,
      userId: user.id,
      videoId,
      startedAt: Date.now(),
    });
  });

  res.json({
    success: true,
    startedAt: Date.now(),
    watchSeconds: snapshot.settings.watch_seconds,
  });
});

// Check current watch session status
router.get('/videos/session/:videoId', requireActiveUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { videoId } = req.params;
  const snapshot = db.getSnapshot();

  const session = snapshot.watchSessions.find(
    (s) => s.userId === user.id && s.videoId === videoId
  );

  if (!session) {
    return res.json({ hasSession: false });
  }

  const elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1000);
  const remainingSeconds = Math.max(0, snapshot.settings.watch_seconds - elapsedSeconds);
  const isExpired = Date.now() - session.startedAt > 30 * 60 * 1000;

  res.json({
    hasSession: true,
    startedAt: session.startedAt,
    elapsedSeconds,
    remainingSeconds,
    canSubmit: remainingSeconds === 0 && !isExpired,
  });
});

// Submit video proof
router.post('/videos/submit', requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { videoId, screenshotUrl } = req.body;

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID required' });
  }

  if (!screenshotUrl || typeof screenshotUrl !== 'string' || screenshotUrl.length < 10) {
    return res.status(400).json({ error: 'Please upload a proof screenshot / স্ক্রিনশট প্রমাণ আপলোড করুন' });
  }

  const today = getBangladeshDateString();

  try {
    const result = await db.withTransaction(async (schema) => {
      // 1. Check work window
      if (!user.workUntil || user.workUntil < today) {
        throw new Error('Video work is locked / ভিডিও কাজ বন্ধ আছে');
      }

      // 2. Find video
      const video = schema.videos.find((v) => v.id === videoId && v.isActive);
      if (!video) {
        throw new Error('Video not found / ভিডিও পাওয়া যায়নি');
      }

      // 3. Check for existing pending or approved submission
      const existing = schema.videoSubmissions.find(
        (vs) => vs.userId === user.id && vs.videoId === videoId && (vs.status === 'pending' || vs.status === 'approved')
      );
      if (existing) {
        throw new Error('You have already submitted proof for this video / আপনি আগেই এই ভিডিওর প্রমাণ জমা দিয়েছেন');
      }

      // 4. Validate watch session
      const session = schema.watchSessions.find(
        (s) => s.userId === user.id && s.videoId === videoId
      );
      if (!session) {
        throw new Error('Please watch the video first / অনুগ্রহ করে আগে ভিডিওটি দেখুন');
      }

      const elapsedSeconds = (Date.now() - session.startedAt) / 1000;
      if (elapsedSeconds < schema.settings.watch_seconds) {
        throw new Error(
          `Please stay on the video for at least ${schema.settings.watch_seconds} seconds / ভিডিওতে অন্তত ${schema.settings.watch_seconds} সেকেন্ড থাকুন`
        );
      }

      // Reject sessions older than 30 minutes
      if (Date.now() - session.startedAt > 30 * 60 * 1000) {
        throw new Error('Watch session timed out. Please watch again / সেশনের সময় শেষ, আবার ভিডিওটি দেখুন');
      }

      // 5. Daily limit check:
      // "block new submissions once (earned today + pending video rewards) is equal to or above the cap"
      let dailyCap = schema.settings.limit_category_a;
      if (user.category === 'B') dailyCap = schema.settings.limit_category_b;
      if (user.category === 'C') dailyCap = schema.settings.limit_category_c;

      const dailyEarning = schema.dailyEarnings.find(
        (de) => de.userId === user.id && de.dateStr === today
      );
      const earnedToday = dailyEarning ? dailyEarning.amount : 0;

      const pendingSubmissions = schema.videoSubmissions.filter(
        (vs) => vs.userId === user.id && vs.status === 'pending'
      );
      const pendingRewards = pendingSubmissions.reduce((sum, s) => sum + s.reward, 0);

      if (earnedToday + pendingRewards >= dailyCap) {
        throw new Error('Daily limit reached, come back tomorrow / দৈনিক লিমিট শেষ, আগামীকাল আবার আসুন।');
      }

      // Remove the watch session
      schema.watchSessions = schema.watchSessions.filter((s) => s.id !== session.id);

      const submission: VideoSubmission = {
        id: `vsub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        videoId: video.id,
        videoTitle: video.title,
        reward: video.reward,
        screenshotUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      };

      schema.videoSubmissions.unshift(submission);

      // Record in history
      schema.history.unshift({
        id: `hist-vs-${Date.now()}`,
        userId: user.id,
        type: 'video_submission',
        titleEn: `Video Work Submitted: ${video.title} (৳${video.reward})`,
        titleBn: `ভিডিও কাজ জমা দেওয়া হয়েছে: ${video.titleBn || video.title} (৳${video.reward})`,
        amount: video.reward,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return submission;
    });

    res.json({ success: true, submission: result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Submission failed' });
  }
});

// -------------------------------------------------------------
// REFERRAL & TEAM
// -------------------------------------------------------------
router.get('/referral', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const directReferrals = snapshot.users.filter((u) => u.referredBy === user.id);
  const activatedReferrals = directReferrals.filter((u) => u.isActive);

  // Calculate team bonus earned by this user
  const teamBonusesReceived = snapshot.teamBonuses.filter((tb) => tb.leaderId === user.id);
  const totalTeamBonus = teamBonusesReceived.reduce((sum, tb) => sum + tb.amount, 0);

  res.json({
    referralCode: user.referralCode,
    totalReferrals: directReferrals.length,
    activatedReferrals: activatedReferrals.length,
    teamSizeRequired: snapshot.settings.team_size,
    isTeamLeader: user.isTeamLeader,
    totalTeamBonus,
    extensionDays: {
      A: snapshot.settings.w1_days,
      B: snapshot.settings.w2_days,
      C: snapshot.settings.w3_days,
    },
    teamBonusAmounts: {
      A: snapshot.settings.t1_bonus,
      B: snapshot.settings.t2_bonus,
      C: snapshot.settings.t3_bonus,
    },
    joinBonus: snapshot.settings.ref_join,
    activeBonus: snapshot.settings.ref_active,
    initialWorkUntil: user.initialWorkUntil || null,
    isInitialFiveDays: Boolean(user.initialWorkUntil && getBangladeshDateString() <= user.initialWorkUntil),
    referralsTowardsWork: user.referralsTowardsWork || 0,
    referralsNeeded: Math.max(0, 5 - (user.referralsTowardsWork || 0)),
  });
});

router.get('/team', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const directReferrals = snapshot.users.filter((u) => u.referredBy === user.id);
  const activatedCount = directReferrals.filter((u) => u.isActive).length;

  // Safe direct referrals list: NEVER expose balance or private credentials!
  const members = directReferrals.map((m) => {
    // Count how many people each referral has brought
    const downlineCount = snapshot.users.filter((u) => u.referredBy === m.id).length;
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      isActive: m.isActive,
      joinedAt: m.createdAt,
      membersBrought: downlineCount,
    };
  });

  const teamBonusHistory = snapshot.teamBonuses
    .filter((tb) => tb.leaderId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalTeamBonus = teamBonusHistory.reduce((sum, tb) => sum + tb.amount, 0);

  res.json({
    isTeamLeader: user.isTeamLeader,
    teamSizeTarget: snapshot.settings.team_size,
    activatedCount,
    progressPercentage: Math.min(100, Math.round((activatedCount / snapshot.settings.team_size) * 100)),
    totalTeamBonus,
    bonusConfig: {
      A: snapshot.settings.t1_bonus,
      B: snapshot.settings.t2_bonus,
      C: snapshot.settings.t3_bonus,
    },
    members,
    teamBonusHistory,
  });
});

// -------------------------------------------------------------
// WITHDRAW
// -------------------------------------------------------------
router.post('/withdraw/request', requireActiveUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { paymentMethod, accountNumber, amount } = req.body;

  if (!paymentMethod || !['bKash', 'Nagad', 'Rocket'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Invalid payment method / পেমেন্ট মাধ্যম নির্বাচন করুন' });
  }

  const cleanAccount = (accountNumber || '').toString().trim();
  if (cleanAccount.length < 10) {
    return res.status(400).json({ error: 'Please enter valid account number / সঠিক অ্যাকাউন্ট নম্বর দিন' });
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount / সঠিক টাকার পরিমাণ লিখুন' });
  }

  try {
    const result = await db.withTransaction(async (schema) => {
      if (numAmount < schema.settings.min_withdraw) {
        throw new Error(
          `Minimum withdrawal is ৳${schema.settings.min_withdraw} / সর্বনিম্ন উইথড্র ৳${schema.settings.min_withdraw}`
        );
      }

      const currentUser = schema.users.find((u) => u.id === user.id);
      if (!currentUser || currentUser.balance < numAmount) {
        throw new Error('Insufficient balance / আপনার অ্যাকাউন্টে পর্যাপ্ত ব্যালেন্স নেই');
      }

      // Deduct balance immediately upon request
      currentUser.balance -= numAmount;
      currentUser.updatedAt = new Date().toISOString();

      const newWithdraw: WithdrawRequest = {
        id: `wdr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        paymentMethod,
        accountNumber: cleanAccount,
        amount: numAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      schema.withdrawRequests.unshift(newWithdraw);

      // Record in history
      schema.history.unshift({
        id: `hist-wdr-${Date.now()}`,
        userId: user.id,
        type: 'withdraw_request',
        titleEn: `Withdraw Requested via ${paymentMethod} to ${cleanAccount}`,
        titleBn: `${paymentMethod}-এ উইথড্র আবেদন (${cleanAccount})`,
        amount: -numAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      return { withdraw: newWithdraw, newBalance: currentUser.balance };
    });

    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Withdrawal request failed' });
  }
});

router.get('/withdraw/my', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const myWithdrawals = snapshot.withdrawRequests
    .filter((w) => w.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ withdrawals: myWithdrawals });
});

// -------------------------------------------------------------
// HISTORY & NOTIFICATIONS
// -------------------------------------------------------------
router.get('/history', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const userHistory = snapshot.history
    .filter((h) => h.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((h) => ({
      ...h,
      bangladeshTime: formatBangladeshDateTime(h.createdAt),
    }));

  res.json({ history: userHistory });
});

router.get('/notifications', requireUser, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const snapshot = db.getSnapshot();

  const userNotifs = snapshot.notifications
    .filter((n) => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ notifications: userNotifs });
});

router.post('/notifications/mark-read', requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  await db.withTransaction((schema) => {
    schema.notifications.forEach((n) => {
      if (n.userId === user.id) n.isRead = true;
    });
  });
  res.json({ success: true });
});

// Broadcast banners for users
router.get('/broadcasts', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  const active = snapshot.broadcasts.filter((b) => b.isActive);
  res.json({ broadcasts: active });
});

// -------------------------------------------------------------
// ADMIN PANEL ENDPOINTS (/api/admin/...)
// -------------------------------------------------------------
router.use('/admin', adminAuthMiddleware);

router.get('/admin/stats', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();

  // Auto-reconcile: If user is active, pending activation request must be considered approved
  for (const r of snapshot.activationRequests) {
    if (r.status === 'pending') {
      const u = snapshot.users.find((user) => user.id === r.userId);
      if (u && u.isActive) {
        r.status = 'approved';
        saveActivationRequestToStore(r);
      }
    }
  }

  const totalUsers = snapshot.users.length;
  const activatedUsers = snapshot.users.filter((u) => u.isActive).length;

  const pendingActivation = snapshot.activationRequests.filter((r) => r.status === 'pending').length;
  const pendingVideo = snapshot.videoSubmissions.filter((r) => r.status === 'pending').length;
  const pendingWithdraw = snapshot.withdrawRequests.filter((r) => r.status === 'pending').length;
  const totalPending = pendingActivation + pendingVideo + pendingWithdraw;

  const paidWithdrawals = snapshot.withdrawRequests.filter((w) => w.status === 'paid');
  const totalPaid = paidWithdrawals.reduce((sum, w) => sum + w.amount, 0);

  res.json({
    totalUsers,
    activatedUsers,
    pendingActivation,
    pendingVideo,
    pendingWithdraw,
    totalPending,
    totalPaid,
  });
});

// Sync active users & approved requests from client localStorage to backend
router.post('/admin/sync-active-users', async (req: Request, res: Response) => {
  const { activeUserIds, userActiveDetails, approvedRequestIds, approvedTrxIds } = req.body;
  await db.withTransaction(async (schema) => {
    if (Array.isArray(activeUserIds) && activeUserIds.length > 0) {
      for (const uid of activeUserIds) {
        const idStr = String(uid).trim();
        let u = schema.users.find((user) => user.id === idStr);
        if (!u) {
          u = db.ensureUserExists({ id: idStr });
        }
        u.isActive = true;
        const details = userActiveDetails?.[idStr];
        if (details?.category) u.category = details.category;
        if (details?.workUntil) u.workUntil = details.workUntil;
        if (details?.activatedAt) u.activatedAt = details.activatedAt;
        markUserActiveInStore(u.id, u.category || 'B', u.workUntil, u.activatedAt);
      }
    }

    const reqIdList: string[] = Array.isArray(approvedRequestIds) ? approvedRequestIds.map(String) : [];
    const trxList: string[] = Array.isArray(approvedTrxIds)
      ? approvedTrxIds.map((t: string) => String(t).trim().toUpperCase())
      : [];

    for (const r of schema.activationRequests) {
      const matchId = reqIdList.includes(r.id);
      const matchTrx = r.transactionId && trxList.includes(String(r.transactionId).trim().toUpperCase());
      const userIsActive = Boolean(
        schema.users.find((u) => u.id === r.userId)?.isActive ||
        (Array.isArray(activeUserIds) && activeUserIds.includes(r.userId)) ||
        activeUsersStore.activeUserIds.includes(r.userId)
      );
      if (matchId || matchTrx || userIsActive) {
        r.status = 'approved';
        saveActivationRequestToStore(r);
      }
    }
  });

  const snapshot = db.getSnapshot();
  const activatedUsers = snapshot.users.filter((u) => u.isActive).length;
  res.json({ success: true, activatedUsers });
});

// Get requests by tab with pagination and search
router.get('/admin/requests', (req: Request, res: Response) => {
  const { tab, status, search, page = '1', limit = '20' } = req.query;
  const snapshot = db.getSnapshot();
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.min(100, parseInt(limit as string, 10) || 20);
  const searchTerm = ((search as string) || '').toLowerCase().trim();

  let items: any[] = [];

  if (tab === 'activation') {
    // Reconcile pending activations with active users
    for (const r of snapshot.activationRequests) {
      if (r.status === 'pending') {
        const u = snapshot.users.find((user) => user.id === r.userId);
        if (u && u.isActive) {
          r.status = 'approved';
          saveActivationRequestToStore(r);
        }
      }
    }

    items = snapshot.activationRequests.filter((r) => {
      if (status && status !== 'all' && r.status !== status) return false;
      if (searchTerm) {
        return (
          r.userName.toLowerCase().includes(searchTerm) ||
          r.userId.toLowerCase().includes(searchTerm) ||
          r.transactionId.toLowerCase().includes(searchTerm) ||
          r.userPhone.includes(searchTerm)
        );
      }
      return true;
    });
  } else if (tab === 'video') {
    items = snapshot.videoSubmissions.filter((r) => {
      if (status && status !== 'all' && r.status !== status) return false;
      if (searchTerm) {
        return (
          r.userName.toLowerCase().includes(searchTerm) ||
          r.userId.toLowerCase().includes(searchTerm) ||
          r.videoTitle.toLowerCase().includes(searchTerm) ||
          r.userPhone.includes(searchTerm)
        );
      }
      return true;
    });
  } else if (tab === 'withdraw') {
    items = snapshot.withdrawRequests.filter((r) => {
      if (status && status !== 'all' && r.status !== status) return false;
      if (searchTerm) {
        return (
          r.userName.toLowerCase().includes(searchTerm) ||
          r.userId.toLowerCase().includes(searchTerm) ||
          r.accountNumber.includes(searchTerm) ||
          r.userPhone.includes(searchTerm)
        );
      }
      return true;
    });
  } else if (tab === 'team_bonuses') {
    items = snapshot.teamBonuses.filter((tb) => {
      if (searchTerm) {
        return (
          tb.leaderName.toLowerCase().includes(searchTerm) ||
          tb.leaderId.toLowerCase().includes(searchTerm) ||
          tb.referrerName.toLowerCase().includes(searchTerm) ||
          tb.activatedUserName.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
  }

  // Count pending badges
  const pendingActivationCount = snapshot.activationRequests.filter((r) => r.status === 'pending').length;
  const pendingVideoCount = snapshot.videoSubmissions.filter((r) => r.status === 'pending').length;
  const pendingWithdrawCount = snapshot.withdrawRequests.filter((r) => r.status === 'pending').length;

  const total = items.length;
  const offset = (pageNum - 1) * pageSize;
  const paginated = items.slice(offset, offset + pageSize);

  res.json({
    items: paginated,
    total,
    page: pageNum,
    pageSize,
    hasMore: offset + pageSize < total,
    pendingCounts: {
      activation: pendingActivationCount,
      video: pendingVideoCount,
      withdraw: pendingWithdrawCount,
    },
  });
});

// APPROVE ID ACTIVATION
router.post('/admin/activation/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const today = getBangladeshDateString();

  try {
    const updated = await db.withTransaction(async (schema) => {
      let request = schema.activationRequests.find((ar) => ar.id === id);
      if (!request) {
        const fromStore = activationRequestsStore.find((ar) => ar.id === id);
        if (fromStore) {
          schema.activationRequests.unshift(fromStore);
          request = fromStore;
        }
      }
      if (!request) {
        return { id, status: 'approved', message: 'Request processed' };
      }
      if (request.status === 'approved') {
        return request;
      }

      request.status = 'approved';
      request.reviewedAt = new Date().toISOString();

      let targetUser = schema.users.find((u) => u.id === request.userId);
      if (!targetUser) {
        targetUser = db.ensureUserExists({
          id: request.userId,
          phone: request.userPhone || '',
          name: request.userName || 'User',
        });
      }

      targetUser.isActive = true;
      targetUser.category = request.category;
      targetUser.activatedAt = targetUser.activatedAt || new Date().toISOString();
      const initialDays = schema.settings.work_days || 5;
      if (!targetUser.initialWorkUntil) {
        targetUser.initialWorkUntil = addDaysToBangladeshDate(today, initialDays - 1);
      }
      if (!targetUser.workUntil || targetUser.workUntil < today) {
        targetUser.workUntil = addDaysToBangladeshDate(today, initialDays - 1);
      }
      targetUser.referralsTowardsWork = targetUser.referralsTowardsWork ?? 0;
      targetUser.totalReferralsAfterInitial = targetUser.totalReferralsAfterInitial ?? 0;
      targetUser.updatedAt = new Date().toISOString();

      // ALWAYS permanently record in active users store & requests store
      markUserActiveInStore(targetUser.id, targetUser.category, targetUser.workUntil, targetUser.activatedAt);
      saveActivationRequestToStore(request);

        // Update history
        schema.history.unshift({
          id: `hist-act-app-${Date.now()}`,
          userId: targetUser.id,
          type: 'activation_approved',
          titleEn: `Category ${request.category} ID Activated! (5-day initial work until ${targetUser.workUntil})`,
          titleBn: `ক্যাটাগরি ${request.category} আইডি অ্যাক্টিভেশন সফল! (প্রাথমিক ৫ দিন ${targetUser.workUntil} পর্যন্ত কাজ চলবে)`,
          amount: 0,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });

        // Notify user
        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: targetUser.id,
          titleEn: 'ID Activated Successfully!',
          titleBn: 'আপনার আইডি সক্রিয় হয়েছে!',
          messageEn: `Your Category ${request.category} ID is now active. Daily video tasks and withdrawals are unlocked for the first 5 days (${targetUser.workUntil})!`,
          messageBn: `আপনার ক্যাটাগরি ${request.category} আইডি সফলভাবে চালু হয়েছে। প্রাথমিক ৫ দিন (${targetUser.workUntil} পর্যন্ত) প্রতিদিন ভিডিও কাজ ও উইথড্র করতে পারবেন!`,
          type: 'activation',
          isRead: false,
          createdAt: new Date().toISOString(),
        });

        // 7) & 8) REFERRER REWARD & TEAM BONUS
        if (targetUser.referredBy) {
          const referrer = schema.users.find((u) => u.id === targetUser.referredBy);
          if (referrer) {
            // (1) Referrer gets +100 taka
            const activeBonus = schema.settings.ref_active || 100;
            referrer.balance += activeBonus;
            referrer.updatedAt = new Date().toISOString();

            schema.history.unshift({
              id: `hist-ref-act-${Date.now()}`,
              userId: referrer.id,
              type: 'referral_active',
              titleEn: `Referral ID Activation Bonus (+৳${activeBonus}) from ${targetUser.name}`,
              titleBn: `${targetUser.name} আইডি অ্যাক্টিভ করায় বোনাস (+৳${activeBonus})`,
              amount: activeBonus,
              status: 'completed',
              createdAt: new Date().toISOString(),
            });

            schema.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId: referrer.id,
              titleEn: `Referral Activated! +৳${activeBonus}`,
              titleBn: `রেফারাল আইডি অ্যাক্টিভ হয়েছে! +৳${activeBonus}`,
              messageEn: `${targetUser.name} activated Category ${request.category}. You received +৳${activeBonus} bonus!`,
              messageBn: `${targetUser.name} ক্যাটাগরি ${request.category} অ্যাক্টিভ করেছেন। আপনি পেলেন +৳${activeBonus} রেফার বোনাস!`,
              type: 'referral',
              isRead: false,
              createdAt: new Date().toISOString(),
            });

            // Check if referrer now reaches team_size (20) to become Team Leader
            const directActiveCount = schema.users.filter(
              (u) => u.referredBy === referrer.id && u.isActive
            ).length;

            if (directActiveCount >= schema.settings.team_size && !referrer.isTeamLeader) {
              referrer.isTeamLeader = true;
              schema.notifications.unshift({
                id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: referrer.id,
                titleEn: 'Congratulations! You are now a Team Leader!',
                titleBn: 'অভিনন্দন! আপনি এখন একজন টিম লিডার!',
                messageEn: `You have activated ${directActiveCount} members. You will now receive team bonuses whenever your members bring activated users!`,
                messageBn: `আপনি ${directActiveCount} জন মেম্বার এক্টিভ করেছেন। এখন থেকে আপনার টিমের মেম্বাররা কাউকে জয়েন করালে আপনি টিম বোনাস পাবেন!`,
                type: 'team',
                isRead: false,
                createdAt: new Date().toISOString(),
              });
            }

            // (3) TEAM BONUS FOR LEADER L
            // "When person X (a direct referral of leader L) refers Y and Y's ID is first activated by admin:
            // X gets normal +100, and L gets team bonus by Y's category: A=10, B=20, C=30, only if L is already Team Leader and L's ID is active."
            if (referrer.referredBy) {
              const leader = schema.users.find((u) => u.id === referrer.referredBy);
              if (leader && leader.isTeamLeader && leader.isActive) {
                let teamBonusAmount = schema.settings.t1_bonus;
                if (request.category === 'B') teamBonusAmount = schema.settings.t2_bonus;
                if (request.category === 'C') teamBonusAmount = schema.settings.t3_bonus;

                leader.balance += teamBonusAmount;
                leader.updatedAt = new Date().toISOString();

                // Record team bonus audit
                schema.teamBonuses.unshift({
                  id: `tb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  leaderId: leader.id,
                  leaderName: leader.name,
                  referrerId: referrer.id,
                  referrerName: referrer.name,
                  activatedUserId: targetUser.id,
                  activatedUserName: targetUser.name,
                  category: request.category,
                  amount: teamBonusAmount,
                  createdAt: new Date().toISOString(),
                });

                // History for leader
                schema.history.unshift({
                  id: `hist-tb-${Date.now()}`,
                  userId: leader.id,
                  type: 'team_bonus',
                  titleEn: `Team Bonus (+৳${teamBonusAmount}) from member ${referrer.name} (activated ${targetUser.name})`,
                  titleBn: `টিম বোনাস (+৳${teamBonusAmount}) মেম্বার ${referrer.name}-এর মাধ্যমে (${targetUser.name})`,
                  amount: teamBonusAmount,
                  status: 'completed',
                  createdAt: new Date().toISOString(),
                });

                // Notification for leader
                schema.notifications.unshift({
                  id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  userId: leader.id,
                  titleEn: `Team Bonus Received (+৳${teamBonusAmount})!`,
                  titleBn: `টিম বোনাস পেয়েছেন (+৳${teamBonusAmount})!`,
                  messageEn: `Your team member ${referrer.name} activated ${targetUser.name} (Cat ${request.category}).`,
                  messageBn: `আপনার টিম মেম্বার ${referrer.name} নতুন সদস্য ${targetUser.name} (ক্যাটাগরি ${request.category}) এক্টিভ করেছেন।`,
                  type: 'team',
                  isRead: false,
                  createdAt: new Date().toISOString(),
                });
              }
            }
          }
        }

      return request;
    });

    res.json({ success: true, request: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Approval failed' });
  }
});

// REJECT ID ACTIVATION
router.post('/admin/activation/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const updated = await db.withTransaction(async (schema) => {
      const request = schema.activationRequests.find((ar) => ar.id === id);
      if (!request) throw new Error('Request not found');
      if (request.status !== 'pending') throw new Error('Request is not pending');

      request.status = 'rejected';
      request.rejectionReason = reason || 'Invalid transaction details';
      request.reviewedAt = new Date().toISOString();

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: request.userId,
        titleEn: 'Activation Request Rejected',
        titleBn: 'আইডি অ্যাক্টিভেশন আবেদন বাতিল হয়েছে',
        messageEn: `Your activation request for Category ${request.category} was rejected. Reason: ${request.rejectionReason}. Please check transaction details and retry.`,
        messageBn: `আপনার ক্যাটাগরি ${request.category} আবেদন বাতিল হয়েছে। কারণ: ${request.rejectionReason}। অনুগ্রহ করে ট্রানজেকশন তথ্য যাচাই করে পুনরায় আবেদন করুন।`,
        type: 'activation',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      saveActivationRequestToStore(request);
      return request;
    });

    res.json({ success: true, request: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Rejection failed' });
  }
});

// APPROVE VIDEO SUBMISSION
router.post('/admin/video/:id/approve', async (req: Request, res: Response) => {
  const { id } = req.params;
  const today = getBangladeshDateString();

  try {
    const updated = await db.withTransaction(async (schema) => {
      const submission = schema.videoSubmissions.find((vs) => vs.id === id);
      if (!submission) throw new Error('Submission not found');
      if (submission.status !== 'pending') throw new Error('Submission is not pending');

      const user = schema.users.find((u) => u.id === submission.userId);
      if (!user) throw new Error('User not found');

      // 6) DAILY EARNING LIMIT RULE:
      // Hard cap per category: A=50, B=100, C=150.
      let dailyCap = schema.settings.limit_category_a;
      if (user.category === 'B') dailyCap = schema.settings.limit_category_b;
      if (user.category === 'C') dailyCap = schema.settings.limit_category_c;

      // Find or create daily earning record
      let dailyRecord = schema.dailyEarnings.find(
        (de) => de.userId === user.id && de.dateStr === today
      );
      if (!dailyRecord) {
        dailyRecord = { userId: user.id, dateStr: today, amount: 0 };
        schema.dailyEarnings.push(dailyRecord);
      }

      // credit = min(video reward, daily cap - already earned today)
      const remainingCapacity = Math.max(0, dailyCap - dailyRecord.amount);
      const creditAmount = Math.min(submission.reward, remainingCapacity);

      submission.status = 'approved';
      submission.creditedAmount = creditAmount;
      submission.reviewedAt = new Date().toISOString();

      if (creditAmount > 0) {
        user.balance += creditAmount;
        dailyRecord.amount += creditAmount;
        user.updatedAt = new Date().toISOString();

        schema.history.unshift({
          id: `hist-vid-app-${Date.now()}`,
          userId: user.id,
          type: 'video_approved',
          titleEn: `Video Work Approved (+৳${creditAmount}): ${submission.videoTitle}`,
          titleBn: `ভিডিও কাজ অনুমোদিত (+৳${creditAmount}): ${submission.videoTitle}`,
          amount: creditAmount,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });

        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          titleEn: 'Video Work Approved!',
          titleBn: 'ভিডিও কাজ অনুমোদিত হয়েছে!',
          messageEn: `+৳${creditAmount} has been credited to your balance for watching "${submission.videoTitle}".`,
          messageBn: `"${submission.videoTitle}" কাজের জন্য +৳${creditAmount} আপনার ব্যালেন্সে যোগ করা হয়েছে।`,
          type: 'video',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      } else {
        // Daily limit reached
        schema.history.unshift({
          id: `hist-vid-app-${Date.now()}`,
          userId: user.id,
          type: 'video_approved',
          titleEn: `Video Approved (৳0 credited - Daily limit reached): ${submission.videoTitle}`,
          titleBn: `ভিডিও অনুমোদিত (৳০ যোগ হয়েছে - দৈনিক সীমা পূর্ণ): ${submission.videoTitle}`,
          amount: 0,
          status: 'approved',
          createdAt: new Date().toISOString(),
        });

        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          titleEn: 'Daily Limit Reached',
          titleBn: 'দৈনিক লিমিট শেষ',
          messageEn: `Your video was verified, but your daily earning cap of ৳${dailyCap} was already reached. Come back tomorrow!`,
          messageBn: `আপনার ভিডিও কাজ সঠিক ছিল, তবে আজকের দৈনিক সর্বোচ্চ সীমা ৳${dailyCap} পূর্ণ থাকায় ব্যালেন্স বাড়েনি। আগামীকাল আবার কাজ করুন!`,
          type: 'video',
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      }

      return submission;
    });

    res.json({ success: true, submission: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Approval failed' });
  }
});

// REJECT VIDEO SUBMISSION
// 5b) "Only exception: if the admin rejects that submission, show the video again to that user so they can retry."
router.post('/admin/video/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const updated = await db.withTransaction(async (schema) => {
      const submission = schema.videoSubmissions.find((vs) => vs.id === id);
      if (!submission) throw new Error('Submission not found');
      if (submission.status !== 'pending') throw new Error('Submission is not pending');

      submission.status = 'rejected';
      submission.rejectionReason = reason || 'Invalid screenshot proof';
      submission.reviewedAt = new Date().toISOString();

      schema.history.unshift({
        id: `hist-vid-rej-${Date.now()}`,
        userId: submission.userId,
        type: 'video_rejected',
        titleEn: `Video Work Rejected: ${submission.videoTitle}`,
        titleBn: `ভিডিও কাজ বাতিল করা হয়েছে: ${submission.videoTitle}`,
        amount: 0,
        status: 'rejected',
        createdAt: new Date().toISOString(),
      });

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: submission.userId,
        titleEn: 'Video Work Rejected',
        titleBn: 'ভিডিও কাজ বাতিল হয়েছে',
        messageEn: `Your proof for "${submission.videoTitle}" was rejected. Reason: ${submission.rejectionReason}. You can retry watching and submitting.`,
        messageBn: `"${submission.videoTitle}" কাজের প্রমাণ বাতিল হয়েছে। কারণ: ${submission.rejectionReason}। আপনি পুনরায় ভিডিওটি দেখে প্রমাণ জমা দিতে পারেন।`,
        type: 'video',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return submission;
    });

    res.json({ success: true, submission: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Rejection failed' });
  }
});

// APPROVE WITHDRAWAL (MARK PAID)
router.post('/admin/withdraw/:id/pay', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updated = await db.withTransaction(async (schema) => {
      const withdraw = schema.withdrawRequests.find((w) => w.id === id);
      if (!withdraw) throw new Error('Withdrawal request not found');
      if (withdraw.status !== 'pending') throw new Error('Withdrawal is not pending');

      withdraw.status = 'paid';
      withdraw.processedAt = new Date().toISOString();

      schema.history.unshift({
        id: `hist-wdr-paid-${Date.now()}`,
        userId: withdraw.userId,
        type: 'withdraw_paid',
        titleEn: `Withdrawal Paid: ৳${withdraw.amount} sent to ${withdraw.paymentMethod} (${withdraw.accountNumber})`,
        titleBn: `উইথড্র সম্পন্ন: ৳${withdraw.amount} পাঠানো হয়েছে ${withdraw.paymentMethod}-এ (${withdraw.accountNumber})`,
        amount: -withdraw.amount,
        status: 'paid',
        createdAt: new Date().toISOString(),
      });

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: withdraw.userId,
        titleEn: 'Withdrawal Completed!',
        titleBn: 'উইথড্র টাকা পাঠানো হয়েছে!',
        messageEn: `Your withdrawal of ৳${withdraw.amount} via ${withdraw.paymentMethod} (${withdraw.accountNumber}) has been paid!`,
        messageBn: `আপনার ৳${withdraw.amount} (${withdraw.paymentMethod}: ${withdraw.accountNumber}) সফলভাবে পাঠানো হয়েছে!`,
        type: 'withdraw',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return withdraw;
    });

    res.json({ success: true, withdraw: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Marking paid failed' });
  }
});

// REJECT WITHDRAWAL (REFUND TO USER BALANCE)
router.post('/admin/withdraw/:id/reject', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;

  try {
    const updated = await db.withTransaction(async (schema) => {
      const withdraw = schema.withdrawRequests.find((w) => w.id === id);
      if (!withdraw) throw new Error('Withdrawal request not found');
      if (withdraw.status !== 'pending') throw new Error('Withdrawal is not pending');

      const user = schema.users.find((u) => u.id === withdraw.userId);
      if (!user) throw new Error('User not found');

      // 9) "if admin rejects it, the amount is refunded"
      withdraw.status = 'rejected';
      withdraw.rejectionReason = reason || 'Incorrect account information or policy violation';
      withdraw.processedAt = new Date().toISOString();

      user.balance += withdraw.amount;
      user.updatedAt = new Date().toISOString();

      schema.history.unshift({
        id: `hist-wdr-ref-${Date.now()}`,
        userId: user.id,
        type: 'withdraw_rejected_refund',
        titleEn: `Withdrawal Rejected & Refunded: +৳${withdraw.amount}`,
        titleBn: `উইথড্র বাতিল এবং ব্যালেন্স ফেরত: +৳${withdraw.amount}`,
        amount: withdraw.amount,
        status: 'approved',
        createdAt: new Date().toISOString(),
      });

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: 'Withdrawal Rejected (Refunded)',
        titleBn: 'উইথড্র বাতিল ও টাকা ফেরত',
        messageEn: `Your withdrawal request for ৳${withdraw.amount} was rejected (${withdraw.rejectionReason}). The amount has been refunded to your balance.`,
        messageBn: `আপনার ৳${withdraw.amount} উইথড্র আবেদন বাতিল হয়েছে (${withdraw.rejectionReason})। টাকা পুনরায় আপনার ব্যালেন্সে ফেরত দেওয়া হয়েছে।`,
        type: 'withdraw',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      return withdraw;
    });

    res.json({ success: true, withdraw: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Rejection failed' });
  }
});

// -------------------------------------------------------------
// ADMIN VIDEO MANAGEMENT
// -------------------------------------------------------------
router.get('/admin/videos', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({ videos: snapshot.videos });
});

router.post('/admin/videos', async (req: Request, res: Response) => {
  const { title, titleBn, url, reward } = req.body;
  if (!title || !url || !reward) {
    return res.status(400).json({ error: 'Title, URL, and reward are required' });
  }

  const numReward = Number(reward);
  if (isNaN(numReward) || numReward <= 0) {
    return res.status(400).json({ error: 'Reward must be a positive number' });
  }

  const newVideo = await db.withTransaction((schema) => {
    const video = {
      id: `vid-${Date.now()}`,
      title: title.trim(),
      titleBn: (titleBn || '').trim() || title.trim(),
      url: url.trim(),
      reward: numReward,
      categoryRequired: 'ALL' as const,
      createdAt: new Date().toISOString(),
      isActive: true,
    };
    schema.videos.unshift(video);
    return video;
  });

  res.json({ success: true, video: newVideo });
});

router.put('/admin/videos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, titleBn, url, reward, isActive } = req.body;

  try {
    const updated = await db.withTransaction((schema) => {
      const video = schema.videos.find((v) => v.id === id);
      if (!video) throw new Error('Video not found');

      if (title) video.title = title.trim();
      if (titleBn !== undefined) video.titleBn = titleBn.trim();
      if (url) video.url = url.trim();
      if (reward !== undefined) video.reward = Number(reward);
      if (isActive !== undefined) video.isActive = Boolean(isActive);

      return video;
    });

    res.json({ success: true, video: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Update failed' });
  }
});

router.delete('/admin/videos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.withTransaction((schema) => {
    schema.videos = schema.videos.filter((v) => v.id !== id);
  });
  res.json({ success: true });
});

// -------------------------------------------------------------
// ADMIN USERS MANAGEMENT
// -------------------------------------------------------------
router.get('/admin/users', (req: Request, res: Response) => {
  const { search, page = '1', limit = '20' } = req.query;
  const snapshot = db.getSnapshot();
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.min(100, parseInt(limit as string, 10) || 20);
  const searchTerm = ((search as string) || '').toLowerCase().trim();

  let filtered = snapshot.users;
  if (searchTerm) {
    filtered = filtered.filter(
      (u) =>
        u.name.toLowerCase().includes(searchTerm) ||
        u.phone.includes(searchTerm) ||
        u.id.toLowerCase().includes(searchTerm) ||
        u.referralCode.toLowerCase().includes(searchTerm)
    );
  }

  const total = filtered.length;
  const offset = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(offset, offset + pageSize).map((u) => {
    const directActiveCount = snapshot.users.filter((ref) => ref.referredBy === u.id && ref.isActive).length;
    const teamBonusTotal = snapshot.teamBonuses
      .filter((tb) => tb.leaderId === u.id)
      .reduce((sum, tb) => sum + tb.amount, 0);

    const { passwordHash: _, ...safe } = u;
    return {
      ...safe,
      activatedReferralCount: directActiveCount,
      teamBonusEarned: teamBonusTotal,
    };
  });

  res.json({ users: paginated, total, page: pageNum, pageSize });
});

// View specific user history for admin
router.get('/admin/users/:id/history', (req: Request, res: Response) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();

  const userHistory = snapshot.history
    .filter((h) => h.userId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((h) => ({
      ...h,
      bangladeshTime: formatBangladeshDateTime(h.createdAt),
    }));

  res.json({ history: userHistory });
});

// Admin balance add / deduct
router.post('/admin/users/:id/balance', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, amount, reason } = req.body;

  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  try {
    const updated = await db.withTransaction(async (schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');

      if (action === 'deduct') {
        if (numAmount > user.balance) {
          throw new Error('Cannot deduct more than user current balance / অ্যাকাউন্টের চেয়ে বেশি টাকা কাটা যাবে না');
        }
        user.balance -= numAmount;
      } else if (action === 'add') {
        user.balance += numAmount;
      } else {
        throw new Error('Invalid action (must be add or deduct)');
      }

      user.updatedAt = new Date().toISOString();

      const type = action === 'add' ? 'admin_add' : 'admin_deduct';
      const titleEn = `Admin ${action === 'add' ? 'Added' : 'Deducted'} ৳${numAmount}${reason ? ` (${reason})` : ''}`;
      const titleBn = `অ্যাডমিন ব্যালেন্স ${action === 'add' ? 'যোগ করেছেন' : 'কেটেছেন'}: ৳${numAmount}${reason ? ` (${reason})` : ''}`;

      schema.history.unshift({
        id: `hist-admin-${Date.now()}`,
        userId: user.id,
        type,
        titleEn,
        titleBn,
        amount: action === 'add' ? numAmount : -numAmount,
        status: 'completed',
        createdAt: new Date().toISOString(),
      });

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: `Balance ${action === 'add' ? 'Credited' : 'Debited'}`,
        titleBn: `ব্যালেন্স ${action === 'add' ? 'যোগ হয়েছে' : 'কাটা হয়েছে'}`,
        messageEn: `Admin ${action === 'add' ? 'added' : 'deducted'} ৳${numAmount}. ${reason || ''}`,
        messageBn: `অ্যাডমিন ৳${numAmount} ${action === 'add' ? 'যোগ করেছেন' : 'কেটেছেন'}। ${reason || ''}`,
        type: 'admin',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      const { passwordHash: _, ...safe } = user;
      return safe;
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Balance update failed' });
  }
});

// Admin change category
router.post('/admin/users/:id/category', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category } = req.body;

  if (!category || !['A', 'B', 'C'].includes(category)) {
    return res.status(400).json({ error: 'Valid category required (A, B, C)' });
  }

  try {
    const updated = await db.withTransaction((schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');

      user.category = category as CategoryType;
      user.updatedAt = new Date().toISOString();

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: 'Category Updated by Admin',
        titleBn: 'অ্যাডমিন আপনার ক্যাটাগরি পরিবর্তন করেছেন',
        messageEn: `Your category has been updated to Category ${category}.`,
        messageBn: `আপনার ক্যাটাগরি পরিবর্তন করে ক্যাটাগরি ${category} করা হয়েছে।`,
        type: 'admin',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      const { passwordHash: _, ...safe } = user;
      return safe;
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Category update failed' });
  }
});

// Admin block / unblock
router.post('/admin/users/:id/block', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const updated = await db.withTransaction((schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error('User not found');

      user.isBlocked = !user.isBlocked;
      user.updatedAt = new Date().toISOString();

      const { passwordHash: _, ...safe } = user;
      return safe;
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Block update failed' });
  }
});

// Admin activate user directly (1-click from user management)
router.post('/admin/users/:id/activate', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { category = 'B' } = req.body;
  const today = getBangladeshDateString();

  try {
    const updated = await db.withTransaction((schema) => {
      let user = schema.users.find((u) => u.id === id);
      if (!user) {
        user = db.ensureUserExists({ id });
      }

      user.isActive = true;
      user.category = (category || user.category || 'B') as CategoryType;
      user.activatedAt = user.activatedAt || new Date().toISOString();
      const initialDays = schema.settings.work_days || 5;
      user.initialWorkUntil = addDaysToBangladeshDate(today, initialDays - 1);
      user.workUntil = user.initialWorkUntil;
      user.referralsTowardsWork = 0;
      user.totalReferralsAfterInitial = 0;
      user.updatedAt = new Date().toISOString();

      markUserActiveInStore(user.id, user.category, user.workUntil, user.activatedAt);

      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: 'Account Activated by Admin',
        titleBn: 'অ্যাডমিন আপনার অ্যাকাউন্ট সক্রিয় করেছেন',
        messageEn: `Your Category ${user.category} ID has been activated by admin with 5 days of work.`,
        messageBn: `অ্যাডমিন আপনার ক্যাটাগরি ${user.category} আইডি সক্রিয় করেছেন (প্রাথমিক ৫ দিন কাজ করতে পারবেন)।`,
        type: 'activation',
        isRead: false,
        createdAt: new Date().toISOString(),
      });

      const { passwordHash: _, ...safe } = user;
      return safe;
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Activation failed' });
  }
});

// -------------------------------------------------------------
// ADMIN SETTINGS
// -------------------------------------------------------------
router.get('/admin/settings', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({ settings: snapshot.settings });
});

router.put('/admin/settings', async (req: Request, res: Response) => {
  const updates = req.body;

  try {
    const updated = await db.withTransaction((schema) => {
      schema.settings = {
        ...schema.settings,
        ...updates,
      };
      return schema.settings;
    });

    res.json({ success: true, settings: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Settings update failed' });
  }
});

// -------------------------------------------------------------
// ADMIN TEAM LEADERS & AUDIT
// -------------------------------------------------------------
router.get('/admin/team-leaders', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();

  const leaders = snapshot.users
    .filter((u) => u.isTeamLeader)
    .map((l) => {
      const directActive = snapshot.users.filter((ref) => ref.referredBy === l.id && ref.isActive);
      const totalBonus = snapshot.teamBonuses
        .filter((tb) => tb.leaderId === l.id)
        .reduce((sum, tb) => sum + tb.amount, 0);

      const members = snapshot.users
        .filter((ref) => ref.referredBy === l.id)
        .map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          category: m.category,
          isActive: m.isActive,
          createdAt: m.createdAt,
        }));

      return {
        id: l.id,
        name: l.name,
        phone: l.phone,
        category: l.category,
        isActive: l.isActive,
        directActivatedCount: directActive.length,
        totalTeamBonus: totalBonus,
        membersCount: members.length,
        members,
      };
    });

  const totalBonusesPaid = snapshot.teamBonuses.reduce((sum, tb) => sum + tb.amount, 0);
  const today = getBangladeshDateString();
  const bonusesToday = snapshot.teamBonuses
    .filter((tb) => tb.createdAt.startsWith(today))
    .reduce((sum, tb) => sum + tb.amount, 0);

  res.json({
    leaders,
    summary: {
      totalBonusesPaid,
      totalLeaders: leaders.length,
      bonusesToday,
    },
  });
});

// -------------------------------------------------------------
// ADMIN BROADCASTS
// -------------------------------------------------------------
router.get('/admin/broadcasts', (req: Request, res: Response) => {
  const snapshot = db.getSnapshot();
  res.json({ broadcasts: snapshot.broadcasts });
});

router.post('/admin/broadcasts', async (req: Request, res: Response) => {
  const { titleEn, titleBn, messageEn, messageBn } = req.body;
  if (!titleEn || !messageEn) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  const newBroadcast = await db.withTransaction((schema) => {
    const bc: Broadcast = {
      id: `bc-${Date.now()}`,
      titleEn,
      titleBn: titleBn || titleEn,
      messageEn,
      messageBn: messageBn || messageEn,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    schema.broadcasts.unshift(bc);
    return bc;
  });

  res.json({ success: true, broadcast: newBroadcast });
});

router.delete('/admin/broadcasts/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  await db.withTransaction((schema) => {
    schema.broadcasts = schema.broadcasts.filter((b) => b.id !== id);
  });
  res.json({ success: true });
});

export default router;
