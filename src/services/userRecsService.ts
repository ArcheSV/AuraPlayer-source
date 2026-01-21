import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { Song } from './youtube';
import toast from 'react-hot-toast';

export interface UserRecsEntry {
  ts: number;
  recs: Song[];
}

export async function getUserRecsCloud(userId: string): Promise<UserRecsEntry | null> {
  try {
    const ref = doc(db, 'users', userId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data() as any;
    if (!data) return null;
    const recsField = data.recommendations || data.recs || null;
    if (!recsField) return null;
    const recs = Array.isArray(recsField.recs) ? recsField.recs.filter((r: any) => r && r.id) : [];
    const ts = typeof recsField.ts === 'number' ? recsField.ts : (recsField.ts && recsField.ts.toMillis ? recsField.ts.toMillis() : Date.now());
    return { ts, recs };
  } catch (e) {
    console.error('getUserRecsCloud error', e);
    return null;
  }
}

export async function setUserRecsCloud(userId: string, recs: Song[]): Promise<boolean> {
  try {
    const ref = doc(db, 'users', userId);
    await setDoc(ref, { recommendations: { ts: Date.now(), recs } }, { merge: true });
    console.log('setUserRecsCloud: success', userId, recs.length);
    return true;
  } catch (e) {
    console.error('setUserRecsCloud error', e);
    try { toast.error('No se pudo guardar recomendaciones en la cuenta.'); } catch {}
    return false;
  }
}
