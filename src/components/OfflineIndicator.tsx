import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { language } = useAuth();
  const isBn = language === 'bn';

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-500/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white shadow-xl border border-amber-300/40">
      <WifiOff className="w-4 h-4 text-white animate-pulse" />
      <span>
        {isBn
          ? 'অফলাইন মোড — ক্যাশ করা ডাটা ব্যবহৃত হচ্ছে'
          : 'Offline Mode — Cached data is being used'}
      </span>
    </div>
  );
};
