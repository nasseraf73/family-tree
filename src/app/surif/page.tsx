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
  ShieldAlert,
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
  PieChart
} from 'lucide-react';

function SurifContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'history' | 'landmarks' | 'gallery' | 'development'>('overview');
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string; desc: string } | null>(null);
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'ancient' | 'mandate' | 'modern'>('all');

  // Key Statistics
  const stats = [
    {
      title: 'إجمالي مساحة الأراضي',
      value: '31,600',
      unit: 'دونم (31.6 كم²)',
      icon: Map,
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50',
      textColor: 'text-emerald-700 dark:text-emerald-300'
    },
    {
      title: 'التعداد السكاني التقديري (2021)',
      value: '19,013',
      unit: 'نسمة',
      icon: Users,
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/50',
      textColor: 'text-blue-700 dark:text-blue-300'
    },
    {
      title: 'الأراضي المزروعة بالزيتون',
      value: '6,035',
      unit: 'دونم زيتون بعلي',
      icon: Trees,
      color: 'from-amber-500 to-yellow-600',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/50',
      textColor: 'text-amber-700 dark:text-amber-300'
    },
    {
      title: 'المباني القديمة والأثرية',
      value: '548',
      unit: 'مبنى تاريخي (>400 عام)',
      icon: Landmark,
      color: 'from-purple-500 to-indigo-600',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/50',
      textColor: 'text-purple-700 dark:text-purple-300'
    },
    {
      title: 'نسبة الإلمام بالقراءة (القرائية)',
      value: '94.4%',
      unit: 'نسبة الأمية 5.6% فقط',
      icon: GraduationCap,
      color: 'from-indigo-500 to-blue-600',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/50',
      textColor: 'text-indigo-700 dark:text-indigo-300'
    },
    {
      title: 'تغطية شبكتي المياه والكهرباء',
      value: '95% / 93%',
      unit: 'خدمة منازل البلدة',
      icon: Droplets,
      color: 'from-cyan-500 to-teal-600',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800/50',
      textColor: 'text-cyan-700 dark:text-cyan-300'
    },
  ];

  // Population history data
  const popHistory = [
    { year: '1922', pop: 1265, source: 'تعداد الانتداب البريطاني' },
    { year: '1931', pop: 1640, source: 'تعداد الانتداب البريطاني' },
    { year: '1945', pop: 2190, source: 'سجل فلسطين الرسمي' },
    { year: '1961', pop: 2827, source: 'تعداد المملكة الأردنية' },
    { year: '1997', pop: 9649, source: 'التعداد الفلسطيني الأول' },
    { year: '2007', pop: 13365, source: 'التعداد الفلسطيني الثاني' },
    { year: '2017', pop: 17287, source: 'التعداد الفلسطيني الثالث' },
    { year: '2021', pop: 19013, source: 'تقدير جهاز الإحصاء (PCBS)' },
  ];
  const maxPop = 20000;

  // Land Usage data
  const landUsage = [
    { name: 'أراضٍ مزروعة حالياً', area: 8457, percentage: 26.8, color: 'bg-emerald-500', text: 'زيتون، حبوب، فواكه وبقوليات' },
    { name: 'مناطق معمارية ومباني', area: 8000, percentage: 25.3, color: 'bg-blue-500', text: 'المركز التاريخي والأحياء الحديثة' },
    { name: 'أراضٍ غير مزروعة (بور)', area: 5043, percentage: 16.0, color: 'bg-amber-500', text: 'صالحة للزراعة وتحتاج استصلاح' },
    { name: 'أراضٍ عارية ورعوية أخرى', area: 9700, percentage: 30.6, color: 'bg-slate-400 dark:bg-slate-600', text: 'تضاريس وجبال ومراعي' },
    { name: 'غابات ومساحات خضراء', area: 400, percentage: 1.3, color: 'bg-teal-600', text: 'محميات وغابات طبيعية' },
  ];

  // Economic workforce distribution
  const workforce = [
    { sector: 'العمل داخل الخط الأخضر', percentage: 55, color: 'bg-blue-600', icon: Briefcase },
    { sector: 'القطاع الزراعي ورعاية الأراضي', percentage: 20, color: 'bg-emerald-600', icon: Trees },
    { sector: 'التجارة والتوزيع والخدمات', percentage: 12, color: 'bg-purple-600', icon: Building2 },
    { sector: 'الصناعات الحرفية والمقالع', percentage: 3, color: 'bg-amber-600', icon: Layers },
    { sector: 'الوظائف الحكومية والقطاعات الأخرى', percentage: 10, color: 'bg-slate-600', icon: GraduationCap },
  ];

  // Timeline Events
  const timelineEvents = [
    {
      year: '1838',
      era: 'ancient',
      title: 'التوثيق في كتابات الرحالة روبنسون',
      desc: 'سجل الرحالة روبنسون صوريف كقرية مسلمة تابعة لقضاء الخليل تقع على مرتفع جبل زراعي.'
    },
    {
      year: '1863',
      era: 'ancient',
      title: 'زيارة الفرنسي فيكتور جويران وآثار العملات الرومانية',
      desc: 'لاحظ وجود محطة سابقة لصك النقود الرومانية وأبئار قديمة وعدد سكان يقارب 700 نسمة.'
    },
    {
      year: '1883',
      era: 'ancient',
      title: 'مسح صندوق استكشاف فلسطين (PEF)',
      desc: 'وُصفت بأنها "قرية قمة تل منخفض تحيط بها أشجار الزيتون من الجنوب والمزارع الخصبة".'
    },
    {
      year: '1922 - 1945',
      era: 'mandate',
      title: 'فترة الانتداب البريطاني والنمو السكاني',
      desc: 'ارتفع عدد السكان من 1,265 نسمة سنة 1922 إلى 2,190 نسمة سنة 1945 بتوسع في غرس أشجار الزيتون.'
    },
    {
      year: '1945',
      era: 'mandate',
      title: 'بناء المسجد العمري الكبير',
      desc: 'تشييد المسجد العمري الكبير في قلب البلدة، والذي شهد بعد ذلك عمليات توسعة شاملة عام 1970.'
    },
    {
      year: '1948 - 1961',
      era: 'mandate',
      title: 'الإدارة الأردنية وتعداد 1961',
      desc: 'خضعت صوريف للإدارة الأردنية بعد حرب 1948 وسُجل بها 2,827 نسمة في إحصاء عام 1961.'
    },
    {
      year: '1997',
      era: 'modern',
      title: 'تأسيس بلدية صوريف الرسمية',
      desc: 'إنشاء مجلس بلدي مستقل لصوريف يتولى تنظيم الخدمات والبنية التحتية وتطوير المؤسسات.'
    },
    {
      year: '2004',
      era: 'modern',
      title: 'جدار الفصل وتأثيرات الاحتلال',
      desc: 'بدء بناء جدار الفصل العنصري مما أدى لعزل نحو 1,300 دونم ومصادرة أراضٍ زراعية.'
    },
    {
      year: '2017 - 2025',
      era: 'modern',
      title: 'التعداد الحديث والدعم التنموي',
      desc: 'وصل التعداد السكاني إلى 17,287 (2017) و19,000+ حالياً مع صمود الأهالي وتطوير المؤسسات المحلية.'
    },
  ];

  const filteredTimeline = timelineEvents.filter(ev => {
    if (timelineFilter === 'all') return true;
    return ev.era === timelineFilter;
  });

  // Gallery items
  const galleryItems = [
    {
      src: '/images/surif/surif-hero.png',
      title: 'مشهد بانورامي لبلدة صوريف',
      desc: 'إطلالة ساحرة على التلال والمباني السكنية المحاطة بالوديان والأشجار الخضراء.'
    },
    {
      src: '/images/surif/surif-landscape.png',
      title: 'جبال صوريف وأراضيها الزراعية',
      desc: 'سلسلة التلال الزراعية وبساتين الزيتون المباركة التي تغطي آلاف الدونمات.'
    },
    {
      src: '/images/surif/surif-landmarks.png',
      title: 'الأصالة والتراث المعماري',
      desc: 'المباني التاريخية والحجارة العريقة في البلدة القديمة والمعالم الدينية.'
    },
    {
      src: '/images/surif/surif-culture.png',
      title: 'التراث الشعبي وحصاد الزيتون',
      desc: 'الموروث الثقافي الأصيل وحرفة نسيج المزاود والتلاحم العائلي في موسم القطاف.'
    },
  ];

  // Development Priorities
  const devPriorities = [
    { title: 'تعبيد الطرق وتوسيع الشبكة', count: '35 كم', desc: 'فتح ورصف طرق رئيسية وزراعية لتسهيل وصول الأهالي والمزارعين للأراضي.', icon: Map, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { title: 'تأهيل وتوسعة شبكة المياه', count: '32 كم', desc: 'بناء خزانات مياه مرتفعة وزيادة الضغط للتغلب على انقطاع المياه في المناطق العالية.', icon: Droplets, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { title: 'إنشاء مركز صحي متكامل', count: 'مركز شامل', desc: 'تزويد البلدة بمركز صحي متطور وتأمين عيادات طوارئ تقلل الاعتماد على مستشفيات المدن.', icon: Activity, color: 'text-rose-500 bg-rose-500/10 border-rose-500/30' },
    { title: 'بناء مدرسة ابتدائية جديدة للبنين', count: 'مدرسة جديدة', desc: 'تخفيف الاكتظاظ المدرسي وتطوير الغرف الصفية في المدارس الـ 9 القائمة بالبلدة.', icon: GraduationCap, color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/30' },
    { title: 'استصلاح الأراضي والجدران الاستنادية', count: '8,000 دونم', desc: 'بناء السلاسل الحجرية وترميم التربة لحماية الأراضي من المصادرة ودعم الزراعة.', icon: Trees, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
    { title: 'إدارة الصرف الصحي والمخلفات', count: 'شبكة مركزية', desc: 'استبدال الحفر الامتصاصية بشبكة صرف صحي حماية للمياه الجوفية والتصدي لمخلفات المستوطنات.', icon: ShieldAlert, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
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
            <span className="text-slate-300 font-bold">عن بلدة صوريف</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Title & Info */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold backdrop-blur-md">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>دليل إنفوجرافيك القرية والتاريخ</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                بلدة صوريف <br />
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
                  عراقة التاريخ وأصالة الأرض
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl font-normal">
                صوريف بلدة فلسطينية تقع في شمال غرب محافظة الخليل، ترتفع نحو 600 متر عن سطح البحر وتمتد على مساحة 31,600 دونم من التلال الخضراء وأشجار الزيتون التليدة. تُعد نموذجاً أصيلاً للصمود، وتزخر بتاريخ حافل ومعالم عريقة وعائلات متجذرة.
              </p>

              {/* Badges Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>الموقع الإداري</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">شمال الخليل (25 كم)</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Mountain className="w-4 h-4" />
                    <span>الارتفاع عن البحر</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">600 متر</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Map className="w-4 h-4" />
                    <span>مساحة الأراضي</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">31,600 دونم</div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3 backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-1">
                    <Building2 className="w-4 h-4" />
                    <span>رئاسة البلدية</span>
                  </div>
                  <div className="text-slate-100 text-xs sm:text-sm font-bold">أحمد علي لافي</div>
                </div>
              </div>
            </div>

            {/* Featured Hero Image Card */}
            <div className="lg:col-span-5 relative">
              <div className="relative rounded-3xl overflow-hidden border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/80 group">
                <Image
                  src="/images/surif/surif-hero.png"
                  alt="صوريف - التلال والأراضي الزراعية"
                  width={700}
                  height={500}
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                <div className="absolute bottom-4 right-4 left-4 text-right">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">مشهد بانورامي لبلدة صوريف</span>
                  <h3 className="text-white font-extrabold text-base sm:text-lg">طبيعة صوريف الخلابة ومبانيها الممتدة على قمم الجبال</h3>
                </div>
                <button
                  onClick={() => setSelectedImage({
                    src: '/images/surif/surif-hero.png',
                    title: 'مشهد بانورامي لبلدة صوريف',
                    desc: 'طبيعة صوريف الخلابة ومبانيها الممتدة على قمم الجبال المحاطة ببساتين الزيتون.'
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>نظرة عامة وإحصائيات</span>
            </button>

            <button
              onClick={() => setActiveTab('charts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'charts'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>الرسوم البيانية</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>الخط الزمني التاريخي</span>
            </button>

            <button
              onClick={() => setActiveTab('landmarks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'landmarks'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>المعالم والتراث</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'gallery'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Maximize2 className="w-4 h-4" />
              <span>معرض الصور</span>
            </button>

            <button
              onClick={() => setActiveTab('development')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeTab === 'development'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>التحديات والتنمية</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">

        {/* Section 1: Overview & Numerical Statistics */}
        {(activeTab === 'overview' || activeTab === 'charts') && (
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span>الأرقام والإحصائيات الرئيسية</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مؤشرات ديموغرافية وجغرافية وبنية تحتية موثقة من الجهاز المركزي للإحصاء الفلسطيني ووزارة الزراعة</p>
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
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تتبع التطور السكاني واستخدامات الأراضي والقطاعات الاقتصادية في صوريف</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Population Growth Chart */}
              <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" />
                      <span>نمو التعداد السكاني في صوريف (1922 - 2021)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">تضاعف عدد السكان أكثر من 15 ضعفاً خلال قرن من الزمن</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full">تعداد رسمي</span>
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
                  <span>المصدر: الجهاز المركزي للإحصاء الفلسطيني والسجل التاريخي</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">النمو السنوي: ~2.8%</span>
                </div>
              </div>

              {/* Economic Workforce Chart */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-500" />
                        <span>توزيع القطاعات الاقتصادية والقوى العاملة</span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">مصادر دخل السكان والنشاط العملي</p>
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
                  💡 تُشكل العمالة والزراعة ركيزتين رئيسيتين لاقتصاد البلدة مع زيادة الاهتمام بالمشاريع التجارية المحلية.
                </div>
              </div>
            </div>

            {/* Land Usage Distribution */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="mb-6">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Map className="w-5 h-5 text-amber-500" />
                  <span>توزيع استخدامات الأرض في صوريف (إجمالي 31,600 دونم)</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">تنوع جغرافي بين الأراضي الزراعية والمناطق المعمارية والغابات</p>
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
                  <span>الخط الزمني لتاريخ صوريف المحطات الرئيسية</span>
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">مسيرة البلدة عبر العصور من الاستكشافات القديمة حتى العصر الحديث</p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                <button
                  onClick={() => setTimelineFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    timelineFilter === 'all'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                  }`}
                >
                  الكل
                </button>
                <button
                  onClick={() => setTimelineFilter('ancient')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    timelineFilter === 'ancient'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                  }`}
                >
                  التاريخ القديم
                </button>
                <button
                  onClick={() => setTimelineFilter('mandate')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    timelineFilter === 'mandate'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-purple-500'
                  }`}
                >
                  الانتداب والأردن
                </button>
                <button
                  onClick={() => setTimelineFilter('modern')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    timelineFilter === 'modern'
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
                        <span>عام {item.year}</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">محطة تاريخية</span>
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
                <span>المعالم التاريخية والتراث السائد</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">أبرز المعالم الروحية والتاريخية والحرف التقليدية التي تمتاز بها صوريف</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Landmark 1 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 mb-4 font-bold">
                  <Landmark className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">المسجد العمري الكبير (1945م)</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  يقع في قلب صوريف القديمة، شُيد عام 1945م وتمت توسعته عام 1970م. يُعد مركز التجمع الديني والاجتماعي في الأعياد والمناسبات الوطنية.
                </p>
              </div>

              {/* Landmark 2 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 mb-4 font-bold">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">مقام أبو عبيدة (خربة جمرين)</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  مقام الصحابي الجليل أبو عبيدة عامر بن الجراح جنوب البلدة بخربة جمرين، معلم ديني وتاريخي بارز يرتاده الأهالي والزوار.
                </p>
              </div>

              {/* Landmark 3 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30 mb-4 font-bold">
                  <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">البلدة القديمة (548 مبنى أثري)</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  تضم أكثر من 548 ييت ومبنى أثري يعود تاريخ بعضها لأكثر من 400 عام، وتتميز بالطراز المعماري الفلسطيني الكنعاني والعثماني.
                </p>
              </div>

              {/* Landmark 4 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/30 mb-4 font-bold">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">حرفة نسيج المزاود والسجاد</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  تعتز صوريف بحرفها التقليدية التراثية كنسيج المفروشات (المزاود) اليدوية والأعمال الصوفية وصناعة الألبان البلدي.
                </p>
              </div>

              {/* Landmark 5 */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all lg:col-span-2">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/30 mb-4 font-bold">
                  <Trees className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mb-2">موسم حصاد الزيتون والعادات الاجتماعية</h3>
                <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                  يُشكل موسم قطاف الزيتون احتفالية كبرى تجمع كل عوائل صوريف وفي مقدمتها عائلة **الغنيمات** والعوائل البارزة. تتجلى فيه أهازيج الفلكلور والتلاحم الأسري والارتباط الوثيق بالأرض والأشجار المعمرة.
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
                <span>معرض الصور البانورامي لبلدة صوريف</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">اضغط على أي صورة لمشاهدتها بالحجم الكامل ومعاينة تفاصيلها</p>
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

        {/* Section 6: Development Priorities & Challenges */}
        {(activeTab === 'overview' || activeTab === 'development') && (
          <section className="space-y-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span>الأولويات التنموية والتحديات المعاصرة</span>
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">تحديد الاحتياجات الأولوية لتطوير صوريف وتلبية تطلعات الساكنين</p>
            </div>

            {/* Impact Banner */}
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-rose-800 dark:text-rose-300">
              <div className="p-3 bg-rose-500 text-white rounded-2xl shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-base mb-1">تحديات الجدار والاستيطان</h3>
                <p className="text-xs sm:text-sm font-medium leading-relaxed">
                  تم مصادرة ما يقارب 1,213 دونماً من أراضي صوريف منذ انتفاضة الأقصى عام 2000، كما أن جدار الفصل العنصري (بدأ 2004) يعزل حوالي 1,300 دونم خلف سواتره الأمنية، مما يتطلب استمرار استصلاح الأراضي ودعم صمود المزارعين.
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
            <span className="text-lg font-black text-white">صوريف - عراقة وتاريخ</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            منصة توثيق أنساب العائلة والتراث المحلي. جميع الإحصاءات مستمدة من التعدادات الرسمية والمسوح الموثوقة.
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

export default function SurifPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
              جاري تحميل دليل صوريف...
            </div>
          }
        >
          <SurifContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
