import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { db } from '@/db';
import { persons as personsTable } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { person_id, national_id, proof_document } = body;

    if (!person_id) {
      return NextResponse.json({ error: 'معرف الشخص مطلوب للمطالبة' }, { status: 400 });
    }

    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً للمطالبة ببطاقة نسبك' },
        { status: 401 }
      );
    }
    const userIdToClaim = dbUser.id;

    // 1. Check PostgreSQL DB first
    let personFoundInDb = false;
    try {
      const dbPersons = await db.select().from(personsTable).where(eq(personsTable.id, person_id)).limit(1);
      if (dbPersons.length > 0) {
        personFoundInDb = true;
        const targetPerson = dbPersons[0];
        if (targetPerson.claimed_by_user_id) {
          return NextResponse.json(
            { error: 'هذا الملف الشخصي تم المطالبة به وتوثيقه مسبقاً من قِبل عضو آخر' },
            { status: 409 }
          );
        }

        // Update in PostgreSQL database
        await db.update(personsTable)
          .set({ claimed_by_user_id: userIdToClaim })
          .where(eq(personsTable.id, person_id));
      }
    } catch {
      // Fallback
    }

    // 2. Fallback / Sync MemoryStore
    const person = dbStore.getPersonById(person_id);
    if (person) {
      if (!personFoundInDb && person.claimed_by_user_id) {
        return NextResponse.json(
          { error: 'هذا الملف الشخصي تم المطالبة به وتوثيقه مسبقاً من قِبل عضو آخر' },
          { status: 409 }
        );
      }
      person.claimed_by_user_id = userIdToClaim;
    } else if (!personFoundInDb) {
      return NextResponse.json({ error: 'الشخص غير موجود بالمنظومة' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'تم رفع طلب المطالبة بالملف الشخصي بنجاح وحفظه بالمنظومة، وهو بانتظار توثيق المشرف',
      person_id,
      claimed_by_user_id: userIdToClaim,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
