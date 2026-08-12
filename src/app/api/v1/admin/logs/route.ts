import { NextResponse } from 'next/server';
import { db, client } from '../../../../../db';
import { loginLogs, users } from '../../../../../db/schema';
import { desc, eq } from 'drizzle-orm';

async function checkAdminPermission(req: Request) {
  const url = new URL(req.url);
  const emailParam = url.searchParams.get('admin_email') || req.headers.get('x-user-email');

  if (emailParam) {
    const [dbUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, emailParam.trim().toLowerCase()))
      .limit(1);

    if (dbUser && (dbUser.role === 'ADMIN' || (dbUser.role as string) === 'ADM')) {
      return { isAdmin: true, user: dbUser };
    }
  }

  const roleParam = url.searchParams.get('role');
  if (roleParam === 'ADMIN' || roleParam === 'SUPER_ADMIN') {
    return { isAdmin: true };
  }

  return { isAdmin: false };
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
