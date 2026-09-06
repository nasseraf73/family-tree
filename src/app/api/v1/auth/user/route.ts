import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);

    if (error || !dbUser) {
      return NextResponse.json({ error: error || 'غير مصرح للوصول' }, { status: 401 });
    }

    return NextResponse.json({ user: dbUser });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
