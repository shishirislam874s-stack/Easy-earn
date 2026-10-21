import { LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { LiquidButton } from './LiquidGlass';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const { logout, adminLogout, isAdmin, t } = useAuth();

  if (!isOpen) return null;

  const handleLogout = async () => {
    if (isAdmin) {
      await adminLogout();
    } else {
      await logout();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', damping: 25, stiffness: 400 }}
          className="relative w-full max-w-sm rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="h-12 w-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <LogOut className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-white mb-2">{t.logoutConfirmTitle}</h3>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {t.logoutConfirmDesc}
          </p>

          <div className="flex items-center gap-3">
            <LiquidButton
              variant="secondary"
              onClick={onClose}
              fullWidth
              size="md"
            >
              {t.cancel}
            </LiquidButton>
            <LiquidButton
              variant="danger"
              onClick={handleLogout}
              fullWidth
              size="md"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </LiquidButton>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
