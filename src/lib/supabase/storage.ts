/**
 * Uploads a person's photo directly to local disk storage (public/uploads/photos)
 * and returns the relative URL string stored in the database.
 */
export async function uploadPersonPhoto(file: File, personId?: number): Promise<{ url: string | null; error: string | null }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    if (personId) {
      formData.append('person_id', personId.toString());
    }

    const res = await fetch('/api/v1/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();

    if (res.ok && data.url) {
      return { url: data.url, error: null };
    }

    return { url: null, error: data.error || 'فشل رفع وتخزين الصورة' };
  } catch (err) {
    return { url: null, error: (err as Error).message || 'حدث خطأ غير متوقع أثناء الرفع' };
  }
}
