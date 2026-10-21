import { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, Sparkles, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { NotificationItem } from '../types';
import { LiquidButton } from './LiquidGlass';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { language, t, refreshUserData } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/mark-read', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      refreshUserData();
    } catch {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative w-full max-w-md rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{t.notifications}</h3>
                <span className="text-xs text-slate-400">
                  {notifications.filter((n) => !n.isRead).length} {language === 'bn' ? 'টি অপঠিত' : 'unread'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {notifications.some((n) => !n.isRead) && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 hover:bg-cyan-500/20 transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>{t.markAllRead}</span>
                </button>
              )}
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
            {isLoading ? (
              <div className="py-8 text-center text-slate-400 text-sm">{t.loading}</div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                <p className="text-sm">{t.noNotifications}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 rounded-2xl transition-all ${
                    n.isRead
                      ? 'bg-white/5 border border-white/5 text-slate-300'
                      : 'bg-cyan-500/10 border border-cyan-400/30 text-white shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      {language === 'bn' ? n.titleBn : n.titleEn}
                    </span>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'bn' ? n.messageBn : n.messageEn}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-white/10 shrink-0">
            <LiquidButton variant="secondary" fullWidth size="sm" onClick={onClose}>
              {t.close}
            </LiquidButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
