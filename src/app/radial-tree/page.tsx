'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { AuthProvider } from '../../context/AuthContext';
import { ThemeProvider } from '../../context/ThemeContext';
import { Navbar } from '../../components/Navbar';
import { RadialTreeSVG } from '../../components/RadialTreeSVG';
import { AuthModal } from '../../components/AuthModal';

export default function RadialTreePage() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="flex flex-col h-screen w-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
          {!isFullscreen && <Navbar onOpenAuthModal={() => setIsAuthModalOpen(true)} />}
          <Suspense
            fallback={
              <div className="flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-950 dir-rtl">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    جاري تحميل الشجرة الدائرية...
                  </span>
                </div>
              </div>
            }
          >
            <RadialTreeSVG isFullscreen={isFullscreen} />
          </Suspense>
        </div>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={() => setIsAuthModalOpen(false)}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}
