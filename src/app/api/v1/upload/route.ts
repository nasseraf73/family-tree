import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const personId = formData.get('person_id') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'لم يتم توفير ملف الصورة' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create target directory in public/uploads/photos
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'photos');
    await fs.mkdir(uploadDir, { recursive: true });

    // File extension and sanitized filename
    const originalExt = file.name.split('.').pop() || 'jpg';
    const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(originalExt.toLowerCase())
      ? originalExt.toLowerCase()
      : 'jpg';
      
    const fileName = `photo_${personId || Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file to disk
    await fs.writeFile(filePath, buffer);

    // Relative web URL stored in DB
    const relativeUrl = `/uploads/photos/${fileName}`;

    return NextResponse.json({ url: relativeUrl, message: 'تم رفع وتخزين الصورة بنجاح على القرص الصلب' });
  } catch (error) {
    console.error('Error uploading photo to local disk:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ ملف الصورة على القرص الصلب' },
      { status: 500 }
    );
  }
}
