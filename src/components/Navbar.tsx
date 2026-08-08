'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sun,
  Moon,
  LogIn,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  Clock,
  Globe,
  Database
} from 'lucide-react';

interface NavbarProps {
  onOpenAuthModal?: () => void;
  onOpenStewardDashboard?: () => void;
  onOpenAddBranchModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
  onOpenStewardDashboard,
  onOpenAddBranchModal,
}) => {
  const pathname = usePathname();
  const { user, dbUser, role, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = user
    ? [
        { name: 'الرئيسية', href: '/' },
        { name: 'شجرة العائلة', href: '/tree' },
        { name: 'الشجرة الدائرية', href: '/radial-tree' },
        { name: 'شجرتي', href: '/my-tree' },
        { name: 'الجد المشترك', href: '/common-ancestor' },
        { name: 'إنفوجرافيك الشجرة', href: '/infographic' },
        { name: 'عن صوريف', href: '/surif' },
      ]
    : [
        { name: 'الرئيسية', href: '/' },
        { name: 'الشجرة الدائرية', href: '/radial-tree' },
        { name: 'إنفوجرافيك الشجرة', href: '/infographic' },
        { name: 'عن صوريف', href: '/surif' },
      ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-slate-950/85 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 dir-rtl shadow-sm dark:shadow-slate-950/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Right Side: Application Logo & Name (الجهة اليمنى) */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
              <Image
                src="/images/logo/family_tree_logo_S.png"
                alt="شعار شجرة العائلة"
                width={48}
                height={48}
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent tracking-tight">
                شجرة العائلة
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
                منصة توثيق الأنساب الجماعية
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Navigation Links (الوسط) */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Left Side: Theme Toggle & User Controls (الجهة اليسرى) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle Icon */}
          <button
            onClick={toggleTheme}
            aria-label="تبديل الوضع الليلي والنهاري"
            title={theme === 'dark' ? 'التحويل للوضع النهارى' : 'التحويل للوضع الليلي'}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-200 hover:scale-105 shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            )}
          </button>

          {/* User Auth Info & Controls */}
          {user ? (
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-sm">
              <div className="flex items-center gap-2 px-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                  {dbUser?.full_name ? dbUser.full_name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-right">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs truncate max-w-[110px]">
                    {dbUser?.full_name || user.email}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                    {role === 'ADMIN'
                      ? 'مدير النظام'
                      : role === 'REVIEWER'
                      ? 'ناظر فرع (راجع)'
                      : 'عضو عائلة'}
                  </span>
                </div>
              </div>

              {/* Steward Dashboard for Admins/Stewards OR My Requests for Regular Users */}
              {onOpenStewardDashboard && (() => {
                const isStewardOrAdmin = role === 'ADMIN' || role === 'REVIEWER' || (role as string) === 'STEWARD';
                return (
                  <button
                    onClick={onOpenStewardDashboard}
                    title={isStewardOrAdmin ? 'لوحة مراجعة وإدارة المشرفين والصلاحيات' : 'متابعة سجل طلباتي الخاصة وحالتها'}
                    className="px-2.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl hover:bg-amber-500/20 border border-amber-500/30 transition-colors text-xs font-extrabold flex items-center gap-1.5"
                  >
                    {isStewardOrAdmin ? (
                      <>
                        <ShieldCheck className="w-4 h-4 text-amber-400" />
                        <span className="hidden md:inline">لوحة المشرفين</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-emerald-400" />
                        <span className="hidden md:inline">طلباتي</span>
                      </>
                    )}
                  </button>
                );
              })()}

              {(role === 'ADMIN' || (role as string) === 'ADM') && (
                <>
                  <Link
                    href="/admin/countries"
                    title="تعريف وإدارة قائمة الدول والانتساب الجغرافي"
                    className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span className="hidden md:inline">إدارة الدول</span>
                  </Link>

                  <Link
                    href="/admin/database"
                    title="إدارة ومزامنة قواعد البيانات والنسخ الاحتياطي"
                    className="px-2.5 py-1.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl hover:bg-purple-500/20 border border-purple-500/30 transition-colors text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Database className="w-4 h-4 text-purple-500" />
                    <span className="hidden md:inline">إدارة البيانات</span>
                  </Link>
                </>
              )}

              <button
                onClick={signOut}
                title="تسجيل الخروج"
                className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">تسجيل الدخول / حساب جديد</span>
              <span className="sm:hidden">دخول</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2 shadow-xl dir-rtl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
