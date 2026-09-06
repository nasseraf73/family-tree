'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
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
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [role, setRole] = useState<'USER' | 'REVIEWER' | 'ADMIN'>('USER');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const mapUserRole = (rVal?: string): 'USER' | 'REVIEWER' | 'ADMIN' => {
    if (!rVal) return 'USER';
    if (rVal === 'ADM' || rVal === 'ADMIN') return 'ADMIN';
    if (rVal === 'REV' || rVal === 'REVIEWER') return 'REVIEWER';
    return 'USER';
  };

  const fetchDbUserProfile = useCallback(async (token: string) => {
    try {
      const res = await fetch('/api/v1/auth/user', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setDbUser(data.user);
          setRole(mapUserRole(data.user.role));
          return data.user;
        }
      }
    } catch (err) {
      console.error('Failed to fetch authenticated user profile:', err);
    }
    return null;
  }, []);

  const authFetch = useCallback(async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (session?.access_token) {
      headers.set('Authorization', `Bearer ${session.access_token}`);
    }
    const currentEmail = user?.email || dbUser?.email || (typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') || '' : '');
    if (currentEmail) {
      headers.set('x-user-email', currentEmail);
    }
    return fetch(url, {
      ...init,
      headers,
    });
  }, [session?.access_token, user?.email, dbUser?.email]);

  const handleLocalSignIn = useCallback(async (rawEmail: string, pass?: string, isRestore = false) => {
    if (!rawEmail || !rawEmail.trim()) {
      return { error: 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم' };
    }
    const cleanEmail = rawEmail.trim().toLowerCase();

    try {
      const res = await fetch(`/api/v1/auth/user?email=${encodeURIComponent(cleanEmail)}`);
      const data = await res.json();

      if (res.ok && data.user) {
        setDbUser(data.user);
        setRole(mapUserRole(data.user.role));

        const mockUser = {
          id: data.user.id.toString(),
          email: data.user.email,
          app_metadata: {},
          user_metadata: { full_name: data.user.full_name },
          aud: 'authenticated',
          created_at: data.user.created_at || new Date().toISOString(),
        } as unknown as User;

        setUser(mockUser);
        if (typeof window !== 'undefined') {
          localStorage.setItem('family_tree_user_email', cleanEmail);
        }

        if (!isRestore) {
          fetch('/api/v1/auth/log-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-user-email': cleanEmail },
            body: JSON.stringify({
              email: cleanEmail,
              full_name: data.user.full_name,
              user_id: data.user.id,
              status: 'SUCCESS',
            }),
          }).catch(() => {});
        }

        return { error: null };
      }
      return { error: 'تعذر العثور على الحساب، يرجى التأكد من البريد الإلكتروني وكلمة المرور' };
    } catch (err) {
      return { error: (err as Error).message };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting initial Supabase session:', error);
        }

        if (initialSession?.user && isMounted) {
          setSession(initialSession);
          setUser(initialSession.user);
          if (initialSession.access_token) {
            await fetchDbUserProfile(initialSession.access_token);
          }
        } else {
          // Restore local saved session
          if (typeof window !== 'undefined') {
            const savedEmail = localStorage.getItem('family_tree_user_email');
            if (savedEmail) {
              await handleLocalSignIn(savedEmail, undefined, true);
            }
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        if (typeof window !== 'undefined') {
          const savedEmail = localStorage.getItem('family_tree_user_email');
          if (savedEmail) {
            await handleLocalSignIn(savedEmail, undefined, true);
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (currentSession?.user) {
        setSession(currentSession);
        setUser(currentSession.user);
        if (currentSession.access_token) {
          await fetchDbUserProfile(currentSession.access_token);
        }
      } else {
        // If not in Supabase, check local saved session before clearing
        const savedEmail = typeof window !== 'undefined' ? localStorage.getItem('family_tree_user_email') : null;
        if (!savedEmail) {
          setSession(null);
          setUser(null);
          setDbUser(null);
          setRole('USER');
        }
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, fetchDbUserProfile, handleLocalSignIn]);

  const signIn = async (email: string, pass: string) => {
    if (!email || !email.trim()) {
      return { error: 'يرجى إدخال البريد الإلكتروني' };
    }
    if (!pass || pass.trim().length < 6) {
      return { error: 'يرجى إدخال كلمة المرور (6 أحرف على الأقل)' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: pass,
      });

      if (!error && data.session) {
        setSession(data.session);
        setUser(data.user);
        if (typeof window !== 'undefined') {
          localStorage.setItem('family_tree_user_email', email.trim().toLowerCase());
        }
        if (data.session.access_token) {
          const profile = await fetchDbUserProfile(data.session.access_token);
          if (profile) {
            fetch('/api/v1/auth/log-login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({
                email: profile.email,
                full_name: profile.full_name,
                user_id: profile.id,
                status: 'SUCCESS',
              }),
            }).catch(() => {});
          }
        }
        return { error: null };
      }

      // Fallback: Check local PostgreSQL database user
      return await handleLocalSignIn(email, pass);
    } catch {
      return await handleLocalSignIn(email, pass);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, phone: string) => {
    if (!email || !email.trim()) {
      return { error: 'يرجى إدخال البريد الإلكتروني' };
    }
    if (!pass || pass.trim().length < 6) {
      return { error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' };
    }
    if (!fullName || !fullName.trim()) {
      return { error: 'يرجى إدخال الاسم الكامل' };
    }

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();
      const cleanPhone = phone?.trim() || '';

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: pass,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
            role: 'USER',
          },
        },
      });

      if (error) {
        return { error: error.message || 'فشل إنشاء الحساب الجديد' };
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.session.access_token) {
          await fetchDbUserProfile(data.session.access_token);
        }
      }

      return { error: null };
    } catch (err) {
      return { error: (err as Error).message || 'حدث خطأ غير متوقع أثناء التسجيل' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    setSession(null);
    setDbUser(null);
    setRole('USER');

    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, dbUser, role, loading, signIn, signUp, signOut, authFetch }}>
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
