import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawEmail = searchParams.get('email');

    // 1. If email param is provided, lookup user directly from database
    if (rawEmail && rawEmail.trim()) {
      const cleanEmail = rawEmail.trim().toLowerCase();
      const found = await db
        .select({
          id: users.id,
          full_name: users.full_name,
          email: users.email,
          phone: users.phone,
          role: users.role,
          created_at: users.created_at,
        })
        .from(users)
        .where(eq(users.email, cleanEmail))
        .limit(1);

      if (found.length > 0) {
        return NextResponse.json({ user: found[0] });
      }
    }

    // 2. Otherwise verify using Bearer token or x-user-email
    const { dbUser, error } = await getAuthenticatedUser(request);

    if (error || !dbUser) {
      return NextResponse.json({ error: error || 'غير مصرح للوصول' }, { status: 401 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

