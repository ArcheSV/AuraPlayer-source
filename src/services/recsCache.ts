import type { Song } from './youtube';

interface RecsCacheEntry {
  recentsHash: string;
  ts: number;
  recs: Song[];
}

function keyFor(userId: string | null) {
  return `aura_recs_cache_${userId || 'anon'}`;
}

function hashRecents(recents: Song[]): string {
  const ids = recents.map(r => r.id).join('|');
  let hash = 0;
  for (let i = 0; i < ids.length; i++) {
    hash = ((hash << 5) - hash) + ids.charCodeAt(i);
    hash |= 0;
  }
  return `${ids.length}:${hash}`;
}

export function getCachedRecs(userId: string | null, recents: Song[], ttlHours = 24): Song[] | null {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const data: RecsCacheEntry = JSON.parse(raw);
    const recentsHash = hashRecents(recents);
    const ageMs = Date.now() - data.ts;
    if (data.recentsHash === recentsHash && ageMs <= ttlHours * 3600 * 1000) {
      return Array.isArray(data.recs) ? data.recs : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedRecs(userId: string | null, recents: Song[], recs: Song[]): void {
  try {
    const entry: RecsCacheEntry = {
      recentsHash: hashRecents(recents),
      ts: Date.now(),
      recs,
    };
    localStorage.setItem(keyFor(userId), JSON.stringify(entry));
  } catch {}
}

export function buildLocalOnlyRecs(recents: Song[], limit = 24): Song[] {
  const counts: Record<string, number> = {};
  recents.forEach(r => { counts[r.channel] = (counts[r.channel] || 0) + 1; });
  const unique = Array.from(new Map(recents.map(s => [s.id, s])).values());
  const ranked = unique.sort((a, b) => (counts[b.channel] || 0) - (counts[a.channel] || 0));
  return ranked.slice(0, limit);
}
