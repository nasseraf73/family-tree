import { Person, DeduplicationMatch, Relationship } from '@/types';

/**
 * Normalize Arabic text for accurate string comparison
 */
export function normalizeArabicName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    // Remove diacritics (tashkeel)
    .replace(/[\u064B-\u0652]/g, '')
    // Normalize Alefs
    .replace(/[أإآ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yaa
    .replace(/ى/g, 'ي')
    // Remove extra spaces
    .replace(/\s+/g, ' ');
}

/**
 * Normalizes Arabic text for flexible matching during search (removes all spaces, hamzas, etc.)
 */
export function normalizeForSearch(text: string): string {
  if (!text) return '';
  return text
    .trim()
    .toLowerCase()
    // Remove diacritics (tashkeel) and tatweel
    .replace(/[\u064B-\u0652\u0640]/g, '')
    // Normalize Alefs
    .replace(/[أإآ]/g, 'ا')
    // Normalize Taa Marbuta
    .replace(/ة/g, 'ه')
    // Normalize Yaa
    .replace(/ى/g, 'ي')
    // Strip all spaces
    .replace(/\s+/g, '');
}

/**
 * Sorts search results by relevance priority:
 * 1. Persons whose first_name starts with the 1st search word AND father_name starts with 2nd search word.
 * 2. Persons whose first_name starts with the 1st search word.
 * 3. Persons whose full name starts with the search query.
 * 4. Substring / middle name matches.
 */
export function sortSearchResults<
  T extends {
    first_name: string;
    father_name?: string | null;
    grand_father_name?: string | null;
    family_name?: string | null;
    birth_year?: number | null;
  }
>(items: T[], searchQuery: string): T[] {
  if (!searchQuery || !searchQuery.trim()) return items;

  const rawWords = searchQuery.trim().split(/\s+/).filter(Boolean);
  const cleanWords = rawWords.map((w) => normalizeForSearch(w));
  const queryClean = normalizeForSearch(searchQuery);

  return [...items].sort((a, b) => {
    const scoreA = computePersonSearchScore(a, cleanWords, queryClean);
    const scoreB = computePersonSearchScore(b, cleanWords, queryClean);

    if (scoreB !== scoreA) {
      return scoreB - scoreA; // Higher score first
    }

    // Secondary sort: Older birth year first if available
    if (a.birth_year && b.birth_year && a.birth_year !== b.birth_year) {
      return a.birth_year - b.birth_year;
    }

    return 0;
  });
}

/**
 * Flexible word-by-word multi-segment search matching & sorting:
 * Matches if every search word typed by the user exists somewhere in the target person's name or extended lineage.
 */
export function filterAndSortSearchResults<
  T extends {
    id: number;
    first_name: string;
    father_name?: string | null;
    grand_father_name?: string | null;
    family_name?: string | null;
    birth_year?: number | null;
  }
>(
  items: T[],
  searchQuery: string,
  fullNamesMap?: Map<number, string>
): T[] {
  if (!searchQuery || !searchQuery.trim()) return items;

  const rawWords = searchQuery.trim().split(/\s+/).filter(Boolean);
  const cleanWords = rawWords.map((w) => normalizeForSearch(w)).filter(Boolean);

  const matched = items.filter((p) => {
    let fullNameText = `${p.first_name || ''} ${p.father_name || ''} ${p.grand_father_name || ''} ${p.family_name || ''}`;
    if (fullNamesMap && fullNamesMap.has(p.id)) {
      fullNameText = fullNamesMap.get(p.id)!;
    }
    const fullClean = normalizeForSearch(fullNameText);

    // Every search word must be included in the normalized lineage string (or birth year)
    return cleanWords.every((w) => fullClean.includes(w) || (p.birth_year && p.birth_year.toString().includes(w)));
  });

  return sortSearchResults(matched, searchQuery);
}

function computePersonSearchScore<
  T extends {
    first_name: string;
    father_name?: string | null;
    grand_father_name?: string | null;
    family_name?: string | null;
  }
>(p: T, cleanWords: string[], queryClean: string): number {
  const firstClean = normalizeForSearch(p.first_name || '');
  const fatherClean = normalizeForSearch(p.father_name || '');
  const grandClean = normalizeForSearch(p.grand_father_name || '');

  const fullClean = normalizeForSearch(
    `${p.first_name || ''}${p.father_name || ''}${p.grand_father_name || ''}${p.family_name || ''}`
  );

  let score = 0;
  const w1 = cleanWords[0] || '';
  const w2 = cleanWords[1] || '';
  const w3 = cleanWords[2] || '';

  // 1. Highest Priority (1000+): First name matches word 1 AND Father name matches word 2
  if (w1 && w2 && firstClean.startsWith(w1) && fatherClean.startsWith(w2)) {
    score += 1000;
    if (w3 && grandClean.startsWith(w3)) {
      score += 500;
    }
  }

  // 2. High Priority: First name matches word 1
  if (w1 && firstClean === w1) {
    score += 500;
  } else if (w1 && firstClean.startsWith(w1)) {
    score += 300;
  }

  // 3. Full name starts with search query
  if (fullClean.startsWith(queryClean)) {
    score += 200;
  }

  // 4. Father name matches word 1
  if (w1 && fatherClean.startsWith(w1)) {
    score += 50;
  }

  // 5. General substring match
  if (fullClean.includes(queryClean)) {
    score += 10;
  }

  return score;
}

/**
 * Normalizes names before storing in database (removes hamzas, forces space in compound names)
 */
export function normalizeForDatabase(name: string): string {
  if (!name) return '';
  
  let clean = name
    .trim()
    // Remove diacritics (tashkeel) and tatweel
    .replace(/[\u064B-\u0652\u0640]/g, '')
    // Normalize Alefs to bare Alef
    .replace(/[أإآ]/g, 'ا')
    // Replace multiple spaces with a single space
    .replace(/\s+/g, ' ');

  // Standardize compound names starting with "عبد" or "ابو"
  if (clean === 'عبدالله') {
    clean = 'عبد الله';
  } else if (clean.startsWith('عبدال') && clean.length > 5 && clean[3] !== ' ') {
    clean = 'عبد ' + clean.substring(3);
  } else if (clean.startsWith('عبد') && clean.length > 3 && clean[3] !== ' ' && (clean.substring(3).startsWith('رب') || clean.substring(3).startsWith('ال'))) {
    clean = 'عبد ' + clean.substring(3);
  }

  if (clean.startsWith('ابو') && clean.length > 3 && clean[3] !== ' ') {
    clean = 'ابو ' + clean.substring(3);
  }

  return clean;
}

/**
 * Standard Levenshtein distance for string similarity [0.0 - 1.0]
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const s1 = normalizeArabicName(str1);
  const s2 = normalizeArabicName(str2);

  if (s1 === s2) return 1.0;
  if (!s1 || !s2) return 0;

  // If one string contains the other (e.g. "عبدالله" and "عبد الله" or prefix match)
  const cleanS1 = s1.replace(/\s+/g, '');
  const cleanS2 = s2.replace(/\s+/g, '');
  if (cleanS1 === cleanS2) return 1.0;

  const len1 = s1.length;
  const len2 = s2.length;
  const track = Array(len2 + 1).fill(null).map(() => Array(len1 + 1).fill(0));

  for (let i = 0; i <= len1; i += 1) track[0][i] = i;
  for (let j = 0; j <= len2; j += 1) track[j][0] = j;

  for (let j = 1; j <= len2; j += 1) {
    for (let i = 1; i <= len1; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1, // deletion
        track[j - 1][i] + 1, // insertion
        track[j - 1][i - 1] + indicator // substitution
      );
    }
  }

  const distance = track[len2][len1];
  const maxLen = Math.max(len1, len2);
  return Math.max(0, 1 - distance / maxLen);
}

/**
 * Real-time Deduplication Scoring Formula (TDD Section 5)
 * Dynamically evaluates similarity based on entered fields.
 */
export function calculateDeduplicationScore(
  inputPerson: Partial<Person>,
  targetPerson: Person,
  existingRelationships: Relationship[]
): DeduplicationMatch {
  // 1. Name Similarity (Sim_Name)
  const firstNameSim = calculateStringSimilarity(inputPerson.first_name || '', targetPerson.first_name);
  
  let fatherNameSim = 0;
  let hasFatherInput = false;
  if (inputPerson.father_name && inputPerson.father_name.trim().length > 0) {
    hasFatherInput = true;
    fatherNameSim = targetPerson.father_name
      ? calculateStringSimilarity(inputPerson.father_name, targetPerson.father_name)
      : 0.5;
  }

  let grandFatherNameSim = 0;
  let hasGrandFatherInput = false;
  if (inputPerson.grand_father_name && inputPerson.grand_father_name.trim().length > 0) {
    hasGrandFatherInput = true;
    grandFatherNameSim = targetPerson.grand_father_name
      ? calculateStringSimilarity(inputPerson.grand_father_name, targetPerson.grand_father_name)
      : 0.5;
  }

  let familyNameSim = 0;
  let hasFamilyInput = false;
  if (inputPerson.family_name && inputPerson.family_name.trim().length > 0) {
    hasFamilyInput = true;
    
    // Compare family names both with and without "ال" prefix
    const rawInputFam = inputPerson.family_name;
    const rawTargetFam = targetPerson.family_name || '';
    const normInputFam = normalizeArabicName(rawInputFam).replace(/^ال/, '');
    const normTargetFam = normalizeArabicName(rawTargetFam).replace(/^ال/, '');
    
    if (normInputFam === normTargetFam && normInputFam.length > 0) {
      familyNameSim = 1.0;
    } else {
      familyNameSim = calculateStringSimilarity(rawInputFam, rawTargetFam);
    }
  }

  // Dynamic Name Similarity Weighting based on user inputs
  let simName = firstNameSim;
  if (hasFatherInput && hasGrandFatherInput && hasFamilyInput) {
    simName = (firstNameSim * 0.30) + (fatherNameSim * 0.25) + (grandFatherNameSim * 0.20) + (familyNameSim * 0.25);
  } else if (hasFatherInput && hasFamilyInput) {
    simName = (firstNameSim * 0.40) + (fatherNameSim * 0.30) + (familyNameSim * 0.30);
  } else if (hasFatherInput) {
    simName = (firstNameSim * 0.55) + (fatherNameSim * 0.45);
  } else if (hasFamilyInput) {
    simName = (firstNameSim * 0.55) + (familyNameSim * 0.45);
  } else {
    simName = firstNameSim;
  }

  // 2. Birth Year Proximity (Sim_BirthYear)
  let simBirthYear = 0.5;
  if (inputPerson.birth_year && targetPerson.birth_year) {
    const diff = Math.abs(inputPerson.birth_year - targetPerson.birth_year);
    if (diff === 0) simBirthYear = 1.0;
    else if (diff <= 3) simBirthYear = 0.6;
    else simBirthYear = 0.2;
  }

  // 3. Context Similarity (Sim_Context)
  let simContext = 0.5;
  if (hasFamilyInput && targetPerson.family_name) {
    const normInputFam = normalizeArabicName(inputPerson.family_name!).replace(/^ال/, '');
    const normTargetFam = normalizeArabicName(targetPerson.family_name!).replace(/^ال/, '');
    simContext = normInputFam === normTargetFam ? 0.9 : 0.3;
  }

  // Triple Lineage Bonus: If Father, Grandfather, AND Family Name match 85%+
  const isTripleLineageMatch = hasFatherInput && fatherNameSim >= 0.85 &&
    (!hasGrandFatherInput || grandFatherNameSim >= 0.85) &&
    hasFamilyInput && familyNameSim >= 0.85;

  if (isTripleLineageMatch) {
    simContext = 0.95;
    // Elevate simName base score to 0.78 - 0.80 for full siblings so total score reaches 78% - 85%
    const lineageBonusBase = (hasGrandFatherInput && grandFatherNameSim >= 0.85) ? 0.78 : 0.72;
    simName = Math.max(simName, lineageBonusBase);
  }

  // Composite Matching Score
  const totalScore = (simName * 0.60) + (simContext * 0.25) + (simBirthYear * 0.15);

  return {
    person: targetPerson,
    score: Math.round(totalScore * 100) / 100,
    nameSimilarity: Math.round(simName * 100) / 100,
    contextSimilarity: Math.round(simContext * 100) / 100,
    birthYearProximity: Math.round(simBirthYear * 100) / 100,
  };
}

/**
 * Check potential duplicate records in dataset
 */
export function findPotentialDuplicates(
  inputPerson: Partial<Person>,
  allPersons: Person[],
  allRelationships: Relationship[],
  threshold = 0.55
): DeduplicationMatch[] {
  if (!inputPerson.first_name || inputPerson.first_name.trim().length < 2) {
    return [];
  }

  return allPersons
    .filter(p => p.id !== inputPerson.id)
    .map(p => calculateDeduplicationScore(inputPerson, p, allRelationships))
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score);
}
