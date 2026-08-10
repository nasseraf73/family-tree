import { Person, Relationship } from '../types';
import { getChildIds } from './kinship';

export interface PromptAncestryData {
  lineageChain: string[];
  targetPersonName: string;
  childrenNames: string[];
}

/**
 * Ascends from target person up to the root ancestor to form top-down lineage chain
 */
export function getTopDownAncestryArray(
  personId: number,
  personsMap: Map<number, Person>,
  relationships: Relationship[]
): PromptAncestryData {
  const targetPerson = personsMap.get(personId);
  if (!targetPerson) {
    return { lineageChain: [], targetPersonName: '', childrenNames: [] };
  }

  const ancestorsAscending: string[] = [targetPerson.first_name];
  const visited = new Set<number>([personId]);
  let currentId: number | null = personId;

  while (currentId !== null) {
    const currId: number = currentId;
    const parentRel = relationships.find(
      r =>
        (r.relationship_type === 'PARENT' && r.person_id === currId) ||
        (r.relationship_type === 'CHILD' && r.related_person_id === currId)
    );

    if (parentRel) {
      const parentId =
        parentRel.relationship_type === 'PARENT'
          ? parentRel.related_person_id
          : parentRel.person_id;

      if (!visited.has(parentId)) {
        visited.add(parentId);
        const parentObj = personsMap.get(parentId);
        if (parentObj) {
          ancestorsAscending.push(parentObj.first_name);
          currentId = parentId;
          continue;
        }
      }
    }

    const topPerson = personsMap.get(currentId);
    if (topPerson) {
      if (topPerson.father_name && topPerson.father_name.trim()) {
        ancestorsAscending.push(topPerson.father_name.trim());
      }
      if (topPerson.grand_father_name && topPerson.grand_father_name.trim()) {
        ancestorsAscending.push(topPerson.grand_father_name.trim());
      }
    }
    break;
  }

  // Reverse ascending array to get top-down order (Root ancestor to Target Person)
  const lineageChain = ancestorsAscending.reverse();

  // If family_name exists and is not already the first element, prepend it
  const familyName = targetPerson.family_name ? targetPerson.family_name.trim() : '';
  if (familyName && lineageChain.length > 0 && lineageChain[0] !== familyName) {
    lineageChain.unshift(familyName);
  }

  // Get direct children of target person
  const childIds = getChildIds(personId, relationships);
  const childrenNames: string[] = [];
  childIds.forEach(cId => {
    const childObj = personsMap.get(cId);
    if (childObj && childObj.first_name) {
      childrenNames.push(childObj.first_name.trim());
    }
  });

  return {
    lineageChain,
    targetPersonName: targetPerson.first_name,
    childrenNames,
  };
}

/**
 * Generates an optimized Arabic AI Image Prompt for drawing an ancient-style family tree.
 */
export function generateTreeImagePrompt(
  personId: number,
  personsMap: Map<number, Person>,
  relationships: Relationship[]
): string {
  const { lineageChain, targetPersonName, childrenNames } = getTopDownAncestryArray(
    personId,
    personsMap,
    relationships
  );

  const lineageString = lineageChain.join(' - ');
  const childrenCount = childrenNames.length;
  const childrenString = childrenNames.join('، ');

  let promptText = `أريد أن تقوم برسم شجرة العائلة على شكل شجرة تاريخية تراثية كما كان يرسمها الأقدمون.\n\n`;
  promptText += `تأكد من الأسماء والتهجئة وعدد الأجيال بدقة.\n`;
  promptText += `لا تخترع فروعاً من عندك أو أسماء من مخك، والتزم تماماً بالبيانات المرفقة.\n\n`;
  promptText += `طريقة الرسم والتصميم:\n`;
  promptText += `- جذر العائلة والجد الأكبر في الأعلى (أعلى الشجرة)، وتتدرج الأجيال هبوطاً نحو الأسفل حتى نصل إلى الأجيال الحديثة المعاصرة.\n`;
  promptText += `- أسلوب فني تراثي خطي عربي على مخطوطة ورق قديم مع زخارف وتصميم شجرة الأنساب الأصيلة.\n\n`;
  promptText += `تسلسل النسب من الجد الأكبر إلى الشخص المستهدف (من الأعلى إلى الأسفل):\n`;
  promptText += `${lineageString}\n\n`;

  if (childrenCount > 0) {
    promptText += `أخيراً، ${targetPersonName} عنده (${childrenCount}) أبناء كفروع ممتدة منه في الأسفل:\n`;
    promptText += `${childrenString}\n`;
  } else {
    promptText += `الشخص المستهدف في نهاية السلسلة هو: ${targetPersonName}.\n`;
  }

  return promptText;
}
