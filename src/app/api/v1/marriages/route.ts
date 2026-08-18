import { NextResponse } from 'next/server';
import { db } from '@/db';
import { marriages as marriagesTable } from '@/db/schema';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { normalizeForDatabase } from '@/lib/dedup';

export async function POST(request: Request) {
  try {
    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً لتسجيل عقد أو سجل زواج جديد' },
        { status: 401 }
      );
    }
    const userId = dbUser.id;

    const body = await request.json();
    const { husband_id, wife_id, status, marriage_order } = body;

    const external_spouse_name = normalizeForDatabase(body.external_spouse_name);
    const external_family_name = normalizeForDatabase(body.external_family_name);

    if (!husband_id && !wife_id) {
      return NextResponse.json(
        { error: 'بيانات الزواج ناقصة' },
        { status: 400 }
      );
    }

    const newMarriage = await db
      .insert(marriagesTable)
      .values({
        husband_id: husband_id,
        wife_id: wife_id || null,
        external_spouse_name: external_spouse_name || null,
        external_family_name: external_family_name || null,
        status: status || 'ACTIVE',
        marriage_order: marriage_order || 1,
        created_by_user_id: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      marriage: newMarriage[0],
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إضافة سجل الزواج: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
