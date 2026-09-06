import { createClient } from './client';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { User as DbUser } from '../../types';

export async function getAuthenticatedUser(request: Request): Promise<{ dbUser: DbUser | null; error: string | null }> {
  try {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { dbUser: null, error: 'Unauthorized: Missing or invalid Authorization Bearer header' };
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      return { dbUser: null, error: 'Unauthorized: Empty Bearer token' };
    }

    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user || !user.email) {
      return { dbUser: null, error: authError?.message || 'Unauthorized: Invalid token signature' };
    }

    const userEmail = user.email.trim().toLowerCase();
    const foundUsers = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);

    if (foundUsers.length === 0) {
      const defaultFullName = (user.user_metadata?.full_name as string) || userEmail.split('@')[0];
      const defaultPhone = (user.user_metadata?.phone as string) || null;

      const insertedUsers = await db.insert(users).values({
        full_name: defaultFullName,
        email: userEmail,
        phone: defaultPhone,
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

      return { dbUser: null, error: 'User record not found in database' };
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

