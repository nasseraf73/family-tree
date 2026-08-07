'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { createClient } from '../lib/supabase/client';
import { User as DbUser } from '../types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  dbUser: DbUser | null;
  role: 'USER' | 'REVIEWER' | 'ADMIN';
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ error: string | null }>;
  signUp: (email: string, pass: string, fullName: string, phone: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [role, setRole] = useState<'USER' | 'REVIEWER' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(true);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const isPlaceholderSupabase = !supabaseUrl || supabaseUrl.includes('familytree.supabase.co');

  // Only create supabase client when we have a REAL Supabase URL (not placeholder)
  const supabase = isPlaceholderSupabase ? null : createClient();

  const mapUserRole = (rVal?: string): 'USER' | 'REVIEWER' | 'ADMIN' => {
    if (!rVal) return 'USER';
    if (rVal === 'ADM' || rVal === 'ADMIN') return 'ADMIN';
    if (rVal === 'REV' || rVal === 'REVIEWER') return 'REVIEWER';
    return 'USER';
  };

  const fetchDbUserRole = async (userEmail: string) => {
    try {
      const res = await fetch(`/api/v1/auth/user?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setDbUser(data.user);
          setRole(mapUserRole(data.user.role));
          return data.user;
        }
      }
    } catch {
      // Ignore network errors
    }
    return null;
  };

  const handleLocalSignIn = async (rawEmail: string, pass?: string, isRestore = false) => {
    if (!rawEmail || !rawEmail.trim()) {
      return { error: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' };
    }

    if (!isRestore && (!pass || pass.trim().length < 6)) {
      return { error: 'يرجى إدخال كلمة المرور المكونة من 6 أحرف على الأقل' };
    }

    const cleanEmail = rawEmail.trim().toLowerCase();
    let foundUser = await fetchDbUserRole(cleanEmail);

    // Auto-create user account if logging in with a new email in local environment
    if (!foundUser) {
      try {
        const defaultName = cleanEmail.includes('@')
          ? cleanEmail.split('@')[0]
          : cleanEmail;

        const regRes = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            full_name: defaultName,
            role: 'USER',
          }),
        });
        const regData = await regRes.json();
        if (regData.user) {
          foundUser = regData.user;
          setDbUser(foundUser);
          setRole(mapUserRole(foundUser.role));
        }
      } catch {
        // Fallback
      }
    }

    if (foundUser) {
      const mockSupabaseUser = {
        id: foundUser.id.toString(),
        email: foundUser.email,
        app_metadata: {},
        user_metadata: { full_name: foundUser.full_name },
        aud: 'authenticated',
        created_at: foundUser.created_at || new Date().toISOString(),
      } as unknown as User;

      setUser(mockSupabaseUser);
      localStorage.setItem('family_tree_user_email', cleanEmail);
      return { error: null };
    }
    return { error: 'تعذر تسجيل الدخول، يرجى التأكد من البريد الإلكتروني وكلمة المرور' };
  };

  const handleLocalSignUp = async (email: string, fullName: string, phone: string) => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, phone }),
      });
      const data = await res.json();

      if (res.ok && data.user) {
        setDbUser(data.user);
        setRole(mapUserRole(data.user.role));

        const mockSupabaseUser = {
          id: data.user.id.toString(),
          email: data.user.email,
          app_metadata: {},
          user_metadata: { full_name: data.user.full_name },
          aud: 'authenticated',
          created_at: data.user.created_at || new Date().toISOString(),
        } as unknown as User;

        setUser(mockSupabaseUser);
        localStorage.setItem('family_tree_user_email', email);
        return { error: null };
      }
      return { error: data.error || 'حدث خطأ أثناء إنشاء الحساب' };
    } catch (err) {
      return { error: (err as Error).message };
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        if (!isPlaceholderSupabase) {
          const { data: { session: initSession } } = await supabase!.auth.getSession();
          if (initSession?.user) {
            setSession(initSession);
            setUser(initSession.user);
            if (initSession.user.email) {
              await fetchDbUserRole(initSession.user.email);
            }
            setLoading(false);
            return;
          }
        }

        // Saved local session fallback
        const savedEmail = localStorage.getItem('family_tree_user_email');
        if (savedEmail) {
          await handleLocalSignIn(savedEmail, undefined, true);
        }
      } catch {
        const savedEmail = localStorage.getItem('family_tree_user_email');
        if (savedEmail) {
          await handleLocalSignIn(savedEmail, undefined, true);
        }
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    if (!isPlaceholderSupabase) {
      try {
        const { data: { subscription } } = supabase!.auth.onAuthStateChange(async (_event, currentSession) => {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            if (currentSession.user.email) {
              await fetchDbUserRole(currentSession.user.email);
            }
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        // Suppress subscription errors
      }
    }
  }, []);

  const signIn = async (email: string, pass: string) => {
    if (isPlaceholderSupabase) {
      return await handleLocalSignIn(email, pass);
    }
    try {
      const { error } = await supabase!.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        return await handleLocalSignIn(email, pass);
      }
      localStorage.setItem('family_tree_user_email', email);
      return { error: null };
    } catch {
      return await handleLocalSignIn(email, pass);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, phone: string) => {
    if (isPlaceholderSupabase) {
      return await handleLocalSignUp(email, fullName, phone);
    }
    try {
      const { error } = await supabase!.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: 'USER',
          },
        },
      });

      if (error) {
        return await handleLocalSignUp(email, fullName, phone);
      }

      await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: fullName, phone }),
      });

      localStorage.setItem('family_tree_user_email', email);
      return { error: null };
    } catch {
      return await handleLocalSignUp(email, fullName, phone);
    }
  };

  const signOut = async () => {
    if (!isPlaceholderSupabase) {
      try {
        await supabase!.auth.signOut();
      } catch {
        // Ignore
      }
    }
    localStorage.removeItem('family_tree_user_email');
    setUser(null);
    setSession(null);
    setDbUser(null);
    setRole('USER');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, dbUser, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
