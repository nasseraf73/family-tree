'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';

// P4.5: Code splitting - load the heavy canvas component only on the client.
// This reduces initial JS bundle size for the tree page.
const FamilyTreeCanvas = dynamic(
  () => import('../../components/FamilyTreeCanvas').then((m) => m.FamilyTreeCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري تحميل منصة شجرة العائلة...
      </div>
    ),
  }
);

function TreePageContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm dir-rtl">
        جاري التحميل...
      </div>
    );
  }

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
