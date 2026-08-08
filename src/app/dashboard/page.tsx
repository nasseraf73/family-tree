'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Person, Relationship, MergeRequest } from '@/types';
import { normalizeForSearch } from '@/lib/dedup';
import {
  ShieldCheck,
  Check,
  X,
  GitMerge,
  Clock,
  UserCheck,
  Users,
  UserPlus,
  Trash2,
  RefreshCw,
  Shield,
  Globe,
  Database,
  ArrowRight,
  Settings,
  LayoutDashboard,
  Search,
} from 'lucide-react';

// ─── Dashboard Content ───────────────────────────────────────────────

function DashboardContent() {
  const { user, dbUser, role, loading: authLoading } = useAuth();
  const isAdmin = role === 'ADMIN' || (role as string) === 'ADM';
  const isStewardOrAdmin = isAdmin || role === 'REVIEWER' || (role as string) === 'STEWARD' || (role as string) === 'REV';

  // ─── Data State ─────────────────────────────────────────────────
  const [pendingRelationships, setPendingRelationships] = useState<Relationship[]>([]);
  const [allPersonsMap, setAllPersonsMap] = useState<Map<number, Person>>(new Map());
  const [mergeRequests, setMergeRequests] = useState<MergeRequest[]>([]);
  const [claimsList, setClaimsList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [claimsSearchQuery, setClaimsSearchQuery] = useState('');

  // ─── UI State ───────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'claims' | 'verified_claims' | 'pending' | 'merge' | 'stewards'>('claims');
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // ─── Steward Add Form State ─────────────────────────────────────
  const [isAddStewardOpen, setIsAddStewardOpen] = useState(false);
  const [stewardName, setStewardName] = useState('');
  const [stewardNameShowDropdown, setStewardNameShowDropdown] = useState(false);
  const [stewardEmail, setStewardEmail] = useState('');
  const [stewardPhone, setStewardPhone] = useState('');
  const [stewardRole, setStewardRole] = useState<'REVIEWER' | 'ADMIN' | 'USER'>('REVIEWER');
  const [submittingSteward, setSubmittingSteward] = useState(false);

  // ─── Tree Person Search for Steward Name Autocomplete ───────────
  const allPersonsList = Array.from(allPersonsMap.values());
  const cleanStewardNameQuery = normalizeForSearch(stewardName);
  const stewardNameSuggestions =
    cleanStewardNameQuery.length >= 2
      ? allPersonsList.filter((p) => {
          const full4 = [p.first_name, p.father_name, p.grand_father_name, p.family_name].filter(Boolean).join(' ');
          const cleanFull = normalizeForSearch(full4);
          return cleanFull.includes(cleanStewardNameQuery);
        }).slice(0, 8)
      : [];

  // Helper function to build 4-part full name
  const get4PartName = (p: Person) => {
    return [p.first_name, p.father_name, p.grand_father_name, p.family_name]
      .filter(Boolean)
      .join(' ');
  };

  // ─── Filtered Claims Search List ────────────────────────────────
  const filteredClaimsList = useMemo(() => {
    if (!claimsSearchQuery || !claimsSearchQuery.trim()) return claimsList;
    const q = claimsSearchQuery.trim().toLowerCase();
    return claimsList.filter((claim) => {
      const personName = [claim.first_name, claim.father_name, claim.grand_father_name, claim.family_name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const userName = (claim.user_full_name || '').toLowerCase();
      const userEmail = (claim.user_email || '').toLowerCase();
      const userPhone = (claim.user_phone || '').toLowerCase();
      return personName.includes(q) || userName.includes(q) || userEmail.includes(q) || userPhone.includes(q);
    });
  }, [claimsList, claimsSearchQuery]);

  // ─── Data Fetching ─────────────────────────────────────────────

  const fetchTreeData = useCallback(async () => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/v1/tree/canvas?role=${role || 'USER'}`);
      const data = await res.json();

      if (data.persons) {
        const personsArr: Person[] = data.persons;
        const map = new Map<number, Person>();
        personsArr.forEach(p => map.set(p.id, p));
        setAllPersonsMap(map);
      }

      if (data.relationships) {
        const rels: Relationship[] = data.relationships;
        const pending = rels.filter(r => r.status === 'PENDING');
        setPendingRelationships(pending);
      }

      if (data.mergeRequests) {
        setMergeRequests(data.mergeRequests);
      }
    } catch {
      // Safe catch
    } finally {
      setLoadingData(false);
    }
  }, [role]);

  const fetchClaimsList = useCallback(async () => {
    setLoadingClaims(true);
    try {
      const res = await fetch('/api/v1/claim/requests');
      const data = await res.json();
      if (data.claims) {
        setClaimsList(data.claims);
      }
    } catch {
      // Safe catch
    } finally {
      setLoadingClaims(false);
    }
  }, []);

  const fetchUsersList = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/v1/admin/users');
      const data = await res.json();
      if (data.users) {
        setUsersList(data.users);
      }
    } catch {
      // Safe catch
    } finally {
      setLoadingUsers(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchTreeData();
      if (isStewardOrAdmin) {
        fetchClaimsList();
      }
      if (isAdmin) {
        fetchUsersList();
      }
    }
  }, [authLoading, user, role]);

  // Fix tab if user role doesn't allow current tab
  useEffect(() => {
    if (!isStewardOrAdmin && (activeTab === 'merge' || activeTab === 'stewards')) {
      setActiveTab('claims');
    }
    if (!isAdmin && activeTab === 'stewards') {
      setActiveTab('claims');
    }
  }, [isStewardOrAdmin, isAdmin, activeTab]);

  // ─── Action Handlers ──────────────────────────────────────────

  const handleApproveRelation = async (relId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/review/approve', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationship_id: relId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchTreeData();
      } else {
        setActionMessage(data.error || 'حدث خطأ أثناء معالجة الطلب');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء معالجة الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveMerge = async (mergeId: number) => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/review/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merge_request_id: mergeId }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchTreeData();
      } else {
        setActionMessage(data.error || 'حدث خطأ أثناء تنفيذ عملية الدمج');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء تنفيذ عملية الدمج');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveOrRejectClaim = async (personId: number, action: 'approve' | 'reject') => {
    setLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/claim/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person_id: personId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message);
        fetchClaimsList();
      } else {
        setActionMessage(data.error || 'حدث خطأ أثناء معالجة المطالبة');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء معالجة المطالبة');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stewardEmail || !stewardName) return;
    setSubmittingSteward(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: stewardName,
          email: stewardEmail,
          phone: stewardPhone,
          role: stewardRole,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'تمت إضافة المشرف بنجاح');
        setStewardName('');
        setStewardEmail('');
        setStewardPhone('');
        setIsAddStewardOpen(false);
        fetchUsersList();
      } else {
        setActionMessage(data.error || 'فشلت إضافة المشرف');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء إضافة المشرف');
    } finally {
      setSubmittingSteward(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: 'USER' | 'REVIEWER' | 'ADMIN') => {
    setActionMessage(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'تم تغيير دور المشرف بنجاح');
        fetchUsersList();
      } else {
        setActionMessage(data.error || 'فشل تغيير دور المشرف');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء تغيير دور المشرف');
    }
  };

  const handleDeleteSteward = async (userId: number) => {
    if (!confirm('هل أنت متأكد من رغبتك في حذف هذا المشرف/المستخدم من النظام؟')) return;
    setActionMessage(null);
    try {
      const res = await fetch(`/api/v1/admin/users?id=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(data.message || 'تم حذف المشرف بنجاح');
        fetchUsersList();
      } else {
        setActionMessage(data.error || 'فشل حذف المشرف');
      }
    } catch {
      setActionMessage('حدث خطأ أثناء حذف المشرف');
    }
  };

  // ─── Refresh All Data ──────────────────────────────────────────
  const refreshAll = () => {
    fetchTreeData();
    if (isStewardOrAdmin) fetchClaimsList();
    if (isAdmin) fetchUsersList();
  };

  // ─── Not Logged In ─────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center dir-rtl">
        <div className="text-slate-400 text-sm animate-pulse">جاري التحميل...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dir-rtl">
        <Navbar />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-slate-400/40" />
          <h1 className="text-2xl font-extrabold text-slate-700 dark:text-slate-200 mb-2">لوحة التحكم والإعدادات</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">يرجى تسجيل الدخول أولاً للوصول إلى لوحة التحكم</p>
        </div>
      </div>
    );
  }

  // ─── Main Dashboard UI ─────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 dir-rtl">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent flex items-center gap-3">
              <LayoutDashboard className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              لوحة التحكم والإعدادات
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {isAdmin
                ? 'إدارة شاملة للنظام: الطلبات، المشرفين، الدول، المستخدمين، وقواعد البيانات'
                : isStewardOrAdmin
                ? 'مراجعة واعتماد الطلبات المعلقة وإدارة صلاحيات الفرع'
                : 'متابعة طلباتك الشخصية وحالتها'}
            </p>
          </div>
          <button
            onClick={refreshAll}
            className="self-start sm:self-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>

        {/* ─── Admin Quick Links (cards to existing admin pages) ─── */}
        {isAdmin && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Link
              href="/admin/countries"
              className="group bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 hover:border-emerald-500/60 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Globe className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">إدارة الدول</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">تعريف وإدارة قائمة الدول والانتساب الجغرافي</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 mr-auto group-hover:text-emerald-500 group-hover:-translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/users"
              className="group bg-white dark:bg-slate-900 border border-blue-500/30 rounded-2xl p-5 hover:border-blue-500/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">إدارة المستخدمين</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">إدارة الحسابات، تعديل الإيميلات، وتخصيص الصلاحيات</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 mr-auto group-hover:text-blue-500 group-hover:-translate-x-1 transition-all" />
            </Link>

            <Link
              href="/admin/database"
              className="group bg-white dark:bg-slate-900 border border-purple-500/30 rounded-2xl p-5 hover:border-purple-500/60 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Database className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">إدارة البيانات</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">إدارة ومزامنة قواعد البيانات والنسخ الاحتياطي</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-400 mr-auto group-hover:text-purple-500 group-hover:-translate-x-1 transition-all" />
            </Link>
          </div>
        )}

        {/* ─── Action Message ─── */}
        {actionMessage && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-700 dark:text-emerald-200 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{actionMessage}</span>
            </div>
            <button onClick={() => setActionMessage(null)} className="text-emerald-500 hover:text-emerald-700 dark:hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* ─── Tabs ─── */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-6 pt-3 gap-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('claims')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'claims'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-300'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              {isStewardOrAdmin ? `طلبات المطالبة بالبطاقات (${claimsList.length})` : `طلبات "هذا أنا" الخاصة بي`}
            </button>

            <button
              onClick={() => setActiveTab('pending')}
              className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === 'pending'
                  ? 'border-amber-500 text-amber-600 dark:text-amber-300'
                  : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4" />
              {isStewardOrAdmin ? `طلبات العلاقات المعلقة (${pendingRelationships.length})` : `طلباتي المعلقة (${pendingRelationships.length})`}
            </button>

            {isStewardOrAdmin && (
              <button
                onClick={() => setActiveTab('verified_claims')}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'verified_claims'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-300'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                البطاقات الموثقة وإلغاء التوثيق ({claimsList.length})
              </button>
            )}

            {isStewardOrAdmin && (
              <button
                onClick={() => setActiveTab('merge')}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'merge'
                    ? 'border-amber-500 text-amber-600 dark:text-amber-300'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <GitMerge className="w-4 h-4" />
                أداة دمج المكررات ({mergeRequests.length})
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setActiveTab('stewards')}
                className={`pb-3 text-xs font-bold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === 'stewards'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-300'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                إدارة المشرفين ({usersList.filter(u => u.role === 'REVIEWER' || u.role === 'ADMIN').length})
              </button>
            )}
          </div>

          {/* ─── Tab Content ─── */}
          <div className="p-6 min-h-[400px]">

            {/* ════ Claims Tab ════ */}
            {activeTab === 'claims' && (
              <div className="space-y-4">
                {/* Search Bar for Claims */}
                {claimsList.length > 0 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={claimsSearchQuery}
                      onChange={(e) => setClaimsSearchQuery(e.target.value)}
                      placeholder="ابحث باسم صاحب البطاقة، اسم الطالب، البريد الإلكتروني، أو الهواتف..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    />
                  </div>
                )}

                {loadingClaims || loadingData ? (
                  <div className="text-center py-8 text-slate-400 text-xs animate-pulse">جاري تحميل طلبات المطالبة بالبطاقات...</div>
                ) : claimsList.length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <UserCheck className="w-10 h-10 mx-auto mb-3 text-blue-500/30" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">لا يوجد أي طلبات مطالبة بالبطاقات حالياً</p>
                  </div>
                ) : filteredClaimsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    لا توجد نتائج تطابق بحثك عن (&quot;{claimsSearchQuery}&quot;).
                  </div>
                ) : (
                  filteredClaimsList.map((claim) => {
                    const personName = [claim.first_name, claim.father_name, claim.grand_father_name, claim.family_name].filter(Boolean).join(' ');
                    return (
                      <div
                        key={claim.person_id}
                        className="bg-slate-50 dark:bg-slate-950 border border-blue-500/20 dark:border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-blue-700 dark:text-blue-300 text-sm">{personName}</span>
                            <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-200 px-2 py-0.5 rounded-full border border-blue-500/40 font-bold">
                              طلب مطالبة (&quot;هذا أنا&quot;)
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs">
                            طالب البطاقة: <span className="font-bold text-amber-600 dark:text-amber-200">{claim.user_full_name}</span> ({claim.user_email}) {claim.user_phone ? `| 📞 ${claim.user_phone}` : ''}
                          </p>
                        </div>

                        {isStewardOrAdmin ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              disabled={loading}
                              onClick={() => handleApproveOrRejectClaim(claim.person_id, 'approve')}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-all text-xs shadow-md"
                            >
                              <Check className="w-4 h-4" />
                              اعتماد التوثيق
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => handleApproveOrRejectClaim(claim.person_id, 'reject')}
                              className="px-3.5 py-2 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg font-semibold flex items-center gap-1 transition-all text-xs"
                            >
                              <X className="w-4 h-4" />
                              إلغاء / فك الربط
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            {claim.status === 'APPROVED' ? (
                              <span className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 rounded-lg font-bold flex items-center gap-1.5 text-xs">
                                <Check className="w-4 h-4 text-emerald-500" />
                                تم الاعتماد والموافقة
                              </span>
                            ) : claim.status === 'REJECTED' ? (
                              <span className="px-3.5 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-300 border border-red-500/30 rounded-lg font-bold flex items-center gap-1.5 text-xs">
                                <X className="w-4 h-4 text-red-500" />
                                مرفوض
                              </span>
                            ) : (
                              <span className="px-3.5 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-lg font-bold flex items-center gap-1.5 text-xs">
                                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                                قيد المراجعة والاعتماد
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════ Verified Claims & Un-Claim Tab ════ */}
            {activeTab === 'verified_claims' && isStewardOrAdmin && (
              <div className="space-y-4">
                {/* Search Bar */}
                {claimsList.length > 0 && (
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      value={claimsSearchQuery}
                      onChange={(e) => setClaimsSearchQuery(e.target.value)}
                      placeholder="ابحث باسم صاحب البطاقة، اسم الطالب، البريد الإلكتروني، أو الهواتف..."
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                  </div>
                )}

                {loadingClaims || loadingData ? (
                  <div className="text-center py-8 text-slate-400 text-xs animate-pulse">جاري تحميل قائمة البطاقات الموثقة...</div>
                ) : claimsList.length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-indigo-500/30" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">لا يوجد أي بطاقات موثقة حالياً</p>
                  </div>
                ) : filteredClaimsList.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    لا توجد نتائج تطابق بحثك عن (&quot;{claimsSearchQuery}&quot;).
                  </div>
                ) : (
                  filteredClaimsList.map((claim) => {
                    const personName = [claim.first_name, claim.father_name, claim.grand_father_name, claim.family_name].filter(Boolean).join(' ');
                    return (
                      <div
                        key={claim.person_id}
                        className="bg-slate-50 dark:bg-slate-950 border border-indigo-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-sm"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-indigo-700 dark:text-indigo-300 text-sm">{personName}</span>
                            <span className="text-[10px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-200 px-2 py-0.5 rounded-full border border-indigo-500/40 font-bold">
                              بطاقة موثقة ومربوطة
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-300 text-xs">
                            مالك البطاقة الحسابي: <span className="font-bold text-amber-600 dark:text-amber-200">{claim.user_full_name}</span> ({claim.user_email}) {claim.user_phone ? `| 📞 ${claim.user_phone}` : ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            disabled={loading}
                            onClick={() => handleApproveOrRejectClaim(claim.person_id, 'reject')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center gap-1.5 transition-all text-xs shadow-md"
                            title="إلغاء وفك توثيق هذه البطاقة وإعادتها لحالتها الأصلية وإشعار المستخدم بالبريد"
                          >
                            <X className="w-4 h-4" />
                            إلغاء / فك التوثيق (إتاحة البطاقة)
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════ Pending Relationships Tab ════ */}
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {loadingData ? (
                  <div className="text-center py-8 text-slate-400 text-xs animate-pulse">جاري تحميل الطلبات المعلقة...</div>
                ) : pendingRelationships.length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <Check className="w-10 h-10 mx-auto mb-3 text-emerald-500/30" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">لا يوجد أي طلبات علاقات معلقة حالياً. شجرة العائلة محدثة بالكامل!</p>
                  </div>
                ) : (
                  pendingRelationships.map(rel => {
                    const person = allPersonsMap.get(rel.person_id);
                    const relatedPerson = allPersonsMap.get(rel.related_person_id);
                    if (!person || !relatedPerson) return null;

                    const name1_4 = get4PartName(person);
                    const name2_4 = get4PartName(relatedPerson);

                    const relLabel = rel.relationship_type === 'PARENT'
                      ? 'ابن / ابنة لـ'
                      : rel.relationship_type === 'CHILD'
                      ? 'أب / أم لـ'
                      : 'زوج / زوجة لـ';

                    return (
                      <div
                        key={rel.id}
                        className="bg-slate-50 dark:bg-slate-950 border border-amber-500/20 dark:border-amber-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 font-bold text-amber-700 dark:text-amber-200 text-sm">
                            <span className="bg-amber-50 dark:bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg text-amber-800 dark:text-amber-100">
                              {name1_4}
                            </span>
                            <span className="text-slate-400 text-xs px-1">[{relLabel}]</span>
                            <span className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-emerald-700 dark:text-emerald-300">
                              {name2_4}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            مقدم الطلب: <span className="text-slate-700 dark:text-slate-200 font-semibold">مستخدم الفرع</span> | تاريخ الطلب: {rel.created_at.substring(0, 10)}
                          </p>
                        </div>

                        {isStewardOrAdmin ? (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              disabled={loading}
                              onClick={() => handleApproveRelation(rel.id, 'approve')}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1 transition-all text-xs"
                            >
                              <Check className="w-4 h-4" />
                              اعتماد (VERIFIED)
                            </button>
                            <button
                              disabled={loading}
                              onClick={() => handleApproveRelation(rel.id, 'reject')}
                              className="px-3.5 py-2 bg-red-50 dark:bg-red-950 hover:bg-red-100 dark:hover:bg-red-900 border border-red-500/30 text-red-600 dark:text-red-300 rounded-lg font-semibold flex items-center gap-1 transition-all text-xs"
                            >
                              <X className="w-4 h-4" />
                              رفض
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="px-3.5 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 rounded-lg font-bold flex items-center gap-1.5 text-xs">
                              <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                              قيد مراجعة المشرفين واللجنة
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════ Merge Requests Tab ════ */}
            {activeTab === 'merge' && isStewardOrAdmin && (
              <div className="space-y-4">
                {mergeRequests.length === 0 ? (
                  <div className="text-center py-14 text-slate-400">
                    <GitMerge className="w-10 h-10 mx-auto mb-3 text-amber-500/30" />
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">لا يوجد أي طلبات دمج مكررات معلقة</p>
                  </div>
                ) : (
                  mergeRequests.map(req => {
                    const primary = allPersonsMap.get(req.primary_person_id);
                    const duplicate = allPersonsMap.get(req.duplicate_person_id);
                    if (!primary || !duplicate) return null;

                    const primary4 = get4PartName(primary);
                    const duplicate4 = get4PartName(duplicate);

                    return (
                      <div key={req.id} className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                          <span className="font-bold text-amber-600 dark:text-amber-300 text-xs flex items-center gap-1.5">
                            <GitMerge className="w-4 h-4 text-amber-500" />
                            طلب دمج سجلين مكررين في سجل واحد موحد (Side-by-Side Merge)
                          </span>
                          <button
                            disabled={loading}
                            onClick={() => handleApproveMerge(req.id)}
                            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5"
                          >
                            <GitMerge className="w-4 h-4" />
                            تنفيذ الدمج الآن
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div className="bg-white dark:bg-slate-900 border border-emerald-500/40 p-3.5 rounded-xl space-y-1.5">
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">السجل الأساسي المعتمد:</span>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{primary4}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">سنة الميلاد: {primary.birth_year || 'غير متاح'}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">السيرة: {primary.biography || 'بدون سيرة'}</p>
                          </div>
                          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 p-3.5 rounded-xl space-y-1.5">
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">السجل المكرر (سيتم دمج علاقاته ثم حذفه):</span>
                            <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">{duplicate4}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">سنة الميلاد: {duplicate.birth_year || 'غير متاح'}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px]">ملاحظات: {duplicate.biography || 'بدون ملاحظات'}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ════ Stewards Management Tab ════ */}
            {isAdmin && activeTab === 'stewards' && (
              <div className="space-y-4">
                {/* Top Action Bar */}
                <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-500" />
                      قائمة المشرفين وأصحاب الصلاحيات بالنظام
                    </h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">إضافة، تعديل الأدوار، وحذف المشرفين من النظام</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={fetchUsersList}
                      className="p-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs"
                      title="تحديث القائمة"
                    >
                      <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddStewardOpen(!isAddStewardOpen)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>{isAddStewardOpen ? 'إلغاء الإضافة' : 'إضافة مشرف جديد'}</span>
                    </button>
                  </div>
                </div>

                {/* Add New Steward Form */}
                {isAddStewardOpen && (
                  <form onSubmit={handleAddStewardSubmit} className="bg-white dark:bg-slate-950 border-2 border-emerald-500/40 p-4 rounded-2xl space-y-3 shadow-xl">
                    <h5 className="font-extrabold text-xs text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4" />
                      بيانات المشرف الجديد:
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="relative">
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">الاسم الكامل (اختر من الشجرة) *</label>
                        <input
                          type="text"
                          required
                          value={stewardName}
                          onChange={(e) => { setStewardName(e.target.value); setStewardNameShowDropdown(true); }}
                          onFocus={() => setStewardNameShowDropdown(true)}
                          placeholder="ابدأ بكتابة الاسم للاختيار من الشجرة..."
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                        />
                        {stewardNameShowDropdown && stewardNameSuggestions.length > 0 && (
                          <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-slate-950 border-2 border-emerald-500/60 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800 dir-rtl">
                            {stewardNameSuggestions.map((p) => {
                              const full4 = [p.first_name, p.father_name, p.grand_father_name, p.family_name].filter(Boolean).join(' ');
                              const cleanFull4 = normalizeForSearch(full4);
                              const matchedUser = (p.claimed_by_user_id ? usersList.find(u => u.id === p.claimed_by_user_id) : null) ||
                                usersList.find(u => normalizeForSearch(u.full_name) === cleanFull4);
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => {
                                    setStewardName(full4);
                                    setStewardNameShowDropdown(false);
                                    if (matchedUser?.email) {
                                      setStewardEmail(matchedUser.email);
                                      if (matchedUser.phone) setStewardPhone(matchedUser.phone || '');
                                    } else {
                                      const cleanPrefix = normalizeForSearch(p.first_name || 'user');
                                      setStewardEmail(`${cleanPrefix}${p.id}@family.com`);
                                    }
                                  }}
                                  className="w-full text-right p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/80 transition-colors flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <div className="font-extrabold text-emerald-700 dark:text-emerald-300">{full4}</div>
                                    {matchedUser?.email && (
                                      <span className="text-[10px] text-amber-600 dark:text-amber-300 block font-semibold mt-0.5">
                                        📧 البريد المسجل: {matchedUser.email}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-300 dark:border-slate-700 font-medium">
                                    {(p as any).generationLevel ? `الجيل ${(p as any).generationLevel}` : ''} {p.birth_year ? `| ${p.birth_year}` : ''}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">البريد الإلكتروني *</label>
                        <input
                          type="email"
                          required
                          value={stewardEmail}
                          onChange={(e) => setStewardEmail(e.target.value)}
                          placeholder="name@domain.com"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">رقم الهاتف (اختياري)</label>
                        <input
                          type="text"
                          value={stewardPhone}
                          onChange={(e) => setStewardPhone(e.target.value)}
                          placeholder="050xxxxxxx"
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">نوع الصلاحية / الدور *</label>
                        <select
                          value={stewardRole}
                          onChange={(e) => setStewardRole(e.target.value as any)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-emerald-500 font-bold"
                        >
                          <option value="REVIEWER">مشرف فرع (REVIEWER)</option>
                          <option value="ADMIN">مدير عام للنظام (ADMIN)</option>
                          <option value="USER">عضو عائلة عادي (USER)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsAddStewardOpen(false)}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-medium"
                      >
                        إلغاء
                      </button>
                      <button
                        type="submit"
                        disabled={submittingSteward}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold flex items-center gap-1.5 shadow-md"
                      >
                        <Check className="w-4 h-4" />
                        <span>{submittingSteward ? 'جاري الحفظ...' : 'حفظ وإضافة المشرف'}</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* Users & Stewards List */}
                {loadingUsers ? (
                  <div className="text-center py-8 text-slate-400 text-xs animate-pulse">جاري تحميل قائمة المشرفين...</div>
                ) : usersList.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs">لا يوجد مستخدمون مدونون حالياً.</div>
                ) : (
                  <div className="space-y-2">
                    {usersList.map((u) => {
                      const isAdminUser = u.role === 'ADMIN' || u.role === 'ADM';
                      const isReviewer = u.role === 'REVIEWER' || u.role === 'REV';
                      return (
                        <div
                          key={u.id}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                                isAdminUser
                                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/40'
                                  : isReviewer
                                  ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/40'
                                  : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border-blue-500/40'
                              }`}
                            >
                              {u.full_name ? u.full_name.charAt(0) : 'U'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">{u.full_name || 'مستخدم بدون اسم'}</span>
                                <span
                                  className={`px-2 py-0.5 rounded-full font-black text-[10px] border ${
                                    isAdminUser
                                      ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-300 border-amber-500/50'
                                      : isReviewer
                                      ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 border-emerald-500/50'
                                      : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 border-blue-500/50'
                                  }`}
                                >
                                  {isAdminUser ? '👑 مدير نظام (ADMIN)' : isReviewer ? '🛡️ مشرف فرع (REVIEWER)' : '👤 عضو (USER)'}
                                </span>
                              </div>
                              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                {u.email} {u.phone ? `| 📞 ${u.phone}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.id, e.target.value as any)}
                              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                              title="تعديل دور وصلاحيات المستخدم"
                            >
                              <option value="REVIEWER">مشرف فرع (REVIEWER)</option>
                              <option value="ADMIN">مدير نظام (ADMIN)</option>
                              <option value="USER">عضو عائلة (USER)</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => handleDeleteSteward(u.id)}
                              className="p-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 dark:hover:bg-red-900 text-red-500 dark:text-red-300 border border-red-500/30 rounded-lg transition-colors"
                              title="حذف هذا المشرف/المستخدم"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page Export ──────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
