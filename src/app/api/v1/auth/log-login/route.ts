import { NextResponse } from 'next/server';
import { db, client } from '../../../../db';
import { loginLogs } from '../../../../db/schema';

let isTableChecked = false;

async function ensureTable() {
  if (isTableChecked) return;
  try {
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
    isTableChecked = true;
  } catch (err) {
    console.error('Failed to create login_logs table:', err);
  }
}

export async function POST(req: Request) {
  try {
    await ensureTable();
    const body = await req.json();
    const { email, full_name, user_id, status } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const vercelIp = req.headers.get('x-vercel-forwarded-for');

    let ip = (forwardedFor ? forwardedFor.split(',')[0] : (realIp || vercelIp || '127.0.0.1')).trim();
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1 (Localhost)';

    const userAgent = req.headers.get('user-agent') || 'Unknown';

    await db.insert(loginLogs).values({
      user_id: user_id ? Number(user_id) : null,
      email: email.trim().toLowerCase(),
      full_name: full_name || 'مستخدم النظام',
      ip_address: ip,
      user_agent: userAgent,
      status: status || 'SUCCESS',
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error logging login event:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
