import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { Relationship } from '@/types';
import { db } from '@/db';
import { relationships as relsTable, users as usersTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { sendEmailNotification } from '@/lib/email';

async function handleApprove(request: Request) {
  try {
    const body = await request.json();
    const { relationship_id, action } = body;

    if (!relationship_id || !action) {
      return NextResponse.json({ error: 'معرف العلاقة والإجراء مطلوبان' }, { status: 400 });
    }

    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً للوصول إلى لوحة الاعتماد والمراجعة' },
        { status: 401 }
      );
    }

    const isSteward = dbUser.role === 'REVIEWER' || dbUser.role === 'ADMIN' || dbUser.role === 'REV' || dbUser.role === 'ADM';
    if (!isSteward) {
      return NextResponse.json(
        { error: 'عفواً، لا تملك صلاحية مراجع أو مدير فرع لاعتماد أو رفض العلاقات النسبية المعلقة' },
        { status: 403 }
      );
    }

    const reviewerId = dbUser.id;
    const newStatus = action === 'approve' ? 'VERIFIED' : 'REJECTED';

    // 1. Fetch relationship record to identify creator
    let creatorUserId: number | null = null;
    try {
      const relRecords = await db.select().from(relsTable).where(eq(relsTable.id, relationship_id));
      if (relRecords.length > 0) {
        creatorUserId = relRecords[0].created_by_user_id;
      }
    } catch {
      // Memory store fallback check
      const storeRel = dbStore.getRelationships().find((r: Relationship) => r.id === relationship_id);
      if (storeRel) creatorUserId = storeRel.created_by_user_id || null;
    }

    // 2. Update in PostgreSQL DB via Drizzle ORM
    try {
      if (action === 'approve') {
        await db.update(relsTable)
          .set({
            status: 'VERIFIED',
            verified_by_user_id: reviewerId,
            verified_at: new Date(),
          })
          .where(eq(relsTable.id, relationship_id));
      } else {
        await db.update(relsTable)
          .set({
            status: 'REJECTED',
          })
          .where(eq(relsTable.id, relationship_id));
      }
    } catch {
      // Fallback
    }

    // 3. Update in MemoryStore fallback
    const rel = dbStore.getRelationships().find((r: Relationship) => r.id === relationship_id);
    if (rel) {
      rel.status = newStatus;
      if (action === 'approve') {
        rel.verified_by_user_id = reviewerId;
        rel.verified_at = new Date().toISOString();
      }
    }

    // 4. Trigger Email Notification to Creator
    if (creatorUserId) {
      try {
        const creatorUsers = await db.select().from(usersTable).where(eq(usersTable.id, creatorUserId));
        if (creatorUsers.length > 0 && creatorUsers[0].email) {
          const isApproved = action === 'approve';
          await sendEmailNotification({
            to: creatorUsers[0].email,
            subject: isApproved ? 'تحديث: تم اعتماد طلب النسب الخاص بك' : 'تحديث: نتيجة مراجعة طلب النسب',
            title: isApproved ? 'تهانينا! تم اعتماد طلبك بنجاح' : 'تحديث حول طلبك المعلق',
            bodyHtml: isApproved
              ? `قام ناظر الفرع بمراجعة واعتماد طلب النسب الذي قدمته. أصبحت العلاقة مضافة ومثبتة رسمياً في شجرة العائلة الكبرى.`
              : `قام ناظر الفرع بمراجعة الطلب المعلق المقدم من قبلك. لم يتم اعتماد الطلب في الوقت الحالي.`,
            actionUrl: 'http://localhost:3000/tree',
            actionText: 'عرض الشجرة الكبرى',
          });
        }
      } catch (e) {
        console.error('Failed sending status email notification:', e);
      }
    }

    return NextResponse.json({
      message: action === 'approve' ? 'تم اعتماد العلاقة وتحديث الشجرة الكبرى بنجاح' : 'تم رفض العلاقة المعلقة',
      relationship_id,
      status: newStatus,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return handleApprove(request);
}

export async function POST(request: Request) {
  return handleApprove(request);
}
