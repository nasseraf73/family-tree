/**
 * LRU Cache for tree data.
 * P2.1: Caches the full tree snapshot to avoid re-fetching from DB
 *        when multiple users request the same data.
 *
 * On a long-running PM2 process, this cache persists across requests.
 * On `pm2 reload`, the cache is cleared (acceptable — rebuild is fast).
 *
 * Cache invalidation:
 *   - Automatic via TTL (5 minutes)
 *   - Manual via `invalidateTreeCache()` on writes
 */
import { LRUCache } from 'lru-cache';
import { db } from '@/db';
import { persons, relationships, marriages } from '@/db/schema';

export interface TreeSnapshot {
  persons: any[];
  relationships: any[];
  marriages: any[];
  builtAt: number;
}

const TREE_CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes
const TREE_CACHE_MAX_ENTRIES = 50; // 50 unique viewports

const treeCache = new LRUCache<string, TreeSnapshot>({
  max: TREE_CACHE_MAX_ENTRIES,
  ttl: TREE_CACHE_TTL_MS,
  allowStale: true, // serve stale while revalidating
  updateAgeOnGet: false,
});

/**
 * Generate a stable cache key from query params.
 * Returns "*" when no viewport filter is set (most common case).
 */
export function treeCacheKey(params: {
  role?: string;
  xMin?: number | null;
  yMin?: number | null;
  xMax?: number | null;
  yMax?: number | null;
}): string {
  if (
    params.xMin == null ||
    params.yMin == null ||
    params.xMax == null ||
    params.yMax == null
  ) {
    return `tree:${params.role || 'USER'}:full`;
  }
  return `tree:${params.role || 'USER'}:${params.xMin}:${params.yMin}:${params.xMax}:${params.yMax}`;
}

/**
 * Get a cached tree snapshot or fetch it from DB.
 */
export async function getTreeSnapshot(
  key: string,
  options: { fresh?: boolean } = {}
): Promise<TreeSnapshot> {
  if (!options.fresh) {
    const cached = treeCache.get(key);
    if (cached) return cached;
  }

  const [dbPersons, dbRels, dbMarriages] = await Promise.all([
    db.select().from(persons),
    db.select().from(relationships),
    db.select().from(marriages),
  ]);

  const snapshot: TreeSnapshot = {
    persons: dbPersons,
    relationships: dbRels,
    marriages: dbMarriages,
    builtAt: Date.now(),
  };

  treeCache.set(key, snapshot);
  return snapshot;
}

/**
 * Invalidate the entire tree cache.
 * Call this after any write that affects tree data:
 *   - Add/edit/delete person
 *   - Add/edit/delete relationship
 *   - Add/edit/delete marriage
 *   - Approve/reject a pending relationship
 */
export function invalidateTreeCache(): void {
  treeCache.clear();
}

/**
 * Cache statistics for monitoring.
 */
export function getTreeCacheStats() {
  return {
    size: treeCache.size,
    max: TREE_CACHE_MAX_ENTRIES,
    ttlMs: TREE_CACHE_TTL_MS,
  };
}
