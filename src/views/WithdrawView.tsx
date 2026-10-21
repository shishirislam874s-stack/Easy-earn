import { useState, useEffect } from 'react';
import {
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Lock,
  ArrowRight,
  Send,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton, LiquidInput } from '../components/LiquidGlass';

interface WithdrawViewProps {
  onGoToCategory: () => void;
}

export function WithdrawView({ onGoToCategory }: WithdrawViewProps) {
  const { user, config, refreshUserData, showToast, language, t } = useAuth();

  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const minWithdraw = config?.settings?.min_withdraw || 200;

  const fetchWithdrawals = async () => {
    try {
      const res = await fetch('/api/withdraw/my');
      if (res.ok) {
        const json = await res.json();
        setWithdrawals(json.withdrawals || []);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  if (user && !user.isActive) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <LiquidCard elevated className="text-center py-10 border-amber-500/30">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {language === 'bn' ? 'উইথড্র লক করা' : 'Withdrawal Locked'}
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {t.lockMessageNotice}
          </p>
          <LiquidButton variant="primary" size="lg" onClick={onGoToCategory}>
            {t.navCategory}
          </LiquidButton>
        </LiquidCard>
      </div>
    );
  }

  const paymentMethods = config?.paymentMethods || [
    { id: 'bKash' as const, name: 'bKash', nameBn: 'বিকাশ', number: '01604606880', logo: '/logos/bkash.svg', color: '#E2136E' },
    { id: 'Nagad' as const, name: 'Nagad', nameBn: 'নগদ', number: '01604606880', logo: '/logos/nagad.svg', color: '#F7931E' },
    { id: 'Rocket' as const, name: 'Rocket', nameBn: 'রকেট', number: '01604606880', logo: '/logos/rocket.svg', color: '#8E2DE2' },
  ];

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < minWithdraw) {
      setError(`${t.minWithdrawNotice}: ৳${minWithdraw}`);
      setIsSubmitting(false);
      return;
    }

    if (user && numAmount > user.balance) {
      setError(language === 'bn' ? 'পর্যাপ্ত ব্যালেন্স নেই' : 'Insufficient balance');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/withdraw/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          accountNumber: accountNumber.trim(),
          amount: numAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Withdrawal failed');
      } else {
        setAmount('');
        await fetchWithdrawals();
        await refreshUserData();
        showToast(language === 'bn' ? 'উইথড্র রিকোয়েস্ট সফল হয়েছে!' : 'Withdrawal submitted successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Balance Banner */}
      <LiquidCard elevated className="border-cyan-400/40 shadow-[0_12px_32px_rgba(6,182,212,0.2)]">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              {t.availableBalance}
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-1">
              ৳{user?.balance || 0}
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {t.minWithdrawNotice}
            </span>
            <span className="text-sm font-extrabold text-cyan-300 font-mono">
              ৳{minWithdraw}
            </span>
          </div>
        </div>
      </LiquidCard>

      {/* Main Withdrawal Form */}
      <LiquidCard elevated className="border-white/20">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-400" />
          <span>{t.withdrawTitle}</span>
        </h3>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
          {/* Method Selector Cards */}
          <div>
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
              {t.withdrawMethod}
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {paymentMethods.map((pm) => {
                const isSelected = selectedMethod === pm.id;

                return (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setSelectedMethod(pm.id)}
                    className={`
                      p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5
                      ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400/80 shadow-[0_4px_16px_rgba(6,182,212,0.3)]'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="h-6 w-16 flex items-center justify-center overflow-hidden">
                      <img
                        src={pm.logo}
                        alt={pm.name}
                        referrerPolicy="no-referrer"
                        className="h-full w-auto object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <span className="text-xs font-black text-white ml-0.5">
                        {pm.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-300">
                      {pm.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <LiquidInput
            label={t.accountNumber}
            placeholder="017XXXXXXXX"
            type="tel"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
          />

          <LiquidInput
            label={`${t.withdrawAmount} (min ৳${minWithdraw})`}
            placeholder={`e.g. ${minWithdraw}`}
            type="number"
            min={minWithdraw}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />

          <div className="pt-2">
            <LiquidButton
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isSubmitting}
            >
              <Send className="w-4 h-4 mr-1" />
              <span>{t.submitWithdraw}</span>
            </LiquidButton>
          </div>
        </form>
      </LiquidCard>

      {/* Recent Withdrawals Tracker */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
          {t.recentWithdrawals}
        </h3>

        {isLoadingHistory ? (
          <div className="py-6 text-center text-slate-400 text-xs">{t.loading}</div>
        ) : withdrawals.length === 0 ? (
          <LiquidCard className="text-center py-6">
            <p className="text-xs text-slate-400">{t.noWithdrawals}</p>
          </LiquidCard>
        ) : (
          <div className="space-y-2.5">
            {withdrawals.map((w) => {
              const statusColors: Record<string, string> = {
                pending: 'text-amber-300 bg-amber-500/10 border-amber-500/20',
                paid: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                rejected: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
              };

              return (
                <LiquidCard key={w.id} className="p-3.5 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {w.paymentMethod} ({w.accountNumber})
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${statusColors[w.status] || ''}`}>
                        {w.status === 'pending' ? t.pending : w.status === 'paid' ? t.paid : t.rejected}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {new Date(w.createdAt).toLocaleDateString()} · {new Date(w.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {w.rejectionReason && (
                      <span className="text-[10px] text-rose-300 block mt-0.5">
                        {w.rejectionReason}
                      </span>
                    )}
                  </div>

                  <span className="text-base font-extrabold text-white font-mono">
                    ৳{w.amount}
                  </span>
                </LiquidCard>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
