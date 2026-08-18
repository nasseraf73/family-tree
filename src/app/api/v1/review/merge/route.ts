import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { Relationship, MergeRequest } from '@/types';
import { db } from '@/db';
import { mergeRequests, relationships, persons } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merge_request_id } = body;

    if (!merge_request_id) {
      return NextResponse.json({ error: 'معرف طلب الدمج مطلوب' }, { status: 400 });
    }

    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً للوصول إلى دمج السجلات' },
        { status: 401 }
      );
    }

    const isSteward = dbUser.role === 'REVIEWER' || dbUser.role === 'ADMIN' || dbUser.role === 'REV' || dbUser.role === 'ADM';
    if (!isSteward) {
      return NextResponse.json(
        { error: 'عفواً، لا تملك صلاحية مراجع أو مدير فرع للموافقة على دمج السجلات المكررة' },
        { status: 403 }
      );
    }

    const reviewerId = dbUser.id;

    // 1. PostgreSQL DB Merge via Drizzle ORM
    try {
      const dbMergeReqs = await db.select().from(mergeRequests).where(eq(mergeRequests.id, merge_request_id)).limit(1);
      if (dbMergeReqs.length > 0) {
        const req = dbMergeReqs[0];
        // Re-link relationships
        await db.update(relationships)
          .set({ person_id: req.primary_person_id })
          .where(eq(relationships.person_id, req.duplicate_person_id));

        await db.update(relationships)
          .set({ related_person_id: req.primary_person_id })
          .where(eq(relationships.related_person_id, req.duplicate_person_id));

        // Delete duplicate person
        await db.delete(persons).where(eq(persons.id, req.duplicate_person_id));

        // Mark merge request APPROVED
        await db.update(mergeRequests)
          .set({ status: 'APPROVED', reviewed_by_user_id: reviewerId })
          .where(eq(mergeRequests.id, req.id));
      }
    } catch {
      // Fallback
    }

    // 2. MemoryStore Fallback
    const req = dbStore.getMergeRequests().find((m: MergeRequest) => m.id === merge_request_id);
    if (req) {
      const primaryPerson = dbStore.getPersonById(req.primary_person_id);
      const duplicatePerson = dbStore.getPersonById(req.duplicate_person_id);

      if (primaryPerson && duplicatePerson) {
        const allRels = dbStore.getRelationships();
        allRels.forEach((r: Relationship) => {
          if (r.person_id === duplicatePerson.id) {
            r.person_id = primaryPerson.id;
          }
          if (r.related_person_id === duplicatePerson.id) {
            r.related_person_id = primaryPerson.id;
          }
        });

        dbStore.deletePerson(duplicatePerson.id);
        req.status = 'APPROVED';
        req.reviewed_by_user_id = reviewerId;
      }
    }

    return NextResponse.json({
      message: 'تم دمج السجل المكرر بنجاح وتحويل جميع علاقاته إلى السجل الرئيسي المعتمد',
      merge_request_id,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
