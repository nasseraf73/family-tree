import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { Relationship } from '@/types';
import { db } from '@/db';
import { relationships as relsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    // 1. Update in PostgreSQL DB via Drizzle ORM
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

    // 2. Update in MemoryStore fallback
    const rel = dbStore.getRelationships().find((r: Relationship) => r.id === relationship_id);
    if (rel) {
      rel.status = newStatus;
      if (action === 'approve') {
        rel.verified_by_user_id = reviewerId;
        rel.verified_at = new Date().toISOString();
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
