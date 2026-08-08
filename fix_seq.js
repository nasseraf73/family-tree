const postgres = require('postgres');

async function fixSequence() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';
  const sql = postgres(connectionString);
  try {
    await sql`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1) + 10)`;
    await sql`SELECT setval('persons_id_seq', COALESCE((SELECT MAX(id) FROM persons), 1) + 10)`;
    await sql`SELECT setval('relationships_id_seq', COALESCE((SELECT MAX(id) FROM relationships), 1) + 10)`;
    await sql`SELECT setval('branch_reviewers_id_seq', COALESCE((SELECT MAX(id) FROM branch_reviewers), 1) + 10)`;
    await sql`SELECT setval('merge_requests_id_seq', COALESCE((SELECT MAX(id) FROM merge_requests), 1) + 10)`;
    console.log('SUCCESS: All PostgreSQL primary key sequences synced successfully!');
  } catch (err) {
    console.error('ERROR syncing sequences:', err.message);
  } finally {
    await sql.end();
  }
}

fixSequence();
