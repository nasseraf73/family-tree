import { NextResponse } from 'next/server';
import { db } from '@/db';
import {
  users as usersTable,
  persons as personsTable,
  relationships as relsTable,
  branchReviewers as reviewersTable,
  mergeRequests as mergeTable,
} from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);
    if (error || !dbUser) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    const isAdmin = dbUser.role === 'ADMIN' || (dbUser.role as string) === 'ADM';
    if (!isAdmin) {
      return NextResponse.json({ error: 'عفواً، هذه العملية حصرية لمدراء النظام' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');
    if (!rawId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب للفحص' }, { status: 400 });
    }

    const targetUserId = Number(rawId);

    // 1. Fetch Target User Record
    const targetUsers = await db.select().from(usersTable).where(eq(usersTable.id, targetUserId));
    if (targetUsers.length === 0) {
      return NextResponse.json({ error: 'حساب المستخدم غير موجود' }, { status: 404 });
    }
    const targetUser = targetUsers[0];

    // 2. Check Claimed Profile
    const claimedPersons = await db
      .select({
        id: personsTable.id,
        first_name: personsTable.first_name,
        father_name: personsTable.father_name,
        grand_father_name: personsTable.grand_father_name,
        family_name: personsTable.family_name,
      })
      .from(personsTable)
      .where(eq(personsTable.claimed_by_user_id, targetUserId));

    const claimedProfile = claimedPersons.length > 0 ? {
      id: claimedPersons[0].id,
      fullName: [
        claimedPersons[0].first_name,
        claimedPersons[0].father_name,
        claimedPersons[0].grand_father_name,
        claimedPersons[0].family_name
      ].filter(Boolean).join(' '),
    } : null;

    // 3. Check Branch Reviewer Roles
    const branchAssignments = await db
      .select({
        id: reviewersTable.id,
        rootPersonId: reviewersTable.root_person_id,
        rootFirstName: personsTable.first_name,
        rootFamilyName: personsTable.family_name,
      })
      .from(reviewersTable)
      .leftJoin(personsTable, eq(reviewersTable.root_person_id, personsTable.id))
      .where(eq(reviewersTable.user_id, targetUserId));

    const reviewerBranches = branchAssignments.map((b) => ({
      rootPersonId: b.rootPersonId,
      branchName: b.rootFirstName ? `فرع ${b.rootFirstName} ${b.rootFamilyName || ''}` : `الفرع #${b.rootPersonId}`,
    }));

    // 4. Count Pending Relationship Requests
    const pendingRels = await db
      .select()
      .from(relsTable)
      .where(and(eq(relsTable.created_by_user_id, targetUserId), eq(relsTable.status, 'PENDING')));

    // 5. Count Created Persons
    const createdPersons = await db
      .select()
      .from(personsTable)
      .where(eq(personsTable.created_by_user_id, targetUserId));

    // 6. Count Pending Merge Requests
    const pendingMerges = await db
      .select()
      .from(mergeTable)
      .where(and(eq(mergeTable.requested_by_user_id, targetUserId), eq(mergeTable.status, 'PENDING')));

    return NextResponse.json({
      user: {
        id: targetUser.id,
        full_name: targetUser.full_name,
        email: targetUser.email,
        phone: targetUser.phone,
        role: targetUser.role,
      },
      audit: {
        claimedProfile,
        reviewerBranches,
        isReviewer: reviewerBranches.length > 0,
        pendingRequestsCount: pendingRels.length,
        createdPersonsCount: createdPersons.length,
        pendingMergesCount: pendingMerges.length,
      },
    });
  } catch (err) {
    console.error('Error inspecting user before deletion:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'حدث خطأ أثناء إجراء الفحص الخلفي للمستخدم' },
      { status: 500 }
    );
  }
}
