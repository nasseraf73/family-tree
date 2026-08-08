const postgres = require('postgres');

async function checkPersons() {
  const sql = postgres('postgresql://postgres:postgres@localhost:5432/family_tree_db');
  try {
    const persons = await sql`SELECT id, first_name, father_name, grand_father_name, family_name FROM persons ORDER BY id`;
    const rels = await sql`SELECT COUNT(*) FROM relationships`;
    const marr = await sql`SELECT COUNT(*) FROM marriages`;
    console.log('LOCAL_PERSONS_COUNT:', persons.length);
    console.log('LOCAL_PERSONS_SAMPLE:', JSON.stringify(persons.slice(0, 30), null, 2));
    console.log('LOCAL_RELS_COUNT:', rels[0].count);
    console.log('LOCAL_MARR_COUNT:', marr[0].count);
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await sql.end();
  }
}

checkPersons();
