import { NextResponse } from 'next/server';
import { db } from '@/db';
import { countries as countriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

async function verifyAdminUser(request: Request) {
  const { dbUser } = await getAuthenticatedUser(request);
  if (!dbUser) {
    return { authorized: false, error: 'يرجى تسجيل الدخول أولاً كمدير نظام (ADMIN)', status: 401 };
  }

  const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'ADM';
  if (!isAdmin) {
    return {
      authorized: false,
      error: 'عفواً، التحكم بجدول الدول حصري لمدير النظام (ADMIN) فقط',
      status: 403,
    };
  }

  return { authorized: true, dbUser };
}

// GET /api/v1/admin/countries - Fetch all countries (ADMIN ONLY)
export async function GET(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    let allCountries: any[] = [];
    try {
      allCountries = await db.select().from(countriesTable);
    } catch {
      allCountries = dbStore.getCountries();
    }

    return NextResponse.json({ countries: allCountries });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// POST /api/v1/admin/countries - Add new country (ADMIN ONLY)
export async function POST(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { name, code, flag_emoji, is_active } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'اسم الدولة حقل مطلوب' }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanCode = code ? code.trim() : null;
    const cleanFlag = flag_emoji ? flag_emoji.trim() : null;

    let createdCountry: any = null;
    try {
      const inserted = await db
        .insert(countriesTable)
        .values({
          name: cleanName,
          code: cleanCode,
          flag_emoji: cleanFlag,
          is_active: is_active ?? true,
        })
        .returning();
      if (inserted.length > 0) {
        createdCountry = inserted[0];
      }
    } catch (e) {
      console.error('Error inserting country in DB:', e);
    }

    if (!createdCountry) {
      createdCountry = dbStore.addCountry({
        name: cleanName,
        code: cleanCode || undefined,
        flag_emoji: cleanFlag || undefined,
        is_active: is_active ?? true,
      });
    }

    return NextResponse.json(
      { message: 'تم إضافة الدولة بنجاح', country: createdCountry },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// PUT /api/v1/admin/countries - Update country (ADMIN ONLY)
export async function PUT(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { id, name, code, flag_emoji, is_active } = body;

    if (!id) {
      return NextResponse.json({ error: 'معرف الدولة مطلوب للتحديث' }, { status: 400 });
    }

    let updatedCountry: any = null;
    try {
      const updated = await db
        .update(countriesTable)
        .set({
          ...(name !== undefined && { name: name.trim() }),
          ...(code !== undefined && { code: code ? code.trim() : null }),
          ...(flag_emoji !== undefined && { flag_emoji: flag_emoji ? flag_emoji.trim() : null }),
          ...(is_active !== undefined && { is_active }),
        })
        .where(eq(countriesTable.id, id))
        .returning();

      if (updated.length > 0) {
        updatedCountry = updated[0];
      }
    } catch (e) {
      console.error('Error updating country in DB:', e);
    }

    if (!updatedCountry) {
      updatedCountry = dbStore.updateCountry(id, {
        ...(name !== undefined && { name: name.trim() }),
        ...(code !== undefined && { code: code ? code.trim() : undefined }),
        ...(flag_emoji !== undefined && { flag_emoji: flag_emoji ? flag_emoji.trim() : undefined }),
        ...(is_active !== undefined && { is_active }),
      });
    }

    return NextResponse.json({
      message: 'تم تحديث بيانات الدولة بنجاح',
      country: updatedCountry,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

// DELETE /api/v1/admin/countries - Delete country (ADMIN ONLY)
export async function DELETE(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const countryIdParam = searchParams.get('id');
    const countryId = countryIdParam ? parseInt(countryIdParam, 10) : null;

    if (!countryId) {
      return NextResponse.json({ error: 'معرف الدولة مطلوب للحذف' }, { status: 400 });
    }

    try {
      await db.delete(countriesTable).where(eq(countriesTable.id, countryId));
    } catch (e) {
      console.error('Error deleting country from DB:', e);
    }

    dbStore.deleteCountry(countryId);

    return NextResponse.json({ success: true, message: 'تم حذف الدولة بنجاح' });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
