import { describe, it, expect } from 'vitest';
import { POST as requestClaim } from './claim/request/route';

describe('اختبارات نظام المطالبة وتوثيق الملفات الشخصية (Node Claiming API)', () => {
  it('يجب رفض طلب المطالبة في حال عدم تقديم person_id برمز 400', async () => {
    const req = new Request('http://localhost:3000/api/v1/claim/request', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await requestClaim(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('معرف الشخص مطلوب');
  });

  it('يجب أن يمنع المطالبة للمستخدمين غير المسجلين برمز 401', async () => {
    const req = new Request('http://localhost:3000/api/v1/claim/request', {
      method: 'POST',
      body: JSON.stringify({ person_id: 999 }),
    });

    const res = await requestClaim(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('غير مصرح');
  });
});
