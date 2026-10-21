import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Language, AppConfig } from '../types';
import { translations } from '../i18n';
import {
  authFetch,
  adminFetch,
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  setAdminToken,
  removeAdminToken,
} from '../lib/api';

interface AuthContextType {
  user: UserProfile | null;
  isAdmin: boolean;
  isLoading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  hasChosenLanguageFirstTime: boolean;
  completeLanguageSelection: (lang: Language) => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  earnedToday: number;
  dailyCap: number;
  pendingVideoRewards: number;
  isWorkWindowOpen: boolean;
  workDaysRemaining: number;
  unreadNotifications: number;
  config: AppConfig | null;
  referredByName: string | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  login: (phone: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, phone: string, pass: string, refCode?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminLogin: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  refreshUserData: () => Promise<void>;
  refreshConfig: () => Promise<void>;
  t: typeof translations.bn;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Language: Bangla default
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('earn_lang');
    return (saved === 'en' || saved === 'bn') ? saved : 'bn';
  });

  const [hasChosenLanguageFirstTime, setHasChosenLanguageFirstTime] = useState<boolean>(() => {
    return Boolean(localStorage.getItem('earn_lang_selected'));
  });

  // User stats
  const [earnedToday, setEarnedToday] = useState(0);
  const [dailyCap, setDailyCap] = useState(0);
  const [pendingVideoRewards, setPendingVideoRewards] = useState(0);
  const [isWorkWindowOpen, setIsWorkWindowOpen] = useState(false);
  const [workDaysRemaining, setWorkDaysRemaining] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [config, setConfig] = useState<AppConfig | null>(null);
  const [referredByName, setReferredByName] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('earn_lang', lang);
    document.documentElement.lang = lang;
  };

  const completeLanguageSelection = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('earn_lang_selected', 'true');
    setHasChosenLanguageFirstTime(true);
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (next === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
  };

  // Referral capture: check ?ref=CODE
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      const cleanRef = ref.trim();
      localStorage.setItem('earn_ref_code', cleanRef);
      // Also store in cookie so it survives across sessions
      document.cookie = `earn_ref_code=${encodeURIComponent(cleanRef)}; path=/; max-age=2592000; SameSite=Lax`;

      // Lookup referrer name to show toast
      fetch(`/api/referral/lookup/${encodeURIComponent(cleanRef)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.found) {
            setReferredByName(data.name);
            const msg = language === 'bn' 
              ? `রেফারকারী: ${data.name}` 
              : `Referred by: ${data.name}`;
            showToast(msg);
          }
        })
        .catch(() => {});
    }
  }, []);

  const refreshConfig = async () => {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error('Failed to load config:', err);
    }
  };

  const refreshUserData = async (explicitToken?: string) => {
    try {
      const activeToken = explicitToken || getAuthToken();
      if (!activeToken) {
        setUser(null);
        return;
      }
      const res = await authFetch('/api/auth/me', {}, activeToken);
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setEarnedToday(data.earnedToday || 0);
        setDailyCap(data.dailyCap || 0);
        setPendingVideoRewards(data.pendingVideoRewards || 0);
        setIsWorkWindowOpen(Boolean(data.isWorkWindowOpen));
        setWorkDaysRemaining(data.workDaysRemaining || 0);
        setUnreadNotifications(data.unreadNotifications || 0);
      } else if (res.status === 401) {
        removeAuthToken();
        setUser(null);
      }
    } catch (err) {
      console.warn('Network issue fetching user data, keeping existing session:', err);
    }
  };

  const checkAdminStatus = async () => {
    try {
      const res = await adminFetch('/api/admin/me');
      if (res.ok) {
        setIsAdmin(true);
      } else if (res.status === 401) {
        removeAdminToken();
        setIsAdmin(false);
      }
    } catch {
      // Don't eagerly wipe on transient connection issues
    }
  };

  useEffect(() => {
    document.documentElement.lang = language;
    Promise.all([refreshConfig(), refreshUserData(), checkAdminStatus()]).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const login = async (phone: string, pass: string) => {
    try {
      const cleanPhone = (phone || '').trim().replace(/[\s\-]/g, '');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password: pass }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.token) {
        await refreshUserData(data.token);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const register = async (name: string, phone: string, pass: string, refCode?: string) => {
    try {
      const cleanPhone = (phone || '').trim().replace(/[\s\-]/g, '');
      const finalRef = refCode || localStorage.getItem('earn_ref_code') || '';
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), phone: cleanPhone, password: pass, refCode: finalRef }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      if (data.token) {
        setAuthToken(data.token);
      }
      setUser(data.user);
      if (data.token) {
        await refreshUserData(data.token);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const logout = async () => {
    try {
      await authFetch('/api/auth/logout', { method: 'POST' });
    } finally {
      removeAuthToken();
      setUser(null);
      window.location.hash = '';
    }
  };

  const adminLogin = async (username: string, pass: string) => {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password: pass }),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Admin login failed' };
      }
      if (data.token) {
        setAdminToken(data.token);
      }
      setIsAdmin(true);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection error' };
    }
  };

  const adminLogout = async () => {
    try {
      await adminFetch('/api/admin/logout', { method: 'POST' });
    } finally {
      removeAdminToken();
      setIsAdmin(false);
      window.location.hash = '';
    }
  };

  const t = translations[language];

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        language,
        setLanguage,
        hasChosenLanguageFirstTime,
        completeLanguageSelection,
        theme,
        toggleTheme,
        earnedToday,
        dailyCap,
        pendingVideoRewards,
        isWorkWindowOpen,
        workDaysRemaining,
        unreadNotifications,
        config,
        referredByName,
        toastMessage,
        showToast,
        login,
        register,
        logout,
        adminLogin,
        adminLogout,
        refreshUserData,
        refreshConfig,
        t,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
