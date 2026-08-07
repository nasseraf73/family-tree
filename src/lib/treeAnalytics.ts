import { Person, Relationship } from '../types';

export interface DemographicsData {
  totalMembers: number;
  malesCount: number;
  femalesCount: number;
  malesPct: number;
  femalesPct: number;
  livingCount: number;
  deceasedCount: number;
  livingPct: number;
  deceasedPct: number;
  marriedCount: number;
  singleCount: number;
  totalSpouses: number;
}

export interface RecordHolder<T = Person> {
  person: T | null;
  valueText: string;
  metricLabel: string;
  subText?: string;
}

export interface NameFrequency {
  name: string;
  count: number;
  percentage: number;
}

export interface TreeAnalyticsResult {
  demographics: DemographicsData;
  records: {
    oldestLiving: RecordHolder;
    largestBranch: RecordHolder;
    mostOffspring: RecordHolder;
    mostSpouses: RecordHolder;
    newestMember: RecordHolder;
  };
  generational: {
    maxDepth: number;
    avgChildrenPerFamily: number;
    topMaleNames: NameFrequency[];
    topFemaleNames: NameFrequency[];
  };
}

/**
 * Computes complete client-side demographic, record, generational, and name statistics for a family tree dataset.
 */
export function calculateTreeAnalytics(
  persons: Person[],
  relationships: Relationship[]
): TreeAnalyticsResult {
  const totalMembers = persons.length;
  if (totalMembers === 0) {
    return {
      demographics: {
        totalMembers: 0,
        malesCount: 0,
        femalesCount: 0,
        malesPct: 0,
        femalesPct: 0,
        livingCount: 0,
        deceasedCount: 0,
        livingPct: 0,
        deceasedPct: 0,
        marriedCount: 0,
        singleCount: 0,
        totalSpouses: 0,
      },
      records: {
        oldestLiving: { person: null, valueText: 'لا يوجد', metricLabel: 'عميد العائلة' },
        largestBranch: { person: null, valueText: '0 فرد', metricLabel: 'أكبر فرع' },
        mostOffspring: { person: null, valueText: '0 أطفال', metricLabel: 'الأكثر إنجاباً' },
        mostSpouses: { person: null, valueText: '0 زوجات', metricLabel: 'الأكثر زواجاً' },
        newestMember: { person: null, valueText: 'لا يوجد', metricLabel: 'أحدث مولود' },
      },
      generational: {
        maxDepth: 0,
        avgChildrenPerFamily: 0,
        topMaleNames: [],
        topFemaleNames: [],
      },
    };
  }

  // 1. Demographics Calculations
  const malesCount = persons.filter((p) => p.gender === 'MALE').length;
  const femalesCount = persons.filter((p) => p.gender === 'FEMALE').length;
  const malesPct = Math.round((malesCount / totalMembers) * 100);
  const femalesPct = Math.round((femalesCount / totalMembers) * 100);

  const livingCount = persons.filter((p) => p.is_alive).length;
  const deceasedCount = totalMembers - livingCount;
  const livingPct = Math.round((livingCount / totalMembers) * 100);
  const deceasedPct = Math.round((deceasedCount / totalMembers) * 100);

  // Marital counts
  let totalSpousesCount = 0;
  const marriedPersonsSet = new Set<number>();

  persons.forEach((p) => {
    const spouseList = (p as any).spouses || [];
    if (spouseList.length > 0) {
      marriedPersonsSet.add(p.id);
      totalSpousesCount += spouseList.length;
    }
  });

  // Also check spouse relationships
  relationships.forEach((r) => {
    if (r.relationship_type === 'SPOUSE' && r.status !== 'REJECTED') {
      marriedPersonsSet.add(r.person_id);
      marriedPersonsSet.add(r.related_person_id);
    }
  });

  const marriedCount = marriedPersonsSet.size;
  const singleCount = Math.max(0, totalMembers - marriedCount);

  // 2. Offspring map calculation (Parent -> Children)
  const offspringMap = new Map<number, Set<number>>();
  const parentMap = new Map<number, Set<number>>();

  relationships.forEach((r) => {
    if (r.status === 'REJECTED' || r.person_id === r.related_person_id) return;

    let parentId: number | null = null;
    let childId: number | null = null;

    if (r.relationship_type === 'PARENT') {
      parentId = r.related_person_id;
      childId = r.person_id;
    } else if (r.relationship_type === 'CHILD') {
      parentId = r.person_id;
      childId = r.related_person_id;
    }

    if (parentId !== null && childId !== null) {
      if (!offspringMap.has(parentId)) offspringMap.set(parentId, new Set());
      offspringMap.get(parentId)!.add(childId);

      if (!parentMap.has(childId)) parentMap.set(childId, new Set());
      parentMap.get(childId)!.add(parentId);
    }
  });

  // 3. Records Calculations

  // A. Oldest Living Member (عميد العائلة)
  const livingWithBirthYear = persons.filter((p) => p.is_alive && p.birth_year && p.birth_year > 1800);
  livingWithBirthYear.sort((a, b) => (a.birth_year || 9999) - (b.birth_year || 9999));
  const oldestPerson = livingWithBirthYear.length > 0 ? livingWithBirthYear[0] : null;

  // B. Newest Member (أحدث مولود)
  const allWithBirthYear = [...persons].filter((p) => p.birth_year && p.birth_year > 1800);
  allWithBirthYear.sort((a, b) => (b.birth_year || 0) - (a.birth_year || 0));
  const newestPerson = allWithBirthYear.length > 0 ? allWithBirthYear[0] : null;

  // C. Most Offspring (أكثر شخص لديه أبناء وبنات)
  let maxOffspringCount = 0;
  let mostOffspringPerson: Person | null = null;

  persons.forEach((p) => {
    const childrenCount = offspringMap.get(p.id)?.size || 0;
    if (childrenCount > maxOffspringCount) {
      maxOffspringCount = childrenCount;
      mostOffspringPerson = p;
    }
  });

  // D. Most Spouses (أكثر شخص تعدد للزوجات)
  let maxSpouseCount = 0;
  let mostSpousesPerson: Person | null = null;

  persons.forEach((p) => {
    const spousesArr = (p as any).spouses || [];
    const count = spousesArr.length;
    if (count > maxSpouseCount) {
      maxSpouseCount = count;
      mostSpousesPerson = p;
    }
  });

  // E. Largest Root Branch (أكبر فرع في العائلة)
  const rootAncestors = persons.filter((p) => !parentMap.has(p.id) || parentMap.get(p.id)!.size === 0);

  let largestBranchRoot: Person | null = null;
  let maxDescendantCount = 0;

  rootAncestors.forEach((root) => {
    const visitedSet = new Set<number>([root.id]);
    const queue = [root.id];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = offspringMap.get(currentId);
      if (children) {
        children.forEach((cId) => {
          if (!visitedSet.has(cId)) {
            visitedSet.add(cId);
            queue.push(cId);
          }
        });
      }
    }

    const descendantCount = visitedSet.size;
    if (descendantCount > maxDescendantCount) {
      maxDescendantCount = descendantCount;
      largestBranchRoot = root;
    }
  });

  // 4. Generational Calculations & Max Depth
  const depthMemo = new Map<number, number>();

  function getNodeDepth(personId: number, visited = new Set<number>()): number {
    if (depthMemo.has(personId)) return depthMemo.get(personId)!;
    if (visited.has(personId)) return 1;

    visited.add(personId);
    const parents = parentMap.get(personId);
    if (!parents || parents.size === 0) {
      depthMemo.set(personId, 1);
      return 1;
    }

    let maxParentDepth = 0;
    parents.forEach((pId) => {
      const d = getNodeDepth(pId, new Set(visited));
      if (d > maxParentDepth) maxParentDepth = d;
    });

    const depth = maxParentDepth + 1;
    depthMemo.set(personId, depth);
    return depth;
  }

  let maxDepth = 0;
  persons.forEach((p) => {
    const d = getNodeDepth(p.id);
    if (d > maxDepth) maxDepth = d;
  });

  // Average children per parent
  const parentsWithChildrenCount = offspringMap.size;
  let totalChildrenSum = 0;
  offspringMap.forEach((children) => {
    totalChildrenSum += children.size;
  });
  const avgChildrenPerFamily =
    parentsWithChildrenCount > 0
      ? parseFloat((totalChildrenSum / parentsWithChildrenCount).toFixed(1))
      : 0;

  // 5. Top 5 Male and Female Names
  const maleNameCounts = new Map<string, number>();
  const femaleNameCounts = new Map<string, number>();

  persons.forEach((p) => {
    const cleanName = p.first_name.trim();
    if (!cleanName) return;

    if (p.gender === 'FEMALE') {
      femaleNameCounts.set(cleanName, (femaleNameCounts.get(cleanName) || 0) + 1);
    } else {
      maleNameCounts.set(cleanName, (maleNameCounts.get(cleanName) || 0) + 1);
    }
  });

  function getTop5(map: Map<string, number>, genderTotal: number): NameFrequency[] {
    const sorted = Array.from(map.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: genderTotal > 0 ? Math.round((count / genderTotal) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return sorted.slice(0, 5);
  }

  const topMaleNames = getTop5(maleNameCounts, malesCount);
  const topFemaleNames = getTop5(femaleNameCounts, femalesCount);

  return {
    demographics: {
      totalMembers,
      malesCount,
      femalesCount,
      malesPct,
      femalesPct,
      livingCount,
      deceasedCount,
      livingPct,
      deceasedPct,
      marriedCount,
      singleCount,
      totalSpouses: totalSpousesCount,
    },
    records: {
      oldestLiving: {
        person: oldestPerson,
        valueText: oldestPerson ? `مواليد ${oldestPerson.birth_year}` : 'غير محدد',
        metricLabel: 'عميد العائلة (الأكبر سناً)',
        subText: oldestPerson ? `العمر التقديري: ${new Date().getFullYear() - oldestPerson.birth_year!} سنة` : undefined,
      },
      largestBranch: {
        person: largestBranchRoot,
        valueText: `${maxDescendantCount} فرد`,
        metricLabel: 'أكبر فرع شجرة في العائلة',
        subText: `نسبة الفرع: ${Math.round((maxDescendantCount / totalMembers) * 100)}% من إجمالي الأفراد`,
      },
      mostOffspring: {
        person: mostOffspringPerson,
        valueText: `${maxOffspringCount} أبناء وبنات`,
        metricLabel: 'الأكثر إنجاباً للأبناء',
        subText: 'ذرية مباشرة',
      },
      mostSpouses: {
        person: mostSpousesPerson,
        valueText: `${maxSpouseCount} زوجات`,
        metricLabel: 'الأكثر تعدد للزوجات',
        subText: 'سجلات زواج موثقة',
      },
      newestMember: {
        person: newestPerson,
        valueText: newestPerson?.birth_year ? `مواليد ${newestPerson.birth_year}` : 'مضاف حديثاً',
        metricLabel: 'أحدث مولود / إضافة',
        subText: newestPerson ? `${newestPerson.first_name} ${newestPerson.family_name || ''}` : undefined,
      },
    },
    generational: {
      maxDepth,
      avgChildrenPerFamily,
      topMaleNames,
      topFemaleNames,
    },
  };
}
