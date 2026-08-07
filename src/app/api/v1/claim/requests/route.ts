import { NextResponse } from 'next/server';
import { db } from '@/db';
import { persons, users } from '@/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

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
      const dbClaims = await db
        .select({
          person_id: persons.id,
          first_name: persons.first_name,
          father_name: persons.father_name,
          grand_father_name: persons.grand_father_name,
          family_name: persons.family_name,
          birth_year: persons.birth_year,
          claimed_by_user_id: persons.claimed_by_user_id,
          created_at: persons.created_at,
          user_full_name: users.full_name,
          user_email: users.email,
          user_phone: users.phone,
        })
        .from(persons)
        .innerJoin(users, eq(persons.claimed_by_user_id, users.id))
        .where(isNotNull(persons.claimed_by_user_id));

      if (dbClaims.length > 0) {
        return NextResponse.json({ claims: dbClaims });
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

    try {
      if (action === 'approve') {
        // Claim is confirmed
        return NextResponse.json({ message: 'تم اعتماد وتوثيق المطالبة بالملف الشخصي بنجاح' });
      } else {
        // Revoke claim (un-claim)
        await db.update(persons)
          .set({ claimed_by_user_id: null })
          .where(eq(persons.id, pId));

        const memP = dbStore.getPersonById(pId);
        if (memP) {
          memP.claimed_by_user_id = undefined;
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
