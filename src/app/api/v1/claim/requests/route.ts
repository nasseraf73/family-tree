import { NextResponse } from 'next/server';
import { db } from '@/db';
import { persons, users } from '@/db/schema';
import { eq, isNotNull, sql } from 'drizzle-orm';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { sendEmailNotification } from '@/lib/email';

export const dynamic = 'force-dynamic';

// GET /api/v1/claim/requests - Get all profile claim requests for stewards
export async function GET(request: Request) {
  try {
    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const isSteward = dbUser.role === 'REVIEWER' || dbUser.role === 'ADMIN' || dbUser.role === 'REV' || dbUser.role === 'ADM';
    if (!isSteward) {
      return NextResponse.json({ error: 'عفواً، هذه اللوحة خاصة بمشرفي ومدراء النظام' }, { status: 403 });
    }

    try {
      // Auto-migrate claim_status column in PostgreSQL and update all existing claims to APPROVED
      await db.execute(sql`ALTER TABLE persons ADD COLUMN IF NOT EXISTS claim_status varchar(20) DEFAULT 'APPROVED';`).catch(() => {});
      await db.execute(sql`UPDATE persons SET claim_status = 'APPROVED' WHERE claimed_by_user_id IS NOT NULL AND (claim_status IS NULL OR claim_status = 'PENDING');`).catch(() => {});

      const dbClaims = await db
        .select({
          person_id: persons.id,
          first_name: persons.first_name,
          father_name: persons.father_name,
          grand_father_name: persons.grand_father_name,
          family_name: persons.family_name,
          birth_year: persons.birth_year,
          claimed_by_user_id: persons.claimed_by_user_id,
          claim_status: persons.claim_status,
          created_at: persons.created_at,
          user_full_name: users.full_name,
          user_email: users.email,
          user_phone: users.phone,
        })
        .from(persons)
        .innerJoin(users, eq(persons.claimed_by_user_id, users.id))
        .where(isNotNull(persons.claimed_by_user_id));

      if (dbClaims.length > 0) {
        const formatted = dbClaims.map(c => ({
          ...c,
          claim_status: c.claim_status || 'APPROVED',
        }));
        return NextResponse.json({ claims: formatted });
      }
    } catch {
      // Fallback
    }

    // Memory store fallback
    const storePersons = dbStore.getPersons().filter(p => !!p.claimed_by_user_id);
    const storeUsers = dbStore.getUsers();

    const storeClaims = storePersons.map(p => {
      const u = storeUsers.find(user => user.id === p.claimed_by_user_id);
      return {
        person_id: p.id,
        first_name: p.first_name,
        father_name: p.father_name,
        grand_father_name: p.grand_father_name,
        family_name: p.family_name,
        birth_year: p.birth_year,
        claimed_by_user_id: p.claimed_by_user_id,
        claim_status: p.claim_status || 'APPROVED',
        created_at: p.created_at,
        user_full_name: u?.full_name || 'مستخدم',
        user_email: u?.email || 'غير متاح',
        user_phone: u?.phone || '',
      };
    });

    return NextResponse.json({ claims: storeClaims });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/v1/claim/requests - Approve or Revoke a claim
export async function POST(request: Request) {
  try {
    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json({ error: 'يرجى تسجيل الدخول أولاً' }, { status: 401 });
    }

    const isSteward = dbUser.role === 'REVIEWER' || dbUser.role === 'ADMIN' || dbUser.role === 'REV' || dbUser.role === 'ADM';
    if (!isSteward) {
      return NextResponse.json({ error: 'عفواً، هذه اللوحة خاصة بمشرفي ومدراء النظام' }, { status: 403 });
    }

    const body = await request.json();
    const { person_id, action } = body; // action: 'approve' | 'reject'

    if (!person_id || !action) {
      return NextResponse.json({ error: 'معرف الشخص والإجراء مطلوبان' }, { status: 400 });
    }

    const pId = Number(person_id);

    // Auto-migrate claim_status column if missing
    await db.execute(sql`ALTER TABLE persons ADD COLUMN IF NOT EXISTS claim_status varchar(20) DEFAULT 'PENDING';`).catch(() => {});

    // Fetch Target Person & Claiming User
    let targetPerson: any = null;
    let claimingUser: any = null;
    try {
      const pRes = await db.select().from(persons).where(eq(persons.id, pId));
      if (pRes.length > 0) {
        targetPerson = pRes[0];
        if (targetPerson.claimed_by_user_id) {
          const uRes = await db.select().from(users).where(eq(users.id, targetPerson.claimed_by_user_id));
          if (uRes.length > 0) claimingUser = uRes[0];
        }
      }
    } catch {
      // Fallback
    }

    try {
      if (action === 'approve') {
        // Mark claim as APPROVED
        await db.update(persons)
          .set({ claim_status: 'APPROVED' })
          .where(eq(persons.id, pId));

        const memP = dbStore.getPersonById(pId);
        if (memP) {
          memP.claim_status = 'APPROVED';
        }

        // Send Email Notification to Claiming User
        if (claimingUser && claimingUser.email) {
          const personFullName = [targetPerson?.first_name, targetPerson?.father_name, targetPerson?.family_name].filter(Boolean).join(' ');
          await sendEmailNotification({
            to: claimingUser.email,
            subject: 'تأكيد توثيق حسابك وملفك في شجرة العائلة',
            title: 'تهانينا! تم اعتماد مطالبتك بالبروفايل الشخصي',
            bodyHtml: `تم اعتماد وتوثيق ملكيتك للملف الشخصي (${personFullName}) في شجرة العائلة بنجاح. أصبحت الآن قادراً على إدارة وتحديث ملفك وتلقي الإشعارات.`,
            actionUrl: 'https://family-tree-ten-blush.vercel.app/my-tree',
            actionText: 'عرض ملفك وشجرتك',
          });
        }

        return NextResponse.json({ message: 'تم اعتماد وتوثيق المطالبة بالملف الشخصي بنجاح' });
      } else {
        // Revoke claim (un-claim)
        await db.update(persons)
          .set({ claimed_by_user_id: null, claim_status: null })
          .where(eq(persons.id, pId));

        const memP = dbStore.getPersonById(pId);
        if (memP) {
          memP.claimed_by_user_id = undefined;
          memP.claim_status = undefined;
        }

        if (claimingUser && claimingUser.email) {
          await sendEmailNotification({
            to: claimingUser.email,
            subject: 'تحديث: إلغاء المطالبة بالملف الشخصي',
            title: 'تحديث حول طلبك للملف الشخصي',
            bodyHtml: `قام مشرف النظام بمراجعة الطلب وإلغاء المطالبة بالملف الشخصي لإتاحته من جديد.`,
            actionUrl: 'https://family-tree-ten-blush.vercel.app/',
            actionText: 'الانتقال للرئيسية',
          });
        }

        return NextResponse.json({ message: 'تم إلغاء المطالبة بالملف الشخصي وإتاحته من جديد' });
      }
    } catch {
      // Memory fallback
      const memP = dbStore.getPersonById(pId);
      if (memP) {
        if (action === 'reject') {
          memP.claimed_by_user_id = undefined;
        }
      }
      return NextResponse.json({ message: action === 'approve' ? 'تم اعتماد المطالبة' : 'تم إلغاء المطالبة' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
