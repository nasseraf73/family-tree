import { describe, it, expect } from 'vitest';
import { calculateTreeAnalytics } from './treeAnalytics';
import { filterTreeByFocus } from './treeFilter';
import { Person, Relationship } from '../types';

describe('اختبارات تحليلات وتصفية الشجرة (Tree Analytics & Filtering Engine)', () => {
  const now = new Date().toISOString();
  const samplePersons: Person[] = [
    { id: 1, first_name: 'محمد', father_name: 'علي', grand_father_name: 'حسن', family_name: 'العلي', gender: 'MALE', is_alive: true, birth_year: 1950, created_at: now },
    { id: 2, first_name: 'فاطمة', father_name: 'سعد', grand_father_name: 'عمر', family_name: 'السعد', gender: 'FEMALE', is_alive: true, birth_year: 1955, created_at: now },
    { id: 3, first_name: 'أحمد', father_name: 'محمد', grand_father_name: 'علي', family_name: 'العلي', gender: 'MALE', is_alive: true, birth_year: 1980, created_at: now },
    { id: 4, first_name: 'سارة', father_name: 'محمد', grand_father_name: 'علي', family_name: 'العلي', gender: 'FEMALE', is_alive: true, birth_year: 1985, created_at: now },
    { id: 5, first_name: 'علي', father_name: 'حسن', grand_father_name: 'خالد', family_name: 'العلي', gender: 'MALE', is_alive: false, birth_year: 1920, created_at: now },
  ];

  const sampleRelationships: Relationship[] = [
    { id: 1, person_id: 1, related_person_id: 3, relationship_type: 'CHILD', status: 'VERIFIED', created_at: now },
    { id: 2, person_id: 1, related_person_id: 4, relationship_type: 'CHILD', status: 'VERIFIED', created_at: now },
    { id: 3, person_id: 5, related_person_id: 1, relationship_type: 'CHILD', status: 'VERIFIED', created_at: now },
  ];

  it('يجب حساب الإحصائيات الديموغرافية بدقة (Demographics Calculation)', () => {
    const result = calculateTreeAnalytics(samplePersons, sampleRelationships);
    
    expect(result.demographics.totalMembers).toBe(5);
    expect(result.demographics.malesCount).toBe(3);
    expect(result.demographics.femalesCount).toBe(2);
    expect(result.demographics.livingCount).toBe(4);
    expect(result.demographics.deceasedCount).toBe(1);
    expect(result.demographics.malesPct).toBe(60);
    expect(result.demographics.femalesPct).toBe(40);
  });

  it('يجب التعرف على أكبر الأفراد حياً والأسماء الأكثر تكراراً وأكبر الفروع حسب الأجيال', () => {
    const result = calculateTreeAnalytics(samplePersons, sampleRelationships);

    expect(result.records.oldestLiving.person).not.toBeNull();
    expect(result.records.oldestLiving.person?.id).toBe(1); // 1950 is oldest living
    expect(result.generational.topMaleNames[0].name).toBe('محمد');

    // Gen 2 branch test (Node 1 "محمد" is Gen 2, child of Node 5 "علي")
    expect(result.records.largestBranchGen2.person?.id).toBe(1);
    expect(result.records.largestBranchGen2.valueText).toBe('3 فرد');
  });

  it('يجب تصفية الشجرة بناءً على النمط والتركيز (Tree Focus Filtering)', () => {
    // Branch mode focused on node 1
    const filtered = filterTreeByFocus(samplePersons, sampleRelationships, 1, 'branch');
    
    expect(filtered.includedNodeIds.has(1)).toBe(true);
    expect(filtered.includedNodeIds.has(3)).toBe(true);
    expect(filtered.includedNodeIds.has(4)).toBe(true);
  });

});
