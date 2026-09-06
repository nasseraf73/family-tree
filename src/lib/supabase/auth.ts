import { createClient } from './client';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { User as DbUser } from '../../types';

// P2.3: Per-request deduplication using WeakMap.
// Multiple calls to getAuthenticatedUser() in the same request share one
// Supabase call + one DB query. Uses a WeakMap on the Request object so
// the cache auto-cleans when the request is garbage collected.
const inflightAuth = new WeakMap<Request, Promise<{ dbUser: DbUser | null; error: string | null }>>();

export async function getAuthenticatedUser(request: Request): Promise<{ dbUser: DbUser | null; error: string | null }> {
  // Reuse in-flight result for the same request object
  const inflight = inflightAuth.get(request);
  if (inflight) return inflight;

  const promise = (async (): Promise<{ dbUser: DbUser | null; error: string | null }> => {
  try {
    const authHeader = request.headers.get('Authorization');
    const xUserEmail = request.headers.get('x-user-email');

    let userEmail: string | undefined;
    let resolvedUser: any = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      if (token) {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser(token);
          if (user?.email) {
            resolvedUser = user;
            userEmail = user.email.trim().toLowerCase();
          }
        } catch {
          // Token verification fallback
        }
      }
    }

    // Fallback to x-user-email header
    if (!userEmail && xUserEmail && xUserEmail.trim() !== '') {
      userEmail = xUserEmail.trim().toLowerCase();
    }

    if (!userEmail) {
      return { dbUser: null, error: 'Unauthorized: Missing or invalid authorization' };
    }

    const foundUsers = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);

    if (foundUsers.length === 0) {
      const defaultFullName = (resolvedUser?.user_metadata?.full_name as string) || userEmail.split('@')[0];
      const defaultPhone = (resolvedUser?.user_metadata?.phone as string) || null;

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
  })();

  inflightAuth.set(request, promise);
  return promise;
}