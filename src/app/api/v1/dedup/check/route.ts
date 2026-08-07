import { NextResponse } from 'next/server';
import { dbStore } from '@/lib/store';
import { findPotentialDuplicates, normalizeForDatabase } from '@/lib/dedup';
import { db } from '@/db';
import { persons as personsTable, relationships as relsTable } from '@/db/schema';
import { Person, Relationship, RelationshipType, RelationshipStatus, Gender } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birth_year, id } = body;

    const first_name = normalizeForDatabase(body.first_name);
    const father_name = normalizeForDatabase(body.father_name);
    const grand_father_name = normalizeForDatabase(body.grand_father_name);
    const family_name = normalizeForDatabase(body.family_name);

    let allPersons: Person[] = [];
    let allRelationships: Relationship[] = [];

    // Query active records directly from PostgreSQL database via Drizzle ORM
    try {
      const dbPersons = await db.select().from(personsTable);
      const dbRels = await db.select().from(relsTable);

      if (dbPersons.length > 0) {
        allPersons = dbPersons.map(p => ({
          id: p.id,
          first_name: p.first_name,
          father_name: p.father_name || undefined,
          grand_father_name: p.grand_father_name || undefined,
          family_name: p.family_name || undefined,
          gender: p.gender as Gender,
          is_alive: p.is_alive,
          birth_year: p.birth_year || undefined,
          photo_url: p.photo_url || undefined,
          created_at: p.created_at ? p.created_at.toISOString() : new Date().toISOString(),
        }));

        allRelationships = dbRels.map(r => ({
          id: r.id,
          person_id: r.person_id,
          related_person_id: r.related_person_id,
          relationship_type: r.relationship_type as RelationshipType,
          status: r.status as RelationshipStatus,
          created_at: r.created_at ? r.created_at.toISOString() : new Date().toISOString(),
        }));
      } else {
        allPersons = dbStore.getPersons();
        allRelationships = dbStore.getRelationships();
      }
    } catch (e) {
      console.error('Error fetching PostgreSQL persons in dedup check:', e);
      allPersons = dbStore.getPersons();
      allRelationships = dbStore.getRelationships();
    }

    const matches = findPotentialDuplicates(
      {
        id,
        first_name,
        father_name,
        grand_father_name,
        family_name,
        birth_year: birth_year ? parseInt(birth_year, 10) : undefined,
      },
      allPersons,
      allRelationships,
      0.55 // 55% similarity threshold
    );

    return NextResponse.json({
      hasDuplicates: matches.length > 0,
      matches,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Deduplication check error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
