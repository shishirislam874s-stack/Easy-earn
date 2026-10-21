import React, { useState } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAuth } from '../context/AuthContext';
import { InstallAppModal } from './InstallAppModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'pill' | 'banner' | 'icon';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'pill',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const { language } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isBn = language === 'bn';

  // If already running in standalone app mode, hide button
  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setIsModalOpen(true);
      }
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {variant === 'banner' ? (
        <div
          onClick={handleClick}
          className={`cursor-pointer p-3 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-between gap-3 shadow-lg shadow-cyan-500/10 hover:border-cyan-400 transition-all ${className}`}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/20">
              <Download className="w-4 h-4 text-white animate-bounce" />
            </span>
            <div>
              <div className="font-bold text-white text-xs">
                {isBn ? '📱 অ্যাপটি ফোনে ডাউনলোড/ইনস্টল করুন' : '📱 Download/Install Mobile App'}
              </div>
              <div className="text-[11px] text-cyan-200/80">
                {isBn
                  ? 'হোম স্ক্রিন থেকে সাধারণ অ্যাপের মতো চালাতে ট্যাপ করুন'
                  : 'Tap to install directly onto your home screen'}
              </div>
            </div>
          </div>
          <span className="liquid-pill px-3 py-1.5 bg-cyan-500/30 text-white font-bold text-[11px] shrink-0 border-cyan-400/50">
            {isBn ? 'ডাউনলোড' : 'Install'}
          </span>
        </div>
      ) : variant === 'icon' ? (
        <button
          onClick={handleClick}
          title={isBn ? 'অ্যাপ ডাউনলোড করুন' : 'Download App'}
          className={`h-9 w-9 rounded-full bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-cyan-400/40 ${className}`}
        >
          <Download className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`liquid-pill px-3 py-1.5 text-xs font-bold text-cyan-300 border-cyan-400/50 hover:bg-cyan-500/20 flex items-center gap-1.5 cursor-pointer shadow-sm shadow-cyan-500/20 transition-all ${className}`}
        >
          <Download className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{isBn ? 'অ্যাপ ডাউনলোড' : 'Install App'}</span>
        </button>
      )}

      <InstallAppModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
