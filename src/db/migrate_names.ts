import { db, client } from './index';
import { persons, marriages } from './schema';
import { normalizeForDatabase } from '../lib/dedup';
import { eq } from 'drizzle-orm';

async function migrateNames() {
  console.log('Starting name migration/cleanup in PostgreSQL database...');

  // 1. Migrate Persons Table
  const allPersons = await db.select().from(persons);
  console.log(`Fetched ${allPersons.length} persons for processing...`);

  let personsUpdated = 0;
  for (const person of allPersons) {
    const originalFirst = person.first_name || '';
    const originalFather = person.father_name || '';
    const originalGrand = person.grand_father_name || '';
    const originalFamily = person.family_name || '';

    const newFirst = normalizeForDatabase(originalFirst);
    const newFather = normalizeForDatabase(originalFather);
    const newGrand = normalizeForDatabase(originalGrand);
    const newFamily = normalizeForDatabase(originalFamily);

    if (
      originalFirst !== newFirst ||
      originalFather !== newFather ||
      originalGrand !== newGrand ||
      originalFamily !== newFamily
    ) {
      await db
        .update(persons)
        .set({
          first_name: newFirst,
          father_name: newFather || null,
          grand_father_name: newGrand || null,
          family_name: newFamily || null,
        })
        .where(eq(persons.id, person.id));
      
      console.log(`Updated Person ID ${person.id}:`);
      console.log(`  Before: "${originalFirst} | ${originalFather} | ${originalGrand} | ${originalFamily}"`);
      console.log(`  After:  "${newFirst} | ${newFather} | ${newGrand} | ${newFamily}"`);
      personsUpdated++;
    }
  }

  // 2. Migrate Marriages Table (External spouse names)
  const allMarriages = await db.select().from(marriages);
  console.log(`Fetched ${allMarriages.length} marriages for processing...`);

  let marriagesUpdated = 0;
  for (const marriage of allMarriages) {
    const originalSpouse = marriage.external_spouse_name || '';
    const originalFamily = marriage.external_family_name || '';

    const newSpouse = normalizeForDatabase(originalSpouse);
    const newFamily = normalizeForDatabase(originalFamily);

    if (originalSpouse !== newSpouse || originalFamily !== newFamily) {
      await db
        .update(marriages)
        .set({
          external_spouse_name: newSpouse || null,
          external_family_name: newFamily || null,
        })
        .where(eq(marriages.id, marriage.id));
      
      console.log(`Updated Marriage ID ${marriage.id}:`);
      console.log(`  Before: "${originalSpouse} | ${originalFamily}"`);
      console.log(`  After:  "${newSpouse} | ${newFamily}"`);
      marriagesUpdated++;
    }
  }

  console.log('Migration completed successfully!');
  console.log(`Summary: Updated ${personsUpdated} persons, ${marriagesUpdated} marriages.`);
  
  // Close postgres connection client
  await client.end();
  process.exit(0);
}

migrateNames().catch(async (err) => {
  console.error('Migration error:', err);
  await client.end();
  process.exit(1);
});
