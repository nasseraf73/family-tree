import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Person } from '../types';

export interface PersonWithCount extends Person {
  childrenCount?: number;
}

export interface ExportPdfData {
  person: Person;
  lineageString: string;
  siblings: PersonWithCount[];
  directChildren: PersonWithCount[];
  ageString: string;
}

// Global font cache for fast repeat exports
let amiriFontBase64: string | null = null;

async function getAmiriFontBase64(): Promise<string> {
  if (amiriFontBase64) return amiriFontBase64;
  try {
    // Fetch Amiri TTF font directly for vector Arabic PDF text rendering
    const response = await fetch(
      'https://raw.githubusercontent.com/google/fonts/main/ofl/amiri/Amiri-Regular.ttf'
    );
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    amiriFontBase64 = btoa(binary);
    return amiriFontBase64;
  } catch (e) {
    console.error('Failed to load Amiri font for PDF', e);
    return '';
  }
}

export const exportCustomProfilePdf = async ({
  person,
  lineageString,
  siblings,
  directChildren,
  ageString,
}: ExportPdfData): Promise<void> => {
  const fullName = [person.first_name, person.father_name, person.grand_father_name, person.family_name]
    .filter(Boolean)
    .join(' ');

  const currentDateStr = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Create native vector PDF document (A4 portrait)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Load and register Amiri Arabic TTF Font for native selectable text
  const fontBase64 = await getAmiriFontBase64();
  if (fontBase64) {
    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');
    doc.setFont('Amiri');
  }

  let y = 20;

  // 1. Document Title
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // #0f172a
  doc.text('وثيقة نسب وسجل عائلي رسمي', 105, y, { align: 'center' });
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // #64748b
  doc.text(`تاريخ الإصدار: ${currentDateStr}`, 105, y, { align: 'center' });
  y += 8;

  // Divider Line
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y);
  y += 10;

  // 2. Lineage Chain Box
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('سلسلة النسب الكاملة:', 195, y, { align: 'right' });
  y += 6;

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  const lineageLines = doc.splitTextToSize(lineageString || fullName, 175);
  doc.text(lineageLines, 195, y, { align: 'right' });
  y += lineageLines.length * 6 + 8;

  // 3. Person Main Details
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(`الاسم الكامل: ${fullName}`, 195, y, { align: 'right' });
  y += 7;

  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  const isLiving = person.is_alive;
  const statusText = isLiving
    ? `الحالة الحيوية: على قيد الحياة ${person.birth_year ? `(عام ${person.birth_year})` : ''} ${ageString}`
    : `الحالة الحيوية: متوفى ${
        person.birth_year || person.death_date
          ? `(${person.birth_year || '؟'} - ${person.death_date ? person.death_date.substring(0, 4) : 'غير محدد'})`
          : ''
      } ${ageString}`;

  doc.text(statusText, 195, y, { align: 'right' });
  y += 6;

  doc.text(`الجنس: ${person.gender === 'FEMALE' ? 'أنثى' : 'ذكر'}`, 195, y, { align: 'right' });
  y += 6;

  if (!isLiving && person.burial_place) {
    doc.text(`مكان الوفاة / المدفن: ${person.burial_place}`, 195, y, { align: 'right' });
    y += 6;
  }

  if (person.biography) {
    const bioLines = doc.splitTextToSize(`السيرة الذاتية: ${person.biography}`, 175);
    doc.text(bioLines, 195, y, { align: 'right' });
    y += bioLines.length * 6;
  }

  y += 8;

  // 4. Siblings Table (Native Vector PDF Table with children count column & RTL alignment)
  if (siblings.length > 0) {
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`قائمة الإخوة والأخوات (${siblings.length}):`, 195, y, { align: 'right' });
    y += 4;

    const siblingsData = siblings.map((s, index) => [
      (s.childrenCount || 0).toString(),
      s.is_alive ? 'على قيد الحياة' : 'متوفى',
      s.gender === 'FEMALE' ? 'أنثى' : 'ذكر',
      s.first_name,
      (index + 1).toString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['عدد الأبناء', 'الحالة الحيوية', 'الجنس', 'الاسم الأول', '#']],
      body: siblingsData,
      theme: 'grid',
      styles: {
        font: fontBase64 ? 'Amiri' : undefined,
        fontStyle: 'normal',
        halign: 'right',
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      headStyles: {
        font: fontBase64 ? 'Amiri' : undefined,
        fontStyle: 'normal',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        halign: 'right',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 24 }, // 'عدد الأبناء' column on far left
        4: { halign: 'center', cellWidth: 12 }, // '#' column on far right
      },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Direct Children Table (Native Vector PDF Table with children count column & RTL alignment)
  if (directChildren.length > 0) {
    if (y > 240) {
      doc.addPage();
      y = 20;
    }

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`قائمة الأبناء والبنات المباشرين (${directChildren.length}):`, 195, y, { align: 'right' });
    y += 4;

    const childrenData = directChildren.map((c, index) => [
      (c.childrenCount || 0).toString(),
      c.is_alive ? 'على قيد الحياة' : 'متوفى',
      c.gender === 'FEMALE' ? 'أنثى' : 'ذكر',
      c.first_name,
      (index + 1).toString(),
    ]);

    autoTable(doc, {
      startY: y,
      head: [['عدد الأبناء', 'الحالة الحيوية', 'الجنس', 'الاسم الأول', '#']],
      body: childrenData,
      theme: 'grid',
      styles: {
        font: fontBase64 ? 'Amiri' : undefined,
        fontStyle: 'normal',
        halign: 'right',
        fontSize: 9,
        cellPadding: 3,
        textColor: [30, 41, 59],
      },
      headStyles: {
        font: fontBase64 ? 'Amiri' : undefined,
        fontStyle: 'normal',
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        halign: 'right',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 24 }, // 'عدد الأبناء' column on far left
        4: { halign: 'center', cellWidth: 12 }, // '#' column on far right
      },
      margin: { left: 15, right: 15 },
    });

    y = (doc as any).lastAutoTable.finalY + 10;
  }

  // 6. Footer Notice
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('تنويه: هذه الوثيقة مستخرجة آلياً من سجلات الشجرة العائلية الرقمية • جميع الحقوق محفوظة', 105, 285, { align: 'center' });

  // Download Native Vector PDF
  const sanitizedFilename = fullName.replace(/[\s/\\?%*:|"<>]+/g, '_');
  doc.save(`وثيقة_نسب_${sanitizedFilename}.pdf`);
};
