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
  Menu,
  X,
  LayoutDashboard,
} from 'lucide-react';

interface NavbarProps {
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuthModal,
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
    ]
    : [
      { name: 'الرئيسية', href: '/' },
      { name: 'الشجرة الدائرية', href: '/radial-tree' },
      { name: 'إنفوجرافيك الشجرة', href: '/infographic' },
    ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200 dark:border-slate-800 transition-colors duration-300 dir-rtl shadow-sm dark:shadow-slate-950/50">
      {/* Tier 1: Top Bar - Logo on Right, User & Controls on Left */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-800/60">

        {/* Right Side: Logo & Title */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none shrink-0">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/30 p-1 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
            <Image
              src="/images/logo/family_tree_logo_S.png"
              alt="شعار شجرة العائلة"
              width={44}
              height={44}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-extrabold bg-gradient-to-r from-emerald-700 to-teal-700 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent tracking-tight leading-tight">
              شجرة عائلة النمّاري
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              منصة توثيق الأنساب والتاريخ العائلي
            </span>
          </div>
        </Link>

        {/* Left Side: Theme Toggle & User Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Dark / Light Mode Toggle Icon */}
          <button
            onClick={toggleTheme}
            aria-label="تبديل الوضع الليلي والنهاري"
            title={theme === 'dark' ? 'التحويل للوضع النهارى' : 'التحويل للوضع الليلي'}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 transition-all duration-200 hover:scale-105 shadow-sm shrink-0"
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
              {/* Full User Name & Role Badge (كامل بدون قطع) */}
              <div className="flex items-center gap-2.5 px-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-md shrink-0">
                  {dbUser?.full_name ? dbUser.full_name.charAt(0) : 'U'}
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-slate-800 dark:text-slate-100 block text-xs sm:text-sm whitespace-nowrap">
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

              {/* Dashboard Link - لوحة التحكم */}
              <Link
                href="/dashboard"
                title="لوحة التحكم والإعدادات"
                className={`px-3 py-1.5 rounded-xl border transition-colors text-xs font-extrabold flex items-center gap-1.5 shrink-0 ${pathname === '/dashboard'
                    ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/50'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  }`}
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                <span>لوحة التحكم</span>
              </Link>

              {/* Logout Button */}
              <button
                onClick={signOut}
                title="تسجيل الخروج"
                className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-500/20 border border-rose-500/30 transition-colors shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول / حساب جديد</span>
            </button>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tier 2: Bottom Bar - Centered Navigation Links */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <nav className="flex items-center justify-center gap-1.5 lg:gap-2.5 flex-wrap">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-1.5 rounded-xl text-xs lg:text-sm font-bold transition-all duration-200 ${isActive
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 border border-emerald-400/30'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-900/80'
                  }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2 shadow-xl dir-rtl">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${pathname === link.href
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
};
