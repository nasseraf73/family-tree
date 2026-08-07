import { describe, it, expect } from 'vitest';
import { POST as executeMerge } from './review/merge/route';

describe('اختبارات مراجعة الفروع ودمج العقد المكررة (Branch Review & Merge Requests API)', () => {
  it('يجب رفض طلب الدمج دون معرف الطلب برمز 400', async () => {
    const req = new Request('http://localhost:3000/api/v1/review/merge', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await executeMerge(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('معرف طلب الدمج مطلوب');
  });

  it('يجب حظر طلبات الدمج للمستخدمين غير المسجلين برمز 401', async () => {
    const req = new Request('http://localhost:3000/api/v1/review/merge', {
      method: 'POST',
      body: JSON.stringify({ merge_request_id: 1 }),
    });

    const res = await executeMerge(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('غير مصرح');
  });
});
