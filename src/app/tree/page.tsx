'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { FamilyTreeCanvas } from '../../components/FamilyTreeCanvas';

function TreePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري التحميل...
      </div>
    );
  }

  if (!user) return null;

  return <FamilyTreeCanvas />;
}

export default function TreePage() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ReactFlowProvider>
          <TreePageContent />
        </ReactFlowProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
