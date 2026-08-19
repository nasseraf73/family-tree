import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { RelationshipType, Gender, Person, Relationship, RelationshipStatus } from '@/types';
import { checkKinshipCycle } from '@/lib/kinship';
import { getAuthenticatedUser } from '@/lib/supabase/auth';
import { normalizeForDatabase } from '@/lib/dedup';
import { db } from '@/db';
import { persons as personsTable, relationships as relsTable } from '@/db/schema';
import { eq, and, or } from 'drizzle-orm';

function formatPostgresDate(dStr: string | null | undefined): string | null {
  if (!dStr || dStr.trim() === '') return null;
  const clean = dStr.trim();
  if (clean.length === 4 && !isNaN(Number(clean))) {
    return `${clean}-01-01`;
  }
  return clean;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      gender,
      is_alive,
      birth_year,
      death_date,
      burial_place,
      country_id,
      photo_url,
      related_person_id,
      existing_person_id,
      relationship_type,
      link_mode,
    } = body;
    const cleanCountryId = country_id ? parseInt(country_id, 10) : null;

    const first_name = normalizeForDatabase(body.first_name);
    const father_name = normalizeForDatabase(body.father_name);
    const grand_father_name = normalizeForDatabase(body.grand_father_name);
    const family_name = normalizeForDatabase(body.family_name);

    const { dbUser } = await getAuthenticatedUser(request);
    const creatorUserId = dbUser ? dbUser.id : 1;

    const isAutoVerified =
      dbUser?.role === 'REVIEWER' ||
      dbUser?.role === 'ADMIN' ||
      dbUser?.role === 'REV' ||
      dbUser?.role === 'ADM';
    const status = isAutoVerified ? 'VERIFIED' : 'PENDING';

    const cleanDeathDate = !is_alive ? formatPostgresDate(death_date) : null;
    const cleanBurialPlace = !is_alive ? (burial_place || null) : null;

    // -------------------------------------------------------------
    // PHASE 1: Handle Sibling Bridging & Auto-Placeholder Parent Engine
    // -------------------------------------------------------------
    if ((relationship_type === 'SIBLING' || link_mode === 'AUTO_PARENT_BRIDGE') && related_person_id) {
      let siblingPersonId = existing_person_id;

      // If creating a new sibling person instead of linking an existing one
      if (!siblingPersonId && first_name) {
        try {
          const insPerson = await db.insert(personsTable).values({
            first_name,
            father_name: father_name || null,
            grand_father_name: grand_father_name || null,
            family_name: family_name || null,
            gender: gender || 'MALE',
            is_alive: is_alive ?? true,
            birth_year: birth_year ? parseInt(birth_year, 10) : null,
            death_date: cleanDeathDate,
            burial_place: cleanBurialPlace,
            country_id: cleanCountryId,
            photo_url: photo_url || null,
            created_by_user_id: creatorUserId,
          }).returning();
          if (insPerson.length > 0) {
            siblingPersonId = insPerson[0].id;
          }
        } catch {
          // Fallback
        }

        if (!siblingPersonId) {
          const sp = dbStore.addPerson({
            first_name,
            father_name,
            grand_father_name,
            family_name,
            gender: (gender as Gender) || 'MALE',
            is_alive: is_alive ?? true,
            birth_year: birth_year ? parseInt(birth_year, 10) : undefined,
            death_date: cleanDeathDate || undefined,
            burial_place: cleanBurialPlace || undefined,
            photo_url: photo_url || undefined,
            created_by_user_id: creatorUserId,
          });
          siblingPersonId = sp.id;
        }
      }

      if (!siblingPersonId) {
        return NextResponse.json({ error: 'لم يتم تحديد الشخص الشقيق المراد ربطه' }, { status: 400 });
      }

      // Step A: Query existing PARENT relationship for related_person_id
      let parentPersonId: number | null = null;
      try {
        const pRels = await db.select().from(relsTable).where(
          and(
            eq(relsTable.related_person_id, related_person_id),
            eq(relsTable.relationship_type, 'PARENT')
          )
        );
        if (pRels.length > 0) {
          parentPersonId = pRels[0].person_id;
        }
      } catch {
        // Fallback
      }

      // Step B: If NO Parent exists on canvas -> Create Auto-Placeholder Parent Node
      if (!parentPersonId) {
        let targetPersonObj: Person | null = null;
        try {
          const pRows = await db.select().from(personsTable).where(eq(personsTable.id, related_person_id)).limit(1);
          if (pRows.length > 0) {
            const p = pRows[0];
            targetPersonObj = {
              id: p.id,
              first_name: p.first_name,
              father_name: p.father_name || undefined,
              grand_father_name: p.grand_father_name || undefined,
              family_name: p.family_name || undefined,
              gender: p.gender as Gender,
              is_alive: p.is_alive,
              created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
            };
          }
        } catch {
          targetPersonObj = dbStore.getPersonById(related_person_id) || null;
        }

        const placeholderFirstName = targetPersonObj?.father_name || father_name || 'والد';
        const placeholderFatherName = targetPersonObj?.grand_father_name || grand_father_name || null;
        const placeholderFamilyName = targetPersonObj?.family_name || family_name || null;

        try {
          const insPlaceholder = await db.insert(personsTable).values({
            first_name: placeholderFirstName,
            father_name: placeholderFatherName,
            family_name: placeholderFamilyName,
            gender: 'MALE',
            is_alive: true,
            is_placeholder: true,
            created_by_user_id: creatorUserId,
          }).returning();

          if (insPlaceholder.length > 0) {
            parentPersonId = insPlaceholder[0].id;
          }
        } catch {
          // Fallback memory store
        }

        if (!parentPersonId) {
          const ph = dbStore.addPerson({
            first_name: placeholderFirstName,
            father_name: placeholderFatherName || undefined,
            family_name: placeholderFamilyName || undefined,
            gender: 'MALE',
            is_alive: true,
            is_placeholder: true,
            created_by_user_id: creatorUserId,
          });
          parentPersonId = ph.id;
        }

        // Create PARENT relationship between new Placeholder Father & targetPerson
        try {
          await db.insert(relsTable).values({
            person_id: parentPersonId,
            related_person_id: related_person_id,
            relationship_type: 'PARENT',
            status,
            created_by_user_id: creatorUserId,
            verified_by_user_id: isAutoVerified ? creatorUserId : null,
            verified_at: isAutoVerified ? new Date() : null,
          });
        } catch {
          dbStore.addRelationship({
            person_id: parentPersonId,
            related_person_id: related_person_id,
            relationship_type: 'PARENT',
            status,
            created_by_user_id: creatorUserId,
          });
        }
      }

      // Step C: Link Sibling Node as CHILD under parentPersonId
      let createdRel: Relationship | null = null;
      try {
        const insRel = await db.insert(relsTable).values({
          person_id: parentPersonId,
          related_person_id: siblingPersonId,
          relationship_type: 'PARENT',
          status,
          created_by_user_id: creatorUserId,
          verified_by_user_id: isAutoVerified ? creatorUserId : null,
          verified_at: isAutoVerified ? new Date() : null,
        }).returning();

        if (insRel.length > 0) {
          const r = insRel[0];
          createdRel = {
            id: r.id,
            person_id: r.person_id,
            related_person_id: r.related_person_id,
            relationship_type: r.relationship_type as RelationshipType,
            status: r.status as RelationshipStatus,
            created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          };
        }
      } catch {
        // Fallback
      }

      if (!createdRel) {
        createdRel = dbStore.addRelationship({
          person_id: parentPersonId,
          related_person_id: siblingPersonId,
          relationship_type: 'PARENT',
          status,
          created_by_user_id: creatorUserId,
        });
      }

      return NextResponse.json({
        message: 'تم ربط الإخوة بنجاح وإنشاء الوالد المشترك بالشجرة!',
        relationship: createdRel,
        linked: true,
      }, { status: 201 });
    }

    // -------------------------------------------------------------
    // PHASE 2: Handle Standard Link Existing Node Mode
    // -------------------------------------------------------------
    if (existing_person_id && related_person_id) {
      let createdRel: Relationship | null = null;
      try {
        const insertedRels = await db.insert(relsTable).values({
          person_id: existing_person_id,
          related_person_id,
          relationship_type: relationship_type as RelationshipType,
          status,
          created_by_user_id: creatorUserId,
          verified_by_user_id: isAutoVerified ? creatorUserId : null,
          verified_at: isAutoVerified ? new Date() : null,
        }).returning();

        if (insertedRels.length > 0) {
          const r = insertedRels[0];
          createdRel = {
            id: r.id,
            person_id: r.person_id,
            related_person_id: r.related_person_id,
            relationship_type: r.relationship_type as RelationshipType,
            status: r.status as RelationshipStatus,
            created_by_user_id: r.created_by_user_id || undefined,
            created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          };
        }
      } catch {
        // Fallback
      }

      if (!createdRel) {
        createdRel = dbStore.addRelationship({
          person_id: existing_person_id,
          related_person_id,
          relationship_type: relationship_type as RelationshipType,
          status,
          created_by_user_id: creatorUserId,
          verified_by_user_id: isAutoVerified ? creatorUserId : undefined,
          verified_at: isAutoVerified ? new Date().toISOString() : undefined,
        });
      }

      return NextResponse.json({
        message: 'تم ربط العلاقة مع الشخص الموجود في شجرة العائلة بنجاح!',
        relationship: createdRel,
        linked: true,
      }, { status: 201 });
    }

    if (!first_name || !gender) {
      return NextResponse.json(
        { error: 'الاسم الأول والجنس حقول مطلوبة' },
        { status: 400 }
      );
    }

    let createdPerson: Person | null = null;
    let createdRelationship: Relationship | null = null;

    // 1. If Root Person (No target person selected)
    if (!related_person_id) {
      try {
        const insertedPersons = await db.insert(personsTable).values({
          first_name,
          father_name: father_name || null,
          grand_father_name: grand_father_name || null,
          family_name: family_name || null,
          gender,
          is_alive: is_alive ?? true,
          birth_year: birth_year ? parseInt(birth_year, 10) : null,
          death_date: cleanDeathDate,
          burial_place: cleanBurialPlace,
          country_id: cleanCountryId,
          photo_url: photo_url || null,
          created_by_user_id: creatorUserId,
        }).returning();

        if (insertedPersons.length > 0) {
          const p = insertedPersons[0];
          createdPerson = {
            id: p.id,
            first_name: p.first_name,
            father_name: p.father_name || undefined,
            grand_father_name: p.grand_father_name || undefined,
            family_name: p.family_name || undefined,
            gender: p.gender as Gender,
            is_alive: p.is_alive,
            birth_year: p.birth_year || undefined,
            death_date: p.death_date || undefined,
            burial_place: p.burial_place || undefined,
            country_id: p.country_id || undefined,
            photo_url: p.photo_url || undefined,
            created_by_user_id: p.created_by_user_id || undefined,
            created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
          };
        }
      } catch (e) {
        console.error('Error inserting root person:', e);
      }

      if (!createdPerson) {
        createdPerson = dbStore.addPerson({
          first_name,
          father_name,
          grand_father_name,
          family_name,
          gender: gender as Gender,
          is_alive: is_alive ?? true,
          birth_year: birth_year ? parseInt(birth_year, 10) : undefined,
          death_date: cleanDeathDate || undefined,
          burial_place: cleanBurialPlace || undefined,
          photo_url,
          created_by_user_id: creatorUserId,
        });
      }

      return NextResponse.json({
        message: 'تم إضافة الجد/الشخص الأول في شجرة العائلة بنجاح!',
        person: createdPerson,
      }, { status: 201 });
    }

    // 2. Adding relative to existing person
    let currentPersons: Person[] = [];
    let currentRelationships: Relationship[] = [];

    try {
      const dbPersons = await db.select().from(personsTable);
      const dbRels = await db.select().from(relsTable);
      if (dbPersons.length > 0) {
        currentPersons = dbPersons.map(p => ({
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          birth_year: p.birth_year || undefined,
          death_date: p.death_date || undefined,
          burial_place: p.burial_place || undefined,
          photo_url: p.photo_url || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        }));

        currentRelationships = dbRels.map(r => ({
          id: r.id,
          person_id: r.person_id,
          related_person_id: r.related_person_id,
          relationship_type: r.relationship_type as RelationshipType,
          status: r.status as RelationshipStatus,
          created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
        }));
      } else {
        currentPersons = dbStore.getPersons();
        currentRelationships = dbStore.getRelationships();
      }
    } catch {
      currentPersons = dbStore.getPersons();
      currentRelationships = dbStore.getRelationships();
    }

    const tempNewPersonId = Date.now();
    const isCycleDetected = checkKinshipCycle(
      tempNewPersonId,
      related_person_id,
      relationship_type as RelationshipType,
      currentPersons,
      currentRelationships
    );

    if (isCycleDetected) {
      return NextResponse.json(
        { error: 'حظر النظام: تمت رصد حلقة نسب دائرية غير منطقية (Circular Kinship Loop)! لا يمكن إضافة هذه العلاقة.' },
        { status: 422 }
      );
    }

    // Persist to PostgreSQL database via Drizzle ORM
    try {
      const insertedPersons = await db.insert(personsTable).values({
        first_name,
        father_name: father_name || null,
        grand_father_name: grand_father_name || null,
        family_name: family_name || null,
        gender,
        is_alive: is_alive ?? true,
        birth_year: birth_year ? parseInt(birth_year, 10) : null,
        death_date: cleanDeathDate,
        burial_place: cleanBurialPlace,
        country_id: cleanCountryId,
        photo_url: photo_url || null,
        created_by_user_id: creatorUserId,
      }).returning();

      if (insertedPersons.length > 0) {
        const p = insertedPersons[0];
        createdPerson = {
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          birth_year: p.birth_year || undefined,
          death_date: p.death_date || undefined,
          burial_place: p.burial_place || undefined,
          country_id: p.country_id || undefined,
          photo_url: p.photo_url || undefined,
          created_by_user_id: p.created_by_user_id || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        };

        const insertedRels = await db.insert(relsTable).values({
          person_id: p.id,
          related_person_id,
          relationship_type,
          status,
          created_by_user_id: creatorUserId,
          verified_by_user_id: isAutoVerified ? creatorUserId : null,
          verified_at: isAutoVerified ? new Date() : null,
        }).returning();

        if (insertedRels.length > 0) {
          const r = insertedRels[0];
          createdRelationship = {
            id: r.id,
            person_id: r.person_id,
            related_person_id: r.related_person_id,
            relationship_type: r.relationship_type as RelationshipType,
            status: r.status as RelationshipStatus,
            created_by_user_id: r.created_by_user_id || undefined,
            created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.error('Error inserting relative person:', e);
    }

    if (!createdPerson) {
      createdPerson = dbStore.addPerson({
        first_name,
        father_name,
        grand_father_name,
        family_name,
        gender: gender as Gender,
        is_alive: is_alive ?? true,
        birth_year: birth_year ? parseInt(birth_year, 10) : undefined,
        death_date: cleanDeathDate || undefined,
        burial_place: cleanBurialPlace || undefined,
        photo_url,
        created_by_user_id: creatorUserId,
      });

      createdRelationship = dbStore.addRelationship({
        person_id: createdPerson.id,
        related_person_id,
        relationship_type: relationship_type as RelationshipType,
        status,
        created_by_user_id: creatorUserId,
        verified_by_user_id: isAutoVerified ? creatorUserId : undefined,
        verified_at: isAutoVerified ? new Date().toISOString() : undefined,
      });
    }

    return NextResponse.json({
      message: status === 'VERIFIED' ? 'تمت إضافة القريب واعتماد العلاقة بنجاح' : 'تمت إضافة القريب وبانتظار اعتماد مشرف الفرع',
      person: createdPerson,
      relationship: createdRelationship,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      gender,
      is_alive,
      birth_year,
      death_date,
      burial_place,
      country_id,
      biography,
      photo_url,
    } = body;

    const first_name = normalizeForDatabase(body.first_name);
    const father_name = normalizeForDatabase(body.father_name);
    const grand_father_name = normalizeForDatabase(body.grand_father_name);
    const family_name = normalizeForDatabase(body.family_name);

    if (!id || !first_name) {
      return NextResponse.json({ error: 'معرف الشخص والاسم الأول حقول مطلوبة' }, { status: 400 });
    }

    const { dbUser } = await getAuthenticatedUser(request);

    // 1. Fetch person to verify ownership / authorization
    let existingPerson: Person | null = null;
    try {
      const pRows = await db.select().from(personsTable).where(eq(personsTable.id, id)).limit(1);
      if (pRows.length > 0) {
        const p = pRows[0];
        existingPerson = {
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          photo_url: p.photo_url || undefined,
          created_by_user_id: p.created_by_user_id || undefined,
          claimed_by_user_id: p.claimed_by_user_id || undefined,
          claim_status: (p.claim_status as 'PENDING' | 'APPROVED' | 'REJECTED') || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      existingPerson = dbStore.getPersonById(id) || null;
    }

    if (!existingPerson) {
      return NextResponse.json({ error: 'الشخص غير موجود بالمنظومة' }, { status: 404 });
    }

    // Authorization verification
    const isCreator = dbUser && (
      !existingPerson.created_by_user_id ||
      existingPerson.created_by_user_id === dbUser.id ||
      existingPerson.created_by_user_id === 1
    );
    const isClaimer = dbUser && existingPerson.claimed_by_user_id === dbUser.id;
    const isSteward = dbUser && (
      dbUser.role === 'REVIEWER' ||
      dbUser.role === 'ADMIN' ||
      dbUser.role === 'REV' ||
      dbUser.role === 'ADM'
    );

    if (!isCreator && !isClaimer && !isSteward) {
      return NextResponse.json(
        { error: 'عذراً، ليس لديك صلاحية تعديل بيانات هذا الشخص. فقط المُنِشئ، أو صاحب الملف، أو مشرف الفرع يحق لهم التعديل.' },
        { status: 403 }
      );
    }

    const cleanDeathDate = !is_alive ? formatPostgresDate(death_date) : null;

    const cleanCountryId = country_id !== undefined ? (country_id ? parseInt(country_id, 10) : null) : undefined;

    // 2. Persist update in PostgreSQL DB via Drizzle ORM
    let updatedPerson: Person | null = null;
    try {
      const updatedRows = await db.update(personsTable)
        .set({
          first_name,
          father_name: father_name || null,
          grand_father_name: grand_father_name || null,
          family_name: family_name || null,
          gender,
          is_alive: is_alive ?? true,
          birth_year: birth_year ? parseInt(birth_year, 10) : null,
          death_date: cleanDeathDate,
          burial_place: burial_place || null,
          ...(cleanCountryId !== undefined && { country_id: cleanCountryId }),
          biography: biography || null,
          photo_url: photo_url !== undefined ? photo_url : undefined,
        })
        .where(eq(personsTable.id, id))
        .returning();

      if (updatedRows.length > 0) {
        const p = updatedRows[0];
        updatedPerson = {
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          birth_year: p.birth_year || undefined,
          death_date: p.death_date || undefined,
          burial_place: p.burial_place || undefined,
          country_id: p.country_id || undefined,
          photo_url: p.photo_url || undefined,
          biography: p.biography || undefined,
          created_by_user_id: p.created_by_user_id || undefined,
          claimed_by_user_id: p.claimed_by_user_id || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        };
      }
    } catch (e) {
      console.error('Error updating person in PostgreSQL:', e);
    }

    // Memory Store update fallback
    const storePerson = dbStore.getPersonById(id);
    if (storePerson) {
      storePerson.first_name = first_name;
      if (father_name !== undefined) storePerson.father_name = father_name;
      if (grand_father_name !== undefined) storePerson.grand_father_name = grand_father_name;
      if (family_name !== undefined) storePerson.family_name = family_name;
      if (gender !== undefined) storePerson.gender = gender;
      if (is_alive !== undefined) storePerson.is_alive = is_alive;
      if (birth_year !== undefined) storePerson.birth_year = birth_year ? parseInt(birth_year, 10) : undefined;
      storePerson.death_date = cleanDeathDate || undefined;
      if (burial_place !== undefined) storePerson.burial_place = burial_place;
      if (biography !== undefined) storePerson.biography = biography;
      if (photo_url !== undefined) storePerson.photo_url = photo_url;
      if (!updatedPerson) updatedPerson = storePerson;
    }

    return NextResponse.json({
      message: 'تم تحديث بيانات الشخص بنجاح',
      person: updatedPerson,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const personIdParam = searchParams.get('id');
    const personId = personIdParam ? parseInt(personIdParam, 10) : null;

    if (!personId) {
      return NextResponse.json({ error: 'معرف الشخص المطلوب حذفه مفقود' }, { status: 400 });
    }

    const { dbUser } = await getAuthenticatedUser(request);
    if (!dbUser) {
      return NextResponse.json(
        { error: 'غير مصرح: يرجى تسجيل الدخول أولاً لحذف هذا الشخص' },
        { status: 401 }
      );
    }

    // Verify ownership / RBAC permission before deleting
    let existingPerson: Person | null = null;
    try {
      const pRows = await db.select().from(personsTable).where(eq(personsTable.id, personId)).limit(1);
      if (pRows.length > 0) {
        const p = pRows[0];
        existingPerson = {
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          created_by_user_id: p.created_by_user_id || undefined,
          claimed_by_user_id: p.claimed_by_user_id || undefined,
          claim_status: (p.claim_status as 'PENDING' | 'APPROVED' | 'REJECTED') || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        };
      }
    } catch {
      existingPerson = dbStore.getPersonById(personId) || null;
    }

    if (!existingPerson) {
      return NextResponse.json({ error: 'الشخص المطلوب حذفه غير موجود' }, { status: 404 });
    }

    const isCreator = existingPerson.created_by_user_id === dbUser.id || existingPerson.created_by_user_id === 1;
    const isSteward =
      dbUser.role === 'REVIEWER' ||
      dbUser.role === 'ADMIN' ||
      dbUser.role === 'REV' ||
      dbUser.role === 'ADM';

    if (!isCreator && !isSteward) {
      return NextResponse.json(
        { error: 'عذراً، ليس لديك صلاحية لحذف بطاقة هذا الشخص. فقط المُنشئ أو مشرف الفرع يحق له الحذف.' },
        { status: 403 }
      );
    }

    // 1. Delete connected relationships from relationships table
    try {
      await db.delete(relsTable).where(
        or(eq(relsTable.person_id, personId), eq(relsTable.related_person_id, personId))
      );
    } catch {
      // Fallback
    }

    // 2. Delete person record from persons table
    try {
      await db.delete(personsTable).where(eq(personsTable.id, personId));
    } catch (e) {
      console.error('Error deleting person from DB:', e);
    }

    // Also remove from Memory Store
    dbStore.deletePerson(personId);

    return NextResponse.json({
      success: true,
      message: 'تم حذف بطاقة الشخص من الشجرة بنجاح',
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
