'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { MyTreeCanvas } from '../../components/MyTreeCanvas';
import { FocusMode } from '../../lib/treeFilter';

function MyTreeContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const searchParams = useSearchParams();
  const focusRaw = searchParams.get('focus');
  const modeRaw = searchParams.get('mode') as FocusMode | null;

  const focusId = focusRaw ? parseInt(focusRaw, 10) : null;
  const focusMode: FocusMode = modeRaw && ['branch', 'spine', 'household', 'full'].includes(modeRaw)
    ? modeRaw
    : 'spine';

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منصة شجرتي المخصصة...
      </div>
    );
  }

  if (!user) return null;

  return <MyTreeCanvas initialFocusPersonId={focusId} initialMode={focusMode} />;
}

export default function MyTreePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactFlowProvider>
          <Suspense
            fallback={
              <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
                جاري تحميل منصة شجرتي المخصصة...
              </div>
            }
          >
            <MyTreeContent />
          </Suspense>
        </ReactFlowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
