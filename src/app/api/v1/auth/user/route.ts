import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { dbStore } from '@/lib/store';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawEmail = searchParams.get('email');

  if (!rawEmail) {
    return NextResponse.json({ error: 'Email query parameter required' }, { status: 400 });
  }

  const cleanEmail = rawEmail.trim().toLowerCase();

  // 1. Check PostgreSQL Database using specific SQL WHERE query (Performance & Security fix)
  try {
    const dbUsers = await db
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

    if (dbUsers.length > 0) {
      return NextResponse.json({ user: dbUsers[0] });
    }
  } catch {
    // Database initializing fallback
  }

  // 2. Memory store fallback
  const storeUser = dbStore
    .getUsers()
    .find((u) => u.email && u.email.trim().toLowerCase() === cleanEmail);

  if (storeUser) {
    return NextResponse.json({ user: storeUser });
  }

  return NextResponse.json({ user: null });
}
