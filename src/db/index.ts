import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || '';
if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn('DATABASE_URL is not set in production environment');
}

// Create Postgres client connection instance with robust timeouts
// P0.2: max raised from 5 to 20 to handle concurrent users (was bottleneck)
// prepare:false is REQUIRED when using Supabase Transaction-mode Pooler
export const client = postgres(connectionString, {
  max: 20,
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 60 * 30,
  prepare: false,
  connection: {
    application_name: 'family-tree-vps',
  },
});
export const db = drizzle(client, { schema });

