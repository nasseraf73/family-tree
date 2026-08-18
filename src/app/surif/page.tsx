'use client';

import React, { useState, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {
  MapPin,
  Mountain,
  Map,
  Users,
  Building2,
  Trees,
  Briefcase,
  GraduationCap,
  Activity,
  History,
  Sparkles,
  ShieldCheck,
  Droplets,
  ArrowRight,
  Maximize2,
  X,
  ChevronLeft,
  TrendingUp,
  Landmark,
  Compass,
  Calendar,
  Layers,
  PieChart,
  Sun
} from 'lucide-react';

function NammariyahContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history' | 'landmarks' | 'gallery' | 'development'>('overview');
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; desc: string } | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'ancient' | 'renaissance' | 'modern'>('all');

  // Key Mock Statistics (إحصائيات نموذجية تجريبية)
  const stats = [
    {
      title: 'إجمالي مساحة الأراضي والضواحي',
      value: '28,500',
      unit: 'دونم (28.5 كم²)',
      icon: Map,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    },
    {
      title: 'التعداد السكاني التقديري',
      value: '16,850',
      unit: 'نسمة (بيانات تجريبية)',
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      title: 'البساتين والمساحات الخضراء',
      value: '7,200',
      unit: 'دونم أشجار مثمرة وزيتون ونخيل',
      icon: Trees,
      color: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      textColor: 'text-amber-700 dark:text-amber-300'
    },
    {
      title: 'المعالم والأبنية التراثية',
      value: '380',
      unit: 'بيت وقصر تاريخي موثق',
      icon: Landmark,
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      title: 'نسبة التعليم وحملة الشهادات',
      value: '96.8%',
      unit: 'مؤشر تعليمي نموذجي متقدم',
      icon: GraduationCap,
      color: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    },
    {
      title: 'تغطية البنية التحتية الذكية',
      value: '98%',
      unit: 'طاقة نظيفة ومياه وإنترنت فائق',
      icon: Droplets,
      color: 'from-cyan-500 to-teal-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50',
      textColor: 'text-cyan-700 dark:text-cyan-300'
    },
  ];

  // Population history data (نمو سكاني تجريبي)
  const popHistory = [
    { year: '1920', pop: 1100, source: 'سجلات التوثيق القديمة (تجريبي)' },
    { year: '1940', pop: 1850, source: 'سجل العائلات التاريخي' },
    { year: '1960', pop: 3200, source: 'إحصاء القرى والبلدات' },
    { year: '1980', pop: 5900, source: 'المسح التنموي الشامل' },
    { year: '2000', pop: 9400, source: 'التعداد الميداني الأول' },
    { year: '2015', pop: 13800, source: 'التعداد الإحصائي التقديري' },
    { year: '2024', pop: 16850, source: 'المنظومة الرقمية الموحدة (محدث)' },
  ];
  const maxPop = 18000;

  // Land Usage data
  const landUsage = [
    { name: 'بساتين زراعية ومزارع نخيل', area: 7200, percentage: 25.3, color: 'bg-emerald-500', text: 'أشجار الزيتون والنخيل والمحاصيل الموسمية' },
    { name: 'أحياء سكنية وعمران حديث', area: 6800, percentage: 23.9, color: 'bg-blue-500', text: 'البلدة القديمة والمجمعات السكنية الجديدة' },
    { name: 'محميات طبيعية ومساحات خضراء', area: 3500, percentage: 12.3, color: 'bg-teal-600', text: 'متنزهات بيئية وتلال طبيعية خضراء' },
    { name: 'أراضٍ مخصصة للتوسع التنموي', area: 5200, percentage: 18.2, color: 'bg-amber-500', text: 'مخططات مستقبلية للمرافق والمشاريع' },
    { name: 'تضاريس ومرتفعات جبلية', area: 5800, percentage: 20.3, color: 'bg-slate-400 dark:bg-slate-600', text: 'مرتفعات طبيعية وإطلالات خلابة' },
  ];

  // Economic workforce distribution
  const workforce = [
    { sector: 'القطاع الهندسي والتقني والوظائف الحديثة', percentage: 38, color: 'bg-blue-600', icon: Briefcase },
    { sector: 'ريادة الأعمال والتجارة والاستثمار', percentage: 26, color: 'bg-emerald-600', icon: Building2 },
    { sector: 'الإنتاج الزراعي والصناعات الغذائية', percentage: 18, color: 'bg-teal-600', icon: Trees },
    { sector: 'التعليم والقطاع الأكاديمي والبحثي', percentage: 12, color: 'bg-purple-600', icon: GraduationCap },
    { sector: 'الحرف التراثية والفنون العائلية', percentage: 6, color: 'bg-amber-600', icon: Layers },
  ];

  // Timeline Events (تسلسل زمني تجريبي متناسق مع العائلة)
  const timelineEvents = [
    {
      year: '1850',
      era: 'ancient',
      title: 'تأسيس ديار النمّاري واستقرار الجد حزام',
      desc: 'استقرار الجد حزام النمّاري في الواحة الخصبة ووضع اللبنة الأولى لفرع العائلة وتشييد أولى البيوت الحجرية والآبار.'
    },
    {
      year: '1895',
      era: 'ancient',
      title: 'بناء ديوان العائلة والمسجد التراثي',
      desc: 'اكتمال بناء ديوان النمّاري المركزي ليكون ملتقى الصلح والضيافة والمناسبات وتدارس شؤون القبيلة والعائلة.'
    },
    {
      year: '1935',
      era: 'renaissance',
      title: 'توسع البساتين وحفر قنوات الري الحجرية',
      desc: 'غرس آلاف أشجار النخيل والزيتون وبناء قنوات مائية دقيقة اعتمدت على الينابيع الجوفية العذبة بالمنطقة.'
    },
    {
      year: '1970',
      era: 'renaissance',
      title: 'نهضة التعليم وتأسيس أول مجمع مدرسي',
      desc: 'افتتاح المجمع التعليمي التأسيسي وتخريج أولى الأفواج الأكاديمية التي ساهمت في نهضة البلدة والوطن.'
    },
    {
      year: '2005',
      era: 'modern',
      title: 'تأسيس مجلس أمناء ديار النمّاري',
      desc: 'هيكلة الصندوق الخيري التكافلي وإطلاق جائزة التفوق العلمي السنوية لأبناء وبنات عائلة النمّاري.'
    },
    {
      year: '2024',
      era: 'modern',
      title: 'إطلاق المنظومة الرقمية لشجرة العائلة',
      desc: 'تدشين المنصة الرقمية التفاعلية لربط الأنساب وتوثيق السلالات بنظام حوكمة ذكي وكشف الجد المشترك.'
    },
  ];

  const filteredTimeline = timelineEvents.filter(ev => {
    if (timelineFilter === 'all') return true;
    return ev.era === timelineFilter;
  });

  // Gallery items (معرض صور تجريبي عالي الجودة)
  const galleryItems = [
    {
      src: '/images/nammari/nammari-hero.jpg',
      title: 'مشهد بانورامي لديار النمّاري',
      desc: 'إطلالة علوية على تلال ديار النمّاري والمباني الحجرية العريقة المحاطة بالخضرة والينابيع.'
    },
    {
      src: '/images/nammari/nammari-landscape.jpg',
      title: 'بساتين النخيل والزيتون المباركة',
      desc: 'مساحات زراعية غناء تمتد على آلاف الدونمات وتعتبر رمزاً لأصالة وعطاء الأرض المباركة.'
    },
    {
      src: '/images/nammari/nammari-landmarks.jpg',
      title: 'ديوان النمّاري والبلدة التراثية',
      desc: 'طراز معماري عريق وشواهد تاريخية تجسد كرم الضيافة وأصالة الأجداد على مر العصور.'
    },
    {
      src: '/images/nammari/nammari-culture.jpg',
      title: 'التكافل الاجتماعي والمناسبات الجامعة',
      desc: 'أجواء اللقاءات العائلية السنوية ومواسم الحصاد والتلاحم بين مختلف أجيال العائلة.'
    },
  ];

  // Development Priorities (مشاريع تنموية نموذجية للعرض)
  const devPriorities = [
    { title: 'تطوير ديوان ومتحف النمّاري التراثي', count: 'مشروع رئيسي', desc: 'إنشاء قاعة توثيق رقمية ومتحف للمقتنيات والوثائق التاريخية للأجداد.', icon: Landmark, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { title: 'واحة الطاقة المتجددة والمياه الذكية', count: 'بنية خضراء', desc: 'تزويد الآبار والمرافق بأنظمة طاقة شمسية وشبكات ري حديثة موفرة للمياه.', icon: Droplets, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { title: 'مركز النمّاري للابتكار وتنمية المهارات', count: 'حاضنة أعمال', desc: 'مساحة تدريبية وتطويرية لدعم الشباب وتأهيلهم في مجالات التقنية وريادة الأعمال.', icon: GraduationCap, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
    { title: 'المتنزه البيئي الترفيهي العائلي', count: '250 دونم', desc: 'تهيئة مساحات خضراء ومسارات مشي وإطلالات جبلية لعائلات وزوار البلدة.', icon: Trees, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'الصندوق التكافلي للرعاية والمنح الدراسية', count: 'برنامج مستمر', desc: 'دعم الطلبة المتفوقين وتقديم الرعاية الاجتماعية للأسر لتعزيز الترابط العائلي.', icon: ShieldCheck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
    { title: 'توسعة وتحديث البوابة الرقمية الموحدة', count: 'إصدار 2.0', desc: 'تطوير تطبيق الهواتف الذكية وتوسيع قاعدة بيانات شجرة العائلة بتقنيات الذكاء الاصطناعي.', icon: Sparkles, color: 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans dir-rtl selection:bg-emerald-500 selection:text-white transition-colors duration-300">
      {/* Main App Navbar */}
      <Navbar />

      {/* Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-950 text-white pt-12 pb-20 border-b border-emerald-900/40">
        {/* Glow Effects & Patterns */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-medium mb-6">
            <Link href="/" className="hover:underline flex items-center gap-1">
              <span>الرئيسية</span>
            </Link>
            <ChevronLeft className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-300 font-bold">عن ديار النمّاري (نسخة تجريبية)</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Title & Info */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>ديار النمّاري — أصالة وتاريخ واعد</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                ديار النمّاري <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  واحة التاريخ ونبض الأجيال
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
                بلدة نموذجية وموطن عريق لفرع عائلة النمّاري، تمتد على تلال وبساتين خضراء بمساحة 28,500 دونم. تجمع بين عبق التراث والأبنية التاريخية الأصيلة ومشاريع التطور الحديثة، لتشكل نموذجاً مشرفاً للتكافل والترابط العائلي والمجتمعي.
              </p>

              {/* Badges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>الموقع الجغرافي</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">المنطقة الوسطى (واحة النمّارية)</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Mountain className="w-4 h-4" />
                    <span>الارتفاع عن البحر</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">620 متر</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Map className="w-4 h-4" />
                    <span>إجمالي المساحة</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">28,500 دونم</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>مجلس الإدارة والوجهاء</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">مجلس أمناء عائلة النمّاري</div>
                </div>
              </div>
            </div>

            {/* Featured Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/80 group">
                <Image
                  src="/images/nammari/nammari-hero.jpg"
                  alt="ديار النمّاري - التلال والطبيعة"
                  width={700}
                  height={500}
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-right">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">مشهد بانورامي لديار النمّاري</span>
                  <h3 className="text-white font-extrabold text-base sm:text-lg">طبيعة خلابة وتراث عمراني متجذر يمتد عبر الأجيال</h3>
                </div>
                <button
                  onClick={() => setSelectedImage({
                    src: '/images/nammari/nammari-hero.jpg',
                    title: 'مشهد بانورامي لديار النمّاري',
                    desc: 'طبيعة خلابة وبساتين خضراء وأبنية تراثية تمتد عبر ربوع ديار النمّاري العامرة.'
                  })}
                  className="absolute top-4 left-4 p-2 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-xl backdrop-blur-md border border-slate-700 transition-colors"
                  title="تكبير الصورة"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Navigation Tabs Bar */}
      <nav className="sticky top-20 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-3 no-scrollbar">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Compass className="w-4 h-4" />
              <span>نظرة عامة وإحصائيات</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'charts'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <PieChart className="w-4 h-4" />
              <span>الرسوم البيانية</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <History className="w-4 h-4" />
              <span>الخط الزمني التاريخي</span>
            </button>

            <button
              onClick={() => setActiveTab('landmarks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'landmarks'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Landmark className="w-4 h-4" />
              <span>المعالم والتراث</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'gallery'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <Maximize2 className="w-4 h-4" />
              <span>معرض الصور</span>
            </button>

            <button
              onClick={() => setActiveTab('development')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${activeTab === 'development'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>المشاريع والتنمية</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* Section 1: Overview & Key Statistics */}
        {(activeTab === 'overview' || activeTab === 'charts') && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span>الأرقام والمؤشرات الرئيسية (بيانات نموذجية)</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مؤشرات ديموغرافية وجغرافية وتنموية مجهزة للعرض التجريبي لبيئة العائلة والبلدة</p>
              </div>
            </div>

            {/* Key Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stats.map((st, idx) => {
                const IconComponent = st.icon;
                return (
                  <div
                    key={idx}
                    className={`rounded-3xl p-6 border ${st.bg} transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md flex flex-col justify-between`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${st.color} text-white flex items-center justify-center shadow-md`}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">مؤشر #{idx + 1}</span>
                    </div>

                    <div>
                      <h3 className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm font-bold mb-1">{st.title}</h3>
                      <div className={`text-3xl sm:text-4xl font-black ${st.textColor} tracking-tight`}>{st.value}</div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold mt-1">{st.unit}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Section 2: Visual Charts & Data Visualizers */}
        {(activeTab === 'overview' || activeTab === 'charts') && (
          <section className="space-y-10 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="text-right">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30">
                  <PieChart className="w-5 h-5" />
                </div>
                <span>الرسوم البيانية والمخططات التفاعلية</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تتبع التطور السكاني وتوزيع استخدامات الأراضي والأنشطة الاقتصادية في ديار النمّاري</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Population Growth Chart */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <span>نمو التعداد السكاني في ديار النمّاري (1920 - 2024)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">توسع مجتمعي مبارك ونمو متواصل للأسر والأجيال</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">بيانات تجريبية</span>
                </div>

                {/* Bars Visualizer */}
                <div className="space-y-4 pt-4">
                  {popHistory.map((item, idx) => {
                    const pct = Math.round((item.pop / maxPop) * 100);
                    return (
                      <div key={idx} className="space-y-1 group">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-slate-700 dark:text-slate-300 w-16">{item.year}م</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px] hidden sm:inline">{item.source}</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-extrabold">{item.pop.toLocaleString('ar-EG')} نسمة</span>
                        </div>
                        <div className="w-full h-4 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-700 group-hover:brightness-110"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>المصدر: السجل الرقمي التاريخي لعائلة النمّاري</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">معدل النمو السنوي: ~2.9%</span>
                </div>
              </div>

              {/* Economic Workforce Chart */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                        <span>توزيع المجالات المهنية والأنشطة</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">تنوع التخصصات العلمية والعملية لأبناء العائلة</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {workforce.map((item, idx) => {
                      const IconComp = item.icon;
                      return (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                              <IconComp className="w-4 h-4 text-emerald-500" />
                              <span>{item.sector}</span>
                            </div>
                            <span className="text-xs font-black text-slate-900 dark:text-slate-100">{item.percentage}%</span>
                          </div>
                          <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                  💡 تمتاز ديار النمّاري بارتفاع نسبة الكفاءات الأكاديمية والتقنية وأصحاب المبادرات الريادية.
                </div>
              </div>
            </div>

            {/* Land Usage Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Map className="w-5 h-5 text-amber-500" />
                  <span>توزيع استخدامات الأراضي في ديار النمّاري (إجمالي 28,500 دونم)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">توازن بيئي نموذجي بين المزارع والمناطق السكنية والمحميات الطبيعية</p>
              </div>

              {/* Combined Progress Bar */}
              <div className="w-full h-8 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden flex p-1 gap-1 mb-6 shadow-inner">
                {landUsage.map((item, idx) => (
                  <div
                    key={idx}
                    className={`${item.color} h-full rounded-xl relative group transition-all duration-300 hover:brightness-110 cursor-pointer`}
                    style={{ width: `${item.percentage}%` }}
                    title={`${item.name}: ${item.area.toLocaleString('ar-EG')} دونم (${item.percentage}%)`}
                  />
                ))}
              </div>

              {/* Breakdown Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {landUsage.map((item, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`} />
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</h4>
                    </div>
                    <div className="text-xl font-black text-slate-900 dark:text-slate-100">{item.area.toLocaleString('ar-EG')} <span className="text-xs font-normal">دونم</span></div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">{item.percentage}% من المساحة</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Section 3: Interactive History & Timeline */}
        {(activeTab === 'overview' || activeTab === 'history') && (
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                    <History className="w-5 h-5" />
                  </div>
                  <span>الخط الزمني لتاريخ ديار النمّاري المحطات الكبرى</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تتبع مسيرة الآباء والأجداد من النشأة الأولى حتى إطلاق المنظومة الرقمية الحديثة</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setTimelineFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${timelineFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                    }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setTimelineFilter('ancient')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${timelineFilter === 'ancient'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                    }`}
                >
                  التأسيس والنشأة
                </button>
                <button
                  onClick={() => setTimelineFilter('renaissance')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${timelineFilter === 'renaissance'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                    }`}
                >
                  النهضة والتوسع
                </button>
                <button
                  onClick={() => setTimelineFilter('modern')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${timelineFilter === 'modern'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                    }`}
                >
                  العصر الحديث
                </button>
              </div>
            </div>

            {/* Timeline Cards Container */}
            <div className="relative border-r-2 border-purple-500/30 mr-4 sm:mr-8 space-y-8 pr-6 sm:pr-8 py-2">
              {filteredTimeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -right-[31px] sm:-right-[39px] top-1.5 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-4 border-purple-600 group-hover:scale-125 transition-transform duration-300 shadow-md" />

                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-300 text-xs font-extrabold rounded-xl border border-purple-500/30 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>عام {item.year}م</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">محطة مضيئة</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">{item.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Culture & Landmarks */}
        {(activeTab === 'overview' || activeTab === 'landmarks') && (
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Landmark className="w-5 h-5" />
                </div>
                <span>المعالم التراثية والرموز العائلية الأصيلة</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">أبرز المعالم المعمارية والمرافق الجامعة التي تميز ديار النمّاري</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Landmark 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4 font-bold">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">ديوان وقصر الجد حزام التراثي</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  الصرح التاريخي الأبرز في قلب البلدة، شُيد بالحجارة المنحوتة الأصيلة، ويحتضن اجتماعات العائلة السنوية ومجالس التشاور والصلح.
                </p>
              </div>

              {/* Landmark 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-4 font-bold">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">عين ماء النمّارية العذبة</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  نبع مائي تاريخي متدفق كان المصدر الأساسي لسقاية القوافل وبساتين النخيل، ويحيط به متنزه بيئي حديث مخصص لجلسات العائلة.
                </p>
              </div>

              {/* Landmark 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30 mb-4 font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">حي النمّاري العتيق (380 مبنى)</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  أزقة ومبانٍ حجرية ساحرة تحتفظ بالعمارة التقليدية والقباب والأقواس، وتعد شاهداً حياً على تتابع الأجيال عبر القرون.
                </p>
              </div>

              {/* Landmark 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30 mb-4 font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">حرف النسيج والصناعات التراثية</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  توارث أبناء وبنات العائلة صناعة السجاد اليدوي وصياغة المشغولات الفضية والأواني النحاسية المنقوشة بزخارف العائلة.
                </p>
              </div>

              {/* Landmark 5 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all lg:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30 mb-4 font-bold">
                  <Trees className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">مهرجان الحصاد والتكافل العائلي السنوي</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  احتفالية كبرى تنظم سنوياً في موسم جني التمور والزيتون، يلتقي فيها كبار وشباب عائلة **النمّاري** في أجواء من الألفة والتعاون وتوزيع التمور والخيرات على الأسر المستحقة.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Section 5: Photo Gallery */}
        {(activeTab === 'overview' || activeTab === 'gallery') && (
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <span>معرض الصور البانورامي لديار النمّاري</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">اضغط على أي صورة لتكبيرها واستعراض التفاصيل البصرية</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {galleryItems.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedImage(item)}
                  className="group relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <Image
                    src={item.src}
                    alt={item.title}
                    width={500}
                    height={350}
                    className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                  <div className="absolute bottom-4 right-4 left-4 text-right">
                    <h3 className="text-white font-extrabold text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-300 text-xs line-clamp-2 font-normal">{item.desc}</p>
                  </div>

                  <div className="absolute top-3 left-3 p-2 rounded-xl bg-slate-900/70 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 6: Development Projects & Future Visions */}
        {(activeTab === 'overview' || activeTab === 'development') && (
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span>المبادرات التنموية والمشاريع المستقبلية</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">خارطة المبادرات التطويرية لخدمة أبناء العائلة ودعم الاستدامة والتميز</p>
            </div>

            {/* Vision Banner */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-emerald-800 dark:text-emerald-300">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl shrink-0 shadow-md">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base mb-1">رؤية ديار النمّاري 2030</h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  تهدف المبادرات إلى ترسيخ مكانة ديار النمّاري كنموذج استثنائي للقرى والبلدات الذكية، من خلال توظيف التقنيات الحديثة، والتحول للطاقة النظيفة، وتمكين الأجيال الشابة وتوثيق الأنساب تشاركياً.
                </p>
              </div>
            </div>

            {/* Priorities Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {devPriorities.map((dev, idx) => {
                const IconComponent = dev.icon;
                return (
                  <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-3 rounded-2xl border ${dev.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-extrabold rounded-full">{dev.count}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-2">{dev.title}</h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">{dev.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-800/80 text-slate-200 hover:bg-rose-600 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative h-96 sm:h-[480px] w-full">
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                fill
                className="object-contain bg-slate-950"
              />
            </div>

            <div className="p-6 bg-slate-900 text-right border-t border-slate-800">
              <h3 className="text-xl font-extrabold text-white mb-2">{selectedImage.title}</h3>
              <p className="text-slate-300 text-sm">{selectedImage.desc}</p>
            </div>
          </div>
        </div>
      )}

      {/* Footer / CTA Section */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20 dir-rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              <Compass className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-white">ديار النمّاري — عراقة وتاريخ</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            منظومة توثيق أنساب عائلة النمّاري والتراث العائلي النموذجي. صفحة مخصصة للعرض التجريبي واستعراض إمكانيات المنظومة.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </Link>

            <Link
              href="/tree"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
            >
              <span>شجرة العائلة</span>
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function NammariyahPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
              جاري تحميل دليل ديار النمّاري...
            </div>
          }
        >
          <NammariyahContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
