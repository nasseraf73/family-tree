import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center dir-rtl">
      <h2 className="text-2xl font-bold text-amber-400 mb-2">404 - الصفحة غير موجودة</h2>
      <p className="text-xs text-slate-400 mb-4">عذراً، لم نتمكن من العثور على الصفحة المطلوبة في شجرة العائلة.</p>
      <Link
        href="/"
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all"
      >
        العودة إلى الشجرة الرئيسية
      </Link>
    </div>
  );
}
