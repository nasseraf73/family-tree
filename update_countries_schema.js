const postgres = require('postgres');

async function updateDb() {
  console.log('Updating DB schema for countries...');
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';
  const sql = postgres(connectionString);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS "countries" (
        "id" bigserial PRIMARY KEY NOT NULL,
        "name" varchar(100) NOT NULL,
        "code" varchar(10),
        "flag_emoji" varchar(10),
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp with time zone DEFAULT now()
      );
    `;
    await sql`
      ALTER TABLE "persons" ADD COLUMN IF NOT EXISTS "country_id" bigint REFERENCES "countries"("id") ON DELETE SET NULL;
    `;
    console.log('SUCCESS: Table countries and column country_id created/updated in PostgreSQL!');
  } catch (err) {
    console.error('NOTICE / ERROR updating schema:', err.message);
  } finally {
    await sql.end();
  }
}

updateDb();
