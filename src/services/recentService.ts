import type { Song } from './youtube';
import { db } from './firebase';
import { collection, doc, getDocs, limit as fblimit, onSnapshot, orderBy, query, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

const MAX_RECENTS = 30;

function keyFor(userId?: string | null) {
  return userId ? `recents:${userId}` : 'recents:anon';
}

export function getRecents(userId?: string | null): Song[] {
  try {
    const raw = localStorage.getItem(keyFor(userId));
    if (!raw) return [];
    const list = JSON.parse(raw) as Song[];
    if (!Array.isArray(list)) return [];
    return list.filter((s) => s && typeof s.id === 'string' && typeof s.title === 'string' && typeof s.thumbnail === 'string' && typeof s.channel === 'string');
  } catch {
    return [];
  }
}

export function setLocalRecents(userId: string | null | undefined, list: Song[]) {
  try {
    const trimmed = list.slice(0, MAX_RECENTS);
    localStorage.setItem(keyFor(userId), JSON.stringify(trimmed));
  } catch {}
}

export function addRecent(userId: string | null | undefined, song: Song) {
  if (!song || !song.id) return;
  try {
    const current = getRecents(userId);
    const existsIndex = current.findIndex((s) => s.id === song.id);
    if (existsIndex >= 0) current.splice(existsIndex, 1);
    current.unshift({ id: song.id, title: song.title, thumbnail: song.thumbnail, channel: song.channel });
    setLocalRecents(userId ?? null, current);
  } catch {}
}

export async function addRecentCloud(userId: string, song: Song) {
  try {
    const ref = doc(db, `users/${userId}/recents`, song.id);
    await setDoc(ref, { id: song.id, title: song.title, thumbnail: song.thumbnail, channel: song.channel, lastPlayedAt: serverTimestamp(), lastPlayedAtMs: Date.now() }, { merge: true });
  } catch (e) {
    
  }
}

export async function getRecentsCloud(userId: string, max: number = MAX_RECENTS): Promise<Song[]> {
  const col = collection(db, `users/${userId}/recents`);
  const qy = query(col, orderBy('lastPlayedAtMs', 'desc'), fblimit(max));
  const snap = await getDocs(qy);
  const list: Song[] = [];
  snap.forEach((d) => {
    const data = d.data() as any;
    if (data && data.id && data.title && data.thumbnail && data.channel) {
      list.push({ id: data.id, title: data.title, thumbnail: data.thumbnail, channel: data.channel });
    }
  });
  return list;
}

export function subscribeRecentsCloud(userId: string, cb: (list: Song[]) => void) {
  const col = collection(db, `users/${userId}/recents`);
  const qy = query(col, orderBy('lastPlayedAtMs', 'desc'), fblimit(MAX_RECENTS));
  return onSnapshot(qy, (snap) => {
    const list: Song[] = [];
    snap.forEach((d) => {
      const data = d.data() as any;
      if (data && data.id && data.title && data.thumbnail && data.channel) {
        list.push({ id: data.id, title: data.title, thumbnail: data.thumbnail, channel: data.channel });
      }
    });
    cb(list);
  });
}

export async function seedCloudFromLocalIfEmpty(userId: string) {
  
  const existing = await getRecentsCloud(userId, 1);
  if (existing.length > 0) return;
  
  const localUser = getRecents(userId);
  const localAnon = getRecents(null);
  const seen = new Set<string>();
  const merged: Song[] = [];
  const pushUnique = (list: Song[]) => {
    list.forEach((s) => {
      if (!s || !s.id || seen.has(s.id)) return;
      seen.add(s.id);
      merged.push({ id: s.id, title: s.title, thumbnail: s.thumbnail, channel: s.channel });
    });
  };
  pushUnique(localUser);
  pushUnique(localAnon);
  if (merged.length === 0) return;
  const batch = writeBatch(db);
  const now = Date.now();
  merged.slice(0, MAX_RECENTS).forEach((s, idx) => {
    const ref = doc(db, `users/${userId}/recents`, s.id);
    batch.set(ref, { id: s.id, title: s.title, thumbnail: s.thumbnail, channel: s.channel, lastPlayedAt: serverTimestamp(), lastPlayedAtMs: now - idx });
  });
  await batch.commit();
  try {
    setLocalRecents(userId, merged);

    localStorage.removeItem(keyFor(null));
  } catch {}

  
  try {
    const recKey = `aura_user_recs_${userId}`;
    const anonRecKey = `aura_user_recs_anon`;
    const raw = localStorage.getItem(recKey) || localStorage.getItem(anonRecKey);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        const recs = Array.isArray(parsed?.recs) ? parsed.recs.slice(0, 10) : null;
        if (recs) {
          const ref = doc(db, 'users', userId);
          await setDoc(ref, { recommendations: { ts: Date.now(), recs } }, { merge: true });
          try { localStorage.removeItem(recKey); localStorage.removeItem(anonRecKey); } catch {}
        }
      } catch {}
    }
  } catch (e) {}
}
