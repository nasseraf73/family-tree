'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { User as DbUser } from '@/types';
import {
  Users,
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Mail,
  Phone,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  X,
  Save,
  Filter,
  CheckCircle2,
  Info,
  Layers,
  Clock,
  User,
  GitPullRequest,
  ShieldAlert,
} from 'lucide-react';

interface UserAuditData {
  user: DbUser;
  audit: {
    claimedProfile: { id: number; fullName: string } | null;
    reviewerBranches: { rootPersonId: number; branchName: string }[];
    isReviewer: boolean;
    pendingRequestsCount: number;
    createdPersonsCount: number;
    pendingMergesCount: number;
  };
}

function AdminUsersContent() {
  const { user, dbUser, role, loading: authLoading } = useAuth();
  const isAdmin = role === 'ADMIN' || (role as string) === 'ADM';

  const [usersList, setUsersList] = useState<DbUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'REVIEWER' | 'USER'>('ALL');

  // Modals
  const [editingUser, setEditingUser] = useState<DbUser | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<DbUser | null>(null);

  // Inspection State
  const [inspectionData, setInspectionData] = useState<UserAuditData | null>(null);
  const [loadingInspection, setLoadingInspection] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'USER' as 'USER' | 'REVIEWER' | 'ADMIN',
  });

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/admin/users', {
        headers: { 'x-user-email': savedEmail },
      });
      const data = await res.json();
      if (res.ok && data.users) {
        setUsersList(data.users);
      } else {
        setMessage({ text: data.error || 'فشل جلب قائمة المستخدمين', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [savedEmail, dbUser?.email, user?.email]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin, fetchUsers]);

  const handleOpenEdit = (u: DbUser) => {
    setEditingUser(u);
    setFormData({
      full_name: u.full_name,
      email: u.email,
      phone: u.phone || '',
      role: (u.role as any) === 'ADM' ? 'ADMIN' : (u.role as any) === 'REV' ? 'REVIEWER' : (u.role as any) || 'USER',
    });
  };

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'USER',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenDeleteInspection = async (u: DbUser) => {
    setDeletingUser(u);
    setInspectionData(null);
    setLoadingInspection(true);

    try {
      const res = await fetch(`/api/v1/admin/users/inspect?id=${u.id}`, {
        headers: { 'x-user-email': savedEmail },
      });
      const data = await res.json();
      if (res.ok && data.audit) {
        setInspectionData(data);
      } else {
        setMessage({ text: data.error || 'فشل فحص الحساب قبل الحذف', type: 'error' });
      }
    } catch (err) {
      console.error('Error fetching inspection:', err);
    } finally {
      setLoadingInspection(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email) {
      setMessage({ text: 'الاسم الكامل والبريد الإلكتروني مطلوبان', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      if (editingUser) {
        // Update user
        const res = await fetch('/api/v1/admin/users', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': savedEmail,
          },
          body: JSON.stringify({
            user_id: editingUser.id,
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone,
            role: formData.role,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ text: '✅ تم تحديث بيانات الحساب والإيميل بنجاح', type: 'success' });
          setEditingUser(null);
          await fetchUsers();
        } else {
          setMessage({ text: data.error || 'فشل تحديث البيانات', type: 'error' });
        }
      } else {
        // Create new user
        const res = await fetch('/api/v1/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-email': savedEmail,
          },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (res.ok) {
          setMessage({ text: '🎉 تم إنشاء الحساب والتأطير بنجاح', type: 'success' });
          setIsAddModalOpen(false);
          await fetchUsers();
        } else {
          setMessage({ text: data.error || 'فشل إضافة الحساب', type: 'error' });
        }
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ أثناء الحفظ', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/admin/users?id=${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': savedEmail },
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ text: '🗑️ تم حذف الحساب بنجاح، وحفظ جميع البيانات والأفراد المرتبطة به آمنة بنسبة 100%', type: 'success' });
        setDeletingUser(null);
        setInspectionData(null);
        await fetchUsers();
      } else {
        setMessage({ text: data.error || 'فشل حذف الحساب', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ أثناء الحذف', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري التحقق من الصلاحيات والإعدادات...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans dir-rtl">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-3xl mx-auto flex items-center justify-center border border-rose-500/30">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">غير مصرح بالوصول</h1>
          <p className="text-slate-400 text-sm">صفحة إدارة وحوكمة حسابات المستخدمين مخصصة لمدراء النظام فقط.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-500 transition-all">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.phone && u.phone.includes(searchQuery));

    const normalizedRole = (u.role as any) === 'ADM' ? 'ADMIN' : (u.role as any) === 'REV' ? 'REVIEWER' : (u.role as any) || 'USER';
    const matchesRole = roleFilter === 'ALL' || normalizedRole === roleFilter;

    return matchesSearch && matchesRole;
  });

  const adminsCount = usersList.filter((u) => u.role === 'ADMIN' || (u.role as any) === 'ADM').length;
  const reviewersCount = usersList.filter((u) => u.role === 'REVIEWER' || (u.role as any) === 'REV').length;
  const regularUsersCount = usersList.length - adminsCount - reviewersCount;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans dir-rtl transition-colors duration-300">
      <Navbar />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white py-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Link href="/" className="hover:underline">الرئيسية</Link>
                <span>/</span>
                <span className="text-slate-400">لوحة الإدارة</span>
                <span>/</span>
                <span className="text-white">إدارة المستخدمين والإيميلات</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <span>إدارة المستخدمين ومعالجة الإيميلات الوهمية</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                استبدال الإيميلات الوهمية بإيميلات حقيقية، تعيين صلاحيات النظار والمدراء، والفحص الاحترافي قبل الحذف
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                onClick={handleOpenAdd}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>إضافة مستخدم / مشرف</span>
              </button>

              <button
                onClick={fetchUsers}
                disabled={loading}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
                title="تحديث القائمة"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-md ${
              message.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-200">
              ✕
            </button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">إجمالي المسجلين</span>
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">{usersList.length}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">مدراء النظام (Admins)</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{adminsCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl border border-blue-500/30">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">نظار ومسؤولو الفروع</span>
              <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{reviewersCount}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-slate-500/10 text-slate-500 rounded-xl border border-slate-500/30">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 block">أعضاء العائلة العاديين</span>
              <span className="text-2xl font-black text-slate-600 dark:text-slate-300">{regularUsersCount}</span>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            {(['ALL', 'ADMIN', 'REVIEWER', 'USER'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  roleFilter === r
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {r === 'ALL' ? 'الكل' : r === 'ADMIN' ? 'المدراء' : r === 'REVIEWER' ? 'النظار' : 'الأعضاء'}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-4">الاسم الكامل</th>
                  <th className="p-4">البريد الإلكتروني (قابل للتعديل)</th>
                  <th className="p-4">الهاتف</th>
                  <th className="p-4">الدور والصلاحية</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">
                      لا توجد حسابات مطابقة للبحث أو التصفية الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const normRole = (u.role as any) === 'ADM' ? 'ADMIN' : (u.role as any) === 'REV' ? 'REVIEWER' : (u.role as any) || 'USER';
                    const isFake = u.email.endsWith('@family.org') || u.email.endsWith('@nas.com');

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-black text-xs border border-purple-500/20">
                            {u.full_name.charAt(0)}
                          </div>
                          <span>{u.full_name}</span>
                        </td>

                        <td className="p-4 font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span className={isFake ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                              {u.email}
                            </span>
                            {isFake && (
                              <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[10px] font-bold">
                                افتراضي/يحتاج تحديث
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-xs">
                          {u.phone || '—'}
                        </td>

                        <td className="p-4">
                          {normRole === 'ADMIN' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-black inline-flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              مدير النظام (Admin)
                            </span>
                          ) : normRole === 'REVIEWER' ? (
                            <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 rounded-lg text-xs font-black inline-flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5" />
                              ناظر فرع (Reviewer)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-bold">
                              عضو عائلة (User)
                            </span>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEdit(u)}
                              className="p-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 hover:bg-purple-500/20 rounded-lg transition-colors"
                              title="تعديل الحساب والبريد"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenDeleteInspection(u)}
                              className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-lg transition-colors"
                              title="فحص الحساب والحذف الاحترافي"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Edit / Add Modal */}
      {(editingUser || isAddModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-6 shadow-2xl dir-rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/30">
                  <Edit2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-black">
                  {editingUser ? `تعديل بريد وبيانات: ${editingUser.full_name}` : 'إضافة حساب جديد'}
                </h3>
              </div>
              <button
                onClick={() => { setEditingUser(null); setIsAddModalOpen(false); }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="مثال: ناصر أبو فاره"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني الحقيقي *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="استبدل الإيميل الوهمي بإيميلك الحقيقي..."
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (اختياري)</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="مثال: 0786844921"
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الدور والصلاحيات *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  className="w-full p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="USER">عضو عائلة عادي (USER)</option>
                  <option value="REVIEWER">ناظر فرع / مشرف (REVIEWER)</option>
                  <option value="ADMIN">مدير نظام كامل (ADMIN)</option>
                </select>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>حفظ البيانات وتأكيد الإيميل</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setEditingUser(null); setIsAddModalOpen(false); }}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Professional Pre-Deletion Audit & Warning Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full text-slate-100 space-y-6 shadow-2xl dir-rtl">

            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/30">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">فحص وتقييم الحساب قبل الحذف النهائي</h3>
                  <p className="text-xs text-slate-400">تدقيق ارتباطات وطلبات المستخدم لضمان سلامة الشجرة</p>
                </div>
              </div>
              <button
                onClick={() => { setDeletingUser(null); setInspectionData(null); }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Loading State */}
            {loadingInspection ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
                <span className="text-xs font-bold">جاري فحص الطلبات وتدقيق ارتباطات الحساب...</span>
              </div>
            ) : inspectionData ? (
              <div className="space-y-5">
                {/* Target User Summary Card */}
                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center font-black border border-rose-500/30">
                      {inspectionData.user.full_name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{inspectionData.user.full_name}</h4>
                      <p className="text-xs font-mono text-slate-400">{inspectionData.user.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs font-bold">
                    معرف: #{inspectionData.user.id}
                  </span>
                </div>

                {/* Audit Grid (5 Items Checked) */}
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>نتائج الفحص والارتباطات المسجلة:</span>
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Item 1: Branch Reviewer Role */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                      inspectionData.audit.isReviewer
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}>
                      <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">نظارة وإشراف الفروع</span>
                        {inspectionData.audit.isReviewer ? (
                          <span className="font-medium text-rose-200">
                            ناظر مشرف على: {inspectionData.audit.reviewerBranches.map(b => b.branchName).join(', ')}
                          </span>
                        ) : (
                          <span>لا يملك مسؤولية إشرافية على أي فرع</span>
                        )}
                      </div>
                    </div>

                    {/* Item 2: Pending Requests */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                      inspectionData.audit.pendingRequestsCount > 0
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}>
                      <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">طلبات النسب المعلقة</span>
                        {inspectionData.audit.pendingRequestsCount > 0 ? (
                          <span className="font-medium text-amber-200">
                            لديه ({inspectionData.audit.pendingRequestsCount}) طلبات إضافة بانتظار الاعتماد
                          </span>
                        ) : (
                          <span>لا توجد طلبات إضافة معلقة</span>
                        )}
                      </div>
                    </div>

                    {/* Item 3: Claimed Profile */}
                    <div className={`p-3.5 rounded-2xl border flex items-start gap-2.5 ${
                      inspectionData.audit.claimedProfile
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}>
                      <User className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">الملف الشخصي المطالب به</span>
                        {inspectionData.audit.claimedProfile ? (
                          <span className="font-medium text-emerald-200">
                            مطالب بالبروفايل: {inspectionData.audit.claimedProfile.fullName}
                          </span>
                        ) : (
                          <span>غير مرتبط بأي بروفايل في الشجرة</span>
                        )}
                      </div>
                    </div>

                    {/* Item 4: Created Persons */}
                    <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl text-slate-300 flex items-start gap-2.5">
                      <Users className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
                      <div>
                        <span className="font-bold block mb-0.5">الأفراد المضافون للشجرة</span>
                        <span>أنشأ ({inspectionData.audit.createdPersonsCount}) فرداً في الشجرة</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety Reassurance Notice */}
                <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl text-xs text-blue-300 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-400">
                    <Info className="w-4 h-4" />
                    <span>ضمان الأمان وسلامة البيانات عند الحذف:</span>
                  </div>
                  <p className="leading-relaxed">
                    عند حذف هذا الحساب، لن يتم حذف أياً من الأفراد الـ ({inspectionData.audit.createdPersonsCount}) أو الطلبات المعتمدة والمعلقة، وستبقى شجرة العائلة كاملة ومحمية 100%.
                  </p>
                </div>
              </div>
            ) : null}

            {/* Action Controls */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={handleDeleteUser}
                disabled={submitting || loadingInspection}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>تأكيد الحذف النهائي للحساب</span>
              </button>

              <button
                onClick={() => { setDeletingUser(null); setInspectionData(null); }}
                className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                إلغاء الإجراء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">جاري التحميل...</div>}>
          <AdminUsersContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
