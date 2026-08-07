'use client';

import React, { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { CommonAncestorCanvas } from '../../components/CommonAncestorCanvas';

function CommonAncestorContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const searchParams = useSearchParams();
  const rawA = searchParams.get('personA');
  const rawB = searchParams.get('personB');

  const personAId = rawA ? parseInt(rawA, 10) : null;
  const personBId = rawB ? parseInt(rawB, 10) : null;

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منصة كشف الجد المشترك...
      </div>
    );
  }

  if (!user) return null;

  return (
    <CommonAncestorCanvas
      initialPersonAId={personAId}
      initialPersonBId={personBId}
    />
  );
}

export default function CommonAncestorPage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactFlowProvider>
          <Suspense
            fallback={
              <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
                جاري تحميل منصة كشف الجد المشترك...
              </div>
            }
          >
            <CommonAncestorContent />
          </Suspense>
        </ReactFlowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
