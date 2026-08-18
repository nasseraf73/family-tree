import { NextResponse } from 'next/server';
import { db } from '@/db';
import { countries as countriesTable } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { dbStore } from '@/lib/store';

export async function GET() {
  try {
    let activeCountries: any[] = [];
    try {
      activeCountries = await db
        .select()
        .from(countriesTable)
        .where(eq(countriesTable.is_active, true));
    } catch {
      activeCountries = dbStore.getCountries().filter((c) => c.is_active);
    }

    return NextResponse.json({ countries: activeCountries });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
