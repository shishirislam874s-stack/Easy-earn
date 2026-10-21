import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/TopBar';
import { BottomNav } from './components/BottomNav';
import { NotificationModal } from './components/NotificationModal';
import { LogoutModal } from './components/LogoutModal';
import { LanguageSelectorModal } from './components/LanguageSelectorModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { LoginView } from './views/LoginView';
import { VideosView } from './views/VideosView';
import { ActivationView } from './views/ActivationView';
import { ReferralView } from './views/ReferralView';
import { TeamView } from './views/TeamView';
import { WithdrawView } from './views/WithdrawView';
import { HistoryView } from './views/HistoryView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminPanelView } from './views/AdminPanelView';
import { Sparkles, Megaphone, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BroadcastItem } from './types';

function MainAppContent() {
  const { user, isAdmin, isLoading, toastMessage, language, t } = useAuth();

  // Tab State
  const [currentTab, setCurrentTab] = useState<string>('tasks');
  const [isAdminLoginRoute, setIsAdminLoginRoute] = useState<boolean>(() => {
    return window.location.pathname === '/admin/login' || window.location.hash === '#admin-login';
  });

  // Modals
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [closedBroadcastIds, setClosedBroadcastIds] = useState<Set<string>>(new Set());

  // Listen to hash / url changes
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#admin-login' || window.location.pathname === '/admin/login') {
        setIsAdminLoginRoute(true);
      } else {
        setIsAdminLoginRoute(false);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Fetch broadcasts
  useEffect(() => {
    fetch('/api/broadcasts')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.broadcasts) {
          setBroadcasts(data.broadcasts);
        }
      })
      .catch(() => {});
  }, []);

  const activeBroadcasts = broadcasts.filter((b) => !closedBroadcastIds.has(b.id));

  const dismissBroadcast = (id: string) => {
    setClosedBroadcastIds((prev) => new Set([...prev, id]));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#07090e] text-white flex flex-col items-center justify-center p-4">
        <div className="relative">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 animate-spin flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
        </div>
        <span className="text-xs font-semibold text-slate-400 mt-4 tracking-wider uppercase">
          {t.loading}
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#07090e] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Slow-moving Animated Colorful Blurred Liquid Orbs Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/15 blur-[120px] animate-orb-1" />
        <div className="absolute top-[30%] right-[-15%] w-[55vw] h-[55vw] rounded-full bg-purple-600/15 blur-[130px] animate-orb-2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-pink-600/12 blur-[125px] animate-orb-3" />
      </div>

      {/* Top Bar Contract compliant Navigation */}
      <TopBar
        onOpenNotifications={() => setIsNotificationOpen(true)}
        onOpenLogoutModal={() => setIsLogoutOpen(true)}
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsAdminLoginRoute(false);
          setCurrentTab(tab);
        }}
      />

      {/* Broadcast Announcements Banner */}
      {activeBroadcasts.length > 0 && !isAdmin && (
        <div className="relative z-30 max-w-4xl mx-auto px-4 pt-3 w-full">
          {activeBroadcasts.map((bc) => (
            <motion.div
              key={bc.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-600/30 via-cyan-600/20 to-indigo-600/30 border border-cyan-400/40 text-xs text-white flex items-center justify-between gap-3 shadow-lg shadow-cyan-500/10 mb-2 backdrop-blur-xl"
            >
              <div className="flex items-center gap-2.5">
                <span className="h-7 w-7 rounded-xl bg-cyan-500/30 flex items-center justify-center shrink-0 text-cyan-300">
                  <Megaphone className="w-4 h-4" />
                </span>
                <div>
                  <span className="font-bold text-cyan-200 block">
                    {language === 'bn' ? bc.titleBn : bc.titleEn}
                  </span>
                  <span className="text-slate-300">
                    {language === 'bn' ? bc.messageBn : bc.messageEn}
                  </span>
                </div>
              </div>
              <button
                onClick={() => dismissBroadcast(bc.id)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 shrink-0 cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main Dynamic View Content */}
      <main className="relative z-10 flex-1 pb-24 md:pb-12">
        {isAdmin ? (
          <AdminPanelView />
        ) : isAdminLoginRoute ? (
          <AdminLoginView
            onBackToUser={() => {
              setIsAdminLoginRoute(false);
              window.location.hash = '';
            }}
            onLoginSuccess={() => {
              setIsAdminLoginRoute(false);
            }}
          />
        ) : !user ? (
          <LoginView
            onGoToAdminLogin={() => {
              setIsAdminLoginRoute(true);
              window.location.hash = '#admin-login';
            }}
            onLoginSuccess={() => {
              setCurrentTab('tasks');
            }}
          />
        ) : (
          <>
            {currentTab === 'tasks' && (
              <VideosView
                onGoToCategory={() => setCurrentTab('category')}
                onGoToRefer={() => setCurrentTab('refer')}
              />
            )}
            {currentTab === 'category' && <ActivationView />}
            {currentTab === 'refer' && (
              <ReferralView
                onGoToTeam={() => setCurrentTab('team')}
                onGoToCategory={() => setCurrentTab('category')}
              />
            )}
            {currentTab === 'team' && (
              <TeamView onBack={() => setCurrentTab('refer')} />
            )}
            {currentTab === 'withdraw' && (
              <WithdrawView onGoToCategory={() => setCurrentTab('category')} />
            )}
            {currentTab === 'history' && (
              <HistoryView onOpenLogoutModal={() => setIsLogoutOpen(true)} />
            )}
          </>
        )}
      </main>

      {/* Mobile-First Bottom Navigation Bar */}
      {user && !isAdmin && !isAdminLoginRoute && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
        />
      )}

      {/* Modals & Offline Indicator */}
      <OfflineIndicator />
      <LanguageSelectorModal />
      <NotificationModal
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
      />
      <LogoutModal
        isOpen={isLogoutOpen}
        onClose={() => setIsLogoutOpen(false)}
      />

      {/* Floating Liquid-Glass Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.92 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="liquid-glass-elevated border-cyan-400/50 shadow-2xl px-5 py-2.5 rounded-full text-xs font-bold text-white flex items-center gap-2 tracking-wide">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
