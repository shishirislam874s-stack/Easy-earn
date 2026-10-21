// server/vercel.ts
import express from "express";
import cookieParser from "cookie-parser";

// server/routes.ts
import { Router } from "express";
import bcrypt from "bcryptjs";

// server/db.ts
import fs from "fs";
import path from "path";

// data/db.json
var db_default = {
  users: [
    {
      id: "1001",
      name: "Admin (slshishir)",
      phone: "01604606880",
      passwordHash: "$2b$10$IhrTempsfOE0oVG35Rre4u6/vH/aC1DIiefgGE6d/o9/E17U8H6KG",
      category: "C",
      isActive: true,
      isBlocked: false,
      balance: 1e4,
      referredBy: null,
      referralCode: "ADMIN",
      workUntil: null,
      isTeamLeader: true,
      activatedAt: "2026-10-15T09:31:42.801Z",
      createdAt: "2026-10-15T09:31:42.801Z",
      updatedAt: "2026-10-15T09:31:42.801Z"
    },
    {
      id: "1002",
      name: "Shishir",
      phone: "01621794375",
      passwordHash: "$2b$10$IhrTempsfOE0oVG35Rre4u6/vH/aC1DIiefgGE6d/o9/E17U8H6KG",
      category: "B",
      isActive: true,
      isBlocked: false,
      balance: 0,
      referredBy: "1001",
      referralCode: "EARN1002",
      workUntil: "2026-10-30",
      isTeamLeader: false,
      activatedAt: "2026-10-21T07:25:17.622Z",
      createdAt: "2026-10-21T06:00:00.000Z",
      updatedAt: "2026-10-21T07:25:17.622Z"
    }
  ],
  videos: [
    {
      id: "vid-1",
      title: "Earn App Platform Overview & Guidelines",
      titleBn: "\u0986\u09B0\u09CD\u09A8 \u0985\u09CD\u09AF\u09BE\u09AA \u09AA\u09B0\u09BF\u099A\u09BF\u09A4\u09BF \u098F\u09AC\u0982 \u0995\u09BE\u099C\u09C7\u09B0 \u09A8\u09BF\u09AF\u09BC\u09AE\u09BE\u09AC\u09B2\u09C0",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      reward: 10,
      categoryRequired: "ALL",
      createdAt: "2026-10-15T09:31:42.801Z",
      isActive: true
    },
    {
      id: "vid-2",
      title: "Digital Bangladesh Freelance Income Strategies",
      titleBn: "\u09A1\u09BF\u099C\u09BF\u099F\u09BE\u09B2 \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u09AB\u09CD\u09B0\u09BF\u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8\u09BF\u0982 \u0986\u09AF\u09BC \u0995\u09CC\u09B6\u09B2",
      url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
      reward: 15,
      categoryRequired: "ALL",
      createdAt: "2026-10-15T09:31:42.801Z",
      isActive: true
    },
    {
      id: "vid-3",
      title: "Mobile Banking & Transaction Security In BD",
      titleBn: "\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09AC\u09CD\u09AF\u09BE\u0982\u0995\u09BF\u0982 \u09B2\u09C7\u09A8\u09A6\u09C7\u09A8\u09C7\u09B0 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A4\u09CD\u09A4\u09BE \u099F\u09BF\u09AA\u09B8",
      url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
      reward: 20,
      categoryRequired: "ALL",
      createdAt: "2026-10-15T09:31:42.801Z",
      isActive: true
    },
    {
      id: "vid-4",
      title: "Smart E-Commerce Product Research BD",
      titleBn: "\u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u0987-\u0995\u09AE\u09BE\u09B0\u09CD\u09B8 \u09AC\u09BF\u099C\u09A8\u09C7\u09B8 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE \u09AA\u09A6\u09CD\u09A7\u09A4\u09BF",
      url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
      reward: 25,
      categoryRequired: "ALL",
      createdAt: "2026-10-15T09:31:42.801Z",
      isActive: true
    }
  ],
  watchSessions: [],
  videoSubmissions: [],
  dailyEarnings: [],
  activationRequests: [],
  withdrawRequests: [],
  teamBonuses: [],
  history: [],
  notifications: [],
  settings: {
    payment_number_bkash: "01604606880",
    payment_number_nagad: "01604606880",
    payment_number_rocket: "01604606880",
    fee_category_a: 500,
    fee_category_b: 1e3,
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
    watch_seconds: 15
  },
  broadcasts: [
    {
      id: "bc-1",
      titleEn: "Welcome to Earn App 2026 Edition",
      titleBn: "\u0986\u09B0\u09CD\u09A8 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE! \u09A8\u09BF\u09AF\u09BC\u09AE \u09AE\u09C7\u09A8\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09C1\u09A8 \u0993 \u09A6\u09CD\u09B0\u09C1\u09A4 \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09A8\u09BF\u09A8",
      messageEn: "All withdrawals and tasks are approved daily. Stay on video for 15s to get reward.",
      messageBn: "\u09B8\u0995\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C\u09C7 \u09E7\u09EB \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964 \u09B0\u09C7\u09AB\u09BE\u09B0 \u0995\u09B0\u09C7 \u099F\u09BF\u09AE \u09B2\u09BF\u09A1\u09BE\u09B0 \u09B9\u09DF\u09C7 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09AC\u09CB\u09A8\u09BE\u09B8 \u09AA\u09BE\u09A8\u0964",
      isActive: true,
      createdAt: "2026-10-15T09:31:42.801Z"
    }
  ]
};

// data/active_users.json
var active_users_default = {
  activeUserIds: ["1001", "1002"],
  userActiveDetails: {
    "1001": {
      isActive: true,
      category: "C",
      workUntil: "2030-12-31"
    },
    "1002": {
      isActive: true,
      category: "B",
      workUntil: "2026-10-30"
    }
  }
};

// server/db.ts
var isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
var DATA_DIR = isServerless ? path.resolve("/tmp", "earn_app_data") : path.resolve(process.cwd(), "data");
var DB_FILE = path.resolve(DATA_DIR, "db.json");
var ACTIVE_USERS_FILE = path.resolve(DATA_DIR, "active_users.json");
var activeUsersStore = {
  activeUserIds: ["1001", "1002"],
  userActiveDetails: {
    "1001": { isActive: true, category: "C", workUntil: "2030-12-31" },
    "1002": { isActive: true, category: "B", workUntil: "2026-10-30" }
  }
};
function initActiveUsersStore() {
  try {
    if (active_users_default && typeof active_users_default === "object") {
      const s = active_users_default;
      if (Array.isArray(s.activeUserIds)) {
        activeUsersStore.activeUserIds = Array.from(/* @__PURE__ */ new Set([...activeUsersStore.activeUserIds, ...s.activeUserIds]));
      }
      if (s.userActiveDetails) {
        activeUsersStore.userActiveDetails = { ...activeUsersStore.userActiveDetails, ...s.userActiveDetails };
      }
    }
    if (fs.existsSync(ACTIVE_USERS_FILE)) {
      const content = fs.readFileSync(ACTIVE_USERS_FILE, "utf-8");
      const data = JSON.parse(content);
      if (Array.isArray(data.activeUserIds)) {
        activeUsersStore.activeUserIds = Array.from(/* @__PURE__ */ new Set([...activeUsersStore.activeUserIds, ...data.activeUserIds]));
      }
      if (data.userActiveDetails) {
        activeUsersStore.userActiveDetails = { ...activeUsersStore.userActiveDetails, ...data.userActiveDetails };
      }
    }
  } catch (err) {
    console.error("Failed to init active users store:", err);
  }
}
initActiveUsersStore();
function markUserActiveInStore(userId, category = "B", workUntil, activatedAt) {
  if (!activeUsersStore.activeUserIds.includes(userId)) {
    activeUsersStore.activeUserIds.push(userId);
  }
  activeUsersStore.userActiveDetails[userId] = {
    isActive: true,
    category,
    workUntil: workUntil || "2026-10-30",
    activatedAt: activatedAt || (/* @__PURE__ */ new Date()).toISOString()
  };
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(ACTIVE_USERS_FILE, JSON.stringify(activeUsersStore, null, 2), "utf-8");
  } catch {
  }
}
var DEFAULT_SETTINGS = {
  payment_number_bkash: "01604606880",
  payment_number_nagad: "01604606880",
  payment_number_rocket: "01604606880",
  fee_category_a: 500,
  fee_category_b: 1e3,
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
  watch_seconds: 15
};
var DatabaseManager = class {
  constructor() {
    this.writeLock = Promise.resolve();
    this.data = this.loadOrInitialize();
  }
  loadOrInitialize() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        try {
          fs.writeFileSync(DB_FILE, JSON.stringify(db_default, null, 2), "utf-8");
        } catch (e) {
          console.warn("Could not write seed database to DATA_DIR:", e);
        }
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        parsed.settings = { ...DEFAULT_SETTINGS, ...parsed.settings || {} };
        this.mergeActiveUsers(parsed);
        return parsed;
      }
    } catch (err) {
      console.error("Error loading db file, falling back to seed:", err);
    }
    try {
      const fallback = JSON.parse(JSON.stringify(db_default));
      fallback.settings = { ...DEFAULT_SETTINGS, ...fallback.settings || {} };
      this.mergeActiveUsers(fallback);
      return fallback;
    } catch {
      return this.createInitialData();
    }
  }
  mergeActiveUsers(schema) {
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
  createInitialData() {
    const initialVideos = [
      {
        id: "vid-1",
        title: "Earn App Platform Overview & Guidelines",
        titleBn: "\u0986\u09B0\u09CD\u09A8 \u0985\u09CD\u09AF\u09BE\u09AA \u09AA\u09B0\u09BF\u099A\u09BF\u09A4\u09BF \u098F\u09AC\u0982 \u0995\u09BE\u099C\u09C7\u09B0 \u09A8\u09BF\u09AF\u09BC\u09AE\u09BE\u09AC\u09B2\u09C0",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        reward: 10,
        categoryRequired: "ALL",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true
      },
      {
        id: "vid-2",
        title: "Digital Bangladesh Freelance Income Strategies",
        titleBn: "\u09A1\u09BF\u099C\u09BF\u099F\u09BE\u09B2 \u09AC\u09BE\u0982\u09B2\u09BE\u09A6\u09C7\u09B6 \u09AB\u09CD\u09B0\u09BF\u09B2\u09CD\u09AF\u09BE\u09A8\u09CD\u09B8\u09BF\u0982 \u0986\u09AF\u09BC \u0995\u09CC\u09B6\u09B2",
        url: "https://www.youtube.com/watch?v=kJQP7kiw5Fk",
        reward: 15,
        categoryRequired: "ALL",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true
      },
      {
        id: "vid-3",
        title: "Mobile Banking & Transaction Security In BD",
        titleBn: "\u09AE\u09CB\u09AC\u09BE\u0987\u09B2 \u09AC\u09CD\u09AF\u09BE\u0982\u0995\u09BF\u0982 \u09B2\u09C7\u09A8\u09A6\u09C7\u09A8\u09C7\u09B0 \u09A8\u09BF\u09B0\u09BE\u09AA\u09A4\u09CD\u09A4\u09BE \u099F\u09BF\u09AA\u09B8",
        url: "https://www.youtube.com/watch?v=fJ9rUzIMcZQ",
        reward: 20,
        categoryRequired: "ALL",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true
      },
      {
        id: "vid-4",
        title: "Smart E-Commerce Product Research BD",
        titleBn: "\u09B8\u09CD\u09AE\u09BE\u09B0\u09CD\u099F \u0987-\u0995\u09AE\u09BE\u09B0\u09CD\u09B8 \u09AC\u09BF\u099C\u09A8\u09C7\u09B8 \u0997\u09AC\u09C7\u09B7\u09A3\u09BE \u09AA\u09A6\u09CD\u09A7\u09A4\u09BF",
        url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ",
        reward: 25,
        categoryRequired: "ALL",
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        isActive: true
      }
    ];
    const initialBroadcasts = [
      {
        id: "bc-1",
        titleEn: "Welcome to Earn App 2026 Edition",
        titleBn: "\u0986\u09B0\u09CD\u09A8 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE! \u09A8\u09BF\u09AF\u09BC\u09AE \u09AE\u09C7\u09A8\u09C7 \u0995\u09BE\u099C \u0995\u09B0\u09C1\u09A8 \u0993 \u09A6\u09CD\u09B0\u09C1\u09A4 \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09A8\u09BF\u09A8",
        messageEn: "All withdrawals and tasks are approved daily. Stay on video for 15s to get reward.",
        messageBn: "\u09B8\u0995\u09B2 \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C\u09C7 \u09E7\u09EB \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09A5\u09BE\u0995\u09A4\u09C7 \u09B9\u09AC\u09C7\u0964 \u09B0\u09C7\u09AB\u09BE\u09B0 \u0995\u09B0\u09C7 \u099F\u09BF\u09AE \u09B2\u09BF\u09A1\u09BE\u09B0 \u09B9\u09DF\u09C7 \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09AC\u09CB\u09A8\u09BE\u09B8 \u09AA\u09BE\u09A8\u0964",
        isActive: true,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      }
    ];
    const initial = {
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
      broadcasts: initialBroadcasts
    };
    this.saveData(initial);
    return initial;
  }
  saveData(data) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("Error saving db file:", err);
    }
  }
  // Atomic transactional wrapper with sequential execution
  async withTransaction(callback) {
    const previousLock = this.writeLock;
    let releaseLock = () => {
    };
    this.writeLock = new Promise((resolve) => {
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
  ensureUserExists(partial) {
    const existing = this.data.users.find((u) => u.id === partial.id);
    if (existing) {
      if (activeUsersStore.activeUserIds.includes(existing.id)) {
        existing.isActive = true;
        const details2 = activeUsersStore.userActiveDetails[existing.id];
        if (details2?.category && !existing.category) existing.category = details2.category;
        if (details2?.workUntil && (!existing.workUntil || existing.workUntil < details2.workUntil)) {
          existing.workUntil = details2.workUntil;
        }
      }
      return existing;
    }
    const isInitiallyActive = activeUsersStore.activeUserIds.includes(partial.id);
    const details = activeUsersStore.userActiveDetails[partial.id];
    const nowIso = (/* @__PURE__ */ new Date()).toISOString();
    const newUser = {
      id: partial.id,
      name: partial.name || "User",
      phone: partial.phone || "",
      passwordHash: "",
      category: details?.category || (isInitiallyActive ? "B" : null),
      isActive: isInitiallyActive,
      isBlocked: false,
      balance: 0,
      referredBy: "ADMIN",
      referralCode: `EARN${partial.id}`,
      workUntil: details?.workUntil || (isInitiallyActive ? "2026-10-30" : null),
      isTeamLeader: false,
      activatedAt: details?.activatedAt || (isInitiallyActive ? nowIso : null),
      createdAt: nowIso,
      updatedAt: nowIso
    };
    this.data.users.push(newUser);
    this.saveData(this.data);
    return newUser;
  }
  getSnapshot() {
    return this.data;
  }
};
var db = new DatabaseManager();

// server/auth.ts
import crypto from "crypto";
import fs2 from "fs";
import path2 from "path";

// data/sessions.json
var sessions_default = { userSessions: { "7c39facf20149638fa8a7bb644a26d445b2128f9542f36f8095da94eaa3dd8d3": { userId: "1002", lastActivity: 1792057682855 }, "09a18ef71757bed57cb6290c7527cf5c915dfe2fc19f19217be5981d8fe1786c": { userId: "1002", lastActivity: 1792549091238 }, "4b1f2d4d5a2826fea20eef220efe9881ccf19a2c5d3464b1557efc54a3bb9b6b": { userId: "1002", lastActivity: 1792550223227 }, "22ca727c0d709075e3dfd98bc4aa98dcc476aa814e9af52eec9d29a7e668aafd": { userId: "1002", lastActivity: 1792552154336 }, "5590673f964179bcfd95bd3a8ed11839baa6a8de724824fa8f60270be02cee77": { userId: "1001", lastActivity: 1792553437124 }, "499a8385ce09e56aad107280286fcf958ed49329e71b7314cf9e37fdc6e1dd4d": { userId: "1002", lastActivity: 1792553442745 } }, adminSessions: { db55f8cc2ba4a091935aa80bd30fc465138efbc2a03532664461e7a7c405e700: { isAdmin: true, lastActivity: 1792548946598 }, "5a8a480f933eedd332ab85aba8c9e13e7834103edf483a95de0efbf2e3460439": { isAdmin: true, lastActivity: 1792552141226 }, "06c916259f9746856a8219b0beba7bfd1382f51b89edb70fdf32622ee079e76d": { isAdmin: true, lastActivity: 1792552231429 } } };

// server/auth.ts
var ADMIN_USERNAME = process.env.ADMIN_USERNAME || "slshishir";
var ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "#FFHUDT6O3jojE8uJPo7eO";
var SESSION_SECRET = process.env.SESSION_SECRET || "earn_app_default_session_secret_2026_xyz";
var adminFailedAttempts = /* @__PURE__ */ new Map();
function checkAdminRateLimit(ip) {
  const info = adminFailedAttempts.get(ip);
  if (!info) return { isLocked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (info.lockedUntil > now) {
    const remainingSeconds = Math.ceil((info.lockedUntil - now) / 1e3);
    return { isLocked: true, remainingSeconds };
  }
  if (info.lockedUntil <= now && info.count >= 5) {
    adminFailedAttempts.delete(ip);
    return { isLocked: false, remainingSeconds: 0 };
  }
  return { isLocked: false, remainingSeconds: 0 };
}
function recordAdminLoginAttempt(ip, success) {
  if (success) {
    adminFailedAttempts.delete(ip);
    return;
  }
  const now = Date.now();
  const info = adminFailedAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  info.count += 1;
  if (info.count >= 5) {
    info.lockedUntil = now + 5 * 60 * 1e3;
  }
  adminFailedAttempts.set(ip, info);
}
var userSessions = /* @__PURE__ */ new Map();
var adminSessions = /* @__PURE__ */ new Map();
var isServerless2 = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY);
var DATA_DIR2 = isServerless2 ? path2.resolve("/tmp", "earn_app_data") : path2.resolve(process.cwd(), "data");
var SESSIONS_FILE = path2.resolve(DATA_DIR2, "sessions.json");
function initSessionsPersistence() {
  try {
    if (sessions_default && typeof sessions_default === "object") {
      const s = sessions_default;
      if (s.userSessions) {
        for (const [k, v] of Object.entries(s.userSessions)) {
          userSessions.set(k, v);
        }
      }
      if (s.adminSessions) {
        for (const [k, v] of Object.entries(s.adminSessions)) {
          adminSessions.set(k, v);
        }
      }
    }
    if (!fs2.existsSync(DATA_DIR2)) {
      try {
        fs2.mkdirSync(DATA_DIR2, { recursive: true });
      } catch {
      }
    }
    if (fs2.existsSync(SESSIONS_FILE)) {
      const content = fs2.readFileSync(SESSIONS_FILE, "utf-8");
      const data = JSON.parse(content);
      if (data && data.userSessions) {
        for (const [k, v] of Object.entries(data.userSessions)) {
          userSessions.set(k, v);
        }
      }
      if (data && data.adminSessions) {
        for (const [k, v] of Object.entries(data.adminSessions)) {
          adminSessions.set(k, v);
        }
      }
    }
  } catch (err) {
    console.error("Failed to load session persistence:", err);
  }
}
initSessionsPersistence();
function persistSessions() {
  try {
    const userObj = {};
    const adminObj = {};
    for (const [k, v] of userSessions.entries()) userObj[k] = v;
    for (const [k, v] of adminSessions.entries()) adminObj[k] = v;
    fs2.writeFileSync(SESSIONS_FILE, JSON.stringify({ userSessions: userObj, adminSessions: adminObj }));
  } catch (err) {
    console.error("Failed to save session persistence:", err);
  }
}
function signToken(payload) {
  const jsonStr = JSON.stringify(payload);
  const data = Buffer.from(jsonStr).toString("base64url");
  const hmac = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}
function verifyToken(token) {
  if (!token || typeof token !== "string") return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const data = token.substring(0, dotIndex);
  const signature = token.substring(dotIndex + 1);
  if (!data || !signature) return null;
  try {
    const expectedHmac = crypto.createHmac("sha256", SESSION_SECRET).update(data).digest("base64url");
    if (signature.length !== expectedHmac.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedHmac))) return null;
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
function createAdminSession() {
  const token = signToken({
    userId: "admin",
    role: "admin",
    exp: Date.now() + 24 * 60 * 60 * 1e3,
    // 24 hours
    iat: Date.now()
  });
  adminSessions.set(token, {
    isAdmin: true,
    lastActivity: Date.now()
  });
  persistSessions();
  return token;
}
function createUserSession(userId, phone = "", name = "") {
  const token = signToken({
    userId,
    phone,
    name,
    role: "user",
    exp: Date.now() + 30 * 24 * 60 * 60 * 1e3,
    // 30 days
    iat: Date.now()
  });
  userSessions.set(token, {
    userId,
    phone,
    name,
    lastActivity: Date.now()
  });
  persistSessions();
  return token;
}
function verifyAdminPassword(inputUsername, inputPass) {
  if (inputUsername.trim() !== ADMIN_USERNAME.trim()) {
    return false;
  }
  const inputBuffer = Buffer.from(inputPass);
  const targetBuffer = Buffer.from(ADMIN_PASSWORD);
  if (inputBuffer.length !== targetBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(inputBuffer, targetBuffer);
}
function userAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = req.headers["x-session-token"];
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_user_session;
  }
  let userId = null;
  let verifiedPayload = null;
  let cachedSession;
  if (token) {
    cachedSession = userSessions.get(token);
    if (cachedSession && cachedSession.userId) {
      userId = cachedSession.userId;
      cachedSession.lastActivity = Date.now();
      userSessions.set(token, cachedSession);
    }
    if (!userId) {
      verifiedPayload = verifyToken(token);
      if (verifiedPayload && verifiedPayload.userId && verifiedPayload.role === "user") {
        userId = verifiedPayload.userId;
        userSessions.set(token, {
          userId,
          phone: verifiedPayload.phone,
          name: verifiedPayload.name,
          lastActivity: Date.now()
        });
      }
    }
  }
  if (!userId) {
    const headerUserId = req.headers["x-user-id"];
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
  if (!user && userId) {
    if (!verifiedPayload && token) {
      verifiedPayload = verifyToken(token);
    }
    const defaultName = userId === "1001" ? "Admin" : userId === "1002" ? "Shishir" : "User";
    const defaultPhone = userId === "1001" ? "01604606880" : userId === "1002" ? "01621794375" : "";
    user = db.ensureUserExists({
      id: userId,
      phone: verifiedPayload?.phone || cachedSession?.phone || req.body && req.body.userPhone || defaultPhone,
      name: verifiedPayload?.name || cachedSession?.name || req.body && req.body.userName || defaultName
    });
  }
  if (user && !user.isBlocked) {
    req.user = user;
    if (token) req.userSessionToken = token;
  }
  next();
}
function requireUser(req, res, next) {
  if (!req.user) {
    const fallbackId = req.headers["x-user-id"] || req.body && req.body.userId || req.query && req.query.userId;
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === "1001" ? "Admin" : cleanId === "1002" ? "Shishir" : "User";
        const defaultPhone = cleanId === "1001" ? "01604606880" : cleanId === "1002" ? "01621794375" : "";
        u = db.ensureUserExists({
          id: cleanId,
          phone: req.body && req.body.userPhone || defaultPhone,
          name: req.body && req.body.userName || defaultName
        });
      }
      if (u && !u.isBlocked) {
        req.user = u;
      }
    }
  }
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized. Please login.",
      errorBn: "\u09B2\u0997\u0987\u09A8 \u09B8\u09C7\u09B6\u09A8 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
      code: "UNAUTHORIZED"
    });
  }
  next();
}
function requireActiveUser(req, res, next) {
  if (!req.user) {
    const fallbackId = req.headers["x-user-id"] || req.body && req.body.userId || req.query && req.query.userId;
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === "1001" ? "Admin" : cleanId === "1002" ? "Shishir" : "User";
        const defaultPhone = cleanId === "1001" ? "01604606880" : cleanId === "1002" ? "01621794375" : "";
        u = db.ensureUserExists({
          id: cleanId,
          phone: req.body && req.body.userPhone || defaultPhone,
          name: req.body && req.body.userName || defaultName
        });
      }
      if (u && !u.isBlocked) {
        req.user = u;
      }
    }
  }
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized. Please login.",
      errorBn: "\u09B2\u0997\u0987\u09A8 \u09B8\u09C7\u09B6\u09A8 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u09AC\u09BE\u09B0 \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
      code: "UNAUTHORIZED"
    });
  }
  if (!req.user.isActive) {
    return res.status(403).json({
      error: "Account not active. Activate your ID first.",
      code: "ID_INACTIVE"
    });
  }
  next();
}
function adminAuthMiddleware(req, res, next) {
  let token = req.headers["x-admin-token"];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_admin_session;
  }
  if (!token) {
    return res.status(401).json({ error: "Admin unauthorized" });
  }
  let isValidAdmin = false;
  const session = adminSessions.get(token);
  if (session && session.isAdmin) {
    session.lastActivity = Date.now();
    adminSessions.set(token, session);
    isValidAdmin = true;
  } else {
    const verified = verifyToken(token);
    if (verified && verified.role === "admin") {
      isValidAdmin = true;
      adminSessions.set(token, {
        isAdmin: true,
        lastActivity: Date.now()
      });
    }
  }
  if (!isValidAdmin) {
    res.clearCookie("earn_admin_session");
    return res.status(401).json({ error: "Admin session invalid" });
  }
  next();
}
function destroyUserSession(token) {
  userSessions.delete(token);
  persistSessions();
}
function destroyAdminSession(token) {
  adminSessions.delete(token);
  persistSessions();
}

// server/dateUtils.ts
function getBangladeshNow() {
  const now = /* @__PURE__ */ new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 6e4;
  return new Date(utc + 6 * 36e5);
}
function getBangladeshDateString(date = getBangladeshNow()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function addDaysToBangladeshDate(baseDateStr, daysToAdd) {
  const [y, m, d] = baseDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  const resY = date.getUTCFullYear();
  const resM = String(date.getUTCMonth() + 1).padStart(2, "0");
  const resD = String(date.getUTCDate()).padStart(2, "0");
  return `${resY}-${resM}-${resD}`;
}
function formatBangladeshDateTime(isoOrDate) {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const utc = d.getTime() + d.getTimezoneOffset() * 6e4;
  const bstDate = new Date(utc + 6 * 36e5);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthsBn = ["\u099C\u09BE\u09A8\u09C1", "\u09AB\u09C7\u09AC\u09CD\u09B0\u09C1", "\u09AE\u09BE\u09B0\u09CD\u099A", "\u098F\u09AA\u09CD\u09B0\u09BF\u09B2", "\u09AE\u09C7", "\u099C\u09C1\u09A8", "\u099C\u09C1\u09B2\u09BE\u0987", "\u0986\u0997\u09B8\u09CD\u099F", "\u09B8\u09C7\u09AA\u09CD\u099F\u09C7", "\u0985\u0995\u09CD\u099F\u09CB", "\u09A8\u09AD\u09C7", "\u09A1\u09BF\u09B8\u09C7"];
  const day = bstDate.getDate();
  const month = months[bstDate.getMonth()];
  const year = bstDate.getFullYear();
  let hours = bstDate.getHours();
  const minutes = String(bstDate.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const dateFormatted = `${day} ${month} ${year}`;
  const timeFormatted = `${hours}:${minutes} ${ampm}`;
  return {
    date: dateFormatted,
    time: timeFormatted,
    full: `${dateFormatted}, ${timeFormatted} BST`
  };
}

// server/routes.ts
var router = Router();
router.get("/config", (req, res) => {
  const snapshot = db.getSnapshot();
  const publicSiteUrl = process.env.PUBLIC_SITE_URL || "";
  res.json({
    settings: snapshot.settings,
    publicSiteUrl,
    categories: [
      {
        id: "A",
        nameEn: "Category A",
        nameBn: "\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF A",
        fee: snapshot.settings.fee_category_a,
        dailyLimit: snapshot.settings.limit_category_a,
        extensionDays: snapshot.settings.w1_days,
        teamBonus: snapshot.settings.t1_bonus
      },
      {
        id: "B",
        nameEn: "Category B",
        nameBn: "\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF B",
        fee: snapshot.settings.fee_category_b,
        dailyLimit: snapshot.settings.limit_category_b,
        extensionDays: snapshot.settings.w2_days,
        teamBonus: snapshot.settings.t2_bonus
      },
      {
        id: "C",
        nameEn: "Category C",
        nameBn: "\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF C",
        fee: snapshot.settings.fee_category_c,
        dailyLimit: snapshot.settings.limit_category_c,
        extensionDays: snapshot.settings.w3_days,
        teamBonus: snapshot.settings.t3_bonus
      }
    ],
    paymentMethods: [
      {
        id: "bKash",
        name: "bKash",
        nameBn: "\u09AC\u09BF\u0995\u09BE\u09B6",
        number: snapshot.settings.payment_number_bkash,
        logo: "/logos/bkash.svg",
        color: "#E2136E"
      },
      {
        id: "Nagad",
        name: "Nagad",
        nameBn: "\u09A8\u0997\u09A6",
        number: snapshot.settings.payment_number_nagad,
        logo: "/logos/nagad.svg",
        color: "#F7931E"
      },
      {
        id: "Rocket",
        name: "Rocket",
        nameBn: "\u09B0\u0995\u09C7\u099F",
        number: snapshot.settings.payment_number_rocket,
        logo: "/logos/rocket.svg",
        color: "#8E2DE2"
      }
    ]
  });
});
function normalizePhoneNumber(raw) {
  let s = (raw || "").toString().trim().replace(/[\s\-\(\)\.]/g, "");
  if (s.startsWith("+880")) {
    s = "0" + s.substring(4);
  } else if (s.startsWith("880") && s.length === 13) {
    s = "0" + s.substring(3);
  }
  return s;
}
router.post("/auth/register", async (req, res) => {
  const { name, phone, password, refCode } = req.body;
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({ error: "Please enter a valid name / \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09A8\u09BE\u09AE \u09B2\u09BF\u0996\u09C1\u09A8" });
  }
  const cleanPhone = normalizePhoneNumber(phone);
  if (cleanPhone.length < 10) {
    return res.status(400).json({ error: "Please enter a valid phone number / \u09B8\u09A0\u09BF\u0995 \u09AB\u09CB\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8" });
  }
  if (!password || typeof password !== "string" || password.length < 4) {
    return res.status(400).json({ error: "Password must be at least 4 characters / \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u0985\u09A8\u09CD\u09A4\u09A4 \u09EA \u0985\u0995\u09CD\u09B7\u09B0\u09C7\u09B0 \u09B9\u09A4\u09C7 \u09B9\u09AC\u09C7" });
  }
  try {
    const result = await db.withTransaction(async (schema) => {
      const existing = schema.users.find((u) => normalizePhoneNumber(u.phone) === cleanPhone);
      if (existing) {
        throw new Error("This phone number is already registered / \u098F\u0987 \u09AB\u09CB\u09A8 \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09DF\u09C7 \u0986\u0997\u09C7\u0987 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u0996\u09CB\u09B2\u09BE \u09B9\u09DF\u09C7\u099B\u09C7");
      }
      if (!refCode || typeof refCode !== "string" || !refCode.trim()) {
        throw new Error("\u09B0\u09C7\u099C\u09BF\u09B8\u09CD\u099F\u09CD\u09B0\u09C7\u09B6\u09A8\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u0995\u09CB\u09A1 \u09A6\u09C7\u0993\u09DF\u09BE \u09AC\u09BE\u09A7\u09CD\u09AF\u09A4\u09BE\u09AE\u09C2\u09B2\u0995 / Referral code is required to register");
      }
      const cleanRef = refCode.trim();
      const cleanRefLower = cleanRef.toLowerCase();
      const isAdminMasterRef = cleanRefLower === "admin" || cleanRefLower === "slshishir" || cleanRefLower === "earnadmin" || cleanRefLower === "earn1000";
      let referrerId = null;
      let referrerUser = null;
      if (isAdminMasterRef) {
        const adminUserInDb = schema.users.find(
          (u) => u.referralCode.toLowerCase() === "admin" || u.referralCode.toLowerCase() === "earn1001"
        );
        if (adminUserInDb) {
          referrerId = adminUserInDb.id;
          referrerUser = adminUserInDb;
        } else {
          referrerId = "ADMIN";
        }
      } else {
        const found = schema.users.find(
          (u) => u.referralCode.toLowerCase() === cleanRefLower || u.id === cleanRef
        );
        if (!found) {
          throw new Error("\u09AD\u09C1\u09B2 \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u0995\u09CB\u09A1! \u09B8\u09A0\u09BF\u0995 \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u0995\u09CB\u09A1 \u09AA\u09CD\u09B0\u09A6\u09BE\u09A8 \u0995\u09B0\u09C1\u09A8 (\u098F\u09A1\u09AE\u09BF\u09A8 \u09B0\u09C7\u09AB\u09BE\u09B0 \u0995\u09CB\u09A1: ADMIN) / Invalid referral code. (Admin code: ADMIN)");
        }
        referrerId = found.id;
        referrerUser = found;
      }
      const newId = String(schema.users.length + 1001);
      const referralCode = `EARN${newId}`;
      const passwordHash = bcrypt.hashSync(password, 10);
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      const newUser = {
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
        updatedAt: nowIso
      };
      schema.users.push(newUser);
      if (referrerUser) {
        const joinBonus = schema.settings.ref_join || 1;
        referrerUser.balance += joinBonus;
        referrerUser.updatedAt = nowIso;
        schema.history.unshift({
          id: `hist-join-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: referrerUser.id,
          type: "referral_join",
          titleEn: `Referral Join Bonus (+\u09F3${joinBonus}) from ${newUser.name}`,
          titleBn: `${newUser.name} \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u09B2\u09BF\u0982\u0995\u09C7 \u099C\u09AF\u09BC\u09C7\u09A8 \u0995\u09B0\u09BE\u09B0 \u09AC\u09CB\u09A8\u09BE\u09B8 (+\u09F3${joinBonus})`,
          amount: joinBonus,
          status: "completed",
          createdAt: nowIso
        });
        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: referrerUser.id,
          titleEn: "New Referral Joined!",
          titleBn: "\u09A8\u09A4\u09C1\u09A8 \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09C7\u099B\u09C7!",
          messageEn: `${newUser.name} joined using your referral link. +\u09F3${joinBonus} added to balance.`,
          messageBn: `${newUser.name} \u0986\u09AA\u09A8\u09BE\u09B0 \u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u09B2\u09BF\u0982\u0995\u09C7 \u099C\u09AF\u09BC\u09C7\u09A8 \u0995\u09B0\u09C7\u099B\u09C7\u0964 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8\u09C7 +\u09F3${joinBonus} \u09AF\u09CB\u0997 \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
          type: "referral",
          isRead: false,
          createdAt: nowIso
        });
      }
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: newUser.id,
        titleEn: "Welcome to Earn App!",
        titleBn: "\u0986\u09B0\u09CD\u09A8 \u0985\u09CD\u09AF\u09BE\u09AA\u09C7 \u0986\u09AA\u09A8\u09BE\u0995\u09C7 \u09B8\u09CD\u09AC\u09BE\u0997\u09A4\u09AE!",
        messageEn: "Please activate your ID from the Category menu to start earning.",
        messageBn: "\u0995\u09BE\u099C \u09B6\u09C1\u09B0\u09C1 \u0995\u09B0\u09A4\u09C7 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF \u09AE\u09C7\u09A8\u09C1 \u09A5\u09C7\u0995\u09C7 \u0986\u0987\u09A1\u09BF \u098F\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09C1\u09A8\u0964",
        type: "activation",
        isRead: false,
        createdAt: nowIso
      });
      return newUser;
    });
    const sessionToken = createUserSession(result.id, result.phone, result.name);
    res.cookie("earn_user_session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    const { passwordHash: _, ...safeUser } = result;
    return res.json({ success: true, user: safeUser, token: sessionToken });
  } catch (err) {
    return res.status(400).json({ error: err.message || "Registration failed" });
  }
});
router.post("/auth/login", async (req, res) => {
  const { phone, password } = req.body;
  const cleanPhone = normalizePhoneNumber(phone);
  if (!cleanPhone || !password) {
    return res.status(400).json({ error: "Please enter phone and password / \u09AB\u09CB\u09A8 \u0993 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1 \u09B2\u09BF\u0996\u09C1\u09A8" });
  }
  const snapshot = db.getSnapshot();
  const user = snapshot.users.find((u) => normalizePhoneNumber(u.phone) === cleanPhone);
  if (!user) {
    return res.status(401).json({ error: "User not found / \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0\u0995\u09BE\u09B0\u09C0 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF" });
  }
  if (user.isBlocked) {
    return res.status(403).json({ error: "Your account has been suspended / \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09B8\u09CD\u09A5\u0997\u09BF\u09A4 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7" });
  }
  const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
  if (!passwordMatch) {
    return res.status(401).json({ error: "Incorrect password / \u09AD\u09C1\u09B2 \u09AA\u09BE\u09B8\u0993\u09DF\u09BE\u09B0\u09CD\u09A1" });
  }
  const sessionToken = createUserSession(user.id, user.phone, user.name);
  res.cookie("earn_user_session", sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 24 * 60 * 60 * 1e3
  });
  const { passwordHash: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token: sessionToken });
});
router.post("/auth/logout", (req, res) => {
  let token = req.userSessionToken || req.headers["x-session-token"];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_user_session;
  }
  if (token) {
    destroyUserSession(token);
  }
  res.clearCookie("earn_user_session", { secure: true, sameSite: "none" });
  res.json({ success: true, message: "Logged out successfully" });
});
router.get("/auth/me", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const today = getBangladeshDateString();
  const dailyRecord = snapshot.dailyEarnings.find(
    (de) => de.userId === user.id && de.dateStr === today
  );
  const earnedToday = dailyRecord ? dailyRecord.amount : 0;
  let dailyCap = 0;
  if (user.category === "A") dailyCap = snapshot.settings.limit_category_a;
  else if (user.category === "B") dailyCap = snapshot.settings.limit_category_b;
  else if (user.category === "C") dailyCap = snapshot.settings.limit_category_c;
  const pendingSubmissions = snapshot.videoSubmissions.filter(
    (vs) => vs.userId === user.id && vs.status === "pending"
  );
  const pendingVideoRewards = pendingSubmissions.reduce((sum, s) => sum + s.reward, 0);
  const unreadNotifications = snapshot.notifications.filter(
    (n) => n.userId === user.id && !n.isRead
  ).length;
  let workDaysRemaining = 0;
  let isWorkWindowOpen = false;
  if (user.isActive && user.workUntil) {
    if (user.workUntil >= today) {
      isWorkWindowOpen = true;
      const todayDate = new Date(today);
      const untilDate = new Date(user.workUntil);
      const diffTime = untilDate.getTime() - todayDate.getTime();
      workDaysRemaining = Math.max(0, Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) + 1);
    }
  }
  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    earnedToday,
    dailyCap,
    pendingVideoRewards,
    isWorkWindowOpen,
    workDaysRemaining,
    unreadNotifications,
    todayBangladesh: today
  });
});
router.get("/referral/lookup/:code", (req, res) => {
  const code = (req.params.code || "").trim().toLowerCase();
  if (code === "admin" || code === "slshishir" || code === "earnadmin" || code === "earn1000") {
    return res.json({ found: true, name: "Admin (Official)", code: "ADMIN" });
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
router.post("/admin/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const { isLocked, remainingSeconds } = checkAdminRateLimit(ip);
  if (isLocked) {
    return res.status(429).json({
      error: `Too many failed attempts. Locked for ${remainingSeconds}s / \u0985\u09A4\u09BF\u09B0\u09BF\u0995\u09CD\u09A4 \u09AD\u09C1\u09B2 \u099A\u09C7\u09B7\u09CD\u099F\u09BE\u09B0 \u0995\u09BE\u09B0\u09A3\u09C7 ${remainingSeconds} \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u0985\u09AA\u09C7\u0995\u09CD\u09B7\u09BE \u0995\u09B0\u09C1\u09A8`,
      remainingSeconds
    });
  }
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username and password required" });
  }
  const isValid = verifyAdminPassword(username, password);
  recordAdminLoginAttempt(ip, isValid);
  if (!isValid) {
    return res.status(401).json({ error: "Invalid admin credentials / \u09AD\u09C1\u09B2 \u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09A4\u09A5\u09CD\u09AF" });
  }
  const token = createAdminSession();
  res.cookie("earn_admin_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 30 * 60 * 1e3
    // 30 mins
  });
  res.json({ success: true, message: "Admin logged in successfully", token });
});
router.post("/admin/logout", (req, res) => {
  let token = req.headers["x-admin-token"];
  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.substring(7).trim();
  }
  if (!token) {
    token = req.cookies?.earn_admin_session;
  }
  if (token) {
    destroyAdminSession(token);
  }
  res.clearCookie("earn_admin_session", { secure: true, sameSite: "none" });
  res.json({ success: true, message: "Admin logged out" });
});
router.get("/admin/me", adminAuthMiddleware, (req, res) => {
  res.json({ isAdmin: true, username: process.env.ADMIN_USERNAME || "admin" });
});
router.post("/activation/request", async (req, res) => {
  let user = req.user;
  if (!user) {
    const fallbackId = req.headers["x-user-id"] || req.body?.userId;
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot = db.getSnapshot();
      let u = snapshot.users.find((x) => x.id === cleanId);
      if (!u) {
        const defaultName = cleanId === "1001" ? "Admin" : cleanId === "1002" ? "Shishir" : "User";
        const defaultPhone = cleanId === "1001" ? "01604606880" : cleanId === "1002" ? "01621794375" : "";
        u = db.ensureUserExists({
          id: cleanId,
          phone: req.body?.userPhone || defaultPhone,
          name: req.body?.userName || defaultName
        });
      }
      if (u && !u.isBlocked) {
        user = u;
      }
    }
  }
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized. Please login.",
      errorBn: "\u09B2\u0997\u0987\u09A8 \u09B8\u09C7\u09B6\u09A8 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09AA\u09C1\u09A8\u09B0\u09BE\u09AF\u09BC \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
      code: "UNAUTHORIZED"
    });
  }
  const { category, paymentMethod, transactionId } = req.body;
  if (!category || !["A", "B", "C"].includes(category)) {
    return res.status(400).json({ error: "Invalid category / \u09B8\u09A0\u09BF\u0995 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8" });
  }
  if (!paymentMethod || !["bKash", "Nagad", "Rocket"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Invalid payment method / \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8" });
  }
  const cleanTrx = (transactionId || "").toString().trim().toUpperCase();
  if (cleanTrx.length < 4) {
    return res.status(400).json({ error: "Please enter valid Transaction ID (TrxID) / \u09B8\u09A0\u09BF\u0995 \u099F\u09CD\u09B0\u09BE\u09A8\u099C\u09C7\u0995\u09B6\u09A8 \u0986\u0987\u09A1\u09BF \u09A6\u09BF\u09A8" });
  }
  try {
    const result = await db.withTransaction(async (schema) => {
      const duplicate = schema.activationRequests.find(
        (ar) => ar.transactionId.toUpperCase() === cleanTrx
      );
      if (duplicate) {
        throw new Error("This Transaction ID has already been submitted / \u098F\u0987 \u099F\u09CD\u09B0\u09BE\u09A8\u099C\u09C7\u0995\u09B6\u09A8 \u0986\u0987\u09A1\u09BF\u099F\u09BF \u0986\u0997\u09C7\u0987 \u09AC\u09CD\u09AF\u09AC\u09B9\u09BE\u09B0 \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7");
      }
      const existingPending = schema.activationRequests.find(
        (ar) => ar.userId === user.id && ar.status === "pending"
      );
      if (existingPending) {
        throw new Error("You already have a pending activation request / \u0986\u09AA\u09A8\u09BE\u09B0 \u098F\u0995\u099F\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD\u09C7\u09B6\u09A8 \u09B0\u09BF\u0995\u09CB\u09AF\u09BC\u09C7\u09B8\u09CD\u099F \u09AA\u09C7\u09A8\u09CD\u09A1\u09BF\u0982 \u0986\u099B\u09C7");
      }
      let fee = schema.settings.fee_category_a;
      if (category === "B") fee = schema.settings.fee_category_b;
      if (category === "C") fee = schema.settings.fee_category_c;
      const newRequest = {
        id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        category,
        paymentMethod,
        transactionId: cleanTrx,
        amount: fee,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      schema.activationRequests.unshift(newRequest);
      schema.history.unshift({
        id: `hist-act-${Date.now()}`,
        userId: user.id,
        type: "activation_request",
        titleEn: `Category ${category} Activation Requested (Trx: ${cleanTrx})`,
        titleBn: `\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${category} \u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD\u09C7\u09B6\u09A8 \u0986\u09AC\u09C7\u09A6\u09A8 (\u099F\u09CD\u09B0\u09BE\u09A8\u099C\u09C7\u0995\u09B6\u09A8: ${cleanTrx})`,
        amount: fee,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return newRequest;
    });
    res.json({ success: true, request: result });
  } catch (err) {
    res.status(400).json({ error: err.message || "Activation request failed" });
  }
});
router.get("/activation/status", async (req, res) => {
  let user = req.user;
  if (!user) {
    const fallbackId = req.headers["x-user-id"] || req.query && req.query.userId;
    if (fallbackId && /^\d+$/.test(String(fallbackId).trim())) {
      const cleanId = String(fallbackId).trim();
      const snapshot2 = db.getSnapshot();
      user = snapshot2.users.find((x) => x.id === cleanId);
    }
  }
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized. Please login.",
      errorBn: "\u09B2\u0997\u0987\u09A8 \u09B8\u09C7\u09B6\u09A8 \u09AA\u09BE\u0993\u09AF\u09BC\u09BE \u09AF\u09BE\u09AF\u09BC\u09A8\u09BF\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u09AA\u09C1\u09A8\u09B0\u09BE\u09AF\u09BC \u09B2\u0997\u0987\u09A8 \u0995\u09B0\u09C1\u09A8\u0964",
      code: "UNAUTHORIZED"
    });
  }
  const snapshot = db.getSnapshot();
  const userRequests = snapshot.activationRequests.filter((ar) => ar.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const latest = userRequests[0] || null;
  res.json({
    isActive: user.isActive,
    category: user.category,
    latestRequest: latest
  });
});
router.get("/videos", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const today = getBangladeshDateString();
  if (!user.isActive) {
    return res.status(403).json({
      locked: true,
      reason: "ID_INACTIVE",
      messageEn: "Activate your ID first, then you can do all the work.",
      messageBn: "\u0995\u09BE\u099C \u0995\u09B0\u09A4\u09C7 \u0986\u0997\u09C7 \u0986\u0987\u09A1\u09BF \u098F\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09C1\u09A8\u0964 \u09A4\u09BE\u09B0\u09AA\u09B0 \u09B8\u09AC \u0995\u09BE\u099C \u0995\u09B0\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8\u0964"
    });
  }
  if (!user.workUntil || user.workUntil < today) {
    return res.status(403).json({
      locked: true,
      reason: "WORK_WINDOW_EXPIRED",
      messageEn: "Video work is locked. Refer someone and get their ID activated to continue. Category A opens 2 days, B 3 days, C 4 days.",
      messageBn: "\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09AC\u09A8\u09CD\u09A7 \u0986\u099B\u09C7\u0964 \u0995\u09BE\u099C \u099A\u09BE\u09B2\u09BE\u09A4\u09C7 \u0986\u0997\u09C7 \u0995\u09BE\u0989\u0995\u09C7 \u099C\u09AF\u09BC\u09C7\u09A8 \u0995\u09B0\u09BE\u09A8 \u0993 \u09A4\u09BE\u09B0 \u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09BE\u09A8\u0964 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF A \u09E8 \u09A6\u09BF\u09A8, B \u09E9 \u09A6\u09BF\u09A8, C \u09EA \u09A6\u09BF\u09A8 \u09B8\u09AE\u09DF \u09AC\u09BE\u09DC\u09BE\u09DF\u0964"
    });
  }
  const userSubmissions = snapshot.videoSubmissions.filter((vs) => vs.userId === user.id);
  const hiddenVideoIds = new Set(
    userSubmissions.filter((vs) => vs.status === "pending" || vs.status === "approved").map((vs) => vs.videoId)
  );
  const availableVideos = snapshot.videos.filter(
    (v) => v.isActive && !hiddenVideoIds.has(v.id)
  );
  const dailyRecord = snapshot.dailyEarnings.find(
    (de) => de.userId === user.id && de.dateStr === today
  );
  const earnedToday = dailyRecord ? dailyRecord.amount : 0;
  let dailyCap = 0;
  if (user.category === "A") dailyCap = snapshot.settings.limit_category_a;
  else if (user.category === "B") dailyCap = snapshot.settings.limit_category_b;
  else if (user.category === "C") dailyCap = snapshot.settings.limit_category_c;
  const pendingSubmissions = userSubmissions.filter((vs) => vs.status === "pending");
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
    workUntil: user.workUntil
  });
});
router.post("/videos/start", requireActiveUser, async (req, res) => {
  const user = req.user;
  const { videoId } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: "Video ID required" });
  }
  const snapshot = db.getSnapshot();
  const video = snapshot.videos.find((v) => v.id === videoId && v.isActive);
  if (!video) {
    return res.status(404).json({ error: "Video not found / \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF" });
  }
  const today = getBangladeshDateString();
  if (!user.workUntil || user.workUntil < today) {
    return res.status(403).json({ error: "Video work is locked / \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09AC\u09A8\u09CD\u09A7 \u0986\u099B\u09C7" });
  }
  await db.withTransaction((schema) => {
    schema.watchSessions = schema.watchSessions.filter(
      (s) => !(s.userId === user.id && s.videoId === videoId)
    );
    schema.watchSessions.push({
      id: `ws-${Date.now()}`,
      userId: user.id,
      videoId,
      startedAt: Date.now()
    });
  });
  res.json({
    success: true,
    startedAt: Date.now(),
    watchSeconds: snapshot.settings.watch_seconds
  });
});
router.get("/videos/session/:videoId", requireActiveUser, (req, res) => {
  const user = req.user;
  const { videoId } = req.params;
  const snapshot = db.getSnapshot();
  const session = snapshot.watchSessions.find(
    (s) => s.userId === user.id && s.videoId === videoId
  );
  if (!session) {
    return res.json({ hasSession: false });
  }
  const elapsedSeconds = Math.floor((Date.now() - session.startedAt) / 1e3);
  const remainingSeconds = Math.max(0, snapshot.settings.watch_seconds - elapsedSeconds);
  const isExpired = Date.now() - session.startedAt > 30 * 60 * 1e3;
  res.json({
    hasSession: true,
    startedAt: session.startedAt,
    elapsedSeconds,
    remainingSeconds,
    canSubmit: remainingSeconds === 0 && !isExpired
  });
});
router.post("/videos/submit", requireActiveUser, async (req, res) => {
  const user = req.user;
  const { videoId, screenshotUrl } = req.body;
  if (!videoId) {
    return res.status(400).json({ error: "Video ID required" });
  }
  if (!screenshotUrl || typeof screenshotUrl !== "string" || screenshotUrl.length < 10) {
    return res.status(400).json({ error: "Please upload a proof screenshot / \u09B8\u09CD\u0995\u09CD\u09B0\u09BF\u09A8\u09B6\u099F \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u0986\u09AA\u09B2\u09CB\u09A1 \u0995\u09B0\u09C1\u09A8" });
  }
  const today = getBangladeshDateString();
  try {
    const result = await db.withTransaction(async (schema) => {
      if (!user.workUntil || user.workUntil < today) {
        throw new Error("Video work is locked / \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09AC\u09A8\u09CD\u09A7 \u0986\u099B\u09C7");
      }
      const video = schema.videos.find((v) => v.id === videoId && v.isActive);
      if (!video) {
        throw new Error("Video not found / \u09AD\u09BF\u09A1\u09BF\u0993 \u09AA\u09BE\u0993\u09DF\u09BE \u09AF\u09BE\u09DF\u09A8\u09BF");
      }
      const existing = schema.videoSubmissions.find(
        (vs) => vs.userId === user.id && vs.videoId === videoId && (vs.status === "pending" || vs.status === "approved")
      );
      if (existing) {
        throw new Error("You have already submitted proof for this video / \u0986\u09AA\u09A8\u09BF \u0986\u0997\u09C7\u0987 \u098F\u0987 \u09AD\u09BF\u09A1\u09BF\u0993\u09B0 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u099C\u09AE\u09BE \u09A6\u09BF\u09AF\u09BC\u09C7\u099B\u09C7\u09A8");
      }
      const session = schema.watchSessions.find(
        (s) => s.userId === user.id && s.videoId === videoId
      );
      if (!session) {
        throw new Error("Please watch the video first / \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u0986\u0997\u09C7 \u09AD\u09BF\u09A1\u09BF\u0993\u099F\u09BF \u09A6\u09C7\u0996\u09C1\u09A8");
      }
      const elapsedSeconds = (Date.now() - session.startedAt) / 1e3;
      if (elapsedSeconds < schema.settings.watch_seconds) {
        throw new Error(
          `Please stay on the video for at least ${schema.settings.watch_seconds} seconds / \u09AD\u09BF\u09A1\u09BF\u0993\u09A4\u09C7 \u0985\u09A8\u09CD\u09A4\u09A4 ${schema.settings.watch_seconds} \u09B8\u09C7\u0995\u09C7\u09A8\u09CD\u09A1 \u09A5\u09BE\u0995\u09C1\u09A8`
        );
      }
      if (Date.now() - session.startedAt > 30 * 60 * 1e3) {
        throw new Error("Watch session timed out. Please watch again / \u09B8\u09C7\u09B6\u09A8\u09C7\u09B0 \u09B8\u09AE\u09AF\u09BC \u09B6\u09C7\u09B7, \u0986\u09AC\u09BE\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993\u099F\u09BF \u09A6\u09C7\u0996\u09C1\u09A8");
      }
      let dailyCap = schema.settings.limit_category_a;
      if (user.category === "B") dailyCap = schema.settings.limit_category_b;
      if (user.category === "C") dailyCap = schema.settings.limit_category_c;
      const dailyEarning = schema.dailyEarnings.find(
        (de) => de.userId === user.id && de.dateStr === today
      );
      const earnedToday = dailyEarning ? dailyEarning.amount : 0;
      const pendingSubmissions = schema.videoSubmissions.filter(
        (vs) => vs.userId === user.id && vs.status === "pending"
      );
      const pendingRewards = pendingSubmissions.reduce((sum, s) => sum + s.reward, 0);
      if (earnedToday + pendingRewards >= dailyCap) {
        throw new Error("Daily limit reached, come back tomorrow / \u09A6\u09C8\u09A8\u09BF\u0995 \u09B2\u09BF\u09AE\u09BF\u099F \u09B6\u09C7\u09B7, \u0986\u0997\u09BE\u09AE\u09C0\u0995\u09BE\u09B2 \u0986\u09AC\u09BE\u09B0 \u0986\u09B8\u09C1\u09A8\u0964");
      }
      schema.watchSessions = schema.watchSessions.filter((s) => s.id !== session.id);
      const submission = {
        id: `vsub-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        videoId: video.id,
        videoTitle: video.title,
        reward: video.reward,
        screenshotUrl,
        status: "pending",
        submittedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      schema.videoSubmissions.unshift(submission);
      schema.history.unshift({
        id: `hist-vs-${Date.now()}`,
        userId: user.id,
        type: "video_submission",
        titleEn: `Video Work Submitted: ${video.title} (\u09F3${video.reward})`,
        titleBn: `\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u099C\u09AE\u09BE \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7: ${video.titleBn || video.title} (\u09F3${video.reward})`,
        amount: video.reward,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return submission;
    });
    res.json({ success: true, submission: result });
  } catch (err) {
    res.status(400).json({ error: err.message || "Submission failed" });
  }
});
router.get("/referral", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const directReferrals = snapshot.users.filter((u) => u.referredBy === user.id);
  const activatedReferrals = directReferrals.filter((u) => u.isActive);
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
      C: snapshot.settings.w3_days
    },
    teamBonusAmounts: {
      A: snapshot.settings.t1_bonus,
      B: snapshot.settings.t2_bonus,
      C: snapshot.settings.t3_bonus
    },
    joinBonus: snapshot.settings.ref_join,
    activeBonus: snapshot.settings.ref_active
  });
});
router.get("/team", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const directReferrals = snapshot.users.filter((u) => u.referredBy === user.id);
  const activatedCount = directReferrals.filter((u) => u.isActive).length;
  const members = directReferrals.map((m) => {
    const downlineCount = snapshot.users.filter((u) => u.referredBy === m.id).length;
    return {
      id: m.id,
      name: m.name,
      category: m.category,
      isActive: m.isActive,
      joinedAt: m.createdAt,
      membersBrought: downlineCount
    };
  });
  const teamBonusHistory = snapshot.teamBonuses.filter((tb) => tb.leaderId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalTeamBonus = teamBonusHistory.reduce((sum, tb) => sum + tb.amount, 0);
  res.json({
    isTeamLeader: user.isTeamLeader,
    teamSizeTarget: snapshot.settings.team_size,
    activatedCount,
    progressPercentage: Math.min(100, Math.round(activatedCount / snapshot.settings.team_size * 100)),
    totalTeamBonus,
    bonusConfig: {
      A: snapshot.settings.t1_bonus,
      B: snapshot.settings.t2_bonus,
      C: snapshot.settings.t3_bonus
    },
    members,
    teamBonusHistory
  });
});
router.post("/withdraw/request", requireActiveUser, async (req, res) => {
  const user = req.user;
  const { paymentMethod, accountNumber, amount } = req.body;
  if (!paymentMethod || !["bKash", "Nagad", "Rocket"].includes(paymentMethod)) {
    return res.status(400).json({ error: "Invalid payment method / \u09AA\u09C7\u09AE\u09C7\u09A8\u09CD\u099F \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE \u09A8\u09BF\u09B0\u09CD\u09AC\u09BE\u099A\u09A8 \u0995\u09B0\u09C1\u09A8" });
  }
  const cleanAccount = (accountNumber || "").toString().trim();
  if (cleanAccount.length < 10) {
    return res.status(400).json({ error: "Please enter valid account number / \u09B8\u09A0\u09BF\u0995 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F \u09A8\u09AE\u09CD\u09AC\u09B0 \u09A6\u09BF\u09A8" });
  }
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Invalid withdrawal amount / \u09B8\u09A0\u09BF\u0995 \u099F\u09BE\u0995\u09BE\u09B0 \u09AA\u09B0\u09BF\u09AE\u09BE\u09A3 \u09B2\u09BF\u0996\u09C1\u09A8" });
  }
  try {
    const result = await db.withTransaction(async (schema) => {
      if (numAmount < schema.settings.min_withdraw) {
        throw new Error(
          `Minimum withdrawal is \u09F3${schema.settings.min_withdraw} / \u09B8\u09B0\u09CD\u09AC\u09A8\u09BF\u09AE\u09CD\u09A8 \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09F3${schema.settings.min_withdraw}`
        );
      }
      const currentUser = schema.users.find((u) => u.id === user.id);
      if (!currentUser || currentUser.balance < numAmount) {
        throw new Error("Insufficient balance / \u0986\u09AA\u09A8\u09BE\u09B0 \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7 \u09AA\u09B0\u09CD\u09AF\u09BE\u09AA\u09CD\u09A4 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09A8\u09C7\u0987");
      }
      currentUser.balance -= numAmount;
      currentUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const newWithdraw = {
        id: `wdr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        userName: user.name,
        userPhone: user.phone,
        paymentMethod,
        accountNumber: cleanAccount,
        amount: numAmount,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      };
      schema.withdrawRequests.unshift(newWithdraw);
      schema.history.unshift({
        id: `hist-wdr-${Date.now()}`,
        userId: user.id,
        type: "withdraw_request",
        titleEn: `Withdraw Requested via ${paymentMethod} to ${cleanAccount}`,
        titleBn: `${paymentMethod}-\u098F \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u0986\u09AC\u09C7\u09A6\u09A8 (${cleanAccount})`,
        amount: -numAmount,
        status: "pending",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return { withdraw: newWithdraw, newBalance: currentUser.balance };
    });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message || "Withdrawal request failed" });
  }
});
router.get("/withdraw/my", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const myWithdrawals = snapshot.withdrawRequests.filter((w) => w.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ withdrawals: myWithdrawals });
});
router.get("/history", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const userHistory = snapshot.history.filter((h) => h.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((h) => ({
    ...h,
    bangladeshTime: formatBangladeshDateTime(h.createdAt)
  }));
  res.json({ history: userHistory });
});
router.get("/notifications", requireUser, (req, res) => {
  const user = req.user;
  const snapshot = db.getSnapshot();
  const userNotifs = snapshot.notifications.filter((n) => n.userId === user.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json({ notifications: userNotifs });
});
router.post("/notifications/mark-read", requireUser, async (req, res) => {
  const user = req.user;
  await db.withTransaction((schema) => {
    schema.notifications.forEach((n) => {
      if (n.userId === user.id) n.isRead = true;
    });
  });
  res.json({ success: true });
});
router.get("/broadcasts", (req, res) => {
  const snapshot = db.getSnapshot();
  const active = snapshot.broadcasts.filter((b) => b.isActive);
  res.json({ broadcasts: active });
});
router.use("/admin", adminAuthMiddleware);
router.get("/admin/stats", (req, res) => {
  const snapshot = db.getSnapshot();
  const totalUsers = snapshot.users.length;
  const activatedUsers = snapshot.users.filter((u) => u.isActive).length;
  const pendingActivation = snapshot.activationRequests.filter((r) => r.status === "pending").length;
  const pendingVideo = snapshot.videoSubmissions.filter((r) => r.status === "pending").length;
  const pendingWithdraw = snapshot.withdrawRequests.filter((r) => r.status === "pending").length;
  const totalPending = pendingActivation + pendingVideo + pendingWithdraw;
  const paidWithdrawals = snapshot.withdrawRequests.filter((w) => w.status === "paid");
  const totalPaid = paidWithdrawals.reduce((sum, w) => sum + w.amount, 0);
  res.json({
    totalUsers,
    activatedUsers,
    pendingActivation,
    pendingVideo,
    pendingWithdraw,
    totalPending,
    totalPaid
  });
});
router.post("/admin/sync-active-users", async (req, res) => {
  const { activeUserIds, userActiveDetails } = req.body;
  if (Array.isArray(activeUserIds) && activeUserIds.length > 0) {
    await db.withTransaction(async (schema) => {
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
        markUserActiveInStore(u.id, u.category || "B", u.workUntil, u.activatedAt);
      }
    });
  }
  const snapshot = db.getSnapshot();
  const activatedUsers = snapshot.users.filter((u) => u.isActive).length;
  res.json({ success: true, activatedUsers });
});
router.get("/admin/requests", (req, res) => {
  const { tab, status, search, page = "1", limit = "20" } = req.query;
  const snapshot = db.getSnapshot();
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, parseInt(limit, 10) || 20);
  const searchTerm = (search || "").toLowerCase().trim();
  let items = [];
  if (tab === "activation") {
    items = snapshot.activationRequests.filter((r) => {
      if (status && status !== "all" && r.status !== status) return false;
      if (searchTerm) {
        return r.userName.toLowerCase().includes(searchTerm) || r.userId.toLowerCase().includes(searchTerm) || r.transactionId.toLowerCase().includes(searchTerm) || r.userPhone.includes(searchTerm);
      }
      return true;
    });
  } else if (tab === "video") {
    items = snapshot.videoSubmissions.filter((r) => {
      if (status && status !== "all" && r.status !== status) return false;
      if (searchTerm) {
        return r.userName.toLowerCase().includes(searchTerm) || r.userId.toLowerCase().includes(searchTerm) || r.videoTitle.toLowerCase().includes(searchTerm) || r.userPhone.includes(searchTerm);
      }
      return true;
    });
  } else if (tab === "withdraw") {
    items = snapshot.withdrawRequests.filter((r) => {
      if (status && status !== "all" && r.status !== status) return false;
      if (searchTerm) {
        return r.userName.toLowerCase().includes(searchTerm) || r.userId.toLowerCase().includes(searchTerm) || r.accountNumber.includes(searchTerm) || r.userPhone.includes(searchTerm);
      }
      return true;
    });
  } else if (tab === "team_bonuses") {
    items = snapshot.teamBonuses.filter((tb) => {
      if (searchTerm) {
        return tb.leaderName.toLowerCase().includes(searchTerm) || tb.leaderId.toLowerCase().includes(searchTerm) || tb.referrerName.toLowerCase().includes(searchTerm) || tb.activatedUserName.toLowerCase().includes(searchTerm);
      }
      return true;
    });
  }
  const pendingActivationCount = snapshot.activationRequests.filter((r) => r.status === "pending").length;
  const pendingVideoCount = snapshot.videoSubmissions.filter((r) => r.status === "pending").length;
  const pendingWithdrawCount = snapshot.withdrawRequests.filter((r) => r.status === "pending").length;
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
      withdraw: pendingWithdrawCount
    }
  });
});
router.post("/admin/activation/:id/approve", async (req, res) => {
  const { id } = req.params;
  const today = getBangladeshDateString();
  try {
    const updated = await db.withTransaction(async (schema) => {
      const request = schema.activationRequests.find((ar) => ar.id === id);
      if (!request) {
        return { id, status: "approved", message: "Request processed" };
      }
      if (request.status === "approved") {
        return request;
      }
      request.status = "approved";
      request.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
      let targetUser = schema.users.find((u) => u.id === request.userId);
      if (!targetUser) {
        targetUser = db.ensureUserExists({
          id: request.userId,
          phone: request.userPhone || "",
          name: request.userName || "User"
        });
      }
      const isFirstActivation = !targetUser.isActive;
      targetUser.isActive = true;
      targetUser.category = request.category;
      targetUser.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (isFirstActivation) {
        targetUser.activatedAt = (/* @__PURE__ */ new Date()).toISOString();
        const initialDays = schema.settings.work_days || 5;
        targetUser.workUntil = addDaysToBangladeshDate(today, initialDays - 1);
        markUserActiveInStore(targetUser.id, targetUser.category, targetUser.workUntil, targetUser.activatedAt);
        schema.history.unshift({
          id: `hist-act-app-${Date.now()}`,
          userId: targetUser.id,
          type: "activation_approved",
          titleEn: `Category ${request.category} ID Activated! (Work open until ${targetUser.workUntil})`,
          titleBn: `\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${request.category} \u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD\u09C7\u09B6\u09A8 \u09B8\u09AB\u09B2! (${targetUser.workUntil} \u09AA\u09B0\u09CD\u09AF\u09A8\u09CD\u09A4 \u0995\u09BE\u099C \u099A\u09B2\u09AC\u09C7)`,
          amount: 0,
          status: "approved",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: targetUser.id,
          titleEn: "ID Activated Successfully!",
          titleBn: "\u0986\u09AA\u09A8\u09BE\u09B0 \u0986\u0987\u09A1\u09BF \u09B8\u0995\u09CD\u09B0\u09BF\u09AF\u09BC \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!",
          messageEn: `Your Category ${request.category} ID is now active. Daily video tasks and withdrawals are unlocked!`,
          messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${request.category} \u0986\u0987\u09A1\u09BF \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u099A\u09BE\u09B2\u09C1 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u098F\u0996\u09A8 \u09AA\u09CD\u09B0\u09A4\u09BF\u09A6\u09BF\u09A8 \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u0995\u09B0\u09A4\u09C7 \u0993 \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09AC\u09C7\u09A8!`,
          type: "activation",
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        if (targetUser.referredBy) {
          const referrer = schema.users.find((u) => u.id === targetUser.referredBy);
          if (referrer) {
            const activeBonus = schema.settings.ref_active || 100;
            referrer.balance += activeBonus;
            referrer.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
            schema.history.unshift({
              id: `hist-ref-act-${Date.now()}`,
              userId: referrer.id,
              type: "referral_active",
              titleEn: `Referral ID Activation Bonus (+\u09F3${activeBonus}) from ${targetUser.name}`,
              titleBn: `${targetUser.name} \u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09BE\u09DF \u09AC\u09CB\u09A8\u09BE\u09B8 (+\u09F3${activeBonus})`,
              amount: activeBonus,
              status: "completed",
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            let extensionDays = schema.settings.w1_days;
            if (request.category === "B") extensionDays = schema.settings.w2_days;
            if (request.category === "C") extensionDays = schema.settings.w3_days;
            if (referrer.workUntil && referrer.workUntil >= today) {
              referrer.workUntil = addDaysToBangladeshDate(referrer.workUntil, extensionDays);
            } else {
              referrer.workUntil = addDaysToBangladeshDate(today, extensionDays - 1);
            }
            schema.notifications.unshift({
              id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              userId: referrer.id,
              titleEn: `Referral Activated! +\u09F3${activeBonus}`,
              titleBn: `\u09B0\u09C7\u09AB\u09BE\u09B0\u09BE\u09B2 \u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD \u09B9\u09DF\u09C7\u099B\u09C7! +\u09F3${activeBonus}`,
              messageEn: `${targetUser.name} activated Category ${request.category}. You received +\u09F3${activeBonus} and your work window extended by ${extensionDays} days!`,
              messageBn: `${targetUser.name} \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${request.category} \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964 \u0986\u09AA\u09A8\u09BF \u09AA\u09C7\u09B2\u09C7\u09A8 +\u09F3${activeBonus} \u098F\u09AC\u0982 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09BE\u099C\u09C7\u09B0 \u09AE\u09C7\u09DF\u09BE\u09A6 ${extensionDays} \u09A6\u09BF\u09A8 \u09AC\u09C3\u09A6\u09CD\u09A7\u09BF \u09AA\u09C7\u09DF\u09C7\u099B\u09C7!`,
              type: "referral",
              isRead: false,
              createdAt: (/* @__PURE__ */ new Date()).toISOString()
            });
            const directActiveCount = schema.users.filter(
              (u) => u.referredBy === referrer.id && u.isActive
            ).length;
            if (directActiveCount >= schema.settings.team_size && !referrer.isTeamLeader) {
              referrer.isTeamLeader = true;
              schema.notifications.unshift({
                id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                userId: referrer.id,
                titleEn: "Congratulations! You are now a Team Leader!",
                titleBn: "\u0985\u09AD\u09BF\u09A8\u09A8\u09CD\u09A6\u09A8! \u0986\u09AA\u09A8\u09BF \u098F\u0996\u09A8 \u098F\u0995\u099C\u09A8 \u099F\u09BF\u09AE \u09B2\u09BF\u09A1\u09BE\u09B0!",
                messageEn: `You have activated ${directActiveCount} members. You will now receive team bonuses whenever your members bring activated users!`,
                messageBn: `\u0986\u09AA\u09A8\u09BF ${directActiveCount} \u099C\u09A8 \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0 \u098F\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964 \u098F\u0996\u09A8 \u09A5\u09C7\u0995\u09C7 \u0986\u09AA\u09A8\u09BE\u09B0 \u099F\u09BF\u09AE\u09C7\u09B0 \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0\u09B0\u09BE \u0995\u09BE\u0989\u0995\u09C7 \u099C\u09DF\u09C7\u09A8 \u0995\u09B0\u09BE\u09B2\u09C7 \u0986\u09AA\u09A8\u09BF \u099F\u09BF\u09AE \u09AC\u09CB\u09A8\u09BE\u09B8 \u09AA\u09BE\u09AC\u09C7\u09A8!`,
                type: "team",
                isRead: false,
                createdAt: (/* @__PURE__ */ new Date()).toISOString()
              });
            }
            if (referrer.referredBy) {
              const leader = schema.users.find((u) => u.id === referrer.referredBy);
              if (leader && leader.isTeamLeader && leader.isActive) {
                let teamBonusAmount = schema.settings.t1_bonus;
                if (request.category === "B") teamBonusAmount = schema.settings.t2_bonus;
                if (request.category === "C") teamBonusAmount = schema.settings.t3_bonus;
                leader.balance += teamBonusAmount;
                leader.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
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
                  createdAt: (/* @__PURE__ */ new Date()).toISOString()
                });
                schema.history.unshift({
                  id: `hist-tb-${Date.now()}`,
                  userId: leader.id,
                  type: "team_bonus",
                  titleEn: `Team Bonus (+\u09F3${teamBonusAmount}) from member ${referrer.name} (activated ${targetUser.name})`,
                  titleBn: `\u099F\u09BF\u09AE \u09AC\u09CB\u09A8\u09BE\u09B8 (+\u09F3${teamBonusAmount}) \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0 ${referrer.name}-\u098F\u09B0 \u09AE\u09BE\u09A7\u09CD\u09AF\u09AE\u09C7 (${targetUser.name})`,
                  amount: teamBonusAmount,
                  status: "completed",
                  createdAt: (/* @__PURE__ */ new Date()).toISOString()
                });
                schema.notifications.unshift({
                  id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  userId: leader.id,
                  titleEn: `Team Bonus Received (+\u09F3${teamBonusAmount})!`,
                  titleBn: `\u099F\u09BF\u09AE \u09AC\u09CB\u09A8\u09BE\u09B8 \u09AA\u09C7\u09DF\u09C7\u099B\u09C7\u09A8 (+\u09F3${teamBonusAmount})!`,
                  messageEn: `Your team member ${referrer.name} activated ${targetUser.name} (Cat ${request.category}).`,
                  messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u099F\u09BF\u09AE \u09AE\u09C7\u09AE\u09CD\u09AC\u09BE\u09B0 ${referrer.name} \u09A8\u09A4\u09C1\u09A8 \u09B8\u09A6\u09B8\u09CD\u09AF ${targetUser.name} (\u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${request.category}) \u098F\u0995\u09CD\u099F\u09BF\u09AD \u0995\u09B0\u09C7\u099B\u09C7\u09A8\u0964`,
                  type: "team",
                  isRead: false,
                  createdAt: (/* @__PURE__ */ new Date()).toISOString()
                });
              }
            }
          }
        }
      }
      return request;
    });
    res.json({ success: true, request: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Approval failed" });
  }
});
router.post("/admin/activation/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await db.withTransaction(async (schema) => {
      const request = schema.activationRequests.find((ar) => ar.id === id);
      if (!request) throw new Error("Request not found");
      if (request.status !== "pending") throw new Error("Request is not pending");
      request.status = "rejected";
      request.rejectionReason = reason || "Invalid transaction details";
      request.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: request.userId,
        titleEn: "Activation Request Rejected",
        titleBn: "\u0986\u0987\u09A1\u09BF \u0985\u09CD\u09AF\u09BE\u0995\u09CD\u099F\u09BF\u09AD\u09C7\u09B6\u09A8 \u0986\u09AC\u09C7\u09A6\u09A8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7",
        messageEn: `Your activation request for Category ${request.category} was rejected. Reason: ${request.rejectionReason}. Please check transaction details and retry.`,
        messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${request.category} \u0986\u09AC\u09C7\u09A6\u09A8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u0995\u09BE\u09B0\u09A3: ${request.rejectionReason}\u0964 \u0985\u09A8\u09C1\u0997\u09CD\u09B0\u09B9 \u0995\u09B0\u09C7 \u099F\u09CD\u09B0\u09BE\u09A8\u099C\u09C7\u0995\u09B6\u09A8 \u09A4\u09A5\u09CD\u09AF \u09AF\u09BE\u099A\u09BE\u0987 \u0995\u09B0\u09C7 \u09AA\u09C1\u09A8\u09B0\u09BE\u09AF\u09BC \u0986\u09AC\u09C7\u09A6\u09A8 \u0995\u09B0\u09C1\u09A8\u0964`,
        type: "activation",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return request;
    });
    res.json({ success: true, request: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Rejection failed" });
  }
});
router.post("/admin/video/:id/approve", async (req, res) => {
  const { id } = req.params;
  const today = getBangladeshDateString();
  try {
    const updated = await db.withTransaction(async (schema) => {
      const submission = schema.videoSubmissions.find((vs) => vs.id === id);
      if (!submission) throw new Error("Submission not found");
      if (submission.status !== "pending") throw new Error("Submission is not pending");
      const user = schema.users.find((u) => u.id === submission.userId);
      if (!user) throw new Error("User not found");
      let dailyCap = schema.settings.limit_category_a;
      if (user.category === "B") dailyCap = schema.settings.limit_category_b;
      if (user.category === "C") dailyCap = schema.settings.limit_category_c;
      let dailyRecord = schema.dailyEarnings.find(
        (de) => de.userId === user.id && de.dateStr === today
      );
      if (!dailyRecord) {
        dailyRecord = { userId: user.id, dateStr: today, amount: 0 };
        schema.dailyEarnings.push(dailyRecord);
      }
      const remainingCapacity = Math.max(0, dailyCap - dailyRecord.amount);
      const creditAmount = Math.min(submission.reward, remainingCapacity);
      submission.status = "approved";
      submission.creditedAmount = creditAmount;
      submission.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
      if (creditAmount > 0) {
        user.balance += creditAmount;
        dailyRecord.amount += creditAmount;
        user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
        schema.history.unshift({
          id: `hist-vid-app-${Date.now()}`,
          userId: user.id,
          type: "video_approved",
          titleEn: `Video Work Approved (+\u09F3${creditAmount}): ${submission.videoTitle}`,
          titleBn: `\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 (+\u09F3${creditAmount}): ${submission.videoTitle}`,
          amount: creditAmount,
          status: "approved",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          titleEn: "Video Work Approved!",
          titleBn: "\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7!",
          messageEn: `+\u09F3${creditAmount} has been credited to your balance for watching "${submission.videoTitle}".`,
          messageBn: `"${submission.videoTitle}" \u0995\u09BE\u099C\u09C7\u09B0 \u099C\u09A8\u09CD\u09AF +\u09F3${creditAmount} \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8\u09C7 \u09AF\u09CB\u0997 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964`,
          type: "video",
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      } else {
        schema.history.unshift({
          id: `hist-vid-app-${Date.now()}`,
          userId: user.id,
          type: "video_approved",
          titleEn: `Video Approved (\u09F30 credited - Daily limit reached): ${submission.videoTitle}`,
          titleBn: `\u09AD\u09BF\u09A1\u09BF\u0993 \u0985\u09A8\u09C1\u09AE\u09CB\u09A6\u09BF\u09A4 (\u09F3\u09E6 \u09AF\u09CB\u0997 \u09B9\u09DF\u09C7\u099B\u09C7 - \u09A6\u09C8\u09A8\u09BF\u0995 \u09B8\u09C0\u09AE\u09BE \u09AA\u09C2\u09B0\u09CD\u09A3): ${submission.videoTitle}`,
          amount: 0,
          status: "approved",
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        schema.notifications.unshift({
          id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          userId: user.id,
          titleEn: "Daily Limit Reached",
          titleBn: "\u09A6\u09C8\u09A8\u09BF\u0995 \u09B2\u09BF\u09AE\u09BF\u099F \u09B6\u09C7\u09B7",
          messageEn: `Your video was verified, but your daily earning cap of \u09F3${dailyCap} was already reached. Come back tomorrow!`,
          messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09B8\u09A0\u09BF\u0995 \u099B\u09BF\u09B2, \u09A4\u09AC\u09C7 \u0986\u099C\u0995\u09C7\u09B0 \u09A6\u09C8\u09A8\u09BF\u0995 \u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A \u09B8\u09C0\u09AE\u09BE \u09F3${dailyCap} \u09AA\u09C2\u09B0\u09CD\u09A3 \u09A5\u09BE\u0995\u09BE\u09DF \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09AC\u09BE\u09DC\u09C7\u09A8\u09BF\u0964 \u0986\u0997\u09BE\u09AE\u09C0\u0995\u09BE\u09B2 \u0986\u09AC\u09BE\u09B0 \u0995\u09BE\u099C \u0995\u09B0\u09C1\u09A8!`,
          type: "video",
          isRead: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
      return submission;
    });
    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Approval failed" });
  }
});
router.post("/admin/video/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await db.withTransaction(async (schema) => {
      const submission = schema.videoSubmissions.find((vs) => vs.id === id);
      if (!submission) throw new Error("Submission not found");
      if (submission.status !== "pending") throw new Error("Submission is not pending");
      submission.status = "rejected";
      submission.rejectionReason = reason || "Invalid screenshot proof";
      submission.reviewedAt = (/* @__PURE__ */ new Date()).toISOString();
      schema.history.unshift({
        id: `hist-vid-rej-${Date.now()}`,
        userId: submission.userId,
        type: "video_rejected",
        titleEn: `Video Work Rejected: ${submission.videoTitle}`,
        titleBn: `\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09AC\u09BE\u09A4\u09BF\u09B2 \u0995\u09B0\u09BE \u09B9\u09AF\u09BC\u09C7\u099B\u09C7: ${submission.videoTitle}`,
        amount: 0,
        status: "rejected",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: submission.userId,
        titleEn: "Video Work Rejected",
        titleBn: "\u09AD\u09BF\u09A1\u09BF\u0993 \u0995\u09BE\u099C \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7",
        messageEn: `Your proof for "${submission.videoTitle}" was rejected. Reason: ${submission.rejectionReason}. You can retry watching and submitting.`,
        messageBn: `"${submission.videoTitle}" \u0995\u09BE\u099C\u09C7\u09B0 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09AF\u09BC\u09C7\u099B\u09C7\u0964 \u0995\u09BE\u09B0\u09A3: ${submission.rejectionReason}\u0964 \u0986\u09AA\u09A8\u09BF \u09AA\u09C1\u09A8\u09B0\u09BE\u09AF\u09BC \u09AD\u09BF\u09A1\u09BF\u0993\u099F\u09BF \u09A6\u09C7\u0996\u09C7 \u09AA\u09CD\u09B0\u09AE\u09BE\u09A3 \u099C\u09AE\u09BE \u09A6\u09BF\u09A4\u09C7 \u09AA\u09BE\u09B0\u09C7\u09A8\u0964`,
        type: "video",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return submission;
    });
    res.json({ success: true, submission: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Rejection failed" });
  }
});
router.post("/admin/withdraw/:id/pay", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.withTransaction(async (schema) => {
      const withdraw = schema.withdrawRequests.find((w) => w.id === id);
      if (!withdraw) throw new Error("Withdrawal request not found");
      if (withdraw.status !== "pending") throw new Error("Withdrawal is not pending");
      withdraw.status = "paid";
      withdraw.processedAt = (/* @__PURE__ */ new Date()).toISOString();
      schema.history.unshift({
        id: `hist-wdr-paid-${Date.now()}`,
        userId: withdraw.userId,
        type: "withdraw_paid",
        titleEn: `Withdrawal Paid: \u09F3${withdraw.amount} sent to ${withdraw.paymentMethod} (${withdraw.accountNumber})`,
        titleBn: `\u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09B8\u09AE\u09CD\u09AA\u09A8\u09CD\u09A8: \u09F3${withdraw.amount} \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09AF\u09BC\u09C7\u099B\u09C7 ${withdraw.paymentMethod}-\u098F (${withdraw.accountNumber})`,
        amount: -withdraw.amount,
        status: "paid",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: withdraw.userId,
        titleEn: "Withdrawal Completed!",
        titleBn: "\u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u099F\u09BE\u0995\u09BE \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09DF\u09C7\u099B\u09C7!",
        messageEn: `Your withdrawal of \u09F3${withdraw.amount} via ${withdraw.paymentMethod} (${withdraw.accountNumber}) has been paid!`,
        messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09F3${withdraw.amount} (${withdraw.paymentMethod}: ${withdraw.accountNumber}) \u09B8\u09AB\u09B2\u09AD\u09BE\u09AC\u09C7 \u09AA\u09BE\u09A0\u09BE\u09A8\u09CB \u09B9\u09DF\u09C7\u099B\u09C7!`,
        type: "withdraw",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return withdraw;
    });
    res.json({ success: true, withdraw: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Marking paid failed" });
  }
});
router.post("/admin/withdraw/:id/reject", async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  try {
    const updated = await db.withTransaction(async (schema) => {
      const withdraw = schema.withdrawRequests.find((w) => w.id === id);
      if (!withdraw) throw new Error("Withdrawal request not found");
      if (withdraw.status !== "pending") throw new Error("Withdrawal is not pending");
      const user = schema.users.find((u) => u.id === withdraw.userId);
      if (!user) throw new Error("User not found");
      withdraw.status = "rejected";
      withdraw.rejectionReason = reason || "Incorrect account information or policy violation";
      withdraw.processedAt = (/* @__PURE__ */ new Date()).toISOString();
      user.balance += withdraw.amount;
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      schema.history.unshift({
        id: `hist-wdr-ref-${Date.now()}`,
        userId: user.id,
        type: "withdraw_rejected_refund",
        titleEn: `Withdrawal Rejected & Refunded: +\u09F3${withdraw.amount}`,
        titleBn: `\u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09AC\u09BE\u09A4\u09BF\u09B2 \u098F\u09AC\u0982 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 \u09AB\u09C7\u09B0\u09A4: +\u09F3${withdraw.amount}`,
        amount: withdraw.amount,
        status: "approved",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: "Withdrawal Rejected (Refunded)",
        titleBn: "\u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u09AC\u09BE\u09A4\u09BF\u09B2 \u0993 \u099F\u09BE\u0995\u09BE \u09AB\u09C7\u09B0\u09A4",
        messageEn: `Your withdrawal request for \u09F3${withdraw.amount} was rejected (${withdraw.rejectionReason}). The amount has been refunded to your balance.`,
        messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u09F3${withdraw.amount} \u0989\u0987\u09A5\u09A1\u09CD\u09B0 \u0986\u09AC\u09C7\u09A6\u09A8 \u09AC\u09BE\u09A4\u09BF\u09B2 \u09B9\u09DF\u09C7\u099B\u09C7 (${withdraw.rejectionReason})\u0964 \u099F\u09BE\u0995\u09BE \u09AA\u09C1\u09A8\u09B0\u09BE\u09DF \u0986\u09AA\u09A8\u09BE\u09B0 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8\u09C7 \u09AB\u09C7\u09B0\u09A4 \u09A6\u09C7\u0993\u09DF\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
        type: "withdraw",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      return withdraw;
    });
    res.json({ success: true, withdraw: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Rejection failed" });
  }
});
router.get("/admin/videos", (req, res) => {
  const snapshot = db.getSnapshot();
  res.json({ videos: snapshot.videos });
});
router.post("/admin/videos", async (req, res) => {
  const { title, titleBn, url, reward } = req.body;
  if (!title || !url || !reward) {
    return res.status(400).json({ error: "Title, URL, and reward are required" });
  }
  const numReward = Number(reward);
  if (isNaN(numReward) || numReward <= 0) {
    return res.status(400).json({ error: "Reward must be a positive number" });
  }
  const newVideo = await db.withTransaction((schema) => {
    const video = {
      id: `vid-${Date.now()}`,
      title: title.trim(),
      titleBn: (titleBn || "").trim() || title.trim(),
      url: url.trim(),
      reward: numReward,
      categoryRequired: "ALL",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      isActive: true
    };
    schema.videos.unshift(video);
    return video;
  });
  res.json({ success: true, video: newVideo });
});
router.put("/admin/videos/:id", async (req, res) => {
  const { id } = req.params;
  const { title, titleBn, url, reward, isActive } = req.body;
  try {
    const updated = await db.withTransaction((schema) => {
      const video = schema.videos.find((v) => v.id === id);
      if (!video) throw new Error("Video not found");
      if (title) video.title = title.trim();
      if (titleBn !== void 0) video.titleBn = titleBn.trim();
      if (url) video.url = url.trim();
      if (reward !== void 0) video.reward = Number(reward);
      if (isActive !== void 0) video.isActive = Boolean(isActive);
      return video;
    });
    res.json({ success: true, video: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Update failed" });
  }
});
router.delete("/admin/videos/:id", async (req, res) => {
  const { id } = req.params;
  await db.withTransaction((schema) => {
    schema.videos = schema.videos.filter((v) => v.id !== id);
  });
  res.json({ success: true });
});
router.get("/admin/users", (req, res) => {
  const { search, page = "1", limit = "20" } = req.query;
  const snapshot = db.getSnapshot();
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSize = Math.min(100, parseInt(limit, 10) || 20);
  const searchTerm = (search || "").toLowerCase().trim();
  let filtered = snapshot.users;
  if (searchTerm) {
    filtered = filtered.filter(
      (u) => u.name.toLowerCase().includes(searchTerm) || u.phone.includes(searchTerm) || u.id.toLowerCase().includes(searchTerm) || u.referralCode.toLowerCase().includes(searchTerm)
    );
  }
  const total = filtered.length;
  const offset = (pageNum - 1) * pageSize;
  const paginated = filtered.slice(offset, offset + pageSize).map((u) => {
    const directActiveCount = snapshot.users.filter((ref) => ref.referredBy === u.id && ref.isActive).length;
    const teamBonusTotal = snapshot.teamBonuses.filter((tb) => tb.leaderId === u.id).reduce((sum, tb) => sum + tb.amount, 0);
    const { passwordHash: _, ...safe } = u;
    return {
      ...safe,
      activatedReferralCount: directActiveCount,
      teamBonusEarned: teamBonusTotal
    };
  });
  res.json({ users: paginated, total, page: pageNum, pageSize });
});
router.get("/admin/users/:id/history", (req, res) => {
  const { id } = req.params;
  const snapshot = db.getSnapshot();
  const userHistory = snapshot.history.filter((h) => h.userId === id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((h) => ({
    ...h,
    bangladeshTime: formatBangladeshDateTime(h.createdAt)
  }));
  res.json({ history: userHistory });
});
router.post("/admin/users/:id/balance", async (req, res) => {
  const { id } = req.params;
  const { action, amount, reason } = req.body;
  const numAmount = Number(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than 0" });
  }
  try {
    const updated = await db.withTransaction(async (schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error("User not found");
      if (action === "deduct") {
        if (numAmount > user.balance) {
          throw new Error("Cannot deduct more than user current balance / \u0985\u09CD\u09AF\u09BE\u0995\u09BE\u0989\u09A8\u09CD\u099F\u09C7\u09B0 \u099A\u09C7\u09DF\u09C7 \u09AC\u09C7\u09B6\u09BF \u099F\u09BE\u0995\u09BE \u0995\u09BE\u099F\u09BE \u09AF\u09BE\u09AC\u09C7 \u09A8\u09BE");
        }
        user.balance -= numAmount;
      } else if (action === "add") {
        user.balance += numAmount;
      } else {
        throw new Error("Invalid action (must be add or deduct)");
      }
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const type = action === "add" ? "admin_add" : "admin_deduct";
      const titleEn = `Admin ${action === "add" ? "Added" : "Deducted"} \u09F3${numAmount}${reason ? ` (${reason})` : ""}`;
      const titleBn = `\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 ${action === "add" ? "\u09AF\u09CB\u0997 \u0995\u09B0\u09C7\u099B\u09C7\u09A8" : "\u0995\u09C7\u099F\u09C7\u099B\u09C7\u09A8"}: \u09F3${numAmount}${reason ? ` (${reason})` : ""}`;
      schema.history.unshift({
        id: `hist-admin-${Date.now()}`,
        userId: user.id,
        type,
        titleEn,
        titleBn,
        amount: action === "add" ? numAmount : -numAmount,
        status: "completed",
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: `Balance ${action === "add" ? "Credited" : "Debited"}`,
        titleBn: `\u09AC\u09CD\u09AF\u09BE\u09B2\u09C7\u09A8\u09CD\u09B8 ${action === "add" ? "\u09AF\u09CB\u0997 \u09B9\u09DF\u09C7\u099B\u09C7" : "\u0995\u09BE\u099F\u09BE \u09B9\u09DF\u09C7\u099B\u09C7"}`,
        messageEn: `Admin ${action === "add" ? "added" : "deducted"} \u09F3${numAmount}. ${reason || ""}`,
        messageBn: `\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u09F3${numAmount} ${action === "add" ? "\u09AF\u09CB\u0997 \u0995\u09B0\u09C7\u099B\u09C7\u09A8" : "\u0995\u09C7\u099F\u09C7\u099B\u09C7\u09A8"}\u0964 ${reason || ""}`,
        type: "admin",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const { passwordHash: _, ...safe } = user;
      return safe;
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Balance update failed" });
  }
});
router.post("/admin/users/:id/category", async (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  if (!category || !["A", "B", "C"].includes(category)) {
    return res.status(400).json({ error: "Valid category required (A, B, C)" });
  }
  try {
    const updated = await db.withTransaction((schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error("User not found");
      user.category = category;
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      schema.notifications.unshift({
        id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId: user.id,
        titleEn: "Category Updated by Admin",
        titleBn: "\u0985\u09CD\u09AF\u09BE\u09A1\u09AE\u09BF\u09A8 \u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09C7\u099B\u09C7\u09A8",
        messageEn: `Your category has been updated to Category ${category}.`,
        messageBn: `\u0986\u09AA\u09A8\u09BE\u09B0 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF \u09AA\u09B0\u09BF\u09AC\u09B0\u09CD\u09A4\u09A8 \u0995\u09B0\u09C7 \u0995\u09CD\u09AF\u09BE\u099F\u09BE\u0997\u09B0\u09BF ${category} \u0995\u09B0\u09BE \u09B9\u09DF\u09C7\u099B\u09C7\u0964`,
        type: "admin",
        isRead: false,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
      const { passwordHash: _, ...safe } = user;
      return safe;
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Category update failed" });
  }
});
router.post("/admin/users/:id/block", async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await db.withTransaction((schema) => {
      const user = schema.users.find((u) => u.id === id);
      if (!user) throw new Error("User not found");
      user.isBlocked = !user.isBlocked;
      user.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
      const { passwordHash: _, ...safe } = user;
      return safe;
    });
    res.json({ success: true, user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Block update failed" });
  }
});
router.get("/admin/settings", (req, res) => {
  const snapshot = db.getSnapshot();
  res.json({ settings: snapshot.settings });
});
router.put("/admin/settings", async (req, res) => {
  const updates = req.body;
  try {
    const updated = await db.withTransaction((schema) => {
      schema.settings = {
        ...schema.settings,
        ...updates
      };
      return schema.settings;
    });
    res.json({ success: true, settings: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || "Settings update failed" });
  }
});
router.get("/admin/team-leaders", (req, res) => {
  const snapshot = db.getSnapshot();
  const leaders = snapshot.users.filter((u) => u.isTeamLeader).map((l) => {
    const directActive = snapshot.users.filter((ref) => ref.referredBy === l.id && ref.isActive);
    const totalBonus = snapshot.teamBonuses.filter((tb) => tb.leaderId === l.id).reduce((sum, tb) => sum + tb.amount, 0);
    const members = snapshot.users.filter((ref) => ref.referredBy === l.id).map((m) => ({
      id: m.id,
      name: m.name,
      phone: m.phone,
      category: m.category,
      isActive: m.isActive,
      createdAt: m.createdAt
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
      members
    };
  });
  const totalBonusesPaid = snapshot.teamBonuses.reduce((sum, tb) => sum + tb.amount, 0);
  const today = getBangladeshDateString();
  const bonusesToday = snapshot.teamBonuses.filter((tb) => tb.createdAt.startsWith(today)).reduce((sum, tb) => sum + tb.amount, 0);
  res.json({
    leaders,
    summary: {
      totalBonusesPaid,
      totalLeaders: leaders.length,
      bonusesToday
    }
  });
});
router.get("/admin/broadcasts", (req, res) => {
  const snapshot = db.getSnapshot();
  res.json({ broadcasts: snapshot.broadcasts });
});
router.post("/admin/broadcasts", async (req, res) => {
  const { titleEn, titleBn, messageEn, messageBn } = req.body;
  if (!titleEn || !messageEn) {
    return res.status(400).json({ error: "Title and message are required" });
  }
  const newBroadcast = await db.withTransaction((schema) => {
    const bc = {
      id: `bc-${Date.now()}`,
      titleEn,
      titleBn: titleBn || titleEn,
      messageEn,
      messageBn: messageBn || messageEn,
      isActive: true,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    schema.broadcasts.unshift(bc);
    return bc;
  });
  res.json({ success: true, broadcast: newBroadcast });
});
router.delete("/admin/broadcasts/:id", async (req, res) => {
  const { id } = req.params;
  await db.withTransaction((schema) => {
    schema.broadcasts = schema.broadcasts.filter((b) => b.id !== id);
  });
  res.json({ success: true });
});
var routes_default = router;

// server/vercel.ts
var app = express();
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));
app.use(cookieParser());
app.use((req, res, next) => {
  next();
});
app.use("/api", userAuthMiddleware, routes_default);
app.use("/", userAuthMiddleware, routes_default);
app.use((err, req, res, next) => {
  console.error("[Vercel Serverless API Error]:", err);
  const status = typeof err?.status === "number" && err.status >= 400 && err.status < 600 ? err.status : 500;
  res.status(status).json({
    error: err?.message || "\u09B8\u09BE\u09B0\u09CD\u09AD\u09BE\u09B0 \u0985\u09AD\u09CD\u09AF\u09A8\u09CD\u09A4\u09B0\u09C0\u09A3 \u09A4\u09CD\u09B0\u09C1\u099F\u09BF (Server Internal Error)",
    status
  });
});
var vercel_default = app;
export {
  vercel_default as default
};
