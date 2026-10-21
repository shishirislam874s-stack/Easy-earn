import { useState, useEffect } from 'react';
import {
  Play,
  Clock,
  Upload,
  CheckCircle2,
  Lock,
  Sparkles,
  ExternalLink,
  AlertCircle,
  FileImage,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { VideoItem } from '../types';
import { LiquidCard, LiquidButton } from '../components/LiquidGlass';
import { authFetch } from '../lib/api';

interface VideosViewProps {
  onGoToCategory: () => void;
  onGoToRefer: () => void;
}

export function VideosView({ onGoToCategory, onGoToRefer }: VideosViewProps) {
  const {
    user,
    earnedToday,
    dailyCap,
    pendingVideoRewards,
    workDaysRemaining,
    isWorkWindowOpen,
    refreshUserData,
    language,
    t,
  } = useAuth();

  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lockedReason, setLockedReason] = useState<string | null>(null);
  const [lockedMessage, setLockedMessage] = useState<string | null>(null);

  // Active watch session state
  const [activeWatchVideo, setActiveWatchVideo] = useState<VideoItem | null>(null);
  const [sessionStartedAt, setSessionStartedAt] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [watchSecondsRequired, setWatchSecondsRequired] = useState<number>(15);

  // Proof submission modal state
  const [proofVideo, setProofVideo] = useState<VideoItem | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const res = await authFetch('/api/videos');
      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setLockedReason(data.reason);
          setLockedMessage(language === 'bn' ? data.messageBn : data.messageEn);
        }
        setVideos([]);
      } else {
        setLockedReason(null);
        setVideos(data.videos || []);
        if (data.watchSeconds) {
          setWatchSecondsRequired(data.watchSeconds);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [language]);

  // Live countdown timer synced with server session start time
  useEffect(() => {
    if (!sessionStartedAt) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartedAt) / 1000);
      const remaining = Math.max(0, watchSecondsRequired - elapsed);
      setRemainingSeconds(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [sessionStartedAt, watchSecondsRequired]);

  // Start watching video
  const handleWatchVideo = async (video: VideoItem) => {
    try {
      // 1. Call server to start watch session
      const res = await authFetch('/api/videos/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId: video.id }),
      });
      const data = await res.json();

      if (res.ok) {
        setActiveWatchVideo(video);
        setSessionStartedAt(data.startedAt);
        setRemainingSeconds(data.watchSeconds || 15);
        setWatchSecondsRequired(data.watchSeconds || 15);

        // 2. Open video in new tab (noopener, noreferrer)
        window.open(video.url, '_blank', 'noopener,noreferrer');
      } else {
        alert(data.error || 'Failed to start watch session');
      }
    } catch (err: any) {
      alert(err.message || 'Error starting video');
    }
  };

  // Open proof upload modal
  const handleOpenProofModal = (video: VideoItem) => {
    setProofVideo(video);
    setScreenshotPreview(null);
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handle file input
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSubmitError('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setScreenshotPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit proof to server
  const handleSubmitProof = async () => {
    if (!proofVideo || !screenshotPreview) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await authFetch('/api/videos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoId: proofVideo.id,
          screenshotUrl: screenshotPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || 'Failed to submit proof');
      } else {
        setSubmitSuccess(true);
        // Refresh local video list (video disappears immediately from user list!)
        setVideos((prev) => prev.filter((v) => v.id !== proofVideo.id));
        if (activeWatchVideo?.id === proofVideo.id) {
          setActiveWatchVideo(null);
          setSessionStartedAt(null);
        }
        await refreshUserData();

        setTimeout(() => {
          setProofVideo(null);
          setSubmitSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Condition 1: User ID is inactive
  if (user && !user.isActive) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <LiquidCard elevated className="text-center py-10 border-amber-500/30">
          <div className="h-16 w-16 rounded-3xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {language === 'bn' ? 'আইডি সক্রিয় নয়' : 'ID Not Activated'}
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {t.lockMessageNotice}
          </p>
          <LiquidButton variant="primary" size="lg" onClick={onGoToCategory}>
            {t.navCategory}
          </LiquidButton>
        </LiquidCard>
      </div>
    );
  }

  // Condition 2: Work window has expired
  if (lockedReason === 'WORK_WINDOW_EXPIRED' || (!isWorkWindowOpen && user?.isActive)) {
    return (
      <div className="max-w-md mx-auto px-4 py-8">
        <LiquidCard elevated className="text-center py-10 border-rose-500/30">
          <div className="h-16 w-16 rounded-3xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400 mx-auto mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t.videoWorkLockedTitle}</h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {t.videoWorkLockedDesc}
          </p>
          <LiquidButton variant="primary" size="lg" onClick={onGoToRefer}>
            {t.goToRefer}
          </LiquidButton>
        </LiquidCard>
      </div>
    );
  }

  // Daily limit calculations
  const totalEarnedToday = earnedToday;
  const currentCap = dailyCap || 50;
  const progressPercent = Math.min(100, Math.round((totalEarnedToday / currentCap) * 100));
  const isCapReached = totalEarnedToday + pendingVideoRewards >= currentCap;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Top Status & Daily Progress Card */}
      <LiquidCard elevated className="border-cyan-500/30 shadow-[0_12px_32px_rgba(6,182,212,0.15)]">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {t.todayEarned}
            </span>
            <div className="text-2xl font-black text-white tracking-tight flex items-baseline gap-1 mt-0.5">
              <span className="text-cyan-400">৳{totalEarnedToday}</span>
              <span className="text-sm font-medium text-slate-400">/ ৳{currentCap}</span>
            </div>
          </div>

          {/* Work Open Days badge */}
          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {t.workOpenDays}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold mt-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {workDaysRemaining} {t.days}
              </span>
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-slate-800/80 p-0.5 border border-white/10 overflow-hidden mb-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-500 shadow-sm"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <span>{progressPercent}% {language === 'bn' ? 'অর্জিত' : 'completed'}</span>
          {pendingVideoRewards > 0 && (
            <span className="text-amber-300 font-semibold">
              (৳{pendingVideoRewards} {language === 'bn' ? 'পেন্ডিং রিওয়ার্ড' : 'pending'})
            </span>
          )}
        </div>

        {isCapReached && (
          <div className="mt-3 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-200 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{t.dailyLimitReached}</span>
          </div>
        )}
      </LiquidCard>

      {/* Active Video Watch Countdown Banner if currently watching */}
      {activeWatchVideo && (
        <LiquidCard elevated className="border-indigo-400/40 bg-indigo-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {language === 'bn' ? (activeWatchVideo.titleBn || activeWatchVideo.title) : activeWatchVideo.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  {remainingSeconds > 0 ? (
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5 animate-pulse">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{t.stayOnVideoCountdown}: {remainingSeconds} {t.seconds}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{language === 'bn' ? 'সময় শেষ! এখন স্ক্রিনশট জমা দিন' : 'Time completed! Now submit screenshot.'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LiquidButton
                variant={remainingSeconds === 0 ? 'success' : 'secondary'}
                size="md"
                disabled={remainingSeconds > 0}
                onClick={() => handleOpenProofModal(activeWatchVideo)}
              >
                <Upload className="w-4 h-4" />
                <span>{t.submitProof}</span>
              </LiquidButton>
            </div>
          </div>
        </LiquidCard>
      )}

      {/* Videos List Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>{language === 'bn' ? 'দৈনিক ভিডিও কাজ' : 'Available Video Tasks'}</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
              {videos.length}
            </span>
          </h3>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">{t.loading}</div>
        ) : videos.length === 0 ? (
          <LiquidCard className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
            <h4 className="text-base font-bold text-white mb-1">
              {language === 'bn' ? 'সব ভিডিও দেখা সম্পন্ন!' : 'All Tasks Completed!'}
            </h4>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              {t.allVideosCompleted}
            </p>
          </LiquidCard>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {videos.map((video) => {
              const isWatchingThis = activeWatchVideo?.id === video.id;

              return (
                <LiquidCard
                  key={video.id}
                  className="hover:border-cyan-400/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="h-11 w-11 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                      <Play className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug line-clamp-2">
                        {language === 'bn' ? (video.titleBn || video.title) : video.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 text-xs">
                        <span className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          +{t.taka}{video.reward}
                        </span>
                        <span className="text-slate-400">· {watchSecondsRequired} {t.seconds}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <LiquidButton
                      variant={isWatchingThis ? 'secondary' : 'primary'}
                      size="sm"
                      disabled={isCapReached}
                      onClick={() => handleWatchVideo(video)}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{t.watchVideo}</span>
                    </LiquidButton>

                    {isWatchingThis && remainingSeconds === 0 && (
                      <LiquidButton
                        variant="success"
                        size="sm"
                        onClick={() => handleOpenProofModal(video)}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>{t.submitProof}</span>
                      </LiquidButton>
                    )}
                  </div>
                </LiquidCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Proof Submission Modal */}
      {proofVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setProofVideo(null)}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <div className="relative w-full max-w-md rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>{t.uploadScreenshotProof}</span>
              </h3>
              <button
                onClick={() => setProofVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <span className="text-xs text-slate-400 block mb-0.5">{language === 'bn' ? 'ভিডিও শিরোনাম' : 'Video Title'}:</span>
              <p className="text-sm font-bold text-white line-clamp-1">{proofVideo.title}</p>
              <span className="text-xs text-emerald-400 font-bold block mt-1">
                {language === 'bn' ? `রিওয়ার্ড: +৳${proofVideo.reward}` : `Reward: +৳${proofVideo.reward}`}
              </span>
            </div>

            {submitError && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs">
                {submitError}
              </div>
            )}

            {submitSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-white">
                  {language === 'bn' ? 'প্রমাণ সফলভাবে জমা হয়েছে!' : 'Proof Submitted Successfully!'}
                </h4>
                <p className="text-xs text-slate-300">
                  {language === 'bn' ? 'অ্যাডমিন যাচাই করে রিওয়ার্ড যুক্ত করবেন।' : 'Pending admin review for reward crediting.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Upload Area */}
                <label className="block cursor-pointer">
                  <div className="w-full h-44 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-400/50 bg-white/5 flex flex-col items-center justify-center p-3 transition-colors overflow-hidden">
                    {screenshotPreview ? (
                      <img
                        src={screenshotPreview}
                        alt="Screenshot proof"
                        className="max-h-full max-w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="text-center space-y-2">
                        <FileImage className="w-10 h-10 text-slate-400 mx-auto" />
                        <span className="text-xs font-semibold text-slate-300 block">
                          {t.selectScreenshot}
                        </span>
                        <span className="text-[10px] text-slate-500 block">PNG, JPG, WebP</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>

                <div className="flex items-center gap-3 pt-2">
                  <LiquidButton
                    variant="secondary"
                    fullWidth
                    size="md"
                    onClick={() => setProofVideo(null)}
                  >
                    {t.cancel}
                  </LiquidButton>
                  <LiquidButton
                    variant="primary"
                    fullWidth
                    size="md"
                    disabled={!screenshotPreview}
                    isLoading={isSubmitting}
                    onClick={handleSubmitProof}
                  >
                    {t.submit}
                  </LiquidButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
