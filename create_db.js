const postgres = require('postgres');

async function createDb() {
  const sql = postgres('postgresql://postgres:postgres@localhost:5432/postgres');
  try {
    await sql`CREATE DATABASE family_tree_db`;
    console.log('SUCCESS: Database family_tree_db created successfully!');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('NOTICE: Database family_tree_db already exists.');
    } else {
      console.error('ERROR: Could not create database:', err.message);
    }
  } finally {
    await sql.end();
  }
}

createDb();
