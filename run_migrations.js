const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

async function runMigrations() {
  console.log('Connecting to Supabase PostgreSQL database to create tables...');
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';
  const sql = postgres(connectionString);

  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, 'drizzle/0000_gifted_rattler.sql'), 'utf8');
    const statements = migrationSql.split('--> statement-breakpoint');

    for (const stmt of statements) {
      const cleanStmt = stmt.trim();
      if (cleanStmt) {
        await sql.unsafe(cleanStmt);
      }
    }

    console.log('SUCCESS: All 5 tables created in PostgreSQL database family_tree_db!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('NOTICE: Tables already exist in database.');
    } else {
      console.error('ERROR during migration:', err.message);
    }
  } finally {
    await sql.end();
  }
}

runMigrations();
