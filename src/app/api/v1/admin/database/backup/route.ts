import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import postgres from 'postgres';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);
    if (error || !dbUser) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    if (dbUser.role !== 'ADMIN' && (dbUser.role as string) !== 'ADM') {
      return NextResponse.json({ error: 'غير مصرح: هذه الصفحة مخصصة لمدراء النظام فقط' }, { status: 403 });
    }

    const backupsDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupsDir, { recursive: true });

    const files = await fs.readdir(backupsDir);
    const backupFiles = [];

    for (const f of files) {
      if (f.endsWith('.json')) {
        const filePath = path.join(backupsDir, f);
        const stat = await fs.stat(filePath);
        backupFiles.push({
          name: f,
          sizeBytes: stat.size,
          createdAt: stat.birthtime.toISOString(),
        });
      }
    }

    backupFiles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ backups: backupFiles });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);
    if (error || !dbUser) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    if (dbUser.role !== 'ADMIN' && (dbUser.role as string) !== 'ADM') {
      return NextResponse.json({ error: 'غير مصرح: هذه الصفحة مخصصة لمدراء النظام فقط' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const source = body.source === 'local' ? 'local' : 'cloud';

    const cloudUrl = process.env.DATABASE_URL || '';
    const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';

    const connUrl = source === 'local' ? localUrl : cloudUrl;
    const sql = postgres(connUrl);

    // Fetch data from all 7 tables
    const [
      countries,
      users,
      persons,
      relationships,
      marriages,
      branch_reviewers,
      merge_requests,
    ] = await Promise.all([
      sql`SELECT * FROM countries ORDER BY id`,
      sql`SELECT * FROM users ORDER BY id`,
      sql`SELECT * FROM persons ORDER BY id`,
      sql`SELECT * FROM relationships ORDER BY id`,
      sql`SELECT * FROM marriages ORDER BY id`,
      sql`SELECT * FROM branch_reviewers ORDER BY id`,
      sql`SELECT * FROM merge_requests ORDER BY id`,
    ]);

    await sql.end();

    const now = new Date();
    const timestampStr = now.toISOString().replace(/[:.]/g, '-');
    const fileName = `family_tree_backup_${source}_${timestampStr}.json`;

    const backupPayload = {
      meta: {
        createdAt: now.toISOString(),
        source,
        version: '1.0',
        counts: {
          countries: countries.length,
          users: users.length,
          persons: persons.length,
          relationships: relationships.length,
          marriages: marriages.length,
          branch_reviewers: branch_reviewers.length,
          merge_requests: merge_requests.length,
        },
      },
      data: {
        countries,
        users,
        persons,
        relationships,
        marriages,
        branch_reviewers,
        merge_requests,
      },
    };

    const backupsDir = path.join(process.cwd(), 'backups');
    await fs.mkdir(backupsDir, { recursive: true });
    const filePath = path.join(backupsDir, fileName);

    await fs.writeFile(filePath, JSON.stringify(backupPayload, null, 2), 'utf8');

    return NextResponse.json({
      message: `تم إنشاء النسخة الاحتياطية بنجاح: ${fileName}`,
      fileName,
      counts: backupPayload.meta.counts,
      payload: backupPayload,
    });
  } catch (err) {
    console.error('Error creating backup:', err);
    return NextResponse.json({ error: (err as Error).message || 'فشل إنشاء النسخة الاحتياطية' }, { status: 500 });
  }
}
