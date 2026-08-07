import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set in production environment');
}

// Create Postgres client connection instance with robust timeouts
export const client = postgres(connectionString, {
  max: 5,
  idle_timeout: 20,
  connect_timeout: 10,
  max_lifetime: 60 * 10,
});
export const db = drizzle(client, { schema });

