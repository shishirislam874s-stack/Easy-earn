import { useState, useEffect } from 'react';
import {
  Users,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Calendar,
  Gift,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton } from '../components/LiquidGlass';
import { authFetch } from '../lib/api';

interface ReferralViewProps {
  onGoToTeam: () => void;
  onGoToCategory: () => void;
}

export function ReferralView({ onGoToTeam, onGoToCategory }: ReferralViewProps) {
  const {
    user,
    config,
    showToast,
    language,
    t,
    referralsTowardsWork,
    isInitialFiveDays,
    workDaysRemaining,
  } = useAuth();
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReferralData = async () => {
    try {
      const res = await authFetch('/api/referral');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralData();
  }, []);

  if (user && !user.isActive) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <LiquidCard elevated className="text-center py-10 border-amber-500/30">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {language === 'bn' ? 'রেফার পেজ লক করা' : 'Referral Locked'}
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

  // Build referral link from PUBLIC_SITE_URL or window.location.origin
  const baseUrl = config?.publicSiteUrl || window.location.origin;
  const referralLink = `${baseUrl}/?ref=${user?.referralCode || user?.id || ''}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    showToast(t.copied);
    setTimeout(() => setCopied(false), 2000);
  };

  const extensionDays = data?.extensionDays || { A: 2, B: 3, C: 4 };
  const teamBonusAmounts = data?.teamBonusAmounts || { A: 10, B: 20, C: 30 };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          {t.referTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          {t.referDesc}
        </p>
      </div>

      {/* Referral Link Card */}
      <LiquidCard elevated className="border-cyan-400/40">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
          {t.yourReferralLink}
        </span>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 font-mono text-xs sm:text-sm text-cyan-300 truncate select-all">
            {referralLink}
          </div>
          <LiquidButton
            variant="primary"
            size="md"
            onClick={handleCopyLink}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>{t.copied}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>{t.copyLink}</span>
              </>
            )}
          </LiquidButton>
        </div>
      </LiquidCard>

      {/* Stats Summary 4-Column Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <LiquidCard className="p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.totalReferrals}
          </span>
          <span className="text-2xl font-black text-white mt-1 block">
            {data?.totalReferrals || 0}
          </span>
        </LiquidCard>

        <LiquidCard className="p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.activatedReferrals}
          </span>
          <span className="text-2xl font-black text-emerald-400 mt-1 block">
            {data?.activatedReferrals || 0}
          </span>
        </LiquidCard>

        <LiquidCard className="p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.teamStatus}
          </span>
          <span className="text-xs font-black text-cyan-300 mt-2 block leading-snug">
            {data?.isTeamLeader ? t.teamLeader : t.generalMember}
          </span>
        </LiquidCard>

        <LiquidCard className="p-4 text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {language === 'bn' ? 'টিম বোনাস আয়' : 'Team Bonus'}
          </span>
          <span className="text-2xl font-black text-purple-400 mt-1 block">
            ৳{data?.totalTeamBonus || 0}
          </span>
        </LiquidCard>
      </div>

      {/* Rewards breakdown card */}
      {/* Live 5-Referral Work Unlock Progress Widget */}
      <LiquidCard elevated className="border-cyan-400/40 space-y-4">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider">
              {language === 'bn' ? 'কাজের মেয়াদ আনলক অগ্রগতি' : 'Work Unlock Progress'}
            </h4>
          </div>
          <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
            {language === 'bn' ? `ক্যাটাগরি ${user?.category || 'A'}` : `Cat ${user?.category || 'A'}`}
          </span>
        </div>

        {isInitialFiveDays ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/30 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{language === 'bn' ? `প্রাথমিক ৫ দিনের কাজ চলছে (বাকি ${workDaysRemaining} দিন)` : `Initial 5 days active (${workDaysRemaining} days left)`}</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              {language === 'bn'
                ? '⚠️ শুরুতেই সবাই একটানা ৫ দিন কাজ করতে পারে। এই প্রাথমিক ৫ দিনের মধ্যে আপনি যত রেফারই করুন না কেন, তা কাজের মেয়াদ বৃদ্ধির জন্য হিসেবে ধরা হবে না। ৫ দিন শেষ হওয়ার পর পরবর্তী রেফার গণনা শুরু হবে।'
                : '⚠️ Initial 5 days are included upon activation. Referrals during these initial 5 days do not count towards work extensions.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>{language === 'bn' ? '৫ জন রেফার অগ্রগতি:' : '5-Referral Progress:'}</span>
              <span className="text-cyan-300 font-mono font-black">{referralsTowardsWork || 0} / 5</span>
            </div>
            <div className="w-full h-3 rounded-full bg-slate-800 p-0.5 border border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((referralsTowardsWork || 0) / 5) * 100))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>
                {5 - (referralsTowardsWork || 0) > 0
                  ? (language === 'bn' ? `আরও ${5 - (referralsTowardsWork || 0)} জন রেফার বাকি` : `${5 - (referralsTowardsWork || 0)} more needed`)
                  : (language === 'bn' ? '৫ জন রেফার সম্পন্ন!' : '5 referrals completed!')}
              </span>
              <span className="text-emerald-300 font-semibold">
                {language === 'bn'
                  ? `আনলক হবে: +${extensionDays[user?.category || 'A'] || 2} দিন`
                  : `Unlocks: +${extensionDays[user?.category || 'A'] || 2} days`}
              </span>
            </div>
          </div>
        )}

        {/* Category Days Chart */}
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            {language === 'bn' ? 'ক্যাটাগরি অনুযায়ী ৫ রেফার করলে আনলক হবে:' : 'Unlock Days per 5 Referrals:'}
          </span>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`p-2.5 rounded-2xl border ${user?.category === 'A' ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <span className="text-[11px] text-slate-300 block font-bold">Cat A</span>
              <span className="text-sm font-black text-white">৫ রেফ = ২ দিন</span>
            </div>
            <div className={`p-2.5 rounded-2xl border ${user?.category === 'B' ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <span className="text-[11px] text-slate-300 block font-bold">Cat B</span>
              <span className="text-sm font-black text-white">৫ রেফ = ৩ দিন</span>
            </div>
            <div className={`p-2.5 rounded-2xl border ${user?.category === 'C' ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200 shadow-sm' : 'bg-white/5 border-white/10'}`}>
              <span className="text-[11px] text-slate-300 block font-bold">Cat C</span>
              <span className="text-sm font-black text-white">৫ রেফ = ৪ দিন</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            {language === 'bn'
              ? '📌 নির্ধারিত দিন (২/৩/৪ দিন) কাজ করার পর আবার অফ হবে এবং পুনরায় ৫ জন রেফার করে আবার কাজ চালু করতে পারবেন।'
              : '📌 After completing unlocked days, work stops again until 5 more referrals are made.'}
          </p>
        </div>

        {/* Team Bonus Rewards */}
        <div className="pt-3 border-t border-white/10">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-purple-400" />
            <span>{t.teamBonusShare}</span>
          </h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-bold">Cat A</span>
              <span className="text-sm font-black text-purple-300">+৳{teamBonusAmounts.A}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-bold">Cat B</span>
              <span className="text-sm font-black text-purple-300">+৳{teamBonusAmounts.B}</span>
            </div>
            <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] text-slate-400 block font-bold">Cat C</span>
              <span className="text-sm font-black text-purple-300">+৳{teamBonusAmounts.C}</span>
            </div>
          </div>
        </div>

        {/* CTA to My Team page */}
        <div className="pt-2">
          <LiquidButton
            variant="secondary"
            fullWidth
            size="md"
            onClick={onGoToTeam}
          >
            <span>{t.myTeamBtn}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </LiquidButton>
        </div>
      </LiquidCard>
    </div>
  );
}
