import { useState, useEffect } from 'react';
import { User, Phone, Lock, UserPlus, ArrowRight, Shield, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton, LiquidInput } from '../components/LiquidGlass';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface LoginViewProps {
  onGoToAdminLogin: () => void;
  onLoginSuccess: () => void;
}

export function LoginView({ onGoToAdminLogin, onLoginSuccess }: LoginViewProps) {
  const { login, register, referredByName, language, t } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('ref') || window.location.hash === '#register') {
        return 'register';
      }
    }
    return 'login';
  });
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [refCode, setRefCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlRef = urlParams.get('ref');
    const savedRef = urlRef || localStorage.getItem('earn_ref_code');
    if (savedRef) {
      setRefCode(savedRef.trim());
    }
    if (urlRef || window.location.hash === '#register') {
      setMode('register');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const cleanPhone = phone.trim().replace(/[\s\-]/g, '');
      if (mode === 'login') {
        const res = await login(cleanPhone, password);
        if (!res.success) {
          setError(res.error || 'Login failed');
        } else {
          onLoginSuccess();
        }
      } else {
        const finalRef = refCode.trim();
        if (!finalRef) {
          setError(
            t.referralRequiredError ||
              (language === 'bn'
                ? 'রেজিস্ট্রেশনের জন্য রেফারাল কোড দেওয়া বাধ্যতামূলক।'
                : 'Referral code is required for registration.')
          );
          setIsLoading(false);
          return;
        }
        const res = await register(name, cleanPhone, password, finalRef);
        if (!res.success) {
          setError(res.error || 'Registration failed');
        } else {
          onLoginSuccess();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8">
      {/* Referral Banner if present */}
      {referredByName && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {language === 'bn' ? `রেফারকারী: ${referredByName}` : `Referred by: ${referredByName}`}
          </span>
        </div>
      )}

      {/* PWA Install Banner */}
      <PWAInstallButton variant="banner" className="mb-5" />

      {/* Main Liquid Glass Authentication Card */}
      <LiquidCard elevated className="border-white/20">
        {/* Toggle Segmented Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-600/40 text-white shadow-md border border-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.login}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-600/40 text-white shadow-md border border-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.register}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <LiquidInput
              label={t.fullName}
              placeholder="e.g. Shishir Islam"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User className="w-4 h-4" />}
              required
            />
          )}

          <LiquidInput
            label={t.phoneNumber}
            placeholder="017XXXXXXXX"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon={<Phone className="w-4 h-4" />}
            required
          />

          <LiquidInput
            label={t.password}
            placeholder="••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          {mode === 'register' && (
            <div>
              <LiquidInput
                label={t.referralCodeRequired || t.referralCodeOptional}
                placeholder="EARN1001"
                value={refCode}
                onChange={(e) => setRefCode(e.target.value)}
                icon={<UserPlus className="w-4 h-4 text-cyan-400" />}
                required
              />
              <p className="mt-1 text-xs text-cyan-400/80 font-medium pl-1">
                {language === 'bn'
                  ? '* রেজিস্ট্রেশনের জন্য রেফারাল কোড থাকা আবশ্যক।'
                  : '* Referral code is mandatory for registration.'}
              </p>
            </div>
          )}

          <div className="pt-2">
            <LiquidButton
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              <span>{mode === 'login' ? t.login : t.register}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </LiquidButton>
          </div>
        </form>
      </LiquidCard>

      {/* Area 2: Clearly Separated Admin Login Button */}
      <div className="mt-8 text-center">
        <div className="relative flex py-2 items-center mb-4">
          <div className="flex-grow border-t border-white/10"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase tracking-widest font-mono">
            Administration
          </span>
          <div className="flex-grow border-t border-white/10"></div>
        </div>

        <button
          onClick={onGoToAdminLogin}
          className="liquid-pill px-6 py-2.5 text-xs font-bold text-slate-300 hover:text-white border-white/20 hover:border-cyan-400/50 flex items-center justify-center gap-2 mx-auto cursor-pointer"
        >
          <Shield className="w-4 h-4 text-cyan-400" />
          <span>{t.adminLogin}</span>
        </button>
      </div>
    </div>
  );
}
