import { NextResponse } from 'next/server';
import { db, client } from '@/db';
import { loginLogs } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

async function checkAdminPermission(req: Request) {
  const { dbUser, error } = await getAuthenticatedUser(req);
  if (error || !dbUser) {
    return { isAdmin: false };
  }

  const isAdmin = dbUser.role === 'ADMIN' || (dbUser.role as string) === 'ADM';
  return { isAdmin, user: dbUser };
}


export async function GET(req: Request) {
  try {
    const perm = await checkAdminPermission(req);
    if (!perm.isAdmin) {
      return NextResponse.json({ error: 'عذراً، الوصول لـ سجلات الدخول محصور فقط للأدمن (ADMIN)' }, { status: 403 });
    }

    // Ensure table exists
    await client.unsafe(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id BIGSERIAL PRIMARY KEY,
        user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
        email VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        ip_address VARCHAR(100),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'SUCCESS' NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const logs = await db
      .select()
      .from(loginLogs)
      .orderBy(desc(loginLogs.created_at))
      .limit(200);

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error('Failed to fetch login logs:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const perm = await checkAdminPermission(req);
    if (!perm.isAdmin) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 403 });
    }

    await client.unsafe(`TRUNCATE TABLE login_logs RESTART IDENTITY;`);
    return NextResponse.json({ success: true, message: 'تم مسح جميع سجلات الدخول بنجاح' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
