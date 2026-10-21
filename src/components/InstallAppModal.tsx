import React, { useState } from 'react';
import { Download, Smartphone, Apple, Monitor, CheckCircle2, X, Share, MoreVertical, PlusSquare, ArrowDownToLine } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAuth } from '../context/AuthContext';
import { LiquidCard, LiquidButton } from './LiquidGlass';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { language } = useAuth();
  const isBn = language === 'bn';

  const [activeTab, setActiveTab] = useState<'android' | 'ios' | 'pc'>(() => {
    if (isIOS) return 'ios';
    if (isAndroid) return 'android';
    return 'android';
  });

  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const result = await install();
    setIsInstalling(false);
    if (result) {
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-900/95 border border-cyan-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 shrink-0">
              <ArrowDownToLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-white">
                {isBn ? 'অ্যাপ ডাউনলোড ও ইনস্টল' : 'Download & Install App'}
              </h2>
              <p className="text-xs text-slate-400">
                {isBn
                  ? 'প্লে-স্টোর ছাড়াই সরাসরি আপনার ডিভাইসে আসল অ্যাপ হিসেবে সেভ করুন'
                  : 'Install directly on your home screen without Play Store'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Already Installed Badge */}
        {isInstalled && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>
              {isBn
                ? 'অ্যাপটি ইতোমধ্যে আপনার ডিভাইসে সফলভাবে ইনস্টল করা আছে!'
                : 'The app is already installed on your device!'}
            </span>
          </div>
        )}

        {/* Direct One-Click Install Banner (if browser supports native install prompt) */}
        {isInstallable && !isInstalled && (
          <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border border-cyan-400/40 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider block">
                  {isBn ? 'সহজ এক ক্লিকে ইনস্টল' : 'One-Click Fast Install'}
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isBn
                    ? 'ব্রাউজার প্রম্পটের মাধ্যমে সরাসরি ফোনে সেভ করুন'
                    : 'Download to home screen instantly via browser prompt'}
                </p>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling || installSuccess}
                className="liquid-pill px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer transition-all shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>
                  {installSuccess
                    ? (isBn ? 'ইনস্টল হয়েছে!' : 'Installed!')
                    : isInstalling
                    ? (isBn ? 'অপেক্ষা করুন...' : 'Installing...')
                    : (isBn ? 'এখনই ইনস্টল করুন' : 'Install Now')}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Platform Tabs */}
        <div className="flex items-center p-1 rounded-2xl bg-white/5 border border-white/10 mb-5">
          <button
            type="button"
            onClick={() => setActiveTab('android')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'android'
                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-600/40 text-white shadow-md border border-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ios')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'ios'
                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-600/40 text-white shadow-md border border-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>iPhone / iOS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pc')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'pc'
                ? 'bg-gradient-to-r from-cyan-500/40 to-blue-600/40 text-white shadow-md border border-cyan-400/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>PC / Desktop</span>
          </button>
        </div>

        {/* Instructions Content */}
        <div className="space-y-3">
          {activeTab === 'android' && (
            <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4" />
                <span>{isBn ? 'অ্যান্ড্রয়েড ফোন থেকে ইনস্টল করার ধাপ:' : 'Steps for Android Phone:'}</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ১
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        আপনার Chrome ব্রাউজারের উপরে ডানদিকের{' '}
                        <strong className="text-white inline-flex items-center gap-0.5">
                          ৩টি ডট <MoreVertical className="w-3 h-3 inline" />
                        </strong>{' '}
                        মেনুতে ট্যাপ করুন।
                      </>
                    ) : (
                      <>
                        Tap the{' '}
                        <strong className="text-white inline-flex items-center gap-0.5">
                          3 dots <MoreVertical className="w-3 h-3 inline" />
                        </strong>{' '}
                        menu in top-right of Chrome browser.
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ২
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        মেনু থেকে{' '}
                        <strong className="text-cyan-300">"Install app"</strong> অথবা{' '}
                        <strong className="text-cyan-300">"Add to Home screen" (হোম স্ক্রিনে যোগ করুন)</strong>{' '}
                        বিকল্পটিতে চাপুন।
                      </>
                    ) : (
                      <>
                        Select <strong className="text-cyan-300">"Install app"</strong> or{' '}
                        <strong className="text-cyan-300">"Add to Home screen"</strong>.
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ৩
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        <strong className="text-emerald-400">"Install"</strong> বাটনে ক্লিক করুন। সাথে সাথে আপনার
                        ফোনে সাধারণ অ্যাপের মতোই আইকন তৈরি হয়ে যাবে!
                      </>
                    ) : (
                      <>
                        Confirm by tapping <strong className="text-emerald-400">"Install"</strong>. The app icon will
                        appear on your home screen like any native app.
                      </>
                    )}
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'ios' && (
            <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Apple className="w-4 h-4" />
                <span>{isBn ? 'iPhone / iPad (Safari) থেকে ইনস্টল করার ধাপ:' : 'Steps for iPhone & iPad (Safari):'}</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ১
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        Safari ব্রাউজারের নিচে থাকা{' '}
                        <strong className="text-white inline-flex items-center gap-0.5">
                          শেয়ার বাটন <Share className="w-3.5 h-3.5 inline text-cyan-400" />
                        </strong>{' '}
                        -এ ট্যাপ করুন।
                      </>
                    ) : (
                      <>
                        Tap the{' '}
                        <strong className="text-white inline-flex items-center gap-0.5">
                          Share <Share className="w-3.5 h-3.5 inline text-cyan-400" />
                        </strong>{' '}
                        button at the bottom of Safari.
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ২
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        মেনুটি একটু নিচে স্ক্রল করে{' '}
                        <strong className="text-cyan-300 inline-flex items-center gap-0.5">
                          "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline" />
                        </strong>{' '}
                        খুঁজে নিয়ে চাপুন।
                      </>
                    ) : (
                      <>
                        Scroll down and tap{' '}
                        <strong className="text-cyan-300 inline-flex items-center gap-0.5">
                          "Add to Home Screen" <PlusSquare className="w-3.5 h-3.5 inline" />
                        </strong>
                        .
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ৩
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        উপরে ডানপাশে{' '}
                        <strong className="text-emerald-400">"Add"</strong> বাটনে চাপ দিন। আপনার আইফোনে অ্যাপ হিসেবে যুক্ত
                        হয়ে যাবে!
                      </>
                    ) : (
                      <>
                        Tap <strong className="text-emerald-400">"Add"</strong> in the top-right corner to finish.
                      </>
                    )}
                  </div>
                </li>
              </ol>
            </div>
          )}

          {activeTab === 'pc' && (
            <div className="space-y-3 bg-white/5 rounded-2xl p-4 border border-white/10">
              <div className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                <Monitor className="w-4 h-4" />
                <span>{isBn ? 'কম্পিউটার (Chrome / Edge / Brave):' : 'Steps for PC & Mac (Chrome/Edge):'}</span>
              </div>
              <ol className="space-y-2.5 text-xs text-slate-300">
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ১
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        ব্রাউজারের অ্যাড্রেস বার (URL bar)-এর ডান পাশে ছোট{' '}
                        <strong className="text-cyan-300 inline-flex items-center gap-0.5">
                          ইনস্টল আইকন <Download className="w-3.5 h-3.5 inline" />
                        </strong>{' '}
                        -এ ক্লিক করুন।
                      </>
                    ) : (
                      <>
                        Click the{' '}
                        <strong className="text-cyan-300 inline-flex items-center gap-0.5">
                          Install icon <Download className="w-3.5 h-3.5 inline" />
                        </strong>{' '}
                        in your browser URL address bar.
                      </>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="h-5 w-5 rounded-full bg-cyan-500/20 text-cyan-400 font-bold flex items-center justify-center shrink-0 border border-cyan-500/40 text-[11px]">
                    ২
                  </span>
                  <div>
                    {isBn ? (
                      <>
                        পপআপে <strong className="text-emerald-400">"Install"</strong> বাটনে ক্লিক করলেই আপনার ডেস্কটপে
                        আলাদা উইন্ডোতে অ্যাপ চালু হবে।
                      </>
                    ) : (
                      <>
                        Click <strong className="text-emerald-400">"Install"</strong> in the prompt to open in a standalone desktop window.
                      </>
                    )}
                  </div>
                </li>
              </ol>
            </div>
          )}
        </div>

        {/* Benefits reminder */}
        <div className="mt-5 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-[11px] text-cyan-200/90 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>
            {isBn
              ? 'ইনস্টল করার পর ইন্টারনেট ছাড়া লোডিং দ্রুত হবে এবং ফুল-স্ক্রিনে আসল অ্যাপের মতো ব্যবহার করতে পারবেন।'
              : 'Once installed, the app launches instantly in standalone full-screen mode with smooth caching.'}
          </span>
        </div>

        {/* Close Button */}
        <div className="mt-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            {isBn ? 'বুঝেছি / বন্ধ করুন' : 'Got it / Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
