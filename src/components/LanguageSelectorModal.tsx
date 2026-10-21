import { useState } from 'react';
import { Globe, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { LiquidButton } from './LiquidGlass';

export function LanguageSelectorModal() {
  const { hasChosenLanguageFirstTime, completeLanguageSelection } = useAuth();
  const [selectedLang, setSelectedLang] = useState<Language>('bn');

  if (hasChosenLanguageFirstTime) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/25 z-10 text-center"
        >
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-blue-600 mx-auto flex items-center justify-center text-white mb-4 shadow-lg shadow-cyan-500/30">
            <Globe className="w-7 h-7" />
          </div>

          <h3 className="text-xl font-extrabold text-white mb-1">
            ভাষা নির্বাচন করুন
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Choose your preferred language / পছন্দের ভাষা বেছে নিন
          </p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Bengali Option */}
            <button
              onClick={() => setSelectedLang('bn')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedLang === 'bn'
                  ? 'bg-gradient-to-b from-cyan-500/30 to-blue-600/30 border-cyan-400/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white">বাংলা</span>
                {selectedLang === 'bn' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <span className="text-[10px] text-cyan-300 font-semibold">(ডিফল্ট)</span>
            </button>

            {/* English Option */}
            <button
              onClick={() => setSelectedLang('en')}
              className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                selectedLang === 'en'
                  ? 'bg-gradient-to-b from-cyan-500/30 to-blue-600/30 border-cyan-400/80 shadow-[inset_0_1px_1px_rgba(255,255,255,0.4),0_8px_20px_rgba(6,182,212,0.3)]'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-white">English</span>
                {selectedLang === 'en' && <Check className="w-4 h-4 text-cyan-400" />}
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Standard</span>
            </button>
          </div>

          <LiquidButton
            variant="primary"
            fullWidth
            size="lg"
            onClick={() => completeLanguageSelection(selectedLang)}
          >
            {selectedLang === 'bn' ? 'শুরু করুন' : 'Continue'}
          </LiquidButton>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
