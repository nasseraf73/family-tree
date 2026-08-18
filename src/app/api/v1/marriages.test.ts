import { describe, it, expect } from 'vitest';
import { POST as createMarriage } from './marriages/route';

describe('اختبارات إدارة سجلات الزواج (Marriages API Endpoints)', () => {
  it('يجب أن يرفض الطلب غير المصرح به مع رمز 401 (Unauthorized Check)', async () => {
    const req = new Request('http://localhost:3000/api/v1/marriages', {
      method: 'POST',
      body: JSON.stringify({ husband_id: 1 }),
    });

    const res = await createMarriage(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain('غير مصرح');
  });
});
