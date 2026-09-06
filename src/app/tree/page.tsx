'use client';

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { FamilyTreeCanvas } from '../../components/FamilyTreeCanvas';

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
