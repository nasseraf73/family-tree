import { describe, it, expect } from 'vitest';
import { normalizeArabicName, calculateStringSimilarity, calculateDeduplicationScore } from './dedup';
import { Person } from '@/types';

describe('Deduplication & String Matching Tests (اختبارات خوارزميات المطابقة والتطبيع)', () => {
  it('يجب أن يطبع الأسماء العربية بالشكل الصحيح (إزالة التشكيل والهمزات والتاء المربوطة)', () => {
    expect(normalizeArabicName('أَحْمَدُ')).toBe('احمد');
    expect(normalizeArabicName('إبراهيم')).toBe('ابراهيم');
    expect(normalizeArabicName('فاطمة')).toBe('فاطمه');
    expect(normalizeArabicName('يسرى')).toBe('يسري');
  });

  it('يجب أن يحسب تشابه النصوص العربية بدقة عالية', () => {
    expect(calculateStringSimilarity('عبدالله', 'عبد الله')).toBe(1.0);
    expect(calculateStringSimilarity('أحمد', 'احمد')).toBe(1.0);
    expect(calculateStringSimilarity('محمد', 'علي')).toBeLessThan(0.4);
  });

  it('يجب أن يحسب درجة المطابقة التكرارية المركبة للأسماء والمتشابهة', () => {
    const input: Partial<Person> = {
      first_name: 'محمد',
      father_name: 'عبدالله',
      family_name: 'آل سعود',
      birth_year: 1990,
    };

    const target: Person = {
      id: 10,
      first_name: 'محمّد',
      father_name: 'عبد الله',
      family_name: 'سعود',
      birth_year: 1990,
      gender: 'MALE',
      is_alive: true,
      created_at: '',
    };

    const result = calculateDeduplicationScore(input, target, []);
    expect(result.score).toBeGreaterThanOrEqual(0.75);
  });
});
