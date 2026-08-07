'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Country } from '@/types';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Save,
  X,
  Flag,
} from 'lucide-react';

function AdminCountriesContent() {
  const router = useRouter();
  const { user, dbUser, role, loading: authLoading } = useAuth();
  const isAdmin = role === 'ADMIN' || (role as string) === 'ADM';

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal State for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<Country | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    flag_emoji: '',
    is_active: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCountries = useCallback(async () => {
    setLoading(true);
    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';
      const res = await fetch('/api/v1/admin/countries', {
        headers: { 'x-user-email': savedEmail },
      });
      const data = await res.json();
      if (res.ok && data.countries) {
        setCountries(data.countries);
      } else {
        setMessage({ text: data.error || 'فشل جلب قائمة الدول', type: 'error' });
      }
    } catch {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [dbUser, user]);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      // Not authorized
    } else if (isAdmin) {
      fetchCountries();
    }
  }, [user, isAdmin, authLoading, fetchCountries]);

  const handleOpenAddModal = () => {
    setEditingCountry(null);
    setFormData({ name: '', code: '', flag_emoji: '', is_active: true });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (country: Country) => {
    setEditingCountry(country);
    setFormData({
      name: country.name || '',
      code: country.code || '',
      flag_emoji: country.flag_emoji || '',
      is_active: country.is_active ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setMessage({ text: 'اسم الدولة حقل مطلوب', type: 'error' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';
      const endpoint = '/api/v1/admin/countries';
      const method = editingCountry ? 'PUT' : 'POST';
      const payload = editingCountry
        ? { id: editingCountry.id, ...formData }
        : formData;

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({
          text: editingCountry ? 'تم تعديل بيانات الدولة بنجاح' : 'تمت إضافة الدولة الجديدة بنجاح',
          type: 'success',
        });
        setIsModalOpen(false);
        fetchCountries();
      } else {
        setMessage({ text: data.error || 'حدث خطأ أثناء الحفظ', type: 'error' });
      }
    } catch {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (country: Country) => {
    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';
      const res = await fetch('/api/v1/admin/countries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({
          id: country.id,
          is_active: !country.is_active,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          text: `تم ${!country.is_active ? 'تفعيل' : 'تعطيل'} دولة ${country.name} بنجاح`,
          type: 'success',
        });
        fetchCountries();
      } else {
        setMessage({ text: data.error || 'فشل تغيير حالة التفعيل', type: 'error' });
      }
    } catch {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const handleDeleteCountry = async (country: Country) => {
    if (!confirm(`هل أنت تأكد من رغبتك في حذف دولة "${country.name}"؟`)) {
      return;
    }

    try {
      const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';
      const res = await fetch(`/api/v1/admin/countries?id=${country.id}`, {
        method: 'DELETE',
        headers: { 'x-user-email': savedEmail },
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({ text: `تم حذف دولة ${country.name} بنجاح`, type: 'success' });
        fetchCountries();
      } else {
        setMessage({ text: data.error || 'فشل حذف الدولة', type: 'error' });
      }
    } catch {
      setMessage({ text: 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    }
  };

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.code && c.code.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 font-semibold dir-rtl">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span>جاري التحقق من الصلاحيات...</span>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 dir-rtl">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-red-200 dark:border-red-900/50 shadow-xl text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/60 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            صلاحيات غير كافية
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            عذراً، هذه الصفحة مخصصة لمدير النظام (ADMIN) فقط لتعريف وقوائم الدول المعتمدة.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-colors"
          >
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 dir-rtl">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="رجوع"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-emerald-100 dark:bg-emerald-950/60 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
                  إدارة قائمة الدول والانتساب الجغرافي
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لوحة تحكم مدير النظام لتعريف الدول والمناطق المتاحة في الشجرة
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCountries}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="تحديث البيانات"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة دولة جديدة</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast / Alert Message */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center justify-between border text-sm font-medium transition-all ${
              message.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-800 dark:text-red-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <span>{message.text}</span>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث باسم الدولة أو الكود..."
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            إجمالي الدول المباشرة: <span className="font-bold text-emerald-600 dark:text-emerald-400">{filteredCountries.length}</span> دولة
          </div>
        </div>

        {/* Countries Data Table */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              <span>جاري تحميل قائمة الدول...</span>
            </div>
          ) : filteredCountries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
              <Flag className="w-12 h-12 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">لا توجد دول مضافة حالياً</p>
              <p className="text-xs text-slate-500">انقر على زر "إضافة دولة جديدة" لإدخال فلسطين، الأردن، دول الخليج وغيرها.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">العلم / الأيقونة</th>
                    <th className="px-6 py-4">اسم الدولة / المنطقة</th>
                    <th className="px-6 py-4">الرمز (Code)</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-left">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredCountries.map((country) => (
                    <tr
                      key={country.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-xl">
                        {country.flag_emoji || '🌐'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-bold text-slate-900 dark:text-slate-100">
                        {country.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                        {country.code || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(country)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                            country.is_active
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              country.is_active ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{country.is_active ? 'مفعّلة' : 'معطلة'}</span>
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(country)}
                            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="تعديل"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCountry(country)}
                            className="p-2 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add / Edit Country Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm dir-rtl">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-bold text-lg">
                <Globe className="w-5 h-5 text-emerald-600" />
                <span>{editingCountry ? 'تعديل دولة' : 'إضافة دولة جديدة'}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  اسم الدولة / المنطقة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="مثال: فلسطين، الأردن، الإمارات، كندا..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    رمز العلم (Emoji)
                  </label>
                  <input
                    type="text"
                    value={formData.flag_emoji}
                    onChange={(e) => setFormData({ ...formData, flag_emoji: e.target.value })}
                    placeholder="🇵🇸 أو 🇯🇴"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    الكود الاختصاري (ISO)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PS, JO, US"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center uppercase"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  تفعيل الدولة في القوائم المنسدلة
                </span>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>حفظ البيانات</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminCountriesPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminCountriesContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
