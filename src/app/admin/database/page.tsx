'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {
  Database,
  Cloud,
  HardDrive,
  RefreshCw,
  Download,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  AlertTriangle,
  FileJson,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Users,
  Globe,
  Heart,
  Trees,
  Layers,
  Check,
  Server,
} from 'lucide-react';

interface DbStats {
  users: number;
  countries: number;
  persons: number;
  relationships: number;
  marriages: number;
  branch_reviewers: number;
  merge_requests: number;
}

interface BackupFile {
  name: string;
  sizeBytes: number;
  createdAt: string;
}

function AdminDatabaseContent() {
  const { user, dbUser, role, loading: authLoading } = useAuth();
  const isAdmin = role === 'ADMIN' || (role as string) === 'ADM';

  const [loading, setLoading] = useState(true);
  const [localAvailable, setLocalAvailable] = useState(false);
  const [cloudStats, setCloudStats] = useState<DbStats | null>(null);
  const [localStats, setLocalStats] = useState<DbStats | null>(null);
  const [backups, setBackups] = useState<BackupFile[]>([]);

  // Action states
  const [syncing, setSyncing] = useState<'pull' | 'push' | null>(null);
  const [backingUp, setBackingUp] = useState(false);
  const [confirmModal, setConfirmModal] = useState<'pull' | 'push' | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || dbUser?.email || user?.email || '' : user?.email || '';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/v1/admin/database/stats', {
        headers: { 'x-user-email': savedEmail },
      });
      const statsData = await statsRes.json();

      if (statsRes.ok) {
        setCloudStats(statsData.cloudStats);
        setLocalStats(statsData.localStats);
        setLocalAvailable(statsData.localAvailable);
      } else {
        setMessage({ text: statsData.error || 'فشل جلب إحصائيات قاعدة البيانات', type: 'error' });
      }

      // 2. Fetch Backups
      const backupRes = await fetch('/api/v1/admin/database/backup', {
        headers: { 'x-user-email': savedEmail },
      });
      const backupData = await backupRes.json();
      if (backupRes.ok && backupData.backups) {
        setBackups(backupData.backups);
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ في الاتصال بالخادم', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [savedEmail, dbUser?.email, user?.email]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin, fetchData]);

  const handleSync = async (action: 'pull' | 'push') => {
    setConfirmModal(null);
    setSyncing(action);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/admin/database/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({
          text: `🎉 ${data.message}! (تمت مزامنة ${data.counts.persons} فرد، ${data.counts.relationships} علاقة، و ${data.counts.marriages} زيجة)`,
          type: 'success',
        });
        await fetchData();
      } else {
        setMessage({ text: data.error || 'فشلت عملية المزامنة', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ غير متوقع أثناء المزامنة', type: 'error' });
    } finally {
      setSyncing(null);
    }
  };

  const handleCreateBackup = async (source: 'cloud' | 'local') => {
    setBackingUp(true);
    setMessage(null);

    try {
      const res = await fetch('/api/v1/admin/database/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': savedEmail,
        },
        body: JSON.stringify({ source }),
      });

      const data = await res.json();
      if (res.ok && data.fileName) {
        setMessage({
          text: `✅ تم إنشاء النسخة الاحتياطية بنجاح: ${data.fileName} (${data.counts.persons} فرد)`,
          type: 'success',
        });

        // Trigger immediate file download
        const blob = new Blob([JSON.stringify(data.payload, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        await fetchData();
      } else {
        setMessage({ text: data.error || 'فشل إنشاء النسخة الاحتياطية', type: 'error' });
      }
    } catch (err) {
      setMessage({ text: (err as Error).message || 'حدث خطأ أثناء إنشاء النسخة الاحتياطية', type: 'error' });
    } finally {
      setBackingUp(false);
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
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white">غير مصرح بالوصول</h1>
          <p className="text-slate-400 text-sm">صفحة إدارة وقواعد البيانات مخصصة فقط لمدراء النظام الرئيسي.</p>
          <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>
      </div>
    );
  }

  const tableDefinitions = [
    { key: 'persons', name: 'الأفراد والشخصيات', icon: Trees, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { key: 'relationships', name: 'علاقات النسب والقرابة', icon: Users, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { key: 'marriages', name: 'سجلات الزيجات', icon: Heart, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { key: 'countries', name: 'الدول والانتساب الجغرافي', icon: Globe, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { key: 'users', name: 'حسابات المستخدمين والترخيص', icon: Server, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
    { key: 'branch_reviewers', name: 'مشرفو ونظار الفروع', icon: Layers, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
    { key: 'merge_requests', name: 'طلبات دمج وتدقيق المكررات', icon: RefreshCw, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans dir-rtl transition-colors duration-300 selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* Hero Title Section */}
      <section className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 text-white py-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Link href="/" className="hover:underline">الرئيسية</Link>
                <span>/</span>
                <span className="text-slate-400">لوحة الإدارة</span>
                <span>/</span>
                <span className="text-white">إدارة قواعد البيانات</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Database className="w-6 h-6" />
                </div>
                <span>إدارة ومزامنة قواعد البيانات والنسخ الاحتياطي</span>
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm">
                التحكم التام بالمزامنة بين البيئة السحابية (Cloud) والبيئة المحلية (Localhost) وتوليد النسخ الاحتياطية لـ 7 جداول
              </p>
            </div>

            {/* Refresh Stats Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all flex items-center gap-2 self-start md:self-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>تحديث الإحصائيات والحالة</span>
            </button>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

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

        {/* Connection Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cloud Database Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center justify-center">
                <Cloud className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">البيئة السحابية المنشورة</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Supabase Cloud Database</h3>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>متصل ومفعل للعموم</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => handleCreateBackup('cloud')}
              disabled={backingUp}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">باك آب الكلاود</span>
            </button>
          </div>

          {/* Localhost Database Status */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                localAvailable
                  ? 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/30'
              }`}>
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">قاعدة البيانات المحلية</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Localhost PostgreSQL (5432)</h3>
                {localAvailable ? (
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    <span>متصل ومعتمد على الجهاز</span>
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>غير متصل أو السيرفر مغلق</span>
                  </p>
                )}
              </div>
            </div>

            {localAvailable && (
              <button
                onClick={() => handleCreateBackup('local')}
                disabled={backingUp}
                className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-500/30 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">باك آب اللوكال</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Controls Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>إجراءات المزامنة والنسخ الاحتياطي السريعة</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">اختر الإجراء المناسب بناءً على البيئة الأكثر تحديثاً وشمولية للبيانات</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pull Action Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/30 mb-3">
                  <ArrowDownCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">استيراد وسحب من الكلاود (Pull)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  يُستخدم عندما تكون نسخة الكلاود أشمل بفضل إضافات الأعضاء. يقوم بسحب كافة البيانات وتحديث اللوكال بها.
                </p>
              </div>

              <button
                onClick={() => setConfirmModal('pull')}
                disabled={syncing !== null || !localAvailable}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
              >
                {syncing === 'pull' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري السحب والمزامنة...</span>
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>سحب من الكلاود إلى اللوكال</span>
                  </>
                )}
              </button>
            </div>

            {/* Push Action Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/30 mb-3">
                  <ArrowUpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">تصدير ودفع إلى الكلاود (Push)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  يُستخدم عندما تقوم بتعديل وإدخال شجرة عريضة محلياً على جهازك وترغب في نشرها وتحديث الكلاود بها بالكامل.
                </p>
              </div>

              <button
                onClick={() => setConfirmModal('push')}
                disabled={syncing !== null || !localAvailable}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
              >
                {syncing === 'push' ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري التحديث والدفع...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>دفع من اللوكال إلى الكلاود</span>
                  </>
                )}
              </button>
            </div>

            {/* Backup Action Card */}
            <div className="p-6 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center border border-purple-500/30 mb-3">
                  <FileJson className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 mb-1">توليد وتنزيل النسخة الاحتياطية</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  أخذ نسخة شاملة لـ 7 جداول بحفظ محلي في مجلد <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">backups/</code> وتنزيل الملف فوراً.
                </p>
              </div>

              <button
                onClick={() => handleCreateBackup('cloud')}
                disabled={backingUp}
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20 transition-all flex items-center justify-center gap-2"
              >
                {backingUp ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>جاري أخذ النسخة...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>إنشاء نسخة وتنزيلها (JSON)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Live Comparison Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <span>مقارنة أعداد السجلات في الجداول السبعة (100% Coverage)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">جدول مرئي يقارن بين بيانات السحابة الحية والبيانات المحلية على الجهاز</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tableDefinitions.map((tb) => {
              const IconComponent = tb.icon;
              const cloudVal = cloudStats ? (cloudStats as Record<string, number>)[tb.key] || 0 : 0;
              const localVal = localStats ? (localStats as Record<string, number>)[tb.key] || 0 : 0;
              const diff = cloudVal - localVal;

              return (
                <div key={tb.key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl border ${tb.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{tb.name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">جدول: {tb.key}</span>
                      </div>
                    </div>
                  </div>

                  {/* Numbers Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-500/20 text-center">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">الكلاود (Cloud)</span>
                      <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{cloudVal.toLocaleString('ar-EG')}</span>
                    </div>

                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-2xl border border-blue-500/20 text-center">
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">اللوكال (Local)</span>
                      <span className="text-xl font-black text-blue-700 dark:text-blue-300">
                        {localAvailable ? localVal.toLocaleString('ar-EG') : 'غير متصل'}
                      </span>
                    </div>
                  </div>

                  {/* Status Indicator Badge */}
                  <div className="pt-1 flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-400 text-[11px]">حالة المزامنة:</span>
                    {diff === 0 ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>متطابقان تماماً</span>
                      </span>
                    ) : diff > 0 ? (
                      <span className="text-blue-600 dark:text-blue-400">
                        الكلاود أشمل بـ (+{diff})
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">
                        اللوكال أشمل بـ (+{Math.abs(diff)})
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Backups History Section */}
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileJson className="w-5 h-5 text-purple-500" />
                <span>سجل النسخ الاحتياطية المحفوظة محلياً (backups/)</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">الملفات التي تم توليدها وحفظها في مجلد المشروع</p>
            </div>
            <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-bold rounded-full">
              {backups.length} ملف
            </span>
          </div>

          {backups.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs sm:text-sm">
              لا توجد ملفات نسخ احتياطية محفوظة حالياً. اضغط على "إنشاء نسخة وتنزيلها" لأخذ النسخة الأولى.
            </div>
          ) : (
            <div className="space-y-3">
              {backups.map((bk, idx) => (
                <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl border border-purple-500/30">
                      <FileJson className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">{bk.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        تاريخ التوليد: {new Date(bk.createdAt).toLocaleString('ar-EG')} • الحجم: {Math.round(bk.sizeBytes / 1024)} كيلوبايت
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCreateBackup('cloud')}
                    className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-purple-600 hover:text-white text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 self-end sm:self-auto"
                  >
                    <Download className="w-4 h-4" />
                    <span>تنزيل النسخة</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

      </main>

      {/* Confirmation Dialog Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-slate-100 space-y-6 shadow-2xl dir-rtl">
            <div className="flex items-center gap-3 text-amber-400">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black">
                {confirmModal === 'pull' ? 'تأكيد السحب والمزامنة من الكلاود' : 'تأكيد الدفع والتحديث إلى الكلاود'}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
              {confirmModal === 'pull'
                ? 'سيتم سحب جميع البيانات من الكلاود واستبدال بيانات القاعدة المحلية على جهازك بها تماماً. هل أنت متاكد من إتمام المزامنة؟'
                : 'سيتم رفع جميع بيانات جهازك المحلي وتحديث قاعدة بيانات الكلاود بها بالكامل. هل أنت متأكد من إتمام التحديث؟'}
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => handleSync(confirmModal)}
                className={`flex-1 py-3 text-white font-bold text-xs rounded-xl shadow-md transition-all ${
                  confirmModal === 'pull' ? 'bg-blue-600 hover:bg-blue-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                تأكيد وبدء المزامنة
              </button>

              <button
                onClick={() => setConfirmModal(null)}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminDatabasePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense fallback={<div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">جاري التحميل...</div>}>
          <AdminDatabaseContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
