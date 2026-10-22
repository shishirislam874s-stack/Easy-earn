import { useState, useEffect } from 'react';
import { ShieldCheck, Copy, Check, Clock, Sparkles, Send, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { CategoryType } from '../types';
import { LiquidCard, LiquidButton, LiquidInput } from '../components/LiquidGlass';
import { authFetch, safeJson } from '../lib/api';

export function ActivationView() {
  const { user, config, refreshUserData, refreshConfig, showToast, language, t, logout } = useAuth();

  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('A');
  const [selectedMethod, setSelectedMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [transactionId, setTransactionId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState(false);
  const [latestRequest, setLatestRequest] = useState<any>(() => {
    try {
      const savedUserStr = localStorage.getItem('earn_saved_user');
      const uid = savedUserStr ? JSON.parse(savedUserStr)?.id : null;
      if (uid) {
        const saved = localStorage.getItem(`earn_pending_act_${uid}`);
        return saved ? JSON.parse(saved) : null;
      }
    } catch {}
    return null;
  });
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      // Sync locally cached pending request with server to prevent loss on reload
      if (user?.id) {
        const localSaved = localStorage.getItem(`earn_pending_act_${user.id}`);
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (parsed && parsed.status === 'pending') {
              authFetch('/api/activation/sync-pending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ request: parsed }),
              }).catch(() => {});
            }
          } catch {}
        }
      }

      const res = await authFetch('/api/activation/status');
      if (res.ok) {
        const data = await res.json();
        if (data.latestRequest) {
          setLatestRequest(data.latestRequest);
          if (user?.id) {
            if (data.latestRequest.status === 'approved' || data.isActive) {
              localStorage.removeItem(`earn_pending_act_${user.id}`);
            } else {
              localStorage.setItem(`earn_pending_act_${user.id}`, JSON.stringify(data.latestRequest));
            }
          }
        }
        if (data.isActive && !user?.isActive) {
          await refreshUserData();
          showToast(language === 'bn' ? 'অভিনন্দন! আপনার আইডি সক্রিয় হয়েছে!' : 'Congratulations! Your ID has been activated!');
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchStatus();
    refreshConfig();

    // Fast polling while user is waiting for activation approval
    if (user?.isActive) return;
    const interval = setInterval(() => {
      fetchStatus();
      refreshUserData();
    }, 2500);

    return () => clearInterval(interval);
  }, [user?.isActive, user?.id]);

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    showToast(`${t.copied}: ${num}`);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await authFetch('/api/activation/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          paymentMethod: selectedMethod,
          transactionId: transactionId.trim(),
          userId: user?.id,
          userName: user?.name,
          userPhone: user?.phone,
        }),
      });

      const data = await safeJson(res, 'আবেদন সম্পন্ন করা যায়নি');
      if (!res.ok) {
        if (res.status === 401 || (data.error && data.error.includes('Unauthorized'))) {
          setError(
            language === 'bn'
              ? 'লগইন সেশন পাওয়া যায়নি বা মেয়াদ শেষ হয়েছে। অনুগ্রহ করে আবার লগইন করুন।'
              : 'Unauthorized. Please login again to submit your transaction.'
          );
        } else {
          setError(data.error || 'Activation request failed');
        }
      } else {
        const submitted = data.request || {
          category: selectedCategory,
          paymentMethod: selectedMethod,
          transactionId: transactionId.trim(),
          amount: selectedCatObj.fee,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };
        setSuccessNotice(true);
        setLatestRequest(submitted);
        setTransactionId('');
        if (user?.id) {
          localStorage.setItem(`earn_pending_act_${user.id}`, JSON.stringify(submitted));
        }
        await fetchStatus();
        await refreshUserData();
        showToast(language === 'bn' ? 'আবেদন সফলভাবে পাঠানো হয়েছে!' : 'Request submitted successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = config?.categories || [
    { id: 'A' as CategoryType, nameEn: 'Category A', nameBn: 'ক্যাটাগরি A', fee: 500, dailyLimit: 50, extensionDays: 2, teamBonus: 10 },
    { id: 'B' as CategoryType, nameEn: 'Category B', nameBn: 'ক্যাটাগরি B', fee: 1000, dailyLimit: 100, extensionDays: 3, teamBonus: 20 },
    { id: 'C' as CategoryType, nameEn: 'Category C', nameBn: 'ক্যাটাগরি C', fee: 1500, dailyLimit: 150, extensionDays: 4, teamBonus: 30 },
  ];

  const paymentMethods = config?.paymentMethods || [
    { id: 'bKash' as const, name: 'bKash', nameBn: 'বিকাশ', number: '01604606880', logo: '/logos/bkash.svg', color: '#E2136E' },
    { id: 'Nagad' as const, name: 'Nagad', nameBn: 'নগদ', number: '01604606880', logo: '/logos/nagad.svg', color: '#F7931E' },
    { id: 'Rocket' as const, name: 'Rocket', nameBn: 'রকেট', number: '01604606880', logo: '/logos/rocket.svg', color: '#8E2DE2' },
  ];

  const selectedCatObj = categories.find((c) => c.id === selectedCategory) || categories[0];
  const selectedMethodObj = paymentMethods.find((m) => m.id === selectedMethod) || paymentMethods[0];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-white tracking-tight">
          {t.activateIdTitle}
        </h2>
        <p className="text-xs text-slate-300 max-w-md mx-auto">
          {t.sendMoneyInstructions}
        </p>
      </div>

      {/* Active User Status Badge if already active */}
      {user?.isActive && (
        <LiquidCard elevated className="border-emerald-400/40 bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {t.alreadyActive} {user.category})
              </span>
              <span className="text-xs text-slate-300">
                {language === 'bn' ? 'আপনি চাইলে নতুন ক্যাটাগরিতে আপগ্রেড করতে পারেন।' : 'You can request an upgrade anytime.'}
              </span>
            </div>
          </div>
          <span className="text-xs font-black text-emerald-400 uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            {t.active}
          </span>
        </LiquidCard>
      )}

      {/* Pending Request Banner */}
      {latestRequest && latestRequest.status === 'pending' && (
        <LiquidCard elevated className="border-amber-400/40 bg-amber-950/30">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-5 h-5 animate-spin" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">
                  {language === 'bn' ? `ক্যাটাগরি ${latestRequest.category} রিকোয়েস্ট পেন্ডিং` : `Category ${latestRequest.category} Request Pending`}
                </span>
                <span className="text-[10px] font-bold text-amber-300 px-2 py-0.5 rounded-full bg-amber-500/20 uppercase">
                  {t.pending}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {t.activationPendingNotice}
              </p>
              <div className="text-[11px] font-mono text-cyan-300 pt-1">
                TrxID: {latestRequest.transactionId} · ৳{latestRequest.amount} via {latestRequest.paymentMethod}
              </div>
            </div>
          </div>
        </LiquidCard>
      )}

      {/* 1. Category Selection Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
          1. {t.chooseCategory}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`
                  p-5 rounded-[26px] text-left transition-all relative cursor-pointer
                  ${
                    isSelected
                      ? 'liquid-glass-elevated border-cyan-400/70 shadow-[0_12px_30px_rgba(6,182,212,0.25)]'
                      : 'liquid-glass hover:border-white/30'
                  }
                `}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center shadow-md">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}
                <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 mb-1">
                  {language === 'bn' ? cat.nameBn : cat.nameEn}
                </div>
                <div className="text-xl font-black text-white">
                  ৳{cat.dailyLimit}
                  <span className="text-xs font-normal text-slate-300 ml-1">/{t.perDay}</span>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 text-xs flex justify-between items-center text-slate-300">
                  <span>{t.activationFee}:</span>
                  <span className="font-extrabold text-white text-sm">৳{cat.fee}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Three Large Liquid-Glass Payment Cards with Brand Logos & Copy Buttons */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">
          2. {t.selectPaymentMethod} & Send Fee (৳{selectedCatObj.fee})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {paymentMethods.map((pm) => {
            const isSelected = selectedMethod === pm.id;
            const isCopied = copiedNumber === pm.number;

            return (
              <div
                key={pm.id}
                onClick={() => setSelectedMethod(pm.id)}
                className={`
                  p-4 rounded-[26px] transition-all cursor-pointer relative flex flex-col justify-between
                  ${
                    isSelected
                      ? 'liquid-glass-elevated border-cyan-400/60 shadow-[0_10px_28px_rgba(6,182,212,0.2)]'
                      : 'liquid-glass hover:border-white/30'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-28 flex items-center overflow-hidden">
                    <img
                      src={pm.logo}
                      alt={pm.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-auto object-contain rounded-lg"
                      onError={(e) => {
                        // Fallback text badge if logo image fails
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <span className="text-sm font-black text-white ml-1">
                      {pm.name}
                    </span>
                  </div>

                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={isSelected}
                    onChange={() => setSelectedMethod(pm.id)}
                    className="accent-cyan-400 h-4 w-4"
                  />
                </div>

                <div className="space-y-1 my-1">
                  <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                    {language === 'bn' ? 'পার্সোনাল নম্বর (Send Money)' : 'Personal Number'}
                  </span>
                  <span className="text-base font-extrabold text-white font-mono tracking-tight block">
                    {pm.number}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(pm.number);
                    }}
                    className="w-full py-2 px-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-slate-200 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{t.copied}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.copy}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Transaction ID Submission Form */}
      <LiquidCard elevated className="border-white/20">
        <h3 className="text-sm font-bold text-slate-200 mb-4 flex items-center gap-2">
          <span>3.</span>
          <span>
            {language === 'bn'
              ? `ট্রানজেকশন আইডি দিন (ক্যাটাগরি ${selectedCategory} - ৳${selectedCatObj.fee} via ${selectedMethod})`
              : `Submit TrxID (Category ${selectedCategory} - ৳${selectedCatObj.fee} via ${selectedMethod})`}
          </span>
        </h3>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {(error.includes('লগইন') || error.includes('login') || error.includes('Unauthorized')) && (
              <button
                type="button"
                onClick={() => logout()}
                className="self-start mt-1 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-[11px] border border-white/20 flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <span>{language === 'bn' ? 'লগইন পেজে যান' : 'Go to Login'}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <LiquidInput
            label={t.transactionId}
            placeholder={t.transactionIdPlaceholder}
            value={transactionId}
            onChange={(e) => setTransactionId(e.target.value)}
            required
            className="uppercase font-mono tracking-wider text-base"
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
              <span>{t.submitActivation}</span>
            </LiquidButton>
          </div>
        </form>
      </LiquidCard>
    </div>
  );
}
