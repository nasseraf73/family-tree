import { Person, Relationship } from '../types';

export interface TreeJsonExportPayload {
  meta: {
    appName: string;
    exportDate: string;
    targetPerson: {
      id: number | null;
      first_name: string | null;
      family_name: string | null;
    } | null;
    focusMode: string;
    totalPersons: number;
    totalRelationships: number;
  };
  persons: Person[];
  relationships: Relationship[];
}

/**
 * Client-side JSON exporter for family tree data.
 * Downloads a formatted JSON file containing persons and relationships.
 */
export function exportTreeToJson(
  persons: Person[],
  relationships: Relationship[],
  targetPerson: Person | null,
  focusMode: string = 'spine',
  fileNamePrefix: string = 'family-tree'
): void {
  const payload: TreeJsonExportPayload = {
    meta: {
      appName: 'شجرة عائلة أبو فارة',
      exportDate: new Date().toISOString(),
      targetPerson: targetPerson
        ? {
            id: targetPerson.id,
            first_name: targetPerson.first_name,
            family_name: targetPerson.family_name || null,
          }
        : null,
      focusMode,
      totalPersons: persons.length,
      totalRelationships: relationships.length,
    },
    persons,
    relationships,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement('a');

  const sanitizedName = targetPerson
    ? `${targetPerson.first_name}_${targetPerson.family_name || ''}`.trim().replace(/\s+/g, '_')
    : 'shajarati';
  const dateStr = new Date().toISOString().split('T')[0];

  downloadAnchor.setAttribute('href', url);
  downloadAnchor.setAttribute('download', `${fileNamePrefix}-${sanitizedName}-${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  URL.revokeObjectURL(url);
}
