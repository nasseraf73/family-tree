import { NextResponse } from 'next/server';
import { db } from '@/db';
import { relationships as relsTable, users as usersTable, persons as personsTable } from '@/db/schema';
import { eq, or } from 'drizzle-orm';

export async function DELETE(request: Request) {
  try {
    const userEmail = request.headers.get('x-user-email');
    if (!userEmail) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً لحذف العلاقة' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { relationship_id } = body;

    if (!relationship_id) {
      return NextResponse.json(
        { error: 'معرف العلاقة المطلوب حذفها مفقود' },
        { status: 400 }
      );
    }

    // 1. Fetch requesting user
    const dbUsers = await db.select().from(usersTable).where(eq(usersTable.email, userEmail));
    if (dbUsers.length === 0) {
      return NextResponse.json(
        { error: 'حساب المستخدم غير موجود' },
        { status: 404 }
      );
    }
    const currentUser = dbUsers[0];

    // 2. Fetch target relationship record
    const targetRels = await db.select().from(relsTable).where(eq(relsTable.id, relationship_id));
    if (targetRels.length === 0) {
      return NextResponse.json(
        { error: 'العلاقة المطلوبة غير موجودة أو تم حذفها مسبقاً' },
        { status: 404 }
      );
    }
    const targetRel = targetRels[0];

    // 3. Permission Control (RBAC):
    // Authorized if: User is ADMIN OR REVIEWER OR User is the Creator of the relationship
    const isOwner = targetRel.created_by_user_id === currentUser.id;
    const isAdminOrReviewer =
      currentUser.role === 'ADMIN' ||
      currentUser.role === 'REVIEWER' ||
      currentUser.role === 'ADM' ||
      currentUser.role === 'REV';

    if (!isOwner && !isAdminOrReviewer) {
      return NextResponse.json(
        { error: 'عفواً، لا تملك الصلاحية لحذف هذه العلاقة. يمكنك فقط حذف العلاقات التي قمت بإنشائها بنفسك.' },
        { status: 403 }
      );
    }

    const connectedPersonIds = [targetRel.person_id, targetRel.related_person_id];

    // 4. Perform Delete from PostgreSQL database
    await db.delete(relsTable).where(eq(relsTable.id, relationship_id));

    // 5. Orphaned Auto-Parent Placeholder Cleanup Logic:
    for (const personId of connectedPersonIds) {
      const pRecords = await db.select().from(personsTable).where(eq(personsTable.id, personId));
      if (pRecords.length > 0 && pRecords[0].is_placeholder) {
        const remainingRels = await db
          .select()
          .from(relsTable)
          .where(or(eq(relsTable.person_id, personId), eq(relsTable.related_person_id, personId)));

        if (remainingRels.length === 0) {
          // Placeholder node is now orphaned (0 relationships left) -> Auto-delete!
          await db.delete(personsTable).where(eq(personsTable.id, personId));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف العلاقة بنجاح وتنظيف العقد اليتيمة',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف العلاقة: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
