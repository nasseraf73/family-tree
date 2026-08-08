import { NextResponse } from 'next/server';
import postgres from 'postgres';
import { getAuthenticatedUser } from '@/lib/supabase/auth';

export async function GET(request: Request) {
  try {
    const { dbUser, error } = await getAuthenticatedUser(request);
    if (error || !dbUser) {
      return NextResponse.json({ error: 'غير مصرح للوصول' }, { status: 401 });
    }

    if (dbUser.role !== 'ADMIN' && (dbUser.role as string) !== 'ADM') {
      return NextResponse.json({ error: 'غير مصرح: هذه الصفحة مخصصة لمدراء النظام فقط' }, { status: 403 });
    }

    const cloudUrl = process.env.DATABASE_URL || '';
    const localUrl = process.env.LOCAL_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/family_tree_db';

    const cloudSql = postgres(cloudUrl);
    let localSql: postgres.Sql | null = null;
    let localAvailable = false;

    try {
      localSql = postgres(localUrl, { connect_timeout: 3 });
      await localSql`SELECT 1`;
      localAvailable = true;
    } catch {
      localAvailable = false;
    }

    // Get Cloud Stats
    const [
      cloudUsers,
      cloudCountries,
      cloudPersons,
      cloudRels,
      cloudMarr,
      cloudRev,
      cloudMerge
    ] = await Promise.all([
      cloudSql`SELECT COUNT(*)::int FROM users`,
      cloudSql`SELECT COUNT(*)::int FROM countries`,
      cloudSql`SELECT COUNT(*)::int FROM persons`,
      cloudSql`SELECT COUNT(*)::int FROM relationships`,
      cloudSql`SELECT COUNT(*)::int FROM marriages`,
      cloudSql`SELECT COUNT(*)::int FROM branch_reviewers`,
      cloudSql`SELECT COUNT(*)::int FROM merge_requests`,
    ]);

    const cloudStats = {
      users: cloudUsers[0].count,
      countries: cloudCountries[0].count,
      persons: cloudPersons[0].count,
      relationships: cloudRels[0].count,
      marriages: cloudMarr[0].count,
      branch_reviewers: cloudRev[0].count,
      merge_requests: cloudMerge[0].count,
    };

    let localStats = {
      users: 0,
      countries: 0,
      persons: 0,
      relationships: 0,
      marriages: 0,
      branch_reviewers: 0,
      merge_requests: 0,
    };

    if (localAvailable && localSql) {
      try {
        const [
          lUsers,
          lCountries,
          lPersons,
          lRels,
          lMarr,
          lRev,
          lMerge
        ] = await Promise.all([
          localSql`SELECT COUNT(*)::int FROM users`,
          localSql`SELECT COUNT(*)::int FROM countries`,
          localSql`SELECT COUNT(*)::int FROM persons`,
          localSql`SELECT COUNT(*)::int FROM relationships`,
          localSql`SELECT COUNT(*)::int FROM marriages`,
          localSql`SELECT COUNT(*)::int FROM branch_reviewers`,
          localSql`SELECT COUNT(*)::int FROM merge_requests`,
        ]);

        localStats = {
          users: lUsers[0].count,
          countries: lCountries[0].count,
          persons: lPersons[0].count,
          relationships: lRels[0].count,
          marriages: lMarr[0].count,
          branch_reviewers: lRev[0].count,
          merge_requests: lMerge[0].count,
        };
      } catch {
        localAvailable = false;
      } finally {
        await localSql.end();
      }
    }

    await cloudSql.end();

    return NextResponse.json({
      cloudStats,
      localStats,
      localAvailable,
    });
  } catch (error) {
    console.error('Error fetching database stats:', error);
    return NextResponse.json(
      { error: (error as Error).message || 'حدث خطأ أثناء جلب إحصائيات قواعد البيانات' },
      { status: 500 }
    );
  }
}
