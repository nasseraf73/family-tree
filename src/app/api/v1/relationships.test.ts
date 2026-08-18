import { describe, it, expect } from 'vitest';
import { DELETE as deleteRelationship } from './relationships/route';

describe('اختبارات إدارة وتنظيف العلاقات المباشرة (Relationships DELETE API)', () => {
  it('يجب أن يرفض الطلب غير المصرح به بدون رأس البريد بـ 401', async () => {
    const req = new Request('http://localhost:3000/api/v1/relationships', {
      method: 'DELETE',
      body: JSON.stringify({ relationship_id: 1 }),
    });

    const res = await deleteRelationship(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('غير مصرح');
  });

  it('يجب أن يرفض الطلب في حال غياب معرف العلاقة برمز 400', async () => {
    const req = new Request('http://localhost:3000/api/v1/relationships', {
      method: 'DELETE',
      headers: {
        'x-user-email': 'test@example.com',
      },
      body: JSON.stringify({}),
    });

    const res = await deleteRelationship(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('معرف العلاقة المطلوب حذفها مفقود');
  });
});
