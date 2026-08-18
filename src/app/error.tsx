'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="w-screen h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 text-center dir-rtl">
      <h2 className="text-xl font-bold text-red-400 mb-2">حدث خطأ في النظام</h2>
      <p className="text-xs text-slate-400 mb-4">{error.message || 'تعذر تحميل الصفحة بشكل صحيح.'}</p>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
