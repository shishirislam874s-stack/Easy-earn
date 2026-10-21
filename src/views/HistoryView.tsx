import { useState, useEffect } from 'react';
import {
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Shield,
  Gift,
  PlayCircle,
  Wallet,
  LogOut,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { HistoryItem } from '../types';
import { LiquidCard, LiquidButton } from '../components/LiquidGlass';

interface HistoryViewProps {
  onOpenLogoutModal: () => void;
}

export function HistoryView({ onOpenLogoutModal }: HistoryViewProps) {
  const { user, earnedToday, dailyCap, language, t } = useAuth();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/history');
      if (res.ok) {
        const json = await res.json();
        setHistory(json.history || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getTypeIcon = (type: string) => {
    if (type.includes('activation')) return Shield;
    if (type.includes('video')) return PlayCircle;
    if (type.includes('team') || type.includes('referral')) return Gift;
    if (type.includes('withdraw')) return Wallet;
    return Clock;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'completed' || s === 'paid') {
      return (
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 uppercase">
          {s === 'paid' ? t.paid : t.approved}
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase">
          {t.pending}
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 uppercase">
          {t.rejected}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Balance & Overview Card */}
      <LiquidCard elevated className="border-cyan-400/40 shadow-[0_12px_32px_rgba(6,182,212,0.18)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t.currentBalance}
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-1 flex items-baseline gap-2">
              <span>৳{user?.balance || 0}</span>
              {user?.category && (
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300">
                  Cat {user.category}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LiquidButton
              variant="secondary"
              size="sm"
              onClick={fetchHistory}
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'bn' ? 'রিফ্রেশ' : 'Refresh'}</span>
            </LiquidButton>
            <LiquidButton
              variant="danger"
              size="sm"
              onClick={onOpenLogoutModal}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t.logout}</span>
            </LiquidButton>
          </div>
        </div>

        {/* Sub metrics */}
        <div className="grid grid-cols-2 gap-3 pt-3">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {t.todayEarned}
            </span>
            <span className="text-base font-bold text-cyan-300 font-mono mt-0.5 block">
              ৳{earnedToday} / ৳{dailyCap}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {t.teamStatus}
            </span>
            <span className="text-xs font-bold text-white mt-1 block">
              {user?.isTeamLeader ? t.teamLeader : t.generalMember}
            </span>
          </div>
        </div>
      </LiquidCard>

      {/* Complete Financial & Activity Ledger */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>{t.fullHistory}</span>
          </h3>
          <span className="text-xs text-slate-400">
            {language === 'bn' ? 'বাংলাদেশ সময় (BST)' : 'BST (UTC+6)'}
          </span>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs">{t.loading}</div>
        ) : history.length === 0 ? (
          <LiquidCard className="text-center py-10">
            <Clock className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t.noHistory}</p>
          </LiquidCard>
        ) : (
          <div className="space-y-2.5">
            {history.map((record) => {
              const Icon = getTypeIcon(record.type);
              const isPositive = record.amount > 0;
              const isNegative = record.amount < 0;

              return (
                <LiquidCard
                  key={record.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:border-white/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-cyan-300 shrink-0 mt-0.5">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-snug">
                        {language === 'bn' ? record.titleBn : record.titleEn}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                        <span>
                          {record.bangladeshTime?.full ||
                            new Date(record.createdAt).toLocaleString()}
                        </span>
                        <span>·</span>
                        {getStatusBadge(record.status)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black font-mono ${
                        isPositive
                          ? 'text-emerald-400'
                          : isNegative
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {isPositive ? `+৳${record.amount}` : isNegative ? `-৳${Math.abs(record.amount)}` : `৳${record.amount}`}
                    </span>
                  </div>
                </LiquidCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
