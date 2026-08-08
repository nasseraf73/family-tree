import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { db } from '@/db';
import { persons as personsTable, users as usersTable } from '@/db/schema';
import { eq, or } from 'drizzle-orm';
import { sendEmailNotification } from '@/lib/email';

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

    // Check if the user ALREADY has a claimed profile in DB
    try {
      const existingClaims = await db
        .select()
        .from(personsTable)
        .where(eq(personsTable.claimed_by_user_id, userIdToClaim))
        .limit(1);

      if (existingClaims.length > 0 && existingClaims[0].id !== Number(person_id)) {
        const claimedName = [
          existingClaims[0].first_name,
          existingClaims[0].father_name,
          existingClaims[0].family_name,
        ]
          .filter(Boolean)
          .join(' ');

        return NextResponse.json(
          {
            error: `عفواً، حسابك مرتبط بالفعل ببطاقة موثقة باسم (${claimedName}). لا يمكن للمستخدم المطالبة بأكثر من بطاقة شخصية واحدة.`,
          },
          { status: 400 }
        );
      }
    } catch {
      // Safe catch if query fails
    }

    // 1. Check PostgreSQL DB first
    let personFoundInDb = false;
    let targetPerson: any = null;
    try {
      const dbPersons = await db.select().from(personsTable).where(eq(personsTable.id, person_id)).limit(1);
      if (dbPersons.length > 0) {
        personFoundInDb = true;
        targetPerson = dbPersons[0];
        if (targetPerson.claimed_by_user_id) {
          return NextResponse.json(
            { error: 'هذا الملف الشخصي تم المطالبة به وتوثيقه مسبقاً من قِبل عضو آخر' },
            { status: 409 }
          );
        }

        // Update in PostgreSQL database
        await db.update(personsTable)
          .set({ claimed_by_user_id: userIdToClaim, claim_status: 'PENDING' })
          .where(eq(personsTable.id, person_id));
      }
    } catch (dbErr: any) {
      console.error('[CLAIM REQUEST DB EXCEPTION]', dbErr);
      return NextResponse.json(
        { error: 'تعذر حفظ طلب المطالبة في قاعدة البيانات (حسابك مرتبط بالفعل ببطاقة أخرى)' },
        { status: 400 }
      );
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
      person.claim_status = 'PENDING';
      if (!targetPerson) {
        targetPerson = person;
      }
    } else if (!personFoundInDb) {
      return NextResponse.json({ error: 'الشخص غير موجود بالمنظومة' }, { status: 404 });
    }

    // 3. Send email notifications to all Admin and Reviewer accounts
    try {
      const stewards = await db.select()
        .from(usersTable)
        .where(
          or(
            eq(usersTable.role, 'REVIEWER'),
            eq(usersTable.role, 'ADMIN'),
            eq(usersTable.role, 'REV'),
            eq(usersTable.role, 'ADM')
          )
        );

      const personFullName = targetPerson
        ? [targetPerson.first_name, targetPerson.father_name, targetPerson.grand_father_name, targetPerson.family_name].filter(Boolean).join(' ')
        : 'ملف شخصي غير محدد';

      console.log(`[CLAIM REQUEST] Found ${stewards.length} stewards to notify. Person: ${personFullName}`);

      for (const steward of stewards) {
        if (steward.email) {
          await sendEmailNotification({
            to: steward.email,
            subject: 'طلب مطابقة وتوثيق ملف شخصي جديد 📋',
            title: 'طلب مطابقة وتوثيق جديد بانتظار المراجعة',
            bodyHtml: `قام العضو <b>${dbUser.full_name}</b> (بريد: ${dbUser.email}) بتقديم طلب توثيق ومطابقة للملف الشخصي: <b>${personFullName}</b>.<br/>يرجى الدخول إلى لوحة التحكم الخاصة بالمشرفين لمراجعة الطلب والمستندات المرفقة واتخاذ الإجراء المناسب.`,
            actionUrl: 'https://family-tree-ten-blush.vercel.app/tree',
            actionText: 'لوحة تحكم المشرفين',
          });
        }
      }
    } catch (mailErr) {
      console.error('[CLAIM REQUEST EMAIL EXCEPTION]', mailErr);
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

