import { useState } from 'react';
import { Bell, LogOut, ShieldCheck, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidButton } from './LiquidGlass';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  onOpenNotifications: () => void;
  onOpenLogoutModal: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export function TopBar({
  onOpenNotifications,
  onOpenLogoutModal,
  currentTab,
  onSelectTab,
}: TopBarProps) {
  const { user, isAdmin, language, setLanguage, unreadNotifications, theme, toggleTheme, t } = useAuth();

  const toggleLanguage = () => {
    setLanguage(language === 'bn' ? 'en' : 'bn');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur-2xl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <button
          onClick={() => onSelectTab(isAdmin ? 'admin_dashboard' : 'tasks')}
          className="text-xl sm:text-2xl font-black tracking-tight text-white whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity"
        >
          <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            {t.appName}
          </span>
        </button>

        {/* Zone 2: Navigation Links (single-line, clean text links) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          {!isAdmin ? (
            <>
              <button
                onClick={() => onSelectTab('tasks')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'tasks' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
                }`}
              >
                {t.navTasks}
              </button>
              <button
                onClick={() => onSelectTab('category')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'category' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
                }`}
              >
                {t.navCategory}
              </button>
              <button
                onClick={() => onSelectTab('refer')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'refer' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
                }`}
              >
                {t.navRefer}
              </button>
              <button
                onClick={() => onSelectTab('withdraw')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'withdraw' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
                }`}
              >
                {t.navWithdraw}
              </button>
              <button
                onClick={() => onSelectTab('history')}
                className={`whitespace-nowrap shrink-0 transition-colors ${
                  currentTab === 'history' ? 'text-cyan-400 font-semibold' : 'hover:text-white'
                }`}
              >
                {t.navHistory}
              </button>
            </>
          ) : (
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Management Mode</span>
            </span>
          )}
        </nav>

        {/* Zone 3: Primary Action / Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton variant="pill" className="hidden xs:flex" />

          {/* Language Toggle Capsule */}
          <button
            onClick={toggleLanguage}
            title={language === 'bn' ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
            className="liquid-pill px-3 py-1.5 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span className={language === 'bn' ? 'text-cyan-400 font-black' : 'text-slate-400'}>বাং</span>
            <span className="text-slate-500">/</span>
            <span className={language === 'en' ? 'text-cyan-400 font-black' : 'text-slate-400'}>EN</span>
          </button>

          {/* Theme Toggle (Light/Dark) */}
          <button
            onClick={toggleTheme}
            className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Notifications */}
          {user && (
            <button
              onClick={onOpenNotifications}
              className="relative h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-white/10"
              title={t.notifications}
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Logout Button with modal */}
          {(user || isAdmin) ? (
            <button
              onClick={onOpenLogoutModal}
              title={t.logout}
              className="liquid-pill px-3.5 py-1.5 text-xs font-semibold text-rose-300 hover:text-white hover:bg-rose-500/20 border-rose-500/30 flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.logout}</span>
            </button>
          ) : (
            <button
              onClick={() => onSelectTab('login')}
              className="liquid-pill px-4 py-1.5 text-xs font-bold text-cyan-300 border-cyan-400/40 hover:bg-cyan-500/20 cursor-pointer"
            >
              {t.login}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
