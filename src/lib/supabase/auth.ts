import { createClient } from './client';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { User as DbUser } from '../../types';

export async function getAuthenticatedUser(request: Request): Promise<{ dbUser: DbUser | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('Authorization');
    const xUserEmail = request.headers.get('x-user-email');

    let userEmail: string | undefined;

    // 1. Check custom header for local auth
    if (xUserEmail && xUserEmail.trim() !== '') {
      userEmail = xUserEmail.trim();
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabase = createClient();
      try {
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user?.email) {
          userEmail = user.email;
        }
      } catch {
        // Ignore JWT verification errors in local mode
      }
    }

    if (!userEmail) {
      return { dbUser: null, error: 'No user session or header found' };
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);

    if (foundUsers.length === 0) {
      // Auto-register user into PostgreSQL DB if user email exists but not in users table yet
      const insertedUsers = await db.insert(users).values({
        full_name: userEmail.split('@')[0],
        email: userEmail,
        role: 'USER',
      }).returning();

      if (insertedUsers.length > 0) {
        const row = insertedUsers[0];
        return {
          dbUser: {
            id: row.id,
            full_name: row.full_name,
            email: row.email,
            phone: row.phone || undefined,
            role: (row.role as 'USER' | 'REVIEWER' | 'ADMIN') || 'USER',
            created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
          },
          error: null,
        };
      }

      return { dbUser: null, error: 'User record not found in public database' };
    }

    const row = foundUsers[0];
    const userObj: DbUser = {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone || undefined,
      role: (row.role as 'USER' | 'REVIEWER' | 'ADMIN') || 'USER',
      created_at: row.created_at ? row.created_at.toISOString() : new Date().toISOString(),
    };

    return { dbUser: userObj, error: null };
  } catch (err) {
    return { dbUser: null, error: (err as Error).message };
  }
}
