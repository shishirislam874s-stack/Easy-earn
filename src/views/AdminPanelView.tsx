import { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Video,
  Wallet,
  Gift,
  Settings,
  Bell,
  Check,
  X,
  Search,
  Copy,
  ExternalLink,
  Plus,
  Trash2,
  Edit2,
  ZoomIn,
  RefreshCw,
  LogOut,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminFetch } from '../lib/api';
import { LiquidCard, LiquidButton, LiquidInput } from '../components/LiquidGlass';

export function AdminPanelView() {
  const { adminLogout, showToast, language, t } = useAuth();

  // Selected tab: remembered in localStorage or defaults to 'activation'
  const [activeTab, setActiveTab] = useState<
    'activation' | 'video' | 'withdraw' | 'team_bonuses' | 'videos_manage' | 'users_manage' | 'settings' | 'broadcast'
  >(() => {
    return (localStorage.getItem('earn_admin_tab') as any) || 'activation';
  });

  const [stats, setStats] = useState<any>(null);
  const [requestsData, setRequestsData] = useState<any[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'paid' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingBadges, setPendingBadges] = useState({ activation: 0, video: 0, withdraw: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  // Tap-to-zoom screenshot modal
  const [zoomedScreenshot, setZoomedScreenshot] = useState<string | null>(null);

  // Reject reason dialog modal
  const [rejectDialog, setRejectDialog] = useState<{
    isOpen: boolean;
    type: 'activation' | 'video' | 'withdraw';
    id: string;
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Videos manager state
  const [videosList, setVideosList] = useState<any[]>([]);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<any>(null);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoTitleBn, setNewVideoTitleBn] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newVideoReward, setNewVideoReward] = useState('15');

  // Settings manager state
  const [systemSettings, setSystemSettings] = useState<any>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Users manager state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState<any>(null);
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceReason, setBalanceReason] = useState('');
  const [userHistoryModal, setUserHistoryModal] = useState<{ user: any; history: any[] } | null>(null);

  // Team Leaders drilldown state
  const [teamLeadersData, setTeamLeadersData] = useState<any>(null);
  const [selectedLeaderDrilldown, setSelectedLeaderDrilldown] = useState<any>(null);

  // Broadcasts state
  const [broadcastsList, setBroadcastsList] = useState<any[]>([]);
  const [bcTitleEn, setBcTitleEn] = useState('');
  const [bcTitleBn, setBcTitleBn] = useState('');
  const [bcMessageEn, setBcMessageEn] = useState('');
  const [bcMessageBn, setBcMessageBn] = useState('');

  const changeTab = (tab: any) => {
    setActiveTab(tab);
    localStorage.setItem('earn_admin_tab', tab);
    setPage(1);
    setSearchQuery('');
  };

  // Fetch admin overview stats
  const fetchStats = async () => {
    try {
      const res = await adminFetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
        setPendingBadges({
          activation: data.pendingActivation || 0,
          video: data.pendingVideo || 0,
          withdraw: data.pendingWithdraw || 0,
        });
      }
    } catch {}
  };

  // Fetch requests for current tab
  const fetchRequests = async (pageNum = 1, append = false) => {
    if (!['activation', 'video', 'withdraw', 'team_bonuses'].includes(activeTab)) return;
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        tab: activeTab,
        status: activeTab === 'team_bonuses' ? 'all' : statusFilter,
        search: searchQuery,
        page: String(pageNum),
        limit: '20',
      });

      const res = await adminFetch(`/api/admin/requests?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        let items: any[] = data.items || [];

        // Reconcile with localStorage approvals so refresh never reverts approved requests back to pending
        try {
          const approvedReqIds: string[] = JSON.parse(localStorage.getItem('earn_approved_request_ids') || '[]');
          const approvedTrxIds: string[] = JSON.parse(localStorage.getItem('earn_approved_trx_ids') || '[]');
          const approvedUsers: string[] = JSON.parse(localStorage.getItem('earn_approved_users') || '[]');

          if (activeTab === 'activation') {
            items = items.map((r: any) => {
              const isApproved =
                r.status === 'approved' ||
                approvedReqIds.includes(r.id) ||
                (r.transactionId && approvedTrxIds.includes(String(r.transactionId).trim().toUpperCase())) ||
                approvedUsers.includes(r.userId);
              return isApproved ? { ...r, status: 'approved' } : r;
            });

            if (statusFilter === 'pending') {
              items = items.filter((r: any) => r.status === 'pending');
            }
          }
        } catch {}

        if (append) {
          setRequestsData((prev) => [...prev, ...items]);
        } else {
          setRequestsData(items);
        }
        setHasMore(Boolean(data.hasMore));
        setPage(data.page || 1);
        if (data.pendingCounts) {
          const pendingActCount = activeTab === 'activation' && statusFilter === 'pending'
            ? items.length
            : data.pendingCounts.activation;
          setPendingBadges({
            ...data.pendingCounts,
            activation: pendingActCount,
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch other tabs data
  const fetchVideos = async () => {
    try {
      const res = await adminFetch('/api/admin/videos');
      if (res.ok) {
        const data = await res.json();
        setVideosList(data.videos || []);
      }
    } catch {}
  };

  const fetchSettings = async () => {
    try {
      const res = await adminFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSystemSettings(data.settings);
      }
    } catch {}
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({ search: userSearch, page: '1', limit: '50' });
      const res = await adminFetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const users = data.users || [];
        setUsersList(users);

        // Auto-persist active users to localStorage so refresh never loses activation
        try {
          const activeIds = users.filter((u: any) => u.isActive).map((u: any) => u.id);
          const saved: string[] = JSON.parse(localStorage.getItem('earn_approved_users') || '[]');
          const combined = Array.from(new Set([...saved, ...activeIds]));
          localStorage.setItem('earn_approved_users', JSON.stringify(combined));
        } catch {}
      }
    } catch {}
  };

  const fetchTeamLeaders = async () => {
    try {
      const res = await adminFetch('/api/admin/team-leaders');
      if (res.ok) {
        const data = await res.json();
        setTeamLeadersData(data);
      }
    } catch {}
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await adminFetch('/api/admin/broadcasts');
      if (res.ok) {
        const data = await res.json();
        setBroadcastsList(data.broadcasts || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchStats();
    // Sync active users & approved requests saved in browser to server so refreshing never causes inactive IDs or resurfaced pending requests
    try {
      const savedUsers = JSON.parse(localStorage.getItem('earn_approved_users') || '[]');
      const savedReqIds = JSON.parse(localStorage.getItem('earn_approved_request_ids') || '[]');
      const savedTrxIds = JSON.parse(localStorage.getItem('earn_approved_trx_ids') || '[]');

      if (
        (Array.isArray(savedUsers) && savedUsers.length > 0) ||
        (Array.isArray(savedReqIds) && savedReqIds.length > 0) ||
        (Array.isArray(savedTrxIds) && savedTrxIds.length > 0)
      ) {
        adminFetch('/api/admin/sync-active-users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activeUserIds: savedUsers,
            approvedRequestIds: savedReqIds,
            approvedTrxIds: savedTrxIds,
          }),
        })
          .then((res) => res.json())
          .then(() => {
            fetchStats();
            fetchRequests(1, false);
          })
          .catch(() => {});
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (['activation', 'video', 'withdraw', 'team_bonuses'].includes(activeTab)) {
      fetchRequests(1, false);
    } else if (activeTab === 'videos_manage') {
      fetchVideos();
    } else if (activeTab === 'settings') {
      fetchSettings();
    } else if (activeTab === 'users_manage') {
      fetchUsers();
    } else if (activeTab === 'broadcast') {
      fetchBroadcasts();
    }
  }, [activeTab, statusFilter, searchQuery]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(`${t.copied}: ${text}`);
  };

  // Actions for requests: single-click instant response with optimistic UI
  const handleApproveActivation = async (id: string) => {
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set([...prev, id]));

    const targetReq = requestsData.find((r) => r.id === id);

    // Instant optimistic feedback on 1st click
    showToast(language === 'bn' ? 'অ্যাক্টিভেশন অনুমোদন সফল!' : 'Activation approved!');
    if (statusFilter === 'pending') {
      setRequestsData((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRequestsData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    }
    setPendingBadges((prev) => ({ ...prev, activation: Math.max(0, prev.activation - 1) }));
    setStats((prev: any) =>
      prev
        ? {
            ...prev,
            activatedUsers: (prev.activatedUsers || 0) + 1,
            pendingActivation: Math.max(0, (prev.pendingActivation || 0) - 1),
          }
        : prev
    );

    // Remember in localStorage permanently so refresh never loses activation
    try {
      const savedUsers: string[] = JSON.parse(localStorage.getItem('earn_approved_users') || '[]');
      if (targetReq?.userId && !savedUsers.includes(targetReq.userId)) {
        savedUsers.push(targetReq.userId);
        localStorage.setItem('earn_approved_users', JSON.stringify(savedUsers));
      }

      const savedReqIds: string[] = JSON.parse(localStorage.getItem('earn_approved_request_ids') || '[]');
      if (!savedReqIds.includes(id)) {
        savedReqIds.push(id);
        localStorage.setItem('earn_approved_request_ids', JSON.stringify(savedReqIds));
      }

      if (targetReq?.transactionId) {
        const trx = String(targetReq.transactionId).trim().toUpperCase();
        const savedTrxIds: string[] = JSON.parse(localStorage.getItem('earn_approved_trx_ids') || '[]');
        if (!savedTrxIds.includes(trx)) {
          savedTrxIds.push(trx);
          localStorage.setItem('earn_approved_trx_ids', JSON.stringify(savedTrxIds));
        }
      }
    } catch {}

    try {
      await adminFetch(`/api/admin/activation/${id}/approve`, { method: 'POST' });
    } catch (err) {
      console.error('Approve failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchStats();
    }
  };

  const handleApproveVideo = async (id: string) => {
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set([...prev, id]));

    // Instant optimistic feedback on 1st click
    showToast(language === 'bn' ? 'ভিডিও কাজ অনুমোদন সফল!' : 'Video approved!');
    if (statusFilter === 'pending') {
      setRequestsData((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRequestsData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    }
    setPendingBadges((prev) => ({ ...prev, video: Math.max(0, prev.video - 1) }));
    setStats((prev: any) =>
      prev ? { ...prev, pendingVideo: Math.max(0, (prev.pendingVideo || 0) - 1) } : prev
    );

    try {
      await adminFetch(`/api/admin/video/${id}/approve`, { method: 'POST' });
    } catch (err) {
      console.error('Video approve failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchStats();
    }
  };

  const handlePayWithdraw = async (id: string) => {
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set([...prev, id]));

    const target = requestsData.find((r) => r.id === id);

    // Instant optimistic feedback on 1st click
    showToast(language === 'bn' ? 'উইথড্র পেইড মার্ক করা হয়েছে!' : 'Withdrawal marked paid!');
    if (statusFilter === 'pending') {
      setRequestsData((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRequestsData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'paid' } : r)));
    }
    setPendingBadges((prev) => ({ ...prev, withdraw: Math.max(0, prev.withdraw - 1) }));
    setStats((prev: any) =>
      prev
        ? {
            ...prev,
            pendingWithdraw: Math.max(0, (prev.pendingWithdraw || 0) - 1),
            totalPaid: (prev.totalPaid || 0) + (target?.amount || 0),
          }
        : prev
    );

    try {
      await adminFetch(`/api/admin/withdraw/${id}/pay`, { method: 'POST' });
    } catch (err) {
      console.error('Pay withdraw failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchStats();
    }
  };

  const confirmReject = async () => {
    if (!rejectDialog) return;
    const { type, id } = rejectDialog;
    if (processingIds.has(id)) return;
    setProcessingIds((prev) => new Set([...prev, id]));

    showToast(language === 'bn' ? 'রিকোয়েস্ট বাতিল করা হয়েছে' : 'Request rejected');
    if (statusFilter === 'pending') {
      setRequestsData((prev) => prev.filter((r) => r.id !== id));
    } else {
      setRequestsData((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    }
    setRejectDialog(null);

    try {
      let endpoint = '';
      if (type === 'activation') endpoint = `/api/admin/activation/${id}/reject`;
      else if (type === 'video') endpoint = `/api/admin/video/${id}/reject`;
      else if (type === 'withdraw') endpoint = `/api/admin/withdraw/${id}/reject`;

      await adminFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setRejectReason('');
    } catch (err) {
      console.error('Reject failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchStats();
    }
  };

  // Video Management actions
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingVideo) {
        const res = await adminFetch(`/api/admin/videos/${editingVideo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newVideoTitle,
            titleBn: newVideoTitleBn,
            url: newVideoUrl,
            reward: Number(newVideoReward),
          }),
        });
        if (res.ok) {
          showToast('Video updated');
          fetchVideos();
          setVideoModalOpen(false);
          setEditingVideo(null);
        }
      } else {
        const res = await adminFetch('/api/admin/videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newVideoTitle,
            titleBn: newVideoTitleBn,
            url: newVideoUrl,
            reward: Number(newVideoReward),
          }),
        });
        if (res.ok) {
          showToast('Video added');
          fetchVideos();
          setVideoModalOpen(false);
          setNewVideoTitle('');
          setNewVideoTitleBn('');
          setNewVideoUrl('');
        }
      }
    } catch {}
  };

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;
    try {
      await adminFetch(`/api/admin/videos/${id}`, { method: 'DELETE' });
      showToast('Video deleted');
      fetchVideos();
    } catch {}
  };

  // Settings Save
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemSettings),
      });
      if (res.ok) {
        showToast('Settings saved successfully!');
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  // User balance add/deduct
  const handleSaveUserBalance = async () => {
    if (!balanceModalUser || !balanceAmount) return;
    try {
      const res = await adminFetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: balanceAction,
          amount: Number(balanceAmount),
          reason: balanceReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed');
      } else {
        showToast('Balance updated!');
        setBalanceModalUser(null);
        setBalanceAmount('');
        setBalanceReason('');
        fetchUsers();
      }
    } catch {}
  };

  const handleToggleBlock = async (userId: string) => {
    try {
      const res = await adminFetch(`/api/admin/users/${userId}/block`, { method: 'POST' });
      if (res.ok) {
        showToast('User status updated');
        fetchUsers();
      }
    } catch {}
  };

  const handleDirectActivateUser = async (u: any) => {
    if (processingIds.has(u.id)) return;
    setProcessingIds((prev) => new Set([...prev, u.id]));

    // 1-Click optimistic response
    showToast(language === 'bn' ? `${u.name}-এর আইডি সফলভাবে সক্রিয় হয়েছে!` : `User ${u.name} activated!`);

    setUsersList((prev) =>
      prev.map((item) => (item.id === u.id ? { ...item, isActive: true, category: item.category || 'B' } : item))
    );

    // Save in localStorage immediately
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('earn_approved_users') || '[]');
      if (!saved.includes(u.id)) {
        saved.push(u.id);
        localStorage.setItem('earn_approved_users', JSON.stringify(saved));
      }
    } catch {}

    try {
      await adminFetch(`/api/admin/users/${u.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: u.category || 'B' }),
      });
    } catch (err) {
      console.error('Direct activate failed:', err);
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
      fetchStats();
      fetchUsers();
    }
  };

  const handleViewUserHistory = async (u: any) => {
    try {
      const res = await adminFetch(`/api/admin/users/${u.id}/history`);
      if (res.ok) {
        const json = await res.json();
        setUserHistoryModal({ user: u, history: json.history || [] });
      }
    } catch {}
  };

  // Broadcast
  const handleCreateBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminFetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: bcTitleEn,
          titleBn: bcTitleBn,
          messageEn: bcMessageEn,
          messageBn: bcMessageBn,
        }),
      });
      if (res.ok) {
        showToast('Announcement posted');
        setBcTitleEn('');
        setBcTitleBn('');
        setBcMessageEn('');
        setBcMessageBn('');
        fetchBroadcasts();
      }
    } catch {}
  };

  const handleDeleteBroadcast = async (id: string) => {
    await adminFetch(`/api/admin/broadcasts/${id}`, { method: 'DELETE' });
    showToast('Deleted');
    fetchBroadcasts();
  };

  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const activeUrlRef = urlParams?.get('ref');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Referral Link Notice Banner when Admin is Logged In */}
      {activeUrlRef && (
        <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-500/10">
          <div className="flex items-start sm:items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="font-bold text-amber-300">
                {language === 'bn'
                  ? `আপনি বর্তমানে অ্যাডমিন হিসেবে লগইন আছেন (রেফার লিংক: ${activeUrlRef})`
                  : `You are currently logged in as Admin (Ref link: ${activeUrlRef})`}
              </p>
              <p className="text-amber-200/80 text-xs mt-0.5">
                {language === 'bn'
                  ? 'রেফারাল লিংক দিয়ে নতুন ইউজার অ্যাকাউন্ট তৈরি করতে চাইলে লগআউট বাটনে চাপ দিন অথবা অন্য ব্রাউজারে লিংকটি খুলুন।'
                  : 'To register a new user account with this referral link, please logout or open this link in an incognito window.'}
              </p>
            </div>
          </div>
          <LiquidButton
            variant="danger"
            size="sm"
            onClick={adminLogout}
            className="shrink-0"
          >
            <LogOut className="w-4 h-4 mr-1" />
            <span>{language === 'bn' ? 'লগআউট করে রেজিস্টার করুন' : 'Logout & Register'}</span>
          </LiquidButton>
        </div>
      )}

      {/* Top Header & Overview Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 block">
            Control Center
          </span>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <span>{t.adminDashboard}</span>
          </h2>
        </div>

        <div className="flex items-center gap-2.5">
          <LiquidButton
            variant="secondary"
            size="sm"
            onClick={() => {
              fetchStats();
              if (['activation', 'video', 'withdraw', 'team_bonuses'].includes(activeTab)) {
                fetchRequests(1, false);
              }
            }}
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </LiquidButton>

          <LiquidButton variant="danger" size="sm" onClick={adminLogout}>
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </LiquidButton>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <LiquidCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.totalUsers}
          </span>
          <div className="text-2xl font-black text-white mt-1">
            {stats?.totalUsers ?? '...'}
          </div>
        </LiquidCard>

        <LiquidCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.totalActiveUsers}
          </span>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {stats?.activatedUsers ?? '...'}
          </div>
        </LiquidCard>

        <LiquidCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.pendingRequests}
          </span>
          <div className="text-2xl font-black text-amber-300 mt-1">
            {stats?.totalPending ?? '...'}
          </div>
        </LiquidCard>

        <LiquidCard className="p-4">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            {t.totalPaid}
          </span>
          <div className="text-2xl font-black text-purple-300 font-mono mt-1">
            ৳{stats?.totalPaid ?? '...'}
          </div>
        </LiquidCard>
      </div>

      {/* Sticky Liquid Glass Tabs Row */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-2 bg-slate-950/80 backdrop-blur-2xl border-y border-white/10 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 min-w-max">
          {/* ID Activation Tab */}
          <button
            onClick={() => changeTab('activation')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'activation'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <span>{t.tabActivation}</span>
            {pendingBadges.activation > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {pendingBadges.activation}
              </span>
            )}
          </button>

          {/* Video Work Tab */}
          <button
            onClick={() => changeTab('video')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'video'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <span>{t.tabVideo}</span>
            {pendingBadges.video > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {pendingBadges.video}
              </span>
            )}
          </button>

          {/* Withdraw Tab */}
          <button
            onClick={() => changeTab('withdraw')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'withdraw'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <span>{t.tabWithdraw}</span>
            {pendingBadges.withdraw > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-extrabold animate-pulse">
                {pendingBadges.withdraw}
              </span>
            )}
          </button>

          {/* Team Bonuses Tab (No red badge as specified) */}
          <button
            onClick={() => {
              changeTab('team_bonuses');
              fetchTeamLeaders();
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'team_bonuses'
                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <span>{t.tabTeamBonuses}</span>
          </button>

          {/* Manage Videos */}
          <button
            onClick={() => changeTab('videos_manage')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'videos_manage'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t.tabVideosManage}</span>
          </button>

          {/* Users Directory */}
          <button
            onClick={() => changeTab('users_manage')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'users_manage'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t.tabUsersManage}</span>
          </button>

          {/* System Settings */}
          <button
            onClick={() => changeTab('settings')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{t.tabSettings}</span>
          </button>

          {/* Broadcasts */}
          <button
            onClick={() => changeTab('broadcast')}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'broadcast'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/50 shadow-md'
                : 'bg-white/5 text-slate-300 hover:text-white border border-white/5'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>{t.tabBroadcast}</span>
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH ROW (for request tabs) */}
      {['activation', 'video', 'withdraw'].includes(activeTab) && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status filters */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white/5 border border-white/10 overflow-x-auto">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.pending}
            </button>
            <button
              onClick={() => setStatusFilter(activeTab === 'withdraw' ? 'paid' : 'approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'approved' || statusFilter === 'paid'
                  ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {activeTab === 'withdraw' ? t.paid : t.approved}
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'rejected'
                  ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.rejected}
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white/20 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.all}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>
      )}

      {/* ---------------- TAB 1: ID ACTIVATION REQUESTS ---------------- */}
      {activeTab === 'activation' && (
        <div className="space-y-3">
          {isLoading && requestsData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">{t.loading}</div>
          ) : requestsData.length === 0 ? (
            <LiquidCard className="py-12 text-center text-slate-400 text-sm">
              No activation requests found in this view.
            </LiquidCard>
          ) : (
            requestsData.map((req) => (
              <LiquidCard
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:border-white/30"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{req.userName}</span>
                    <span className="text-xs text-slate-400 font-mono">({req.userPhone})</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40">
                      Cat {req.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                      ৳{req.amount}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold">{req.paymentMethod}</span>
                    <span>·</span>
                    <span className="text-slate-400">TrxID:</span>
                    <span className="font-mono font-bold text-cyan-300 bg-white/5 px-2 py-0.5 rounded-md">
                      {req.transactionId}
                    </span>
                    <button
                      onClick={() => handleCopy(req.transactionId)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded cursor-pointer"
                      title="Copy TrxID"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span>·</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(req.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {req.status === 'pending' ? (
                    <>
                      <LiquidButton
                        variant="success"
                        size="sm"
                        disabled={processingIds.has(req.id)}
                        isLoading={processingIds.has(req.id)}
                        onClick={() => handleApproveActivation(req.id)}
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.approve}</span>
                      </LiquidButton>
                      <LiquidButton
                        variant="danger"
                        size="sm"
                        disabled={processingIds.has(req.id)}
                        onClick={() =>
                          setRejectDialog({
                            isOpen: true,
                            type: 'activation',
                            id: req.id,
                            title: `Reject Activation: ${req.userName}`,
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                        <span>{t.reject}</span>
                      </LiquidButton>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {req.status}
                    </span>
                  )}
                </div>
              </LiquidCard>
            ))
          )}

          {hasMore && (
            <div className="text-center pt-2">
              <LiquidButton variant="secondary" size="sm" onClick={() => fetchRequests(page + 1, true)}>
                {t.loadMore}
              </LiquidButton>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 2: VIDEO WORK SUBMISSIONS ---------------- */}
      {activeTab === 'video' && (
        <div className="space-y-3">
          {isLoading && requestsData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">{t.loading}</div>
          ) : requestsData.length === 0 ? (
            <LiquidCard className="py-12 text-center text-slate-400 text-sm">
              No video submissions found in this view.
            </LiquidCard>
          ) : (
            requestsData.map((sub) => (
              <LiquidCard
                key={sub.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 hover:border-white/30"
              >
                <div className="flex items-start gap-4">
                  {/* Tap-to-Zoom Screenshot Preview */}
                  {sub.screenshotUrl && (
                    <div
                      onClick={() => setZoomedScreenshot(sub.screenshotUrl)}
                      className="relative h-20 w-20 rounded-2xl overflow-hidden border border-white/20 bg-black/40 shrink-0 cursor-pointer group"
                    >
                      <img
                        src={sub.screenshotUrl}
                        alt="Proof"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn className="w-5 h-5" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-white line-clamp-1">{sub.videoTitle}</h4>
                    <div className="text-xs text-slate-300">
                      <span>Submitted by: </span>
                      <span className="font-bold text-white">{sub.userName}</span>
                      <span className="text-slate-400 font-mono ml-1">({sub.userPhone})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-emerald-400 font-extrabold font-mono">
                        Reward: ৳{sub.reward}
                      </span>
                      {sub.creditedAmount !== undefined && sub.status === 'approved' && (
                        <span className="text-cyan-300 font-mono text-[11px]">
                          (Credited: ৳{sub.creditedAmount})
                        </span>
                      )}
                      <span>·</span>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                  {sub.status === 'pending' ? (
                    <>
                      <LiquidButton
                        variant="success"
                        size="sm"
                        disabled={processingIds.has(sub.id)}
                        isLoading={processingIds.has(sub.id)}
                        onClick={() => handleApproveVideo(sub.id)}
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.approve}</span>
                      </LiquidButton>
                      <LiquidButton
                        variant="danger"
                        size="sm"
                        disabled={processingIds.has(sub.id)}
                        onClick={() =>
                          setRejectDialog({
                            isOpen: true,
                            type: 'video',
                            id: sub.id,
                            title: `Reject Video Work: ${sub.videoTitle}`,
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                        <span>{t.reject}</span>
                      </LiquidButton>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        sub.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {sub.status}
                    </span>
                  )}
                </div>
              </LiquidCard>
            ))
          )}

          {hasMore && (
            <div className="text-center pt-2">
              <LiquidButton variant="secondary" size="sm" onClick={() => fetchRequests(page + 1, true)}>
                {t.loadMore}
              </LiquidButton>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 3: WITHDRAW REQUESTS ---------------- */}
      {activeTab === 'withdraw' && (
        <div className="space-y-3">
          {isLoading && requestsData.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">{t.loading}</div>
          ) : requestsData.length === 0 ? (
            <LiquidCard className="py-12 text-center text-slate-400 text-sm">
              No withdrawal requests found in this view.
            </LiquidCard>
          ) : (
            requestsData.map((w) => (
              <LiquidCard
                key={w.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:border-white/30"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{w.userName}</span>
                    <span className="text-xs text-slate-400 font-mono">({w.userPhone})</span>
                    <span className="text-sm font-black text-cyan-300 font-mono ml-1">
                      ৳{w.amount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-white">{w.paymentMethod}</span>
                    <span>·</span>
                    <span className="font-mono font-bold text-cyan-200">{w.accountNumber}</span>
                    <button
                      onClick={() => handleCopy(w.accountNumber)}
                      className="text-cyan-400 hover:text-cyan-300 p-0.5 rounded cursor-pointer"
                      title="Copy Account Number"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <span>·</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(w.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {w.status === 'pending' ? (
                    <>
                      <LiquidButton
                        variant="success"
                        size="sm"
                        disabled={processingIds.has(w.id)}
                        isLoading={processingIds.has(w.id)}
                        onClick={() => handlePayWithdraw(w.id)}
                      >
                        <Check className="w-4 h-4" />
                        <span>{t.markPaid}</span>
                      </LiquidButton>
                      <LiquidButton
                        variant="danger"
                        size="sm"
                        disabled={processingIds.has(w.id)}
                        onClick={() =>
                          setRejectDialog({
                            isOpen: true,
                            type: 'withdraw',
                            id: w.id,
                            title: `Reject & Refund Withdrawal: ৳${w.amount}`,
                          })
                        }
                      >
                        <X className="w-4 h-4" />
                        <span>{t.reject}</span>
                      </LiquidButton>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full uppercase ${
                        w.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                      }`}
                    >
                      {w.status}
                    </span>
                  )}
                </div>
              </LiquidCard>
            ))
          )}

          {hasMore && (
            <div className="text-center pt-2">
              <LiquidButton variant="secondary" size="sm" onClick={() => fetchRequests(page + 1, true)}>
                {t.loadMore}
              </LiquidButton>
            </div>
          )}
        </div>
      )}

      {/* ---------------- TAB 4: TEAM BONUSES AUDIT ---------------- */}
      {activeTab === 'team_bonuses' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <LiquidCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Team Bonuses Paid
              </span>
              <div className="text-2xl font-black text-purple-400 font-mono mt-1">
                ৳{teamLeadersData?.summary?.totalBonusesPaid ?? 0}
              </div>
            </LiquidCard>

            <LiquidCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Active Team Leaders
              </span>
              <div className="text-2xl font-black text-white mt-1">
                {teamLeadersData?.summary?.totalLeaders ?? 0}
              </div>
            </LiquidCard>

            <LiquidCard className="p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Bonuses Paid Today
              </span>
              <div className="text-2xl font-black text-cyan-300 font-mono mt-1">
                ৳{teamLeadersData?.summary?.bonusesToday ?? 0}
              </div>
            </LiquidCard>
          </div>

          {/* Sub-view: Team Leaders Directory */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Team Leaders Directory (Tap to view members)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamLeadersData?.leaders?.map((leader: any) => (
                <LiquidCard
                  key={leader.id}
                  onClick={() => setSelectedLeaderDrilldown(leader)}
                  className="p-4 cursor-pointer hover:border-purple-400/50 transition-all flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{leader.name}</span>
                      <span className="text-xs text-slate-400 font-mono">({leader.phone})</span>
                    </h4>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <span className="text-emerald-400 font-semibold">
                        {leader.directActivatedCount} Active Members
                      </span>
                      <span>·</span>
                      <span className="text-purple-300 font-bold font-mono">
                        ৳{leader.totalTeamBonus} Bonus
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </LiquidCard>
              ))}
            </div>
          </div>

          {/* Read-Only Team Bonus Audit Log */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider mb-3">
              Full Team Bonus Audit Trail (Newest First)
            </h3>
            <div className="space-y-2">
              {requestsData.length === 0 ? (
                <LiquidCard className="py-8 text-center text-slate-400 text-xs">
                  No team bonuses recorded yet.
                </LiquidCard>
              ) : (
                requestsData.map((tb) => (
                  <LiquidCard key={tb.id} className="p-3.5 flex items-center justify-between gap-3">
                    <div className="space-y-1 text-xs">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span className="text-purple-300">Leader: {tb.leaderName}</span>
                        <span className="text-slate-400 font-mono text-[11px]">(ID: {tb.leaderId})</span>
                      </div>
                      <div className="text-slate-300 text-[11px]">
                        Referred by: <span className="font-bold">{tb.referrerName}</span> → Activated:{' '}
                        <span className="font-bold">{tb.activatedUserName}</span> (Cat {tb.category})
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(tb.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      +৳{tb.amount}
                    </span>
                  </LiquidCard>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- TAB 5: VIDEOS MANAGER ---------------- */}
      {activeTab === 'videos_manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Platform Videos ({videosList.length})
            </h3>
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingVideo(null);
                setNewVideoTitle('');
                setNewVideoTitleBn('');
                setNewVideoUrl('');
                setNewVideoReward('15');
                setVideoModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4" />
              <span>Add New Video</span>
            </LiquidButton>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {videosList.map((v) => (
              <LiquidCard key={v.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{v.title}</h4>
                  {v.titleBn && <p className="text-xs text-slate-400">{v.titleBn}</p>}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-emerald-400 font-bold font-mono">৳{v.reward}</span>
                    <span>·</span>
                    <a
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Watch Link</span>
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingVideo(v);
                      setNewVideoTitle(v.title);
                      setNewVideoTitleBn(v.titleBn || '');
                      setNewVideoUrl(v.url);
                      setNewVideoReward(String(v.reward));
                      setVideoModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVideo(v.id)}
                    className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </LiquidCard>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- TAB 6: USERS MANAGER ---------------- */}
      {activeTab === 'users_manage' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user by name, phone, code..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
              />
            </div>
            <LiquidButton variant="secondary" size="sm" onClick={fetchUsers}>
              Search
            </LiquidButton>
          </div>

          <div className="space-y-2.5">
            {usersList.map((u) => (
              <LiquidCard key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{u.name}</span>
                    <span className="text-xs text-slate-400 font-mono">({u.phone})</span>
                    {u.isActive ? (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                        Active
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40">
                        Inactive
                      </span>
                    )}
                    {u.isTeamLeader && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/40">
                        Team Leader
                      </span>
                    )}
                    {u.isBlocked && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300">
                        Suspended
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                    <span className="font-mono text-cyan-300 font-bold">Balance: ৳{u.balance}</span>
                    <span>·</span>
                    <span>Cat: {u.category || 'None'}</span>
                    <span>·</span>
                    <span>Direct Active: {u.activatedReferralCount}</span>
                    <span>·</span>
                    <span className="text-slate-400 text-[11px]">Work Until: {u.workUntil || 'None'}</span>
                    {u.referralsTowardsWork !== undefined && (
                      <>
                        <span>·</span>
                        <span className="text-amber-300 text-[11px] font-semibold">Ref Progress: {u.referralsTowardsWork}/5</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!u.isActive && (
                    <button
                      disabled={processingIds.has(u.id)}
                      onClick={() => handleDirectActivateUser(u)}
                      className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold border border-emerald-400/40 cursor-pointer disabled:opacity-50"
                    >
                      {processingIds.has(u.id) ? 'Activating...' : 'Activate ID'}
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setBalanceModalUser(u);
                      setBalanceAction('add');
                      setBalanceAmount('');
                      setBalanceReason('');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 text-xs font-bold border border-cyan-400/30 cursor-pointer"
                  >
                    Adjust Balance
                  </button>
                  <button
                    onClick={() => handleViewUserHistory(u)}
                    className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold cursor-pointer"
                  >
                    History
                  </button>
                  <button
                    onClick={() => handleToggleBlock(u.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      u.isBlocked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {u.isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>
              </LiquidCard>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- TAB 7: SETTINGS MANAGER ---------------- */}
      {activeTab === 'settings' && systemSettings && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <LiquidCard elevated className="border-white/20 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Payment Phone Numbers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <LiquidInput
                label="bKash Number"
                value={systemSettings.payment_number_bkash}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, payment_number_bkash: e.target.value })
                }
              />
              <LiquidInput
                label="Nagad Number"
                value={systemSettings.payment_number_nagad}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, payment_number_nagad: e.target.value })
                }
              />
              <LiquidInput
                label="Rocket Number"
                value={systemSettings.payment_number_rocket}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, payment_number_rocket: e.target.value })
                }
              />
            </div>
          </LiquidCard>

          <LiquidCard elevated className="border-white/20 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Category Daily Limits & Activation Fees
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-cyan-300 block">Category A</span>
                <LiquidInput
                  label="Daily Limit (৳)"
                  type="number"
                  value={systemSettings.limit_category_a}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, limit_category_a: Number(e.target.value) })
                  }
                />
                <LiquidInput
                  label="Activation Fee (৳)"
                  type="number"
                  value={systemSettings.fee_category_a}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, fee_category_a: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-cyan-300 block">Category B</span>
                <LiquidInput
                  label="Daily Limit (৳)"
                  type="number"
                  value={systemSettings.limit_category_b}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, limit_category_b: Number(e.target.value) })
                  }
                />
                <LiquidInput
                  label="Activation Fee (৳)"
                  type="number"
                  value={systemSettings.fee_category_b}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, fee_category_b: Number(e.target.value) })
                  }
                />
              </div>

              <div className="space-y-3 p-3 rounded-2xl bg-white/5 border border-white/5">
                <span className="text-xs font-bold text-cyan-300 block">Category C</span>
                <LiquidInput
                  label="Daily Limit (৳)"
                  type="number"
                  value={systemSettings.limit_category_c}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, limit_category_c: Number(e.target.value) })
                  }
                />
                <LiquidInput
                  label="Activation Fee (৳)"
                  type="number"
                  value={systemSettings.fee_category_c}
                  onChange={(e) =>
                    setSystemSettings({ ...systemSettings, fee_category_c: Number(e.target.value) })
                  }
                />
              </div>
            </div>
          </LiquidCard>

          <LiquidCard elevated className="border-white/20 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-white/10 pb-3">
              Referral, Team Bonuses & Work Days
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <LiquidInput
                label="Join Bonus (ref_join)"
                type="number"
                value={systemSettings.ref_join}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, ref_join: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Active Bonus (ref_active)"
                type="number"
                value={systemSettings.ref_active}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, ref_active: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Initial Days (work_days)"
                type="number"
                value={systemSettings.work_days}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, work_days: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Team Size for Leader"
                type="number"
                value={systemSettings.team_size}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, team_size: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Cat A Work Days (w1_days)"
                type="number"
                value={systemSettings.w1_days}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, w1_days: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Cat B Work Days (w2_days)"
                type="number"
                value={systemSettings.w2_days}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, w2_days: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Cat C Work Days (w3_days)"
                type="number"
                value={systemSettings.w3_days}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, w3_days: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Minimum Withdraw (৳)"
                type="number"
                value={systemSettings.min_withdraw}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, min_withdraw: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Team Bonus Cat A (t1_bonus)"
                type="number"
                value={systemSettings.t1_bonus}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, t1_bonus: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Team Bonus Cat B (t2_bonus)"
                type="number"
                value={systemSettings.t2_bonus}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, t2_bonus: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Team Bonus Cat C (t3_bonus)"
                type="number"
                value={systemSettings.t3_bonus}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, t3_bonus: Number(e.target.value) })
                }
              />
              <LiquidInput
                label="Watch Seconds (watch_seconds)"
                type="number"
                value={systemSettings.watch_seconds}
                onChange={(e) =>
                  setSystemSettings({ ...systemSettings, watch_seconds: Number(e.target.value) })
                }
              />
            </div>

            <div className="pt-3">
              <LiquidButton
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSavingSettings}
              >
                Save Settings
              </LiquidButton>
            </div>
          </LiquidCard>
        </form>
      )}

      {/* ---------------- TAB 8: BROADCAST ANNOUNCEMENTS ---------------- */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <LiquidCard elevated className="border-white/20">
            <h3 className="text-base font-bold text-white mb-4">
              Post Broadcast Announcement (Shown to all users)
            </h3>
            <form onSubmit={handleCreateBroadcast} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <LiquidInput
                  label="Title (English)"
                  placeholder="e.g. System Maintenance Update"
                  value={bcTitleEn}
                  onChange={(e) => setBcTitleEn(e.target.value)}
                  required
                />
                <LiquidInput
                  label="শিরোনাম (বাংলা)"
                  placeholder="যেমন: জরুরি আপডেট"
                  value={bcTitleBn}
                  onChange={(e) => setBcTitleBn(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Message (English)</label>
                  <textarea
                    rows={3}
                    value={bcMessageEn}
                    onChange={(e) => setBcMessageEn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">বার্তা (বাংলা)</label>
                  <textarea
                    rows={3}
                    value={bcMessageBn}
                    onChange={(e) => setBcMessageBn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <LiquidButton type="submit" variant="primary" size="md">
                Publish Announcement
              </LiquidButton>
            </form>
          </LiquidCard>

          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Announcements
            </h4>
            {broadcastsList.map((bc) => (
              <LiquidCard key={bc.id} className="p-4 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">{bc.titleBn} / {bc.titleEn}</h4>
                  <p className="text-xs text-slate-300">{bc.messageBn}</p>
                </div>
                <button
                  onClick={() => handleDeleteBroadcast(bc.id)}
                  className="p-2 rounded-xl bg-rose-500/20 text-rose-300 hover:text-white cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </LiquidCard>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: Tap-To-Zoom Screenshot */}
      {zoomedScreenshot && (
        <div
          onClick={() => setZoomedScreenshot(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img
              src={zoomedScreenshot}
              alt="Zoomed proof"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <button
              onClick={() => setZoomedScreenshot(null)}
              className="absolute top-4 right-4 h-10 w-10 rounded-full bg-black/70 text-white flex items-center justify-center border border-white/20"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Reject Reason Prompt */}
      {rejectDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 space-y-4">
            <h3 className="text-base font-bold text-white">{rejectDialog.title}</h3>
            <div className="space-y-1">
              <label className="text-xs text-slate-300">{t.rejectionReason}</label>
              <input
                type="text"
                placeholder="e.g. Invalid transaction or blur screenshot"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-400"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <LiquidButton
                variant="secondary"
                fullWidth
                size="sm"
                onClick={() => setRejectDialog(null)}
              >
                {t.cancel}
              </LiquidButton>
              <LiquidButton
                variant="danger"
                fullWidth
                size="sm"
                onClick={confirmReject}
              >
                Confirm Reject
              </LiquidButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add/Edit Video */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 space-y-4">
            <h3 className="text-base font-bold text-white">
              {editingVideo ? 'Edit Video Task' : 'Add New Video Task'}
            </h3>
            <form onSubmit={handleSaveVideo} className="space-y-3">
              <LiquidInput
                label="Title (English)"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
                required
              />
              <LiquidInput
                label="শিরোনাম (বাংলা)"
                value={newVideoTitleBn}
                onChange={(e) => setNewVideoTitleBn(e.target.value)}
              />
              <LiquidInput
                label="Video URL (YouTube or Web link)"
                value={newVideoUrl}
                onChange={(e) => setNewVideoUrl(e.target.value)}
                required
              />
              <LiquidInput
                label="Reward (Taka)"
                type="number"
                value={newVideoReward}
                onChange={(e) => setNewVideoReward(e.target.value)}
                required
              />
              <div className="flex items-center gap-2 pt-2">
                <LiquidButton
                  type="button"
                  variant="secondary"
                  fullWidth
                  size="sm"
                  onClick={() => setVideoModalOpen(false)}
                >
                  Cancel
                </LiquidButton>
                <LiquidButton type="submit" variant="primary" fullWidth size="sm">
                  Save
                </LiquidButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjust User Balance */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="relative w-full max-w-sm rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 space-y-4">
            <h3 className="text-base font-bold text-white">
              Adjust Balance: {balanceModalUser.name}
            </h3>
            <p className="text-xs text-slate-300">
              Current balance: <span className="font-mono text-cyan-300 font-bold">৳{balanceModalUser.balance}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBalanceAction('add')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  balanceAction === 'add'
                    ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                Add Balance (+)
              </button>
              <button
                type="button"
                onClick={() => setBalanceAction('deduct')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  balanceAction === 'deduct'
                    ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                Deduct Balance (-)
              </button>
            </div>

            <LiquidInput
              label="Amount (৳)"
              type="number"
              value={balanceAmount}
              onChange={(e) => setBalanceAmount(e.target.value)}
              required
            />
            <LiquidInput
              label="Reason (optional)"
              placeholder="e.g. Manual correction"
              value={balanceReason}
              onChange={(e) => setBalanceReason(e.target.value)}
            />

            <div className="flex items-center gap-2 pt-2">
              <LiquidButton
                variant="secondary"
                fullWidth
                size="sm"
                onClick={() => setBalanceModalUser(null)}
              >
                Cancel
              </LiquidButton>
              <LiquidButton
                variant="primary"
                fullWidth
                size="sm"
                onClick={handleSaveUserBalance}
              >
                Confirm
              </LiquidButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Specific User History */}
      {userHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <h3 className="text-base font-bold text-white">
                History: {userHistoryModal.user.name} ({userHistoryModal.user.phone})
              </h3>
              <button
                onClick={() => setUserHistoryModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              {userHistoryModal.history.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No records</div>
              ) : (
                userHistoryModal.history.map((h: any) => (
                  <div key={h.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white">{h.titleEn}</h4>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        {h.bangladeshTime?.full || new Date(h.createdAt).toLocaleString()} · {h.status}
                      </span>
                    </div>
                    <span
                      className={`text-sm font-bold font-mono ${
                        h.amount > 0 ? 'text-emerald-400' : h.amount < 0 ? 'text-rose-400' : 'text-slate-300'
                      }`}
                    >
                      {h.amount > 0 ? `+৳${h.amount}` : h.amount < 0 ? `-৳${Math.abs(h.amount)}` : `৳${h.amount}`}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0">
              <LiquidButton variant="secondary" fullWidth size="sm" onClick={() => setUserHistoryModal(null)}>
                Close
              </LiquidButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Team Leader Members Drilldown */}
      {selectedLeaderDrilldown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-[32px] liquid-glass-elevated p-6 shadow-2xl border border-white/20 z-10 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
              <div>
                <h3 className="text-base font-bold text-white">
                  Leader: {selectedLeaderDrilldown.name} ({selectedLeaderDrilldown.phone})
                </h3>
                <span className="text-xs text-purple-300">
                  Total Bonus: ৳{selectedLeaderDrilldown.totalTeamBonus} · {selectedLeaderDrilldown.membersCount} Members
                </span>
              </div>
              <button
                onClick={() => setSelectedLeaderDrilldown(null)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              {selectedLeaderDrilldown.members?.map((m: any) => (
                <div key={m.id} className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">{m.name}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5 font-mono">
                      {m.phone} · Cat {m.category || 'None'}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      m.isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/10 text-slate-400'
                    }`}
                  >
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-white/10 shrink-0">
              <LiquidButton variant="secondary" fullWidth size="sm" onClick={() => setSelectedLeaderDrilldown(null)}>
                Close
              </LiquidButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
