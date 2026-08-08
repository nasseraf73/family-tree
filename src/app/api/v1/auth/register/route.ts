import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dbStore } from '@/lib/store';
import { sendEmailNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, full_name, phone } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: 'البريد الإلكتروني والاسم الكامل مطلوبان' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = full_name.trim().replace(/<[^>]*>?/gm, ''); // Strip HTML tags

    // Email format validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: 'صيغة البريد الإلكتروني المدخلة غير صحيحة' }, { status: 400 });
    }

    if (cleanFullName.length < 2 || cleanFullName.length > 100) {
      return NextResponse.json({ error: 'الاسم الكامل يجب أن يكون بين حرفين و 100 حرف' }, { status: 400 });
    }

    // Function to trigger welcome email
    const sendWelcome = async (recipientEmail: string, name: string) => {
      try {
        await sendEmailNotification({
          to: recipientEmail,
          subject: 'أهلاً بك في منصة شجرة العائلة الكبرى 🎉',
          title: `أهلاً ومرحباً بك أخي ${name}`,
          bodyHtml: `يسعدنا انضمامك وتسجيل حسابك في منصة شجرة العائلة الكبرى. يمكنك الآن تصفح سلاسل النسب، المطالبة بملفك الشخصي، والمشاركة التشاركية في توثيق سلالة العائلة.`,
          actionUrl: 'https://family-tree-ten-blush.vercel.app/tree',
          actionText: 'استكشف شجرة العائلة الآن',
        });
      } catch (err) {
        console.error('Failed sending welcome email:', err);
      }
    };

    // 1. Check existing in PostgreSQL
    try {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        return NextResponse.json({ user: existing[0] });
      }

      const newUsers = await db.insert(users).values({
        full_name: cleanFullName,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role: 'USER',
      }).returning();

      if (newUsers.length > 0) {
        sendWelcome(cleanEmail, cleanFullName);
        return NextResponse.json({ user: newUsers[0] });
      }
    } catch {
      // Fallback to memory store if database is initializing
    }

    // 2. Fallback memory store registration
    const existingStoreUser = dbStore.getUsers().find(u => u.email === email);
    if (existingStoreUser) {
      return NextResponse.json({ user: existingStoreUser });
    }

    const newUserObj = {
      id: Date.now(),
      full_name,
      email,
      phone: phone || undefined,
      role: 'USER' as const,
      created_at: new Date().toISOString(),
    };
    dbStore.getUsers().push(newUserObj);

    sendWelcome(cleanEmail, cleanFullName);

    return NextResponse.json({ user: newUserObj });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
