import { PlayCircle, Shield, Users, Wallet, Clock, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export function BottomNav({ currentTab, onSelectTab }: BottomNavProps) {
  const { user, isAdmin, t } = useAuth();

  if (isAdmin) {
    return null; // Admin has its own top sticky tabs
  }

  const isInactive = user && !user.isActive;

  const tabs = [
    {
      id: 'tasks',
      label: t.navTasks,
      icon: PlayCircle,
      isLocked: isInactive,
    },
    {
      id: 'category',
      label: t.navCategory,
      icon: Shield,
      isLocked: false,
    },
    {
      id: 'refer',
      label: t.navRefer,
      icon: Users,
      isLocked: isInactive,
    },
    {
      id: 'withdraw',
      label: t.navWithdraw,
      icon: Wallet,
      isLocked: isInactive,
    },
    {
      id: 'history',
      label: t.navHistory,
      icon: Clock,
      isLocked: false,
    },
  ];

  return (
    <div className="fixed bottom-3 inset-x-0 z-40 flex justify-center px-3 pointer-events-none md:hidden">
      <nav
        aria-label="Bottom Navigation"
        className="pointer-events-auto relative w-full max-w-md h-16 rounded-full px-2 py-1.5 flex items-center justify-around liquid-glass refraction-lens-fx shadow-[0_16px_40px_rgba(0,0,0,0.6)] border border-white/25"
      >
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="relative flex flex-col items-center justify-center flex-1 h-full select-none cursor-pointer group"
            >
              {/* Active Morphing Liquid Blob */}
              {isActive && (
                <motion.div
                  layoutId="activeTabBlob"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-x-1 inset-y-0.5 rounded-full bg-gradient-to-tr from-cyan-500/30 via-blue-500/20 to-purple-500/25 border border-cyan-400/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_4px_16px_rgba(6,182,212,0.35)]"
                />
              )}

              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-300' : 'text-slate-400'
                    }`}
                  />
                  {tab.isLocked && (
                    <span className="absolute -top-1 -right-2 bg-amber-500/90 text-slate-950 p-0.5 rounded-full">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
                <span
                  className={`text-[10px] font-semibold mt-0.5 tracking-tight whitespace-nowrap transition-colors ${
                    isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'
                  }`}
                >
                  {tab.label}
                </span>
              </div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
