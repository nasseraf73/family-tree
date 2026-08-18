import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function POST(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);
    if (error || !dbUser) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    if (dbUser.role !== 'ADMIN' && (dbUser.role as string) !== 'ADM') {
      return NextResponse.json({ error: 'غير مصرح: هذه الصفحة مخصصة لمدراء النظام فقط' }, { status: 403 });
    }

    const body = await request.json();
    const action = body.action; // 'pull' | 'push'

    if (action !== 'pull' && action !== 'push') {
      return NextResponse.json({ error: 'إجراء المزامنة غير معروف (يجب أن يكون pull أو push)' }, { status: 400 });
    }

    const cloudUrl = process.env.DATABASE_URL || '';
    const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';

    const cloudSql = postgres(cloudUrl);
    let localSql: postgres.Sql | null = null;

    try {
      localSql = postgres(localUrl, { connect_timeout: 5 });
      await localSql`SELECT 1`;
    } catch (e) {
      await cloudSql.end();
      return NextResponse.json(
        { error: 'قاعدة البيانات المحلية (Localhost) غير متوفرة أو غير متصلة على الجهاز: ' + (e as Error).message },
        { status: 500 }
      );
    }

    const sourceSql = action === 'pull' ? cloudSql : localSql;
    const targetSql = action === 'pull' ? localSql : cloudSql;

    const sourceName = action === 'pull' ? 'الكلاود (Cloud)' : 'الجهاز المحلي (Localhost)';
    const targetName = action === 'pull' ? 'الجهاز المحلي (Localhost)' : 'الكلاود (Cloud)';

    console.log(`Starting SYNC operation: ${action.toUpperCase()} (${sourceName} -> ${targetName})`);

    // 1. Wipe target DB tables safely
    await targetSql`TRUNCATE TABLE branch_reviewers, merge_requests, marriages, relationships, persons, users, countries RESTART IDENTITY CASCADE`;

    // 2. Fetch all data from source DB
    const [
      srcCountries,
      srcUsers,
      srcPersons,
      srcRels,
      srcMarr,
      srcRev,
      srcMerge,
    ] = await Promise.all([
      sourceSql`SELECT * FROM countries ORDER BY id`,
      sourceSql`SELECT * FROM users ORDER BY id`,
      sourceSql`SELECT * FROM persons ORDER BY id`,
      sourceSql`SELECT * FROM relationships ORDER BY id`,
      sourceSql`SELECT * FROM marriages ORDER BY id`,
      sourceSql`SELECT * FROM branch_reviewers ORDER BY id`,
      sourceSql`SELECT * FROM merge_requests ORDER BY id`,
    ]);

    // 3. Insert Countries
    for (const c of srcCountries) {
      await targetSql`
        INSERT INTO countries (id, name, code, flag_emoji, is_active, created_at)
        VALUES (${c.id}, ${c.name}, ${c.code}, ${c.flag_emoji}, ${c.is_active}, ${c.created_at})
      `;
    }
    if (srcCountries.length > 0) {
      await targetSql`SELECT setval('countries_id_seq', COALESCE((SELECT MAX(id) FROM countries), 1))`;
    }

    // 4. Insert Users
    for (const u of srcUsers) {
      await targetSql`
        INSERT INTO users (id, email, password_hash, full_name, phone, role, created_at)
        VALUES (${u.id}, ${u.email}, ${u.password_hash}, ${u.full_name}, ${u.phone}, ${u.role}, ${u.created_at})
      `;
    }
    if (srcUsers.length > 0) {
      await targetSql`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1))`;
    }

    // 5. Insert Persons
    for (const p of srcPersons) {
      await targetSql`
        INSERT INTO persons (
          id, first_name, father_name, grand_father_name, family_name, gender, is_alive,
          birth_date, birth_year, death_date, burial_place, country_id, photo_url, biography,
          is_placeholder, created_by_user_id, claimed_by_user_id, created_at
        ) VALUES (
          ${p.id}, ${p.first_name}, ${p.father_name}, ${p.grand_father_name}, ${p.family_name}, ${p.gender}, ${p.is_alive},
          ${p.birth_date}, ${p.birth_year}, ${p.death_date}, ${p.burial_place}, ${p.country_id}, ${p.photo_url}, ${p.biography},
          ${p.is_placeholder}, ${p.created_by_user_id}, ${p.claimed_by_user_id}, ${p.created_at}
        )
      `;
    }
    if (srcPersons.length > 0) {
      await targetSql`SELECT setval('persons_id_seq', COALESCE((SELECT MAX(id) FROM persons), 1))`;
    }

    // 6. Insert Relationships
    for (const r of srcRels) {
      await targetSql`
        INSERT INTO relationships (
          id, person_id, related_person_id, relationship_type, status,
          created_by_user_id, verified_by_user_id, verified_at, created_at
        ) VALUES (
          ${r.id}, ${r.person_id}, ${r.related_person_id}, ${r.relationship_type}, ${r.status},
          ${r.created_by_user_id}, ${r.verified_by_user_id}, ${r.verified_at}, ${r.created_at}
        )
      `;
    }
    if (srcRels.length > 0) {
      await targetSql`SELECT setval('relationships_id_seq', COALESCE((SELECT MAX(id) FROM relationships), 1))`;
    }

    // 7. Insert Marriages
    for (const m of srcMarr) {
      await targetSql`
        INSERT INTO marriages (
          id, husband_id, wife_id, external_spouse_name, external_family_name,
          status, marriage_order, created_by_user_id, created_at
        ) VALUES (
          ${m.id}, ${m.husband_id}, ${m.wife_id}, ${m.external_spouse_name}, ${m.external_family_name},
          ${m.status}, ${m.marriage_order}, ${m.created_by_user_id}, ${m.created_at}
        )
      `;
    }
    if (srcMarr.length > 0) {
      await targetSql`SELECT setval('marriages_id_seq', COALESCE((SELECT MAX(id) FROM marriages), 1))`;
    }

    // 8. Insert Branch Reviewers
    for (const br of srcRev) {
      await targetSql`
        INSERT INTO branch_reviewers (id, user_id, root_person_id, assigned_at)
        VALUES (${br.id}, ${br.user_id}, ${br.root_person_id}, ${br.assigned_at})
      `;
    }
    if (srcRev.length > 0) {
      await targetSql`SELECT setval('branch_reviewers_id_seq', COALESCE((SELECT MAX(id) FROM branch_reviewers), 1))`;
    }

    // 9. Insert Merge Requests
    for (const mr of srcMerge) {
      await targetSql`
        INSERT INTO merge_requests (
          id, primary_person_id, duplicate_person_id, status,
          requested_by_user_id, reviewed_by_user_id, created_at
        ) VALUES (
          ${mr.id}, ${mr.primary_person_id}, ${mr.duplicate_person_id}, ${mr.status},
          ${mr.requested_by_user_id}, ${mr.reviewed_by_user_id}, ${mr.created_at}
        )
      `;
    }
    if (srcMerge.length > 0) {
      await targetSql`SELECT setval('merge_requests_id_seq', COALESCE((SELECT MAX(id) FROM merge_requests), 1))`;
    }

    await localSql.end();
    await cloudSql.end();

    return NextResponse.json({
      success: true,
      message: `تمت عملية المزامنة بنجاح من ${sourceName} إلى ${targetName}`,
      counts: {
        countries: srcCountries.length,
        users: srcUsers.length,
        persons: srcPersons.length,
        relationships: srcRels.length,
        marriages: srcMarr.length,
        branch_reviewers: srcRev.length,
        merge_requests: srcMerge.length,
      },
    });
  } catch (error) {
    console.error('Error executing database sync:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'حدث خطأ أثناء عملية مزامنة قواعد البيانات' },
      { status: 500 }
    );
  }
}
