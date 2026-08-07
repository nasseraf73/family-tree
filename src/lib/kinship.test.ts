import { describe, it, expect } from 'vitest';
import { detectCircularLoop, getAncestors, getDescendants, deriveKinship } from './kinship';
import { Person, Relationship } from '@/types';

describe('Kinship & Cycle Detection Tests (اختبارات خوارزميات النسب ومنع الحلقات)', () => {
  // إعداد بيانات عائلة تجريبية:
  // 1: الجد (أحمد)
  // 2: الأب (محمد - ابن أحمد)
  // 3: الابن (خالد - ابن محمد)
  // 4: الابن الثاني (عمر - ابن محمد)
  const persons: Person[] = [
    { id: 1, first_name: 'أحمد', gender: 'MALE', is_alive: true, created_at: '' },
    { id: 2, first_name: 'محمد', father_name: 'أحمد', gender: 'MALE', is_alive: true, created_at: '' },
    { id: 3, first_name: 'خالد', father_name: 'محمد', gender: 'MALE', is_alive: true, created_at: '' },
    { id: 4, first_name: 'عمر', father_name: 'محمد', gender: 'MALE', is_alive: true, created_at: '' },
  ];

  const personsMap = new Map<number, Person>(persons.map(p => [p.id, p]));

  const relationships: Relationship[] = [
    { id: 101, person_id: 2, related_person_id: 1, relationship_type: 'PARENT', status: 'VERIFIED', created_at: '' }, // 2 ابن 1
    { id: 102, person_id: 3, related_person_id: 2, relationship_type: 'PARENT', status: 'VERIFIED', created_at: '' }, // 3 ابن 2
    { id: 103, person_id: 4, related_person_id: 2, relationship_type: 'PARENT', status: 'VERIFIED', created_at: '' }, // 4 ابن 2
  ];

  it('يجب أن يكتشف الحلقة الدائرية إذا حاولنا جعل الجد (1) ابناً للحفيد (3)', () => {
    // حاول إضافة 1 كـ CHILD لـ 3 (يعني 3 أب لـ 1)
    const result = detectCircularLoop(1, 3, 'PARENT', relationships);
    expect(result.isCircular).toBe(true);
  });

  it('يجب أن يكتشف الحلقة الدائرية إذا أضيف الشخص كنفسه', () => {
    const result = detectCircularLoop(1, 1, 'PARENT', relationships);
    expect(result.isCircular).toBe(true);
  });

  it('يجب أن يسمح بإضافة علاقة شرعية غير دائرية', () => {
    // إضافة ابن جديد (5) للأب (2)
    const result = detectCircularLoop(5, 2, 'PARENT', relationships);
    expect(result.isCircular).toBe(false);
  });

  it('يجب أن يحسب كل الأجداد بشكل صحيح', () => {
    const ancestorsOfKhalid = getAncestors(3, relationships);
    expect(ancestorsOfKhalid.has(2)).toBe(true); // محمد
    expect(ancestorsOfKhalid.has(1)).toBe(true); // أحمد
    expect(ancestorsOfKhalid.size).toBe(2);
  });

  it('يجب أن يحسب كل الأحفاد بشكل صحيح', () => {
    const descendantsOfAhmed = getDescendants(1, relationships);
    expect(descendantsOfAhmed.has(2)).toBe(true);
    expect(descendantsOfAhmed.has(3)).toBe(true);
    expect(descendantsOfAhmed.has(4)).toBe(true);
    expect(descendantsOfAhmed.size).toBe(3);
  });

  it('يجب أن يشتق الإخوة تلقائياً', () => {
    const derived = deriveKinship(3, personsMap, relationships);
    expect(derived.siblings.length).toBe(1);
    expect(derived.siblings[0].id).toBe(4); // عمر هو أخو خالد
  });
});
