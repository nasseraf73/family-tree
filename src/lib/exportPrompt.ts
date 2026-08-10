import { Person, Relationship } from '../types';
import { getChildIds } from './kinship';

export interface PromptAncestryData {
  lineageChain: string[];
  targetPersonName: string;
  childrenNames: string[];
}

/**
 * Ascends from target person up to the root ancestor to form bottom-to-top lineage chain
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

  // Reverse ascending array to get Root Ancestor -> Target Person order
  const lineageChain = ancestorsAscending.reverse();

  // If family_name exists and is not already the first element, prepend it as root family name
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
 * Generates an optimized, highly accurate Arabic AI Image Prompt for generating a vertical (9:16) ancient-style family tree.
 * Root/Ancestor at the BOTTOM -> Growing UPWARDS -> Children/Newest generation at TOP branches.
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

  const lineageString = lineageChain.join(' ← ');
  const childrenCount = childrenNames.length;
  const childrenString = childrenNames.join('، ');

  let promptText = `صورة شجرة عائلة عربية أصيلة مرسومة بأسلوب المخطوطات التراثية القديمة.\n\n`;
  promptText += `أبعاد الصورة المطلوب توليدها: 9:16 (عرض طولي رأسياً / Vertical 9:16).\n\n`;

  promptText += `الهيكل والنمو الهندسي للشجرة:\n`;
  promptText += `- قاعدة الشجرة وجذورها الصلبة في الأسفل تحتوي على الجد الأكبر وأصل العائلة.\n`;
  promptText += `- يرتفع جذع الشجرة وتتصاعد الأجيال صعوداً من الأسفل إلى الأعلى حسب تسلسل النسب التاريخي.\n`;
  promptText += `- في أعلى الشجرة تتفرع الأغصان والأوراق لتضم أحدث جيل وأبناء الشخص المستهدف.\n\n`;

  promptText += `دقة البيانات والأسماء (التزام تام بالأسماء المرفقة بدون اختراع أو تغيير):\n`;
  promptText += `- تسلسل الأنساب من قاعدة الشجرة في الأسفل صعوداً إلى أعلى الجذع:\n`;
  promptText += `  [القاعدة في الأسفل] ${lineageString} [أعلى الجذع]\n\n`;

  if (childrenCount > 0) {
    promptText += `- الفروع والأغصان في أعلى الشجرة تمتد من (${targetPersonName}) وتضم أبناءه الـ (${childrenCount}):\n`;
    promptText += `  ${childrenString}\n\n`;
  } else {
    promptText += `- الأغصان العلوية ينتهي بها النسب عند الشخص المستهدف: ${targetPersonName}.\n\n`;
  }

  promptText += `النمط الفني والجمالي:\n`;
  promptText += `مخطوطة عربية قديمة على ورق رق عتيق مذهب، خط عربي أصيل ورسم زيتي دقيق لشجرة عريقة، زخارف إسلامية نادرة على الحواف، ألوان دافئة (ذهبي، بني عتيق، أخضر زيتي)، إضاءة تراثية دافئة، تفاصيل دقيقة جداً عالية الجودة (8K resolution, vertical aspect ratio 9:16, --ar 9:16).`;

  return promptText;
}
