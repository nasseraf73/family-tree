const postgres = require('postgres');

async function clearDatabase() {
  console.log('Clearing default seed data from family_tree_db PostgreSQL database...');
  const sql = postgres('postgresql://postgres:postgres@localhost:5432/family_tree_db');

  try {
    await sql`TRUNCATE TABLE merge_requests CASCADE`;
    await sql`TRUNCATE TABLE branch_reviewers CASCADE`;
    await sql`TRUNCATE TABLE relationships CASCADE`;
    await sql`TRUNCATE TABLE persons CASCADE`;
    
    // Reset sequence counters
    await sql`ALTER SEQUENCE persons_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE relationships_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE branch_reviewers_id_seq RESTART WITH 1`;
    await sql`ALTER SEQUENCE merge_requests_id_seq RESTART WITH 1`;

    console.log('SUCCESS: All seed persons and relationships cleared. Database is 100% clean!');
  } catch (err) {
    console.error('ERROR clearing database:', err.message);
  } finally {
    await sql.end();
  }
}

clearDatabase();
