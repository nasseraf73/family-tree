import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStore } from './store';

describe('اختبارات الذاكرة المحلية والاحتفاظ بالحالة (Store Synchronization & Persistence)', () => {
  let store: MemoryStore;

  beforeEach(() => {
    store = new MemoryStore();
  });

  it('يجب أن تبدأ الذاكرة بحالة فارغة كحاوٍ افتراضي', () => {
    expect(store.getPersons().length).toBe(0);
    expect(store.getUsers().length).toBe(0);
    expect(store.getRelationships().length).toBe(0);
  });

  it('يجب البحث والوصول وحذف الأشخاص بدقة من مخزن الذاكرة', () => {
    const testPerson = { id: 101, first_name: 'سعود', gender: 'MALE', is_alive: true };
    store.getPersons().push(testPerson as any);

    expect(store.getPersonById(101)).toBeDefined();
    expect(store.getPersonById(101)?.first_name).toBe('سعود');

    store.deletePerson(101);
    expect(store.getPersonById(101)).toBeUndefined();
  });
});
