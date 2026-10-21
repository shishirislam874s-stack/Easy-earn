import { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  Award,
  TrendingUp,
  UserCheck,
  UserX,
  Gift,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton } from '../components/LiquidGlass';

interface TeamViewProps {
  onBack: () => void;
}

export function TeamView({ onBack }: TeamViewProps) {
  const { language, t } = useAuth();
  const [teamData, setTeamData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTeam = async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        const json = await res.json();
        setTeamData(json);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const activatedCount = teamData?.activatedCount || 0;
  const target = teamData?.teamSizeTarget || 20;
  const progressPercent = Math.min(100, Math.round((activatedCount / target) * 100));
  const isLeader = Boolean(teamData?.isTeamLeader);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="liquid-pill px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>
        <h2 className="text-lg font-bold text-white tracking-tight">{t.myTeamTitle}</h2>
        <div className="w-16"></div>
      </div>

      {/* Team Leader Status & Goal Progress Card */}
      <LiquidCard elevated className={isLeader ? 'border-purple-400/50 shadow-[0_12px_32px_rgba(168,85,247,0.2)]' : 'border-white/20'}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
              isLeader 
                ? 'bg-purple-500/20 border border-purple-400/50 text-purple-300' 
                : 'bg-white/10 border border-white/20 text-slate-400'
            }`}>
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t.teamStatus}
              </span>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>{isLeader ? t.teamLeader : t.generalMember}</span>
                {isLeader && <Sparkles className="w-4 h-4 text-purple-400" />}
              </h3>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.totalTeamBonusEarned}
            </span>
            <span className="text-xl font-black text-purple-400 block">
              ৳{teamData?.totalTeamBonus || 0}
            </span>
          </div>
        </div>

        {/* Progress Bar towards 20 activated referrals */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">{t.teamLeaderGoal}</span>
            <span className="text-cyan-300 font-mono">
              {activatedCount} / {target}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-800 p-0.5 border border-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 pt-0.5">
            {isLeader
              ? (language === 'bn' ? 'আপনি সফলভাবে টিম লিডার হয়েছেন! আপনার টিম মেম্বারদের রেফারাল থেকে টিম বোনাস পাচ্ছেন।' : 'You are an active Team Leader! Earning bonuses from your members.')
              : (language === 'bn' ? `টিম লিডার হতে আরও ${Math.max(0, target - activatedCount)} ${t.activatedMembersRequired}` : `${Math.max(0, target - activatedCount)} more active members needed.`)}
          </p>
        </div>
      </LiquidCard>

      {/* Direct Referrals List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{t.directMembersList}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
              {teamData?.members?.length || 0}
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-sm">{t.loading}</div>
        ) : (!teamData?.members || teamData.members.length === 0) ? (
          <LiquidCard className="text-center py-8">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t.noDirectMembers}</p>
          </LiquidCard>
        ) : (
          <div className="space-y-2.5">
            {teamData.members.map((member: any) => (
              <LiquidCard
                key={member.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:border-white/30"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    member.isActive 
                      ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400' 
                      : 'bg-white/10 border border-white/10 text-slate-400'
                  }`}>
                    {member.isActive ? <UserCheck className="w-5 h-5" /> : <UserX className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{member.name}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono">ID: {member.id}</span>
                      <span>·</span>
                      <span className={member.isActive ? 'text-emerald-400 font-semibold' : 'text-slate-400'}>
                        {member.isActive ? (member.category ? `Cat ${member.category}` : t.active) : t.inactive}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    {t.membersBrought}
                  </span>
                  <span className="text-sm font-bold text-cyan-300 font-mono">
                    {member.membersBrought} {language === 'bn' ? 'জন' : 'users'}
                  </span>
                </div>
              </LiquidCard>
            ))}
          </div>
        )}
      </div>

      {/* Team Bonus History Audit Log */}
      <div>
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-purple-400" />
          <span>{t.teamBonusHistoryTitle}</span>
        </h3>

        {(!teamData?.teamBonusHistory || teamData.teamBonusHistory.length === 0) ? (
          <LiquidCard className="text-center py-6">
            <p className="text-xs text-slate-400">{t.noTeamBonusHistory}</p>
          </LiquidCard>
        ) : (
          <div className="space-y-2">
            {teamData.teamBonusHistory.map((tb: any) => (
              <LiquidCard key={tb.id} className="p-3.5 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="text-purple-300">{t.bonusReceivedFrom}:</span>
                    <span>{tb.referrerName}</span>
                    <span className="text-slate-400">({tb.category})</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {t.newActivatedMember}: {tb.activatedUserName} · {new Date(tb.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-emerald-400 font-mono">
                    +৳{tb.amount}
                  </span>
                </div>
              </LiquidCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
