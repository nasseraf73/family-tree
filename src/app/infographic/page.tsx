'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Image from 'next/image';
import { Navbar } from '../../components/Navbar';
import { AuthModal } from '../../components/AuthModal';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { Person, Relationship } from '../../types';
import { calculateTreeAnalytics, TreeAnalyticsResult } from '../../lib/treeAnalytics';
import { getPentanyicFullName } from '../../lib/lineage';

import {
  Users,
  Crown,
  GitBranch,
  Baby,
  Heart,
  Sparkles,
  TrendingUp,
  Award,
  Calendar,
  Printer,
  Share2,
  CheckCircle,
  PieChart,
  ShieldCheck,
  BarChart3,
  ChevronLeft,
} from 'lucide-react';

function InfographicContent() {
  const { role } = useAuth();

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [persons, setPersons] = useState<Person[]>([]);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [personsMap, setPersonsMap] = useState<Map<number, Person>>(new Map());
  const [analytics, setAnalytics] = useState<TreeAnalyticsResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const fetchTreeData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/tree/canvas?role=${role}`);
      const data = await res.json();

      if (data.nodes) {
        const pList: Person[] = data.nodes.map((n: any) => n.data as Person);
        setPersons(pList);

        const pMap = new Map<number, Person>();
        pList.forEach((p) => pMap.set(p.id, p));
        setPersonsMap(pMap);

        const parsedRels: Relationship[] = (data.edges || []).map((e: any) => ({
          id: parseInt(e.id.replace('e-', ''), 10),
          person_id: parseInt(e.target, 10),
          related_person_id: parseInt(e.source, 10),
          relationship_type: e.data?.relationship_type || 'PARENT',
          status: e.data?.status || 'VERIFIED',
          created_at: new Date().toISOString(),
        }));
        setRelationships(parsedRels);

        // Compute Infographic Analytics
        const result = calculateTreeAnalytics(pList, parsedRels);
        setAnalytics(result);
      }
    } catch (err) {
      console.error('Failed to fetch data for infographic page', err);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  const handlePrintReport = () => {
    window.print();
  };

  const handleShareReport = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('تم نسخ رابط صفحة الإنفوجرافيك إلى الحافظة بنجاح! 🔗📊');
  };

  if (loading || !analytics) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 text-sm dir-rtl space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center animate-spin">
          <PieChart className="w-6 h-6 text-slate-950" />
        </div>
        <p className="font-bold text-slate-300">جاري احتساب التحليلات والسجلات التوثيقية للشجرة...</p>
      </div>
    );
  }

  const { demographics, records, generational } = analytics;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 dir-rtl font-sans pb-16 select-none print:bg-white print:text-black">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce print:hidden">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Hero Infographic Banner */}
      <div className="relative bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-950 border-b border-amber-500/20 px-6 py-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-600 to-yellow-400 p-0.5 shadow-2xl shadow-amber-500/20 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center">
                <BarChart3 className="w-8 h-8 text-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  لوحة التوثيق التحليلي
                </span>
                <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                إنفوجرافيك وإحصائيات شجرة العائلة
              </h1>
              <p className="text-xs text-slate-400 mt-1 font-medium max-w-xl">
                مؤشرات تفاعلية شاملة توثق ديموغرافيا النسب، سجلات الأرقام القياسية، وتوزيع الأجيال والأسماء الأكثر انتشاراً.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 print:hidden">
            <button
              onClick={handleShareReport}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-bold flex items-center gap-2 transition-all hover:scale-105 shadow-md"
            >
              <Share2 className="w-4 h-4 text-blue-400" />
              مشاركة الإنفوجرافيك
            </button>
            <button
              onClick={handlePrintReport}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
              <Printer className="w-4 h-4" />
              طباعة / حفظ التقرير
            </button>
          </div>
        </div>

        {/* Top 5 Quick Stat Badges */}
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">إجمالي أفراد العائلة</span>
              <span className="text-xl font-black text-emerald-400">{demographics.totalMembers} <span className="text-xs font-bold text-slate-400">فرد</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">الأحياء بحفظ الله</span>
              <span className="text-xl font-black text-blue-400">{demographics.livingCount} <span className="text-xs font-bold text-slate-400">({demographics.livingPct}%)</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
              <Heart className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">سجلات المصاهرة والزواج</span>
              <span className="text-xl font-black text-pink-400">{demographics.totalSpouses} <span className="text-xs font-bold text-slate-400">عقد</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <GitBranch className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">عمق سلاسل الأجيال</span>
              <span className="text-xl font-black text-amber-400">{generational.maxDepth} <span className="text-xs font-bold text-slate-400">أجيال</span></span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl shadow-xl flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-semibold block">العمر التقديري للعائلة</span>
              <span className="text-xl font-black text-indigo-400">
                ~ {generational.maxDepth * 30} <span className="text-[10px] font-bold text-slate-400">عام</span>
              </span>
              <span className="text-[9px] text-slate-500 block leading-none mt-0.5">
                ({generational.maxDepth * 27}-{generational.maxDepth * 33} عام تقريباً)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 mt-10 space-y-10">

        {/* Section 1: Demographics Breakdown (الإحصائيات العامة) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">الإحصائيات الديموغرافية والتوزيع التراكمي</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Males vs Females */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">النوع الاجتماعي (الذكور والإناث)</span>
                <span className="text-[11px] text-slate-400 font-bold">{demographics.totalMembers} عضو</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${demographics.malesPct}%` }}
                  className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full transition-all duration-1000"
                  title={`ذكور: ${demographics.malesCount} (${demographics.malesPct}%)`}
                />
                <div
                  style={{ width: `${demographics.femalesPct}%` }}
                  className="bg-gradient-to-r from-pink-600 to-rose-400 h-full transition-all duration-1000"
                  title={`إناث: ${demographics.femalesCount} (${demographics.femalesPct}%)`}
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">الذكور:</span>
                  <span className="text-emerald-400">{demographics.malesCount} ({demographics.malesPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-slate-300">الإناث:</span>
                  <span className="text-pink-400">{demographics.femalesCount} ({demographics.femalesPct}%)</span>
                </div>
              </div>
            </div>

            {/* Vital Status (Living vs Deceased) */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">الحالة الحيوية (الأحياء والمتوفون)</span>
                <span className="text-[11px] text-slate-400 font-bold">رحمة الله للمتوفين</span>
              </div>

              <div className="w-full h-4 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  style={{ width: `${demographics.livingPct}%` }}
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full transition-all duration-1000"
                />
                <div
                  style={{ width: `${demographics.deceasedPct}%` }}
                  className="bg-slate-700 h-full transition-all duration-1000"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-slate-300">الأحياء:</span>
                  <span className="text-blue-400">{demographics.livingCount} ({demographics.livingPct}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600" />
                  <span className="text-slate-300">المتوفون:</span>
                  <span className="text-slate-400">{demographics.deceasedCount} ({demographics.deceasedPct}%)</span>
                </div>
              </div>
            </div>

            {/* Marital Breakdown */}
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-300">مؤشر المصاهرة والربط الأُسري</span>
                <span className="text-[11px] text-pink-400 font-bold">{demographics.totalSpouses} زيجات</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold mb-1">المتزوجون المسجلون</span>
                  <span className="text-lg font-black text-pink-300">{demographics.marriedCount} فرد</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 block font-semibold mb-1">متوسط الأبناء/الأسرة</span>
                  <span className="text-lg font-black text-amber-300">{generational.avgChildrenPerFamily} طفل</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* Section 2: Hall of Fame & Record Holders (سجل الأرقام القياسية والتسجيلات الفريدة) */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-slate-100">سجل الأرقام القياسية والتسجيلات المتميزة</h2>
            </div>
            <span className="text-xs text-amber-400 font-bold bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full">
              تراجم متميزة 🏆
            </span>
          </div>

          {/* Sub-section: Largest Branches by Generation (أكبر فروع الشجرة حسب الأجيال) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-extrabold text-emerald-300">أكبر فروع العائلة حسب الأجيال</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Branch Card 1: Gen 2 (Abna' Al-Jadd) */}
              <div className="bg-gradient-to-b from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-emerald-400 transition-all">
                <div className="absolute top-3 left-3 text-emerald-400/20 group-hover:text-emerald-400/40 transition-colors">
                  <GitBranch className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                    🌿 2
                  </span>
                  <span className="text-xs font-black text-emerald-300">أكبر فرع في الجيل الثاني (أبناء الجد)</span>
                </div>

                {records.largestBranchGen2.person ? (
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      {getPentanyicFullName(records.largestBranchGen2.person, personsMap, relationships)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 pt-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>تعداد الفرع: {records.largestBranchGen2.valueText}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{records.largestBranchGen2.subText}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">غير محدد</p>
                )}
              </div>

              {/* Branch Card 2: Gen 3 (Ahfad Al-Jadd) */}
              <div className="bg-gradient-to-b from-teal-950/50 via-slate-900 to-slate-900 border border-teal-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-teal-400 transition-all">
                <div className="absolute top-3 left-3 text-teal-400/20 group-hover:text-teal-400/40 transition-colors">
                  <GitBranch className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                    🌱 3
                  </span>
                  <span className="text-xs font-black text-teal-300">أكبر فرع في الجيل الثالث (أحفاد الجد)</span>
                </div>

                {records.largestBranchGen3.person ? (
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      {getPentanyicFullName(records.largestBranchGen3.person, personsMap, relationships)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-400 pt-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>تعداد الفرع: {records.largestBranchGen3.valueText}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{records.largestBranchGen3.subText}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">غير محدد</p>
                )}
              </div>

              {/* Branch Card 3: Gen 4 (Abna' Ahfad) */}
              <div className="bg-gradient-to-b from-cyan-950/50 via-slate-900 to-slate-900 border border-cyan-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-cyan-400 transition-all">
                <div className="absolute top-3 left-3 text-cyan-400/20 group-hover:text-cyan-400/40 transition-colors">
                  <GitBranch className="w-12 h-12" />
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-7 h-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold text-xs border border-cyan-500/30">
                    🍀 4
                  </span>
                  <span className="text-xs font-black text-cyan-300">أكبر فرع في الجيل الرابع (أبناء الأحفاد)</span>
                </div>

                {records.largestBranchGen4.person ? (
                  <div className="space-y-1.5">
                    <h4 className="text-base font-extrabold text-white leading-tight">
                      {getPentanyicFullName(records.largestBranchGen4.person, personsMap, relationships)}
                    </h4>
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 pt-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>تعداد الفرع: {records.largestBranchGen4.valueText}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{records.largestBranchGen4.subText}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">غير محدد</p>
                )}
              </div>

            </div>
          </div>

          {/* Sub-section: Other Record Holders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
            
            {/* Record 1: Oldest Living Member */}
            <div className="bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="absolute top-3 left-3 text-amber-400/20 group-hover:text-amber-400/40 transition-colors">
                <Crown className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs border border-amber-500/30">
                  👑
                </span>
                <span className="text-xs font-black text-amber-300">عميد العائلة (الأكبر سناً)</span>
              </div>

              {records.oldestLiving.person ? (
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">
                    {getPentanyicFullName(records.oldestLiving.person, personsMap, relationships)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{records.oldestLiving.valueText}</span>
                    {records.oldestLiving.subText && (
                      <span className="text-slate-400 text-[11px]">({records.oldestLiving.subText})</span>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">لا توجد سنوات ميلاد مسجلة للأحياء</p>
              )}
            </div>

            {/* Record 2: Most Offspring */}
            <div className="bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border border-blue-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="absolute top-3 left-3 text-blue-400/20 group-hover:text-blue-400/40 transition-colors">
                <Baby className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-500/30">
                  👶
                </span>
                <span className="text-xs font-black text-blue-300">الأكثر إنجاباً للأبناء</span>
              </div>

              {records.mostOffspring.person ? (
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">
                    {getPentanyicFullName(records.mostOffspring.person, personsMap, relationships)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-400 pt-1">
                    <Baby className="w-3.5 h-3.5" />
                    <span>الذرية المباشرة: {records.mostOffspring.valueText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">غير محدد</p>
              )}
            </div>

            {/* Record 3: Most Spouses */}
            <div className="bg-gradient-to-b from-pink-950/40 via-slate-900 to-slate-900 border border-pink-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-pink-400 transition-all">
              <div className="absolute top-3 left-3 text-pink-400/20 group-hover:text-pink-400/40 transition-colors">
                <Heart className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs border border-pink-500/30">
                  💍
                </span>
                <span className="text-xs font-black text-pink-300">الأكثر تعدد للزوجات والمصاهرة</span>
              </div>

              {records.mostSpouses.person ? (
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">
                    {getPentanyicFullName(records.mostSpouses.person, personsMap, relationships)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-pink-400 pt-1">
                    <Heart className="w-3.5 h-3.5" />
                    <span>عدد الزوجات: {records.mostSpouses.valueText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">لا توجد زيجات متعددة مسجلة</p>
              )}
            </div>

            {/* Record 4: Newest Member */}
            <div className="bg-gradient-to-b from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 p-5 rounded-3xl shadow-xl relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="absolute top-3 left-3 text-purple-400/20 group-hover:text-purple-400/40 transition-colors">
                <Sparkles className="w-12 h-12" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs border border-purple-500/30">
                  🍼
                </span>
                <span className="text-xs font-black text-purple-300">أحدث مولود / إضافة للعائلة</span>
              </div>

              {records.newestMember.person ? (
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-white">
                    {getPentanyicFullName(records.newestMember.person, personsMap, relationships)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 pt-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{records.newestMember.valueText}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">غير محدد</p>
              )}
            </div>

          </div>
        </section>

        {/* Section 3: Top 5 Names Analytics (تحليل الأسماء الأكثر انتشاراً) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-slate-100">تحليل الأسماء الأكثر تكراراً وانتشاراً في العائلة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top 5 Male Names */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-emerald-400 flex items-center gap-2">
                  <span>أكثر 5 أسماء تكراراً للذكور</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">إجمالي الذكور: {demographics.malesCount}</span>
              </div>

              <div className="space-y-3">
                {generational.topMaleNames.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] border border-emerald-500/30">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-emerald-400">{item.count} فرد ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${item.percentage * 2}%` }}
                        className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Female Names */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-extrabold text-pink-400 flex items-center gap-2">
                  <span>أكثر 5 أسماء تكراراً للإناث</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">إجمالي الإناث: {demographics.femalesCount}</span>
              </div>

              <div className="space-y-3">
                {generational.topFemaleNames.map((item, idx) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center text-[10px] border border-pink-500/30">
                          {idx + 1}
                        </span>
                        <span className="text-slate-200">{item.name}</span>
                      </div>
                      <span className="text-pink-400">{item.count} فرد ({item.percentage}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        style={{ width: `${item.percentage * 2}%` }}
                        className="bg-gradient-to-r from-pink-600 to-rose-400 h-full rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </section>
      </main>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function InfographicPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
              جاري تحميل إنفوجرافيك الشجرة الإحصائي...
            </div>
          }
        >
          <InfographicContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
