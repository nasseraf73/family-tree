'use client';

// Force static generation - serves from CDN instantly, no cold start
export const dynamic = 'force-static';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '../components/Navbar';
import { AuthModal } from '../components/AuthModal';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import {
  GitBranch,
  Users,
  ShieldCheck,
  Network,
  Sparkles,
  ArrowLeft,
  UserCheck,
  BookOpen,
  Layers,
  BarChart3,
  GitMerge,
  Eye,
  Sun,
  Share2,
  CircleDot,
  Crown,
} from 'lucide-react';

function LandingPageContent() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user } = useAuth();

  const handleProtectedClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setIsAuthModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans dir-rtl transition-colors duration-300">
      {/* Navbar */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* ============================================ */}
      {/* SECTION 1: Hero */}
      {/* ============================================ */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
        {/* Ambient blurs */}
        <div className="absolute top-1/4 right-1/2 translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-10 w-[400px] h-[400px] bg-teal-500/10 dark:bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            {/* Right Side: Hero Text */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-right">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-sm">
                <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span>منظومة رقمية شاملة لتوثيق الأنساب وبناء شجرة العائلة تشاركياً</span>
              </div>

              {/* Headline */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white leading-[1.25] tracking-tight">
                منصة <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 dark:from-emerald-400 dark:via-teal-300 dark:to-emerald-300 bg-clip-text text-transparent">شجرة العائلة</span> الكبرى
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-xl text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                منظومة تشاركية موحّدة تجمع أبناء العائلة لبناء وتوثيق سلالتهم على كانفاس تفاعلي غير محدود، مع عرض دائري للشجرة، إنفوجرافيك إحصائي، كشف الجد المشترك، ونظام حوكمة واعتماد صارم لحفظ النسب بدقة.
              </p>

              {/* 3 CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/tree"
                  onClick={handleProtectedClick}
                  className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-3 text-base transition-all hover:scale-105"
                >
                  <GitBranch className="w-5 h-5" />
                  <span>الدخول لشجرة العائلة</span>
                  <ArrowLeft className="w-5 h-5" />
                </Link>

                <Link
                  href="/radial-tree"
                  className="w-full sm:w-auto px-7 py-4 bg-slate-200/80 dark:bg-slate-900 hover:bg-slate-300 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold rounded-2xl border border-slate-300 dark:border-slate-800 flex items-center justify-center gap-2 text-base transition-all"
                >
                  <CircleDot className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <span>استعرض الشجرة الدائرية</span>
                </Link>
              </div>

              {/* Quick Stats */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 dark:border-slate-800/80 max-w-lg mx-auto lg:mx-0">
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">5</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">أوضاع عرض متقدمة</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-teal-600 dark:text-teal-400">تشاركي</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">لجميع أفراد العائلة</span>
                </div>
                <div>
                  <span className="block text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">حوكمة</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">اعتماد ودقة أنساب</span>
                </div>
              </div>
            </div>

            {/* Left Side: Logo */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-emerald-500/20 via-teal-500/10 to-slate-900/40 p-2 border border-emerald-500/30 shadow-2xl flex items-center justify-center group">
                <div className="absolute inset-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-6 shadow-inner">
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 transform group-hover:scale-105 transition-transform duration-500 drop-shadow-xl">
                    <Image
                      src="/images/logo/family_tree_logo_M.png"
                      alt="لوجو شجرة العائلة"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">منصة شجرة العائلة الكبرى</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">تكاتف الأجيال وحفظ السلالة</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 2: Quick Access Cards */}
      {/* ============================================ */}
      <section className="py-16 md:py-24 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
              أقسام المنظومة الرئيسية
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              استكشف وتنقّل بين أقسام النظام
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              اختر القسم الذي تريد الانتقال إليه. الأقسام المتاحة للجميع يمكن تصفحها بدون تسجيل دخول.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Card 1: شجرة العائلة الكبرى */}
            <Link href="/tree" onClick={handleProtectedClick} className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all hover:shadow-xl hover:shadow-emerald-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">شجرة العائلة الكبرى</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">الكانفاس التفاعلي الرئيسي لبناء وتحرير الشجرة وإضافة الأفراد والعلاقات بكافة أنواعها.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">يتطلب تسجيل دخول</span></div>
            </Link>

            {/* Card 2: الشجرة الدائرية */}
            <Link href="/radial-tree" className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-teal-500/50 dark:hover:border-teal-500/50 transition-all hover:shadow-xl hover:shadow-teal-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <CircleDot className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">الشجرة الدائرية التفاعلية</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">عرض بصري فريد للشجرة على شكل أقواس دائرية متدرجة بزاوية وطول فرع قابلين للتحكم.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">متاح للجميع</span></div>
            </Link>

            {/* Card 3: شجرتي */}
            <Link href="/my-tree" onClick={handleProtectedClick} className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all hover:shadow-xl hover:shadow-blue-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Eye className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">منصة شجرتي</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">تخصيص منظور العرض بـ 4 أوضاع ذكية: الفرع، العمود الفقري، الأسرة، أو الشجرة الكاملة.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">يتطلب تسجيل دخول</span></div>
            </Link>

            {/* Card 4: الجد المشترك */}
            <Link href="/common-ancestor" onClick={handleProtectedClick} className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-all hover:shadow-xl hover:shadow-amber-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <GitMerge className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">كشف الجد المشترك</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">خوارزمية LCA لاكتشاف أقرب جد مشترك بين أي فردين وعرض سلسلة النسب ودرجة القرابة.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">يتطلب تسجيل دخول</span></div>
            </Link>

            {/* Card 5: إنفوجرافيك */}
            <Link href="/infographic" className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-purple-500/50 dark:hover:border-purple-500/50 transition-all hover:shadow-xl hover:shadow-purple-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">إنفوجرافيك وإحصائيات</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">لوحة تحليلية شاملة تعرض ديموغرافيا العائلة، الأرقام القياسية، وتوزيع الأجيال والأسماء.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">متاح للجميع</span></div>
            </Link>

            {/* Card 6: لوحة المراجعة */}
            <Link href="/tree" onClick={handleProtectedClick} className="group relative bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 hover:border-rose-500/50 dark:hover:border-rose-500/50 transition-all hover:shadow-xl hover:shadow-rose-500/5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">لوحة مراجعة المشرف</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">لوحة حوكمة مركزية للمشرفين لاعتماد الطلبات المعلقة ومراجعة عمليات الدمج.</p>
                </div>
              </div>
              <div className="mt-4"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">للمشرفين فقط</span></div>
            </Link>

          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 3: عن المنظومة والهدف */}
      {/* ============================================ */}
      <section id="about" className="py-16 md:py-24 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-16">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              عن المنظومة والهدف منها
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              تطبيق <strong className="text-emerald-600 dark:text-emerald-400">&quot;شجرة العائلة&quot;</strong> هو منصة رقمية تفاعلية وتشاركية تُبنى وتنمو بجهود جميع أفراد العائلة. بدلاً من الاعتماد على شخص واحد لتدوين النسب، يُتيح التطبيق لكل فرد المساهمة في إضافة وتحديث بيانات الأقارب وتوثيق العلاقات النسبية والسير الشخصية.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:border-emerald-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">التكاتف التشاركي</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                تتيح لكافة أبناء العائلة إضافة الأقارب والسير الشخصية ليكون العمل مجهوداً عائلياً مشتركاً يربط الفروع ويصل الأجيال.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:border-teal-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">حوكمة لجنة الاعتماد</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                لا تُدرج أي إضافة جديدة في الشجرة الرسمية إلا بعد تدقيقها واعتمادها من قِبل أعضاء لجنة الاعتماد لضمان صحة النسب.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm hover:border-amber-500/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">حفظ التراث والأنساب</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                توثيق رقمي دائم للسير الشخصية والأصول النسبية وحفظ تاريخ الآباء والأجداد لتتعرف عليه الأجيال القادمة بسهولة.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 4: الخصائص والميزات (12 ميزة) */}
      {/* ============================================ */}
      <section id="features" className="py-16 md:py-24 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800/80 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
              دليل الخصائص والإمكانيات
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
              جميع خصائص وميزات المنظومة
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              تعرّف على كافة الأدوات الذكية المتوفرة لبناء شجرتك العائلية وتحليلها واستكشاف علاقات النسب.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Feature 1 */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-emerald-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform"><GitBranch className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">البناء والتكافل التشاركي</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">تمكين جميع أفراد العائلة من إدخال بيانات الأقارب وربط صلات النسب (آباء، أبناء، أزواج متعددين) بشكل جماعي على كانفاس تفاعلي غير محدود.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-amber-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform"><ShieldCheck className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">التدقيق ولجنة الاعتماد</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">نظام موافقة محكم لا يسمح بإدراج أي فرد جديد في الشجرة الرسمية إلا بعد مراجعة وقبول من لجنة الاعتماد المعتمدة.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-teal-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Network className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">التصفح التفاعلي والتخطيطات</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">كانفاس ذكي بتقنية React Flow يتيح التكبير والتصغير والبحث المباشر والتبديل بين العرض الأفقي والعمودي مع ترتيب تلقائي عبر Dagre.</p>
            </div>

            {/* Feature 4: الشجرة الدائرية */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-teal-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center group-hover:scale-110 transition-transform"><CircleDot className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">الشجرة الدائرية التفاعلية</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">عرض بصري SVG فريد يرسم الشجرة كأقواس دائرية متدرجة مع شريط تحكم بزاوية القوس وطول الفرع، ودعم طي/فتح الفروع والتصدير.</p>
            </div>

            {/* Feature 5: شجرتي */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-blue-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Eye className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">منصة شجرتي — 4 أوضاع تصفية</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">تخصيص العرض بأربعة أوضاع ذكية: الفرع الكامل، العمود الفقري، وحدة الأسرة، أو الشجرة الشاملة — للتصفح والاستكشاف بمنظور شخصي.</p>
            </div>

            {/* Feature 6: كشف الجد المشترك */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-amber-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Crown className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">كشف الجد المشترك (LCA)</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">خوارزمية ذكية تكتشف أقرب جد مشترك بين أي فردين وتعرض سلسلة النسب على شكل رسم Y-Shape مع حساب درجة القرابة بالعربية.</p>
            </div>

            {/* Feature 7: إنفوجرافيك */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-purple-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform"><BarChart3 className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">إنفوجرافيك وإحصائيات تحليلية</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">لوحة تحليلية شاملة: ديموغرافيا العائلة، سجلات الأرقام القياسية، توزيع الأجيال، أكثر 5 أسماء تكراراً للذكور والإناث.</p>
            </div>

            {/* Feature 8: كشف التكرارات */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-rose-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Layers className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">كشف التكرارات والدمج الذكي</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">خوارزمية Levenshtein لاكتشاف السجلات المكررة تلقائياً بمقارنة الأسماء العربية (مع تطبيع التشكيل والألف) وسنوات الميلاد.</p>
            </div>

            {/* Feature 9: المطالبة بالملف */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-blue-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform"><UserCheck className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">المطالبة بالملف — &quot;هذا أنا&quot;</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">يتيح لأي فرد العثور على بطاقته داخل الشجرة والمطالبة بتوثيق ملكيتها ليتمكن من تحديث بياناته الذاتية وصوره وسيرته.</p>
            </div>

            {/* Feature 10: البطاقات والنسب */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-indigo-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">البطاقات والنسب المتسلسل</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">بطاقات شاملة لكل فرد بالصور والسيرة والنسب المتصل (سلسلة &quot;بن&quot;) وصولاً للجد الأول، مع تفاصيل الميلاد والوفاة ومكان الدفن.</p>
            </div>

            {/* Feature 11: تصدير ومشاركة */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-sky-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Share2 className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">تصدير SVG ومشاركة الروابط</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">تصدير الشجرة كملف SVG عالي الدقة للطباعة، ومشاركة روابط مباشرة لنتائج كشف الجد المشترك وإنفوجرافيك الإحصائيات.</p>
            </div>

            {/* Feature 12: الوضع الليلي */}
            <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-3 hover:border-yellow-500/40 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center justify-center group-hover:scale-110 transition-transform"><Sun className="w-5 h-5" /></div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">الوضع الليلي والنهاري</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">تبديل فوري بين المظهر المضيء والداكن عبر زر واحد في شريط التنقل، مع حفظ التفضيل تلقائياً في المتصفح.</p>
            </div>

          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 5: CTA Banner */}
      {/* ============================================ */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/20 via-transparent to-transparent opacity-50 pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-8">
          <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-xl">
            <GitBranch className="w-8 h-8" />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              جاهز لبناء وتوثيق شجرة عائلتك؟
            </h2>
            <p className="text-emerald-100/80 text-sm sm:text-lg max-w-2xl mx-auto">
              انتقل الآن إلى الكانفاس التفاعلي وابدأ بإضافة الأقارب، أو استعرض الشجرة الدائرية والإحصائيات مباشرة.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/tree" onClick={handleProtectedClick} className="inline-flex items-center gap-3 px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-2xl shadow-emerald-500/30 text-lg transition-all hover:scale-105">
              <span>الانتقال لشجرة العائلة</span>
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <Link href="/radial-tree" className="inline-flex items-center gap-3 px-8 py-5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl border border-white/20 text-base transition-all hover:scale-105">
              <CircleDot className="w-5 h-5 text-teal-300" />
              <span>استعراض الشجرة الدائرية</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECTION 6: Footer */}
      {/* ============================================ */}
      <footer className="py-10 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 p-0.5 flex items-center justify-center">
              <Image src="/images/logo/family_tree_logo_XS.png" alt="شعار شجرة العائلة" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-extrabold text-slate-700 dark:text-slate-200 text-sm">منصة شجرة العائلة الكبرى</span>
          </div>
          <p className="text-center sm:text-right">
            جميع الحقوق محفوظة © {new Date().getFullYear()} — منصة توثيق الأنساب الجماعية
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}

export default function Page() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LandingPageContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
