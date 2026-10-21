export type Language = 'bn' | 'en';

export type CategoryType = 'A' | 'B' | 'C';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  category: CategoryType | null;
  isActive: boolean;
  isBlocked: boolean;
  balance: number;
  referredBy: string | null;
  referralCode: string;
  workUntil: string | null;
  isTeamLeader: boolean;
  activatedAt: string | null;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  titleBn?: string;
  url: string;
  reward: number;
  isActive: boolean;
}

export interface AppConfig {
  settings: {
    payment_number_bkash: string;
    payment_number_nagad: string;
    payment_number_rocket: string;
    fee_category_a: number;
    fee_category_b: number;
    fee_category_c: number;
    limit_category_a: number;
    limit_category_b: number;
    limit_category_c: number;
    min_withdraw: number;
    ref_join: number;
    ref_active: number;
    work_days: number;
    w1_days: number;
    w2_days: number;
    w3_days: number;
    team_size: number;
    t1_bonus: number;
    t2_bonus: number;
    t3_bonus: number;
    watch_seconds: number;
  };
  publicSiteUrl: string;
  categories: {
    id: CategoryType;
    nameEn: string;
    nameBn: string;
    fee: number;
    dailyLimit: number;
    extensionDays: number;
    teamBonus: number;
  }[];
  paymentMethods: {
    id: 'bKash' | 'Nagad' | 'Rocket';
    name: string;
    nameBn: string;
    number: string;
    logo: string;
    color: string;
  }[];
}

export interface HistoryItem {
  id: string;
  userId: string;
  type: string;
  titleEn: string;
  titleBn: string;
  amount: number;
  status: string;
  createdAt: string;
  bangladeshTime?: {
    date: string;
    time: string;
    full: string;
  };
}

export interface NotificationItem {
  id: string;
  userId: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export interface BroadcastItem {
  id: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  isActive: boolean;
  createdAt: string;
}
