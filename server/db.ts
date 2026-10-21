import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import seedDatabase from '../data/db.json';
import seedActiveUsers from '../data/active_users.json';
import {
  User,
  Video,
  WatchSession,
  VideoSubmission,
  DailyEarning,
  ActivationRequest,
  WithdrawRequest,
  TeamBonus,
  HistoryRecord,
  AppNotification,
  SystemSettings,
  Broadcast,
  CategoryType,
} from './types';
import { getBangladeshDateString, addDaysToBangladeshDate } from './dateUtils';

export interface DatabaseSchema {
  users: User[];
  videos: Video[];
  watchSessions: WatchSession[];
  videoSubmissions: VideoSubmission[];
  dailyEarnings: DailyEarning[];
  activationRequests: ActivationRequest[];
  withdrawRequests: WithdrawRequest[];
  teamBonuses: TeamBonus[];
  history: HistoryRecord[];
  notifications: AppNotification[];
  settings: SystemSettings;
  broadcasts: Broadcast[];
}

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
const DATA_DIR = isServerless
  ? path.resolve('/tmp', 'earn_app_data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');
const ACTIVE_USERS_FILE = path.resolve(DATA_DIR, 'active_users.json');

interface ActiveUsersRecord {
  activeUserIds: string[];
  userActiveDetails: Record<
    string,
    { isActive: boolean; category?: CategoryType | null; workUntil?: string | null; activatedAt?: string | null }
  >;
}

export const activeUsersStore: ActiveUsersRecord = {
  activeUserIds: ['1001', '1002'],
  userActiveDetails: {
    '1001': { isActive: true, category: 'C', workUntil: '2030-12-31' },
    '1002': { isActive: true, category: 'B', workUntil: '2026-10-30' },
  },
};

function initActiveUsersStore() {
  try {
    if (seedActiveUsers && typeof seedActiveUsers === 'object') {
      const s = seedActiveUsers as any;
      if (Array.isArray(s.activeUserIds)) {
        activeUsersStore.activeUserIds = Array.from(new Set([...activeUsersStore.activeUserIds, ...s.activeUserIds]));
      }
      if (s.userActiveDetails) {
        activeUsersStore.userActiveDetails = { ...activeUsersStore.userActiveDetails, ...s.userActiveDetails };
      }
    }

    if (fs.existsSync(ACTIVE_USERS_FILE)) {
      const content = fs.readFileSync(ACTIVE_USERS_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data.activeUserIds)) {
        activeUsersStore.activeUserIds = Array.from(new Set([...activeUsersStore.activeUserIds, ...data.activeUserIds]));
      }
      if (data.userActiveDetails) {
        activeUsersStore.userActiveDetails = { ...activeUsersStore.userActiveDetails, ...data.userActiveDetails };
      }
    }
  } catch (err) {
    console.error('Failed to init active users store:', err);
  }
}

initActiveUsersStore();

export function markUserActiveInStore(
  userId: string,
  category: CategoryType = 'B',
  workUntil?: string | null,
  activatedAt?: string | null
) {
  if (!activeUsersStore.activeUserIds.includes(userId)) {
    activeUsersStore.activeUserIds.push(userId);
  }
  activeUsersStore.userActiveDetails[userId] = {
    isActive: true,
    category,
    workUntil: workUntil || '2026-10-30',
    activatedAt: activatedAt || new Date().toISOString(),
  };

  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ACTIVE_USERS_FILE, JSON.stringify(activeUsersStore, null, 2), 'utf-8');
  } catch {}
}

const DEFAULT_SETTINGS: SystemSettings = {
  payment_number_bkash: '01604606880',
  payment_number_nagad: '01604606880',
  payment_number_rocket: '01604606880',
  fee_category_a: 500,
  fee_category_b: 1000,
  fee_category_c: 1500,
  limit_category_a: 50,
  limit_category_b: 100,
  limit_category_c: 150,
  min_withdraw: 200,
  ref_join: 1,
  ref_active: 100,
  work_days: 5,
  w1_days: 2,
  w2_days: 3,
  w3_days: 4,
  team_size: 20,
  t1_bonus: 10,
  t2_bonus: 20,
  t3_bonus: 30,
  watch_seconds: 15,
};

class DatabaseManager {
  private data: DatabaseSchema;
  private writeLock: Promise<void> = Promise.resolve();

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // In serverless /tmp environment, populate from bundled data/db.json seed
      if (!fs.existsSync(DB_FILE)) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(seedDatabase, null, 2), 'utf-8');
        } catch (e) {
          console.warn('Could not write seed database to DATA_DIR:', e);
        }
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure defaults are merged
        parsed.settings = { ...DEFAULT_SETTINGS, ...(parsed.settings || {}) };
        this.mergeActiveUsers(parsed);
        return parsed;
      }
    } catch (err) {
      console.error('Error loading db file, falling back to seed:', err);
    }

    // Direct fallback from bundled seed
    try {
      const fallback = JSON.parse(JSON.stringify(seedDatabase));
      fallback.settings = { ...DEFAULT_SETTINGS, ...(fallback.settings || {}) };
      this.mergeActiveUsers(fallback);
      return fallback as DatabaseSchema;
    } catch {
      return this.createInitialData();
    }
  }

  public mergeActiveUsers(schema: DatabaseSchema): void {
    if (!schema || !Array.isArray(schema.users)) return;
    for (const [userId, details] of Object.entries(activeUsersStore.userActiveDetails)) {
      const user = schema.users.find((u) => u.id === userId);
      if (user) {
        user.isActive = true;
        if (details.category && !user.category) user.category = details.category;
        if (details.workUntil && (!user.workUntil || user.workUntil < details.workUntil)) {
          user.workUntil = details.workUntil;
        }
        if (details.activatedAt && !user.activatedAt) {
          user.activatedAt = details.activatedAt;
        }
      }
    }
  }

  private createInitialData(): DatabaseSchema {
    const initialVideos: Video[] = [
      {
        id: 'vid-1',
        title: 'Earn App Platform Overview & Guidelines',
        titleBn: 'আর্ন অ্যাপ পরিচিতি এবং কাজের নিয়মাবলী',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        reward: 10,
        categoryRequired: 'ALL',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'vid-2',
        title: 'Digital Bangladesh Freelance Income Strategies',
        titleBn: 'ডিজিটাল বাংলাদেশ ফ্রিল্যান্সিং আয় কৌশল',
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        reward: 15,
        categoryRequired: 'ALL',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'vid-3',
        title: 'Mobile Banking & Transaction Security In BD',
        titleBn: 'মোবাইল ব্যাংকিং লেনদেনের নিরাপত্তা টিপস',
        url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
        reward: 20,
        categoryRequired: 'ALL',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
      {
        id: 'vid-4',
        title: 'Smart E-Commerce Product Research BD',
        titleBn: 'স্মার্ট ই-কমার্স বিজনেস গবেষণা পদ্ধতি',
        url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ',
        reward: 25,
        categoryRequired: 'ALL',
        createdAt: new Date().toISOString(),
        isActive: true,
      },
    ];

    const initialBroadcasts: Broadcast[] = [
      {
        id: 'bc-1',
        titleEn: 'Welcome to Earn App 2026 Edition',
        titleBn: 'আর্ন অ্যাপে স্বাগতম! নিয়ম মেনে কাজ করুন ও দ্রুত উইথড্র নিন',
        messageEn: 'All withdrawals and tasks are approved daily. Stay on video for 15s to get reward.',
        messageBn: 'সকল ভিডিও কাজে ১৫ সেকেন্ড থাকতে হবে। রেফার করে টিম লিডার হয়ে অতিরিক্ত বোনাস পান।',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    const initial: DatabaseSchema = {
      users: [],
      videos: initialVideos,
      watchSessions: [],
      videoSubmissions: [],
      dailyEarnings: [],
      activationRequests: [],
      withdrawRequests: [],
      teamBonuses: [],
      history: [],
      notifications: [],
      settings: DEFAULT_SETTINGS,
      broadcasts: initialBroadcasts,
    };

    this.saveData(initial);
    return initial;
  }

  private saveData(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving db file:', err);
    }
  }

  // Atomic transactional wrapper with sequential execution
  public async withTransaction<T>(callback: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
    const previousLock = this.writeLock;
    let releaseLock: () => void = () => {};
    this.writeLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    try {
      await previousLock;
      const result = await callback(this.data);
      this.saveData(this.data);
      return result;
    } finally {
      releaseLock();
    }
  }

  public ensureUserExists(partial: { id: string; phone?: string; name?: string }): User {
    const existing = this.data.users.find((u) => u.id === partial.id);
    if (existing) {
      if (activeUsersStore.activeUserIds.includes(existing.id)) {
        existing.isActive = true;
        const details = activeUsersStore.userActiveDetails[existing.id];
        if (details?.category && !existing.category) existing.category = details.category;
        if (details?.workUntil && (!existing.workUntil || existing.workUntil < details.workUntil)) {
          existing.workUntil = details.workUntil;
        }
      }
      return existing;
    }

    const isInitiallyActive = activeUsersStore.activeUserIds.includes(partial.id);
    const details = activeUsersStore.userActiveDetails[partial.id];

    const nowIso = new Date().toISOString();
    const newUser: User = {
      id: partial.id,
      name: partial.name || 'User',
      phone: partial.phone || '',
      passwordHash: '',
      category: details?.category || (isInitiallyActive ? 'B' : null),
      isActive: isInitiallyActive,
      isBlocked: false,
      balance: 0,
      referredBy: 'ADMIN',
      referralCode: `EARN${partial.id}`,
      workUntil: details?.workUntil || (isInitiallyActive ? '2026-10-30' : null),
      isTeamLeader: false,
      activatedAt: details?.activatedAt || (isInitiallyActive ? nowIso : null),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    this.data.users.push(newUser);
    this.saveData(this.data);
    return newUser;
  }

  public getSnapshot(): DatabaseSchema {
    return this.data;
  }
}

export const db = new DatabaseManager();
