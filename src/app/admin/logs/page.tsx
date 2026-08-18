'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Navbar } from '../../../components/Navbar';
import { AuthModal } from '../../../components/AuthModal';
import { AuthProvider, useAuth } from '../../../context/AuthContext';
import { ThemeProvider } from '../../../context/ThemeContext';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  Trash2,
  Globe,
  Clock,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Laptop,
  ArrowRight,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import Link from 'next/link';

interface LogItem {
  id: number;
  user_id: number | null;
  email: string;
  full_name: string | null;
  ip_address: string;
  user_agent: string | null;
  status: string;
  created_at: string;
}

function AdminLogsContent() {
  const { role, dbUser } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isSuperAdmin = role === 'ADMIN' || (role as string) === 'SUPER_ADMIN' || (role as string) === 'ADM';

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchLogs = useCallback(async () => {
    if (!isSuperAdmin) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const email = dbUser?.email || '';
      const res = await fetch(`/api/v1/admin/logs?role=${role}&admin_email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
      }
    } catch (err) {
      console.error('Failed to fetch login logs:', err);
    } finally {
      setLoading(false);
    }
  }, [role, dbUser?.email, isSuperAdmin]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleClearLogs = async () => {
    if (!confirm('هل أنت تأكد من رغبتك في مسح كافة سجلات الدخول؟ لا يمكن التراجع عن هذا الإجراء.')) {
      return;
    }
    try {
      const email = dbUser?.email || '';
      const res = await fetch(`/api/v1/admin/logs?role=${role}&admin_email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setLogs([]);
        showToast('تم مسح جميع سجلات الدخول بنجاح 🧹');
      }
    } catch (err) {
      showToast('تعذر مسح السجلات');
    }
  };

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (log.full_name && log.full_name.toLowerCase().includes(q)) ||
      log.email.toLowerCase().includes(q) ||
      log.ip_address.toLowerCase().includes(q)
    );
  });

  const uniqueIps = new Set(logs.map((l) => l.ip_address)).size;

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white dir-rtl flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 text-rose-400">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">عذراً، الوصول غير مصرح</h1>
        <p className="text-xs text-slate-400 mt-2 text-center max-w-md">
          هذه الصفحة مخصصة لمديري النظام (ADMIN) فقط للاطلاع على سجلات حركة وتسجيلات الدخول.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          <span>العودة للوحة التحكم</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 dir-rtl font-sans pb-16 select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Banner */}
      <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border-b border-slate-800 px-6 py-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-xl shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-purple-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-purple-500/20 text-purple-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-purple-500/30">
                  لوحة الأمان والأدمن
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  حماية حسابات النظام 🛡️
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                سجل عمليات الدخول (Login Audit Logs)
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                توثيق مباشر ومحمي لكافة عمليات وتجارب تسجيل الدخول بالنظام، متضمنة الـ IP والبريد والتوقيت.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث السجلات</span>
            </button>
            {logs.length > 0 && (
              <button
                onClick={handleClearLogs}
                className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/40 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجلات</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">إجمالي عمليات الدخول</span>
              <span className="text-lg font-black text-purple-400">{logs.length} <span className="text-xs text-slate-400 font-medium">عملية</span></span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">عناوين الـ IP الفريدة</span>
              <span className="text-lg font-black text-blue-400">{uniqueIps} <span className="text-xs text-slate-400 font-medium">عنوان IP</span></span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">آخر عمليّة دخول مسجلة</span>
              <span className="text-xs font-bold text-emerald-400 block truncate max-w-[180px]">
                {logs.length > 0 ? new Date(logs[0].created_at).toLocaleString('ar-EG') : 'لا يوجد'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-8 space-y-6">
        
        {/* Search & Filter Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-lg">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث بالاسم، الإيميل، أو الـ IP..."
              className="w-full bg-slate-950 text-slate-100 text-xs font-medium pr-10 pl-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="text-xs text-slate-400 font-semibold">
            عرض {filteredLogs.length} من أصل {logs.length} سجل
          </div>
        </div>

        {/* Logs Table Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs font-bold space-y-3">
              <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin mx-auto" />
              <p>جاري تحميل سجلات الدخول...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-semibold">
              لا توجد سجلات دخول مطابقة للبحث
            </div>
          ) : (
            <div className="overflow-x-auto dir-rtl">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 font-bold border-b border-slate-800">
                    <th className="px-5 py-3.5">#</th>
                    <th className="px-5 py-3.5">المستخدم والبريد الإلكتروني</th>
                    <th className="px-5 py-3.5">عنوان الـ IP</th>
                    <th className="px-5 py-3.5">تاريخ ووقت الدخول</th>
                    <th className="px-5 py-3.5">حالة الدخول</th>
                    <th className="px-5 py-3.5">الجهاز والمتصفح</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {filteredLogs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                      
                      {/* User & Email */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {log.full_name ? log.full_name[0] : 'U'}
                          </div>
                          <div>
                            <span className="font-extrabold text-white block">
                              {log.full_name || 'مستخدم النظام'}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono blockDir">{log.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* IP Address */}
                      <td className="px-5 py-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-purple-300 font-bold text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          <span>{log.ip_address}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="px-5 py-4 text-slate-300 font-medium">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{new Date(log.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        {log.status === 'REGISTER_SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-[10px]">
                            <UserCheck className="w-3 h-3" />
                            حساب جديد
                          </span>
                        ) : log.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[10px]">
                            <CheckCircle className="w-3 h-3" />
                            دخول ناجح
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-300 font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3" />
                            فشل الدخول
                          </span>
                        )}
                      </td>

                      {/* User Agent */}
                      <td className="px-5 py-4 max-w-xs truncate text-[11px] text-slate-400 font-mono" title={log.user_agent || ''}>
                        <div className="flex items-center gap-1.5">
                          <Laptop className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{log.user_agent || 'Unknown Browser'}</span>
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

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
              جاري تحميل سجلات الدخول والأمان...
            </div>
          }
        >
          <AdminLogsContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
