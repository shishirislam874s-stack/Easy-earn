import { useState } from 'react';
import { Shield, Lock, User, ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton, LiquidInput } from '../components/LiquidGlass';

interface AdminLoginViewProps {
  onBackToUser: () => void;
  onLoginSuccess: () => void;
}

export function AdminLoginView({ onBackToUser, onLoginSuccess }: AdminLoginViewProps) {
  const { adminLogin, t } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await adminLogin(username, password);
      if (!res.success) {
        setError(res.error || 'Admin login failed');
      } else {
        onLoginSuccess();
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 py-12">
      <div className="mb-6">
        <button
          onClick={onBackToUser}
          className="liquid-pill px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.back}</span>
        </button>
      </div>

      <LiquidCard elevated className="border-indigo-400/40 shadow-[0_16px_40px_rgba(99,102,241,0.25)]">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-3xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-400 mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">
            {t.adminLoginTitle}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Secure admin authentication portal
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <LiquidInput
            label={t.adminUsername}
            placeholder="slshishir"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            icon={<User className="w-4 h-4" />}
            required
          />

          <LiquidInput
            label={t.adminPassword}
            placeholder="••••••••••••"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="pt-2">
            <LiquidButton
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              <span>{t.login}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </LiquidButton>
          </div>
        </form>


      </LiquidCard>
    </div>
  );
}
