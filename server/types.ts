export type CategoryType = 'A' | 'B' | 'C';

export interface User {
  id: string; // e.g. "EARN-1001" or numeric string
  name: string;
  phone: string;
  passwordHash: string;
  category: CategoryType | null;
  isActive: boolean;
  isBlocked: boolean;
  balance: number;
  referredBy: string | null; // User ID who referred this user
  referralCode: string;
  workUntil: string | null; // Date string YYYY-MM-DD (Bangladesh time UTC+6)
  initialWorkUntil?: string | null; // Date marking end of the initial 5 days
  referralsTowardsWork?: number; // Count of referrals towards next 5-referral unlock cycle (0 to 5)
  totalReferralsAfterInitial?: number; // Total referrals joined after initial 5 days
  isTeamLeader: boolean;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: string;
  title: string;
  titleBn?: string;
  url: string;
  reward: number; // in Taka
  categoryRequired?: CategoryType | 'ALL';
  createdAt: string;
  isActive: boolean;
}

export interface WatchSession {
  id: string;
  userId: string;
  videoId: string;
  startedAt: number; // epoch ms (server time)
}

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface VideoSubmission {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  videoId: string;
  videoTitle: string;
  reward: number;
  creditedAmount?: number;
  screenshotUrl: string;
  status: SubmissionStatus;
  rejectionReason?: string;
  submittedAt: string; // ISO
  reviewedAt?: string;
}

export interface DailyEarning {
  userId: string;
  dateStr: string; // YYYY-MM-DD (Bangladesh time UTC+6)
  amount: number;
}

export interface ActivationRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  category: CategoryType;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
  transactionId: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket';
  accountNumber: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  processedAt?: string;
}

export interface TeamBonus {
  id: string;
  leaderId: string;
  leaderName: string;
  referrerId: string;
  referrerName: string;
  activatedUserId: string;
  activatedUserName: string;
  category: CategoryType;
  amount: number;
  createdAt: string;
}

export type HistoryType =
  | 'activation_request'
  | 'activation_approved'
  | 'video_submission'
  | 'video_approved'
  | 'video_rejected'
  | 'referral_join'
  | 'referral_active'
  | 'team_bonus'
  | 'admin_add'
  | 'admin_deduct'
  | 'withdraw_request'
  | 'withdraw_paid'
  | 'withdraw_rejected_refund';

export interface HistoryRecord {
  id: string;
  userId: string;
  type: HistoryType;
  titleEn: string;
  titleBn: string;
  amount: number; // positive or negative or 0
  status: 'pending' | 'approved' | 'rejected' | 'paid' | 'completed';
  createdAt: string; // ISO string
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  userId: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  type: 'activation' | 'video' | 'withdraw' | 'referral' | 'team' | 'admin' | 'broadcast';
  isRead: boolean;
  createdAt: string;
}

export interface SystemSettings {
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
  ref_join: number; // 1
  ref_active: number; // 100
  work_days: number; // 5
  w1_days: number; // 2
  w2_days: number; // 3
  w3_days: number; // 4
  team_size: number; // 20
  t1_bonus: number; // 10
  t2_bonus: number; // 20
  t3_bonus: number; // 30
  watch_seconds: number; // 15
}

export interface Broadcast {
  id: string;
  titleEn: string;
  titleBn: string;
  messageEn: string;
  messageBn: string;
  isActive: boolean;
  createdAt: string;
}
