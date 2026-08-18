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

    // Function to trigger welcome email with detailed tracing
    const sendWelcome = async (recipientEmail: string, name: string) => {
      console.log(`[REGISTER API] Triggering welcome email for ${recipientEmail}`);
      const res = await sendEmailNotification({
        to: recipientEmail,
        subject: 'أهلاً بك في منصة شجرة العائلة الكبرى 🎉',
        title: `أهلاً ومرحباً بك أخي ${name}`,
        bodyHtml: `يسعدنا انضمامك وتسجيل حسابك في منصة شجرة العائلة الكبرى. يمكنك الآن تصفح سلاسل النسب، المطالبة بملفك الشخصي، والمشاركة التشاركية في توثيق سلالة العائلة.`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://family-tree-ten-blush.vercel.app'}/tree`,
        actionText: 'استكشف شجرة العائلة الآن',
      });
      console.log(`[REGISTER API EMAIL RESULT]`, res);
      return res;
    };

    // 1. Check existing in PostgreSQL
    try {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        console.log(`[REGISTER API] User ${cleanEmail} already exists in DB.`);
        return NextResponse.json({ user: existing[0], is_existing: true });
      }

      const newUsers = await db.insert(users).values({
        full_name: cleanFullName,
        email: cleanEmail,
        phone: phone ? phone.trim() : null,
        role: 'USER',
      }).returning();

      if (newUsers.length > 0) {
        const emailStatus = await sendWelcome(cleanEmail, cleanFullName);
        return NextResponse.json({ user: newUsers[0], email_status: emailStatus });
      }
    } catch (dbErr) {
      console.error('[REGISTER API DB EXCEPTION]', dbErr);
    }

    // 2. Fallback memory store registration
    const existingStoreUser = dbStore.getUsers().find(u => u.email === email);
    if (existingStoreUser) {
      return NextResponse.json({ user: existingStoreUser, is_existing: true });
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

    const emailStatus = await sendWelcome(cleanEmail, cleanFullName);

    return NextResponse.json({ user: newUserObj, email_status: emailStatus });
  } catch (err) {
    console.error('[REGISTER API GENERAL EXCEPTION]', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
