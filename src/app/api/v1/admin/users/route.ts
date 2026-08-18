import { NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dbStore } from '@/lib/store';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

async function verifyAdminUser(request: Request) {
  const { dbUser } = await getAuthenticatedUser(request);
  if (!dbUser) {
    return { authorized: false, error: 'يرجى تسجيل الدخول أولاً كمدير نظام (ADMIN)', status: 401 };
  }

  const isAdmin = dbUser.role === 'ADMIN' || dbUser.role === 'ADM';
  if (!isAdmin) {
    return {
      authorized: false,
      error: 'عفواً، الإطلاع والتحكم بأسماء وإضافة وصلاحيات المشرفين حصرية فقط لمدير النظام (ADMIN)',
      status: 403,
    };
  }

  return { authorized: true, dbUser };
}

// GET /api/v1/admin/users - Get list of all users & stewards (ADMIN ONLY)
export async function GET(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const dbUsers = await db
      .select({
        id: users.id,
        full_name: users.full_name,
        email: users.email,
        phone: users.phone,
        role: users.role,
        created_at: users.created_at,
      })
      .from(users);

    if (dbUsers.length > 0) {
      return NextResponse.json({ users: dbUsers });
    }
  } catch (err) {
    console.error('DB fetch users failed', err);
  }

  // Fallback memory store users
  const storeUsers = dbStore.getUsers();
  return NextResponse.json({ users: storeUsers });
}

// POST /api/v1/admin/users - Add a new steward or user (ADMIN ONLY)
export async function POST(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { email, full_name, phone, role } = body;

    if (!email || !full_name) {
      return NextResponse.json({ error: 'البريد الإلكتروني والاسم مطلوبان' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFullName = full_name.trim();
    const userRole = role === 'ADMIN' || role === 'REVIEWER' ? role : 'USER';

    try {
      const existing = await db.select().from(users).where(eq(users.email, cleanEmail)).limit(1);
      if (existing.length > 0) {
        // Update existing user role if already exists
        const updated = await db
          .update(users)
          .set({
            role: userRole,
            full_name: cleanFullName,
            phone: phone ? phone.trim() : existing[0].phone,
          })
          .where(eq(users.email, cleanEmail))
          .returning();

        return NextResponse.json({ message: 'تم تحديث بيانات وتعيين دور المشرف بنجاح', user: updated[0] });
      }

      const inserted = await db
        .insert(users)
        .values({
          full_name: cleanFullName,
          email: cleanEmail,
          phone: phone ? phone.trim() : null,
          role: userRole,
        })
        .returning();

      return NextResponse.json({ message: 'تمت إضافة المشرف الجديد بنجاح', user: inserted[0] });
    } catch {
      // Memory store fallback
      const newUser = {
        id: Date.now(),
        full_name: cleanFullName,
        email: cleanEmail,
        phone: phone || undefined,
        role: userRole as any,
        created_at: new Date().toISOString(),
      };
      dbStore.getUsers().push(newUser);
      return NextResponse.json({ message: 'تمت إضافة المشرف بنجاح', user: newUser });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'فشلت إضافة المشرف' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/users - Update steward role or info (ADMIN ONLY)
export async function PATCH(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const { user_id, role, full_name, phone } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 });
    }

    const uId = Number(user_id);

    try {
      const updateData: any = {};
      if (role) updateData.role = role;
      if (full_name) updateData.full_name = full_name.trim();
      if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;

      const updated = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, uId))
        .returning();

      if (updated.length > 0) {
        return NextResponse.json({ message: 'تم تعديل دور/بيانات المشرف بنجاح', user: updated[0] });
      }
    } catch {
      // Memory fallback
      const storeUser = dbStore.getUsers().find((u) => u.id === uId);
      if (storeUser) {
        if (role) storeUser.role = role;
        if (full_name) storeUser.full_name = full_name;
        if (phone !== undefined) storeUser.phone = phone;
        return NextResponse.json({ message: 'تم تعديل دور المشرف بنجاح', user: storeUser });
      }
    }

    return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'فشل التعديل' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/users - Delete a user or steward (ADMIN ONLY)
export async function DELETE(request: Request) {
  const auth = await verifyAdminUser(request);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id');

    if (!rawId) {
      return NextResponse.json({ error: 'معرف المشرف مطلوب للحذف' }, { status: 400 });
    }

    const uId = Number(rawId);

    try {
      await db.delete(users).where(eq(users.id, uId));
      return NextResponse.json({ message: 'تم حذف المشرف/المستخدم بنجاح' });
    } catch {
      // Memory store fallback
      const idx = dbStore.getUsers().findIndex((u) => u.id === uId);
      if (idx !== -1) {
        dbStore.getUsers().splice(idx, 1);
      }
      return NextResponse.json({ message: 'تم حذف المشرف بنجاح' });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'فشل الحذف' }, { status: 500 });
  }
}
