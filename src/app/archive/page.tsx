'use client';

import React, { useState, Suspense, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { AuthModal } from '@/components/AuthModal';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import {
  Scroll,
  Landmark,
  Compass,
  Map,
  Sparkles,
  Search,
  Maximize2,
  X,
  ChevronLeft,
  Calendar,
  ShieldCheck,
  Award,
  Layers,
  Share2,
  CheckCircle,
  FileText,
  Key,
  Flame,
  ArrowRight,
  Info,
  UploadCloud,
  PlusCircle,
  User,
  Clock,
  Check,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface ArchiveItem {
  id: string;
  title: string;
  category: 'docs' | 'landmarks' | 'artifacts' | 'maps';
  categoryLabel: string;
  era: string;
  yearApprox: string;
  image: string;
  shortDesc: string;
  fullDesc: string;
  symbolism: string;
  location: string;
  verified: boolean;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  uploadedBy: {
    name: string;
    email: string;
    userId?: number | string;
  };
  uploadedAt: string;
}

const INITIAL_ARCHIVE_ITEMS: ArchiveItem[] = [
  {
    id: 'doc-1',
    title: 'صك ملكية وحجة أرض الجد حزام',
    category: 'docs',
    categoryLabel: 'وثائق وصكوك',
    era: 'العهد العثماني',
    yearApprox: '1875م',
    image: '/images/archive/doc-tabu-1885.jpg',
    shortDesc: 'مخطوطة طابو عثمانية رسمية بختم الطغراء تؤكد ملكية واحة وبساتين النمّارية التأسيسية.',
    fullDesc: 'حجة شرعية تاريخية كُتبت بخط الرقعة والديواني على ورق الرق المقوى، مزخرفة بالإطارات الإسلامية الزرقاء والمذهبة، وممهورة بختم الشمع الأحمر العثماني الأصيل. تحدد أراضي وبساتين الواحة التأسيسية التي استقر بها الجد حزام النمّاري وذريته.',
    symbolism: 'رمز التثبيت القانوني والتاريخي لملكية الأرض والجذور العريقة للعائلة في المنطقة.',
    location: 'خزانة الوثائق المركزية — ديوان النمّاري',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'أحمد بن عبد الله النمّاري',
      email: 'admin@nammari.family',
    },
    uploadedAt: '2026-08-10'
  },
  {
    id: 'seal-1',
    title: 'ختم النمّاري النحاسي والمفتاح التراثي',
    category: 'artifacts',
    categoryLabel: 'مقتنيات وأدوات',
    era: 'أواخر القرن التاسع عشر',
    yearApprox: '1892م',
    image: '/images/archive/seal-heritage.jpg',
    shortDesc: 'ختم نحاسي منقوش بالزخارف النباتية والأرابيسك، استُخدم في توثيق مراسلات وعهود العائلة.',
    fullDesc: 'ختم معدني يدوي منقوش بحرفية متقنة تظهر التوريق الإسلامي الأصيل، بجانبه مفتاح البوابة الكبرى المصنوع من الحديد المطروق وقوالب الشمع الأحمر. توارثه كبار العائلة لختم صكوك المصالحة وحفظ الأمانات والعهود.',
    symbolism: 'رمز الأمانة، السيادة، الكلمة الجامعة، والمكانة الاعتبارية لعميد العائلة.',
    location: 'المعرض التراثي المركزي',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'سليمان بن حزام النمّاري',
      email: 'sulaiman@nammari.family',
    },
    uploadedAt: '2026-08-12'
  },
  {
    id: 'gate-1',
    title: 'بوابة وقوس ديوان النمّاري الحجري',
    category: 'landmarks',
    categoryLabel: 'معالم وشواهد',
    era: 'حقبة التأسيس العمراني',
    yearApprox: '1895م',
    image: '/images/archive/gateway-diwan.jpg',
    shortDesc: 'بوابة حجرية شامخة بنقوش ونحت كنعاني وعثماني، تؤدي إلى بهو القصر والديوان المركزي.',
    fullDesc: 'صرح معماري مبني من الحجر الجيري الوردي المنحوت يدوياً (حجر قدسي عتيق)، تعلوه نقوش وزخارف ونباتات متسلقة مع باب خشبي ضخم مدعم بمسامير حديدية تاريخية. شهد هذا المدخل استقبال كبار الوفود والوجهاء على مدار أكثر من 130 عاماً.',
    symbolism: 'رمز الكرم والضيافة، وعنوان البيت المفتوح لأبناء العائلة وعابري السبيل.',
    location: 'مدخل الحي التراثي القديم',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'خالد بن ناصر النمّاري',
      email: 'khaled@nammari.family',
    },
    uploadedAt: '2026-08-14'
  },
  {
    id: 'map-1',
    title: 'خارطة التضاريس والواحات التاريخية',
    category: 'maps',
    categoryLabel: 'خرائط ومخطوطات',
    era: 'أوائل القرن العشرين',
    yearApprox: '1910م',
    image: '/images/archive/map-lands-1890.jpg',
    shortDesc: 'مخطط كارتوغرافي مرسوم يدوياً يوضح تلال وبساتين النخيل ومجاري العيون والينابيع.',
    fullDesc: 'مخطوطة جغرافية نادرة رسمت بالحبر النباتي الأسود على ورق بردي محروق الأطراف، تزينها بوصلة الرياح والأهلة الزخرفية. ترسم حدود الأراضي الزراعية، المرتفعات، قلاع الحراسة الحجرية، ومواقع توزيع حصص المياه بين العوائل.',
    symbolism: 'رمز التخطيط الزراعي الدقيق والحفاظ على حقوق الأجيال في الموارد والأراضي.',
    location: 'أرشيف المخطوطات والخرائط',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'محمد بن سعيدان النمّاري',
      email: 'mohammed@nammari.family',
    },
    uploadedAt: '2026-08-15'
  },
  {
    id: 'spring-1',
    title: 'عين ماء النمّارية الحجرية',
    category: 'landmarks',
    categoryLabel: 'معالم وشواهد',
    era: 'التاريخ العريق',
    yearApprox: '1860م',
    image: '/images/archive/spring-nammari.jpg',
    shortDesc: 'حوض حجري أثري منحوت تتفجر منه المياه العذبة بين أحضان بساتين الزيتون والزهور البرية.',
    fullDesc: 'معلم مائي تاريخي حُفر بحوض من الحجر الصلب المزخرف بنقش أسد ونباتات كرمة، تنساب منه مياه نبع جوفي عذب لا ينقطع صيفاً وشتاءً. كان هذا النبع شريان الحياة الرئيسي للبلدة ومحطة استراحة للقوافل التجارية القديمة.',
    symbolism: 'رمز الحياة المستمرة، العطاء الدائم، والبركة المتوارثة للأرض وأهلها.',
    location: 'وادي البساتين الجنوبي',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'عبد الرحمن النمّاري',
      email: 'abdulrahman@nammari.family',
    },
    uploadedAt: '2026-08-16'
  },
  {
    id: 'dallah-1',
    title: 'دلال الضيافة والمنسوجات الصوفية الأصيلة',
    category: 'artifacts',
    categoryLabel: 'مقتنيات وأدوات',
    era: 'حقبة منتصف القرن العشرين',
    yearApprox: '1945م',
    image: '/images/nammari/nammari-culture.jpg',
    shortDesc: 'مجموعة دلال قهوة نحاسية ومنسوجات "مزاود" بدوية يدوية وسلال قطاف الزيتون.',
    fullDesc: 'أدوات ضيافة متكاملة تشمل الدلال النحاسية البغدادية والمكاوية المنقوشة، مجامر الفحم، فناجين الخزف التراثية، وسجاد الصوف الخالص المنسوج بنول يدوي بزخارف هندسية دقيقة، إلى جانب سلال القش المجدولة لقطاف الزيتون.',
    symbolism: 'رمز عادات وتقاليد إكرام الضيف، والتراث الشعبي المتجذر في الوجدان.',
    location: 'بيت التراث العائلي',
    verified: true,
    status: 'APPROVED',
    uploadedBy: {
      name: 'يوسف بن إبراهيم النمّاري',
      email: 'yousef@nammari.family',
    },
    uploadedAt: '2026-08-17'
  },
];

function ArchiveContent() {
  const { user, dbUser, role } = useAuth();
  const isModerator = role === 'ADMIN' || role === 'REVIEWER';

  const [items, setItems] = useState<ArchiveItem[]>(INITIAL_ARCHIVE_ITEMS);
  const [activeCategory, setActiveCategory] = useState<'all' | 'docs' | 'landmarks' | 'artifacts' | 'maps' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'docs' | 'landmarks' | 'artifacts' | 'maps'>('docs');
  const [formEra, setFormEra] = useState('');
  const [formYear, setFormYear] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formFullDesc, setFormFullDesc] = useState('');
  const [formSymbolism, setFormSymbolism] = useState('');
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [formUploaderName, setFormUploaderName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load / Sync from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nammari_archive_items');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading archive items from localStorage:', e);
    }
  }, []);

  const saveItems = (updated: ArchiveItem[]) => {
    setItems(updated);
    try {
      localStorage.setItem('nammari_archive_items', JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving archive items to localStorage:', e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenUpload = () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    setFormUploaderName(dbUser?.full_name || user.email?.split('@')[0] || '');
    setIsUploadModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formImagePreview) {
      alert('يرجى كتابة عنوان الوثيقة واختيار صورة لها');
      return;
    }

    setFormSubmitting(true);

    const categoryMap: Record<string, string> = {
      docs: 'وثائق وصكوك',
      landmarks: 'معالم وشواهد',
      artifacts: 'مقتنيات وأدوات',
      maps: 'خرائط ومخطوطات',
    };

    const isAutoApproved = isModerator;

    const newItem: ArchiveItem = {
      id: `custom-doc-${Date.now()}`,
      title: formTitle,
      category: formCategory,
      categoryLabel: categoryMap[formCategory],
      era: formEra || 'توثيق حديث',
      yearApprox: formYear || `${new Date().getFullYear()}م`,
      image: formImagePreview,
      shortDesc: formShortDesc || formTitle,
      fullDesc: formFullDesc || formShortDesc || formTitle,
      symbolism: formSymbolism || 'شاهد توثيقي مضاف لأرشيف العائلة المبارك.',
      location: formLocation || 'أرشيف العائلة الرقمي',
      verified: isAutoApproved,
      status: isAutoApproved ? 'APPROVED' : 'PENDING',
      uploadedBy: {
        name: formUploaderName || dbUser?.full_name || 'عضو من العائلة',
        email: user?.email || 'user@nammari.family',
      },
      uploadedAt: new Date().toISOString().split('T')[0],
    };

    const updated = [newItem, ...items];
    saveItems(updated);
    setFormSubmitting(false);
    setIsUploadModalOpen(false);

    // Reset Form
    setFormTitle('');
    setFormEra('');
    setFormYear('');
    setFormLocation('');
    setFormShortDesc('');
    setFormFullDesc('');
    setFormSymbolism('');
    setFormImagePreview(null);

    if (isAutoApproved) {
      showToast('تم رفع واعتماد الوثيقة بنجاح ونشرها في المتحف مباشرة! 🎉📜');
    } else {
      showToast('تم رفع الوثيقة بنجاح! ستظهر للجميع فور مصادقة المشرفين عليها. ⏳🛡️');
    }
  };

  // Moderator Actions (Approve / Reject)
  const handleApprove = (id: string) => {
    const updated = items.map((it) => (it.id === id ? { ...it, status: 'APPROVED' as const, verified: true } : it));
    saveItems(updated);
    showToast('تمت المصادقة على الوثيقة ونشرها في الأرشيف العام بنجاح! ✅🏛️');
  };

  const handleReject = (id: string) => {
    if (confirm('هل أنت متأكد من حذف/رفض هذه الوثيقة من الأرشيف؟')) {
      const updated = items.filter((it) => it.id !== id);
      saveItems(updated);
      showToast('تم رفض وحذف الوثيقة.');
    }
  };

  // Filtered Items
  const pendingCount = items.filter((it) => it.status === 'PENDING').length;

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Pending Tab
      if (activeCategory === 'pending') {
        if (item.status !== 'PENDING') return false;
      } else {
        // Normal View only shows APPROVED items for regular users
        if (item.status !== 'APPROVED') return false;
        if (activeCategory !== 'all' && item.category !== activeCategory) return false;
      }

      const matchSearch =
        searchQuery.trim() === '' ||
        item.title.includes(searchQuery) ||
        item.shortDesc.includes(searchQuery) ||
        item.symbolism.includes(searchQuery) ||
        item.era.includes(searchQuery) ||
        item.uploadedBy.name.includes(searchQuery);

      return matchSearch;
    });
  }, [items, activeCategory, searchQuery]);

  const handleShare = (item: ArchiveItem) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${window.location.origin}/archive#${item.id}`);
      showToast(`تم نسخ رابط وثيقة «${item.title}» بنجاح! 🔗📜`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans dir-rtl selection:bg-amber-500 selection:text-slate-950 transition-colors duration-300">
      {/* Navbar */}
      <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-slate-950 font-black text-xs px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-amber-300 animate-bounce">
          <CheckCircle className="w-4 h-4 text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Header Banner */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-950/70 via-slate-900 to-slate-950 text-white pt-12 pb-20 border-b border-amber-500/20">
        {/* Glow Ambient */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="absolute top-1/4 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-400 font-medium mb-6">
            <Link href="/" className="hover:underline flex items-center gap-1">
              <span>الرئيسية</span>
            </Link>
            <ChevronLeft className="w-4 h-4 text-amber-600" />
            <span className="text-slate-300 font-bold">المتحف والوثائق التاريخية</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs sm:text-sm font-bold backdrop-blur-md">
                <Scroll className="w-4 h-4 text-amber-400" />
                <span>أرشيف الذاكرة والشواهد التراثية التشاركي</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
                متحف الوثائق والرموز <br />
                <span className="bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-300 bg-clip-text text-transparent">
                  شواهد الأصالة وسجل التاريخ
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-normal">
                منصة توثيقية تشاركية تتيح لأبناء العائلة استعراض ورفع الصكوك التاريخية، المخطوطات النادرة، الأختام، والشواهد المعمارية مع نظام مصادقة وتدقيق محكم من لجان التوثيق.
              </p>
            </div>

            {/* Upload Button CTA in Hero */}
            <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col gap-3">
              <button
                onClick={handleOpenUpload}
                className="px-8 py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-3 text-sm sm:text-base transition-all hover:scale-105"
              >
                <PlusCircle className="w-5 h-5 text-slate-950" />
                <span>+ رفع / مساهمة بوثيقة جديدة</span>
              </button>

              <div className="text-[11px] text-amber-200/80 text-center font-medium bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
                🛡️ تخضع كافة المشاركات لمصادقة المشرفين لضمان دقة الأرشيف
              </div>
            </div>
          </div>

          {/* Quick KPI Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-8 mt-4 border-t border-slate-800/80">
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <FileText className="w-4 h-4" />
                <span>الوثائق المعتمدة</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {items.filter((i) => i.status === 'APPROVED').length}{' '}
                <span className="text-xs font-normal text-slate-400">وثيقة معتمدة</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Calendar className="w-4 h-4" />
                <span>أقدم شاهد موثق</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                1860م <span className="text-xs font-normal text-slate-400">حجة طابو</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Landmark className="w-4 h-4" />
                <span>المعالم والشواهد</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {items.filter((i) => i.category === 'landmarks' && i.status === 'APPROVED').length}{' '}
                <span className="text-xs font-normal text-slate-400">موقعاً</span>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold mb-1">
                <Award className="w-4 h-4" />
                <span>المقتنيات النادرة</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white">
                {items.filter((i) => i.category === 'artifacts' && i.status === 'APPROVED').length}{' '}
                <span className="text-xs font-normal text-slate-400">قطعة</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toolbar: Category Tabs & Search Bar */}
      <section className="sticky top-20 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm py-3.5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto w-full md:w-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              جميع الشواهد ({items.filter((i) => i.status === 'APPROVED').length})
            </button>

            <button
              onClick={() => setActiveCategory('docs')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'docs'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>وثائق وصكوك</span>
            </button>

            <button
              onClick={() => setActiveCategory('landmarks')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'landmarks'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Landmark className="w-4 h-4" />
              <span>معالم وشواهد</span>
            </button>

            <button
              onClick={() => setActiveCategory('artifacts')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'artifacts'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Award className="w-4 h-4" />
              <span>مقتنيات وأدوات</span>
            </button>

            <button
              onClick={() => setActiveCategory('maps')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                activeCategory === 'maps'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Map className="w-4 h-4" />
              <span>خرائط ومخطوطات</span>
            </button>

            {/* Moderator Pending Requests Tab */}
            {isModerator && (
              <button
                onClick={() => setActiveCategory('pending')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border ${
                  activeCategory === 'pending'
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>بانتظار المصادقة ({pendingCount})</span>
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث في الوثائق والرافعين..."
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pr-10 pl-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </section>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
              {activeCategory === 'pending'
                ? 'لا توجد طلبات معلقة بانتظار المصادقة حالياً'
                : 'لم يتم العثور على وثائق مطابقة'}
            </h3>
            <p className="text-xs text-slate-500">
              {activeCategory === 'pending'
                ? 'كافة الوثائق والمشاركات تمت مراجعتها ومصادقتها بنجاح.'
                : 'جرب كتابة كلمات بحث أخرى أو قم برفع وثيقة جديدة.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                id={item.id}
                className={`group bg-white dark:bg-slate-900 border rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between ${
                  item.status === 'PENDING'
                    ? 'border-amber-500/60 ring-2 ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-amber-500/50'
                }`}
              >
                <div>
                  {/* Image Container */}
                  <div className="relative h-60 w-full overflow-hidden bg-slate-950 cursor-pointer" onClick={() => setSelectedItem(item)}>
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

                    {/* Category & Era Badges */}
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 text-amber-300 text-[10px] font-extrabold backdrop-blur-md border border-amber-500/30">
                        {item.categoryLabel}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl bg-slate-950/80 text-slate-200 text-[10px] font-bold backdrop-blur-md border border-slate-700">
                        {item.yearApprox}
                      </span>
                    </div>

                    {/* Maximize Icon */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedItem(item);
                      }}
                      className="absolute top-3 left-3 p-2 rounded-xl bg-slate-950/80 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-500 hover:text-slate-950"
                      title="عرض وتكبير الشاهد"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Verified / Pending Stamp */}
                    <div className="absolute bottom-3 right-3">
                      {item.status === 'APPROVED' ? (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-black backdrop-blur-md shadow-md">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          <span>شاهد معتمد وموثق</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/90 border border-amber-500/60 text-amber-300 text-[10px] font-black backdrop-blur-md shadow-md animate-pulse">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>قيد مراجعة المشرف</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <div>
                      <div className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1">{item.era}</div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-500 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                        {item.shortDesc}
                      </p>
                    </div>

                    {/* Symbolism Box */}
                    <div className="p-3.5 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-xs font-black mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>الدلالة والرمزية التاريخية:</span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {item.symbolism}
                      </p>
                    </div>

                    {/* UPLOADER INFO BAR (اسم الرافع وتاريخ الرفع) */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold truncate">
                        <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{item.uploadedBy.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium text-[10px]">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>{item.uploadedAt}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer & Moderator Controls */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[160px]" title={item.location}>
                    📍 {item.location}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    {/* Moderator Action Buttons for Pending Items */}
                    {isModerator && item.status === 'PENDING' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleApprove(item.id)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                          title="اعتماد الوثيقة ونشرها"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>مصادقة</span>
                        </button>
                        <button
                          onClick={() => handleReject(item.id)}
                          className="p-1.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 rounded-xl border border-rose-500/30 transition-colors"
                          title="رفض وحذف الوثيقة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleShare(item)}
                          title="مشاركة رابط الوثيقة"
                          className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedItem(item)}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1"
                        >
                          <span>التفاصيل</span>
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* UPLOAD DOCUMENT MODAL (نافذة رفع الوثيقة) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col dir-rtl text-right">
            
            {/* Header */}
            <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-white">رفع وثيقة أو رمز تراثي جديد</h3>
                  <p className="text-[11px] text-slate-400">شارك صكوك، معالم، أو مقتنيات أصيلة لتخليدها في أرشيف العائلة</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitUpload} className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* File / Image Upload Box */}
              <div>
                <label className="block text-slate-300 font-bold mb-1.5">صورة الوثيقة أو الرمز التراثي *</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />

                {formImagePreview ? (
                  <div className="relative h-52 w-full rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-slate-950 group">
                    <Image
                      src={formImagePreview}
                      alt="معاينة الوثيقة"
                      fill
                      className="object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity"
                    >
                      تغيير الصورة المحددة
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="h-40 border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-950/40 hover:bg-slate-950/80 transition-all text-slate-400 hover:text-amber-400"
                  >
                    <UploadCloud className="w-8 h-8" />
                    <span className="font-bold">اضغط هنا لاختيار صورة من جوالك أو جهازك</span>
                    <span className="text-[10px] text-slate-500">يدعم JPG, PNG, WEBP بدقة عالية</span>
                  </div>
                )}
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم / عنوان الوثيقة *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="مثال: حجة أرض وادي الزيتون"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">تصنيف الشاهد *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="docs">وثائق وصكوك تاريخية</option>
                    <option value="landmarks">معالم وشواهد معمارية</option>
                    <option value="artifacts">مقتنيات وأدوات تراثية</option>
                    <option value="maps">خرائط ومخطوطات جغرافية</option>
                  </select>
                </div>
              </div>

              {/* Era, Year, & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الحقبة التاريخية</label>
                  <input
                    type="text"
                    value={formEra}
                    onChange={(e) => setFormEra(e.target.value)}
                    placeholder="مثال: العهد العثماني"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">العام التقريبي</label>
                  <input
                    type="text"
                    value={formYear}
                    onChange={(e) => setFormYear(e.target.value)}
                    placeholder="مثال: 1890م"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">مكان الحفظ الحالي</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="مثال: ديوان العائلة"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">نبذة وشرح عن الوثيقة *</label>
                <textarea
                  rows={2}
                  required
                  value={formShortDesc}
                  onChange={(e) => setFormShortDesc(e.target.value)}
                  placeholder="اكتب شرحاً موجزاً يوضح ما تحتويه هذه الوثيقة أو الصورة..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">الرمزية والدلالة في وجدان العائلة</label>
                <input
                  type="text"
                  value={formSymbolism}
                  onChange={(e) => setFormSymbolism(e.target.value)}
                  placeholder="مثال: رمز لأصالة وثبات ملكية بساتين العائلة"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Uploader Name */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">اسم الشخص الرافع (يظهر في البطاقة) *</label>
                <input
                  type="text"
                  required
                  value={formUploaderName}
                  onChange={(e) => setFormUploaderName(e.target.value)}
                  placeholder="اسمك الكامل"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
                >
                  إلغاء
                </button>

                <button
                  type="submit"
                  disabled={formSubmitting || !formImagePreview}
                  className="px-7 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>{isModerator ? 'رفع واعتماد فوري في الأرشيف' : 'إرسال للمصادقة والنشر'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Lightbox Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* Close Button */}
            <button
              onClick={() => setSelectedItem(null)}
              className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-800/90 text-slate-200 hover:bg-rose-600 hover:text-white transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Image */}
            <div className="relative h-80 sm:h-96 w-full shrink-0 bg-slate-950">
              <Image
                src={selectedItem.image}
                alt={selectedItem.title}
                fill
                className="object-contain"
              />
              <div className="absolute bottom-3 right-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-950/90 text-amber-300 text-xs font-black border border-amber-500/40">
                  {selectedItem.categoryLabel}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-950/90 text-white text-xs font-bold border border-slate-700">
                  {selectedItem.yearApprox}
                </span>
              </div>
            </div>

            {/* Modal Content Details */}
            <div className="p-6 sm:p-8 space-y-5 overflow-y-auto text-right">
              <div>
                <span className="text-xs font-bold text-amber-400">{selectedItem.era}</span>
                <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">{selectedItem.title}</h2>
              </div>

              {/* Uploader Box in Modal */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">مرفوعة وموثقة بواسطة:</span>
                    <strong className="text-white text-sm">{selectedItem.uploadedBy.name}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-400 text-xs">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <span>تاريخ الرفع: {selectedItem.uploadedAt}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">الشرح والتوثيق الأرشيفي:</h4>
                <p className="text-slate-300 text-sm leading-relaxed">{selectedItem.fullDesc}</p>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-1.5">
                <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>الرمزية والدلالة في وجدان العائلة:</span>
                </div>
                <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">{selectedItem.symbolism}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400 gap-4">
                <span>📍 <strong>مكان الحفظ:</strong> {selectedItem.location}</span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleShare(selectedItem)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-2 transition-colors border border-slate-700"
                  >
                    <Share2 className="w-4 h-4 text-amber-400" />
                    <span>مشاركة الرابط</span>
                  </button>
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl transition-all"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          setIsUploadModalOpen(true);
        }}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800 mt-20 dir-rtl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Scroll className="w-5 h-5" />
            </div>
            <span className="text-lg font-black text-white">متحف الذاكرة والوثائق التاريخية</span>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            سجل توثيقي مخصص لعرض ومشاركة شواهد وأصالة العائلة والبلدة. جميع المشاركات تخضع لتدقيق ومصادقة لجان التوثيق.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-2"
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

export default function ArchivePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Suspense
          fallback={
            <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
              جاري فتح متحف الوثائق والتراث...
            </div>
          }
        >
          <ArchiveContent />
        </Suspense>
      </AuthProvider>
    </ThemeProvider>
  );
}
