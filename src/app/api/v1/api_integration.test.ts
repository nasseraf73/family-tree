import { describe, it, expect, afterAll } from 'vitest';
import { POST as createPersonPOST } from './persons/route';
import { POST as checkDedupPOST } from './dedup/check/route';
import { DELETE as deleteRelDELETE } from './relationships/route';
import { db } from '@/db';
import { persons as personsTable } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

describe('API Integration Tests (اختبارات التكامل والربط للـ APIs)', () => {
  afterAll(async () => {
    // Clean up test persons to prevent accumulating duplicates in the database
    try {
      await db
        .delete(personsTable)
        .where(
          and(
            eq(personsTable.first_name, 'سلمان'),
            eq(personsTable.family_name, 'الجد الأول')
          )
        );
      console.log('Cleanup: Test persons deleted successfully.');
    } catch (err) {
      console.error('Cleanup error:', err);
    }
  });
  it('يجب أن ينشئ شخصاً جذراً بنجاح عبر POST /api/v1/persons', async () => {
    const req = new Request('http://localhost:3000/api/v1/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'سلمان',
        family_name: 'الجد الأول',
        gender: 'MALE',
        is_alive: true,
      }),
    });

    const res = await createPersonPOST(req);
    expect(res.status).toBe(201);

    const data = await res.json();
    expect(data.person).toBeDefined();
    expect(data.person.first_name).toBe('سلمان');
  });

  it('يجب أن يرفض إنشاء شخص إذا كانت البيانات الإلزامية مفقودة (الاسم الأول أو الجنس)', async () => {
    const req = new Request('http://localhost:3000/api/v1/persons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        family_name: 'بدون اسم أول',
      }),
    });

    const res = await createPersonPOST(req);
    expect(res.status).toBe(400);

    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  it('يجب أن يفحص التكرارات بنجاح عبر POST /api/v1/dedup/check', async () => {
    const req = new Request('http://localhost:3000/api/v1/dedup/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'سلمان',
        family_name: 'الجد الأول',
      }),
    });

    const res = await checkDedupPOST(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.hasDuplicates).toBeDefined();
  });

  it('يجب أن يرفض حذف العلاقة بدون توفير header المصادقة x-user-email عبر DELETE /api/v1/relationships', async () => {
    const req = new Request('http://localhost:3000/api/v1/relationships', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relationship_id: 1,
      }),
    });

    const res = await deleteRelDELETE(req);
    expect(res.status).toBe(401);

    const data = await res.json();
    expect(data.error).toContain('غير مصرح');
  });
});
