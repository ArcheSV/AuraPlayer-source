import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { adminUpdateUserProfile, assignBadgeToUser, uploadBadgeImage, removeBadgeFromUser } from '../services/userService';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function AdminControls({ profile, currentUser, setProfile }: { profile: any; currentUser: User; setProfile: (p: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [newName, setNewName] = useState(profile?.displayName || '');
  const [newBio, setNewBio] = useState(profile?.bio || '');
  const [badgeName, setBadgeName] = useState('Desarrollador');
  const [badgeFile, setBadgeFile] = useState<File | null>(null);

  const predefinedBadges = [
    { id: 'dev_hammer', name: 'Developer', emoji: '🔨' },
    { id: 'blue_star', name: 'Blue Star', emoji: '⭐' },
    { id: 'maintainer', name: 'Maintainer', emoji: '🛠️' }
  ];

  const doUpdateProfile = async () => {
    if (!currentUser || !profile) return;
    setLoading(true);
    try {
      await adminUpdateUserProfile(currentUser, profile.uid, { displayName: newName, bio: newBio });
      setProfile((p: any) => p ? { ...p, displayName: newName, bio: newBio } : p);
      toast.success('Perfil actualizado (Firestore).');
    } catch (e: any) { toast.error('Error: ' + (e.message || e)); }
    finally { setLoading(false); }
  };

  const doAssignPredefined = async (b: any) => {
    if (!currentUser || !profile) return;
    setLoading(true);
    try {
      await assignBadgeToUser(currentUser, profile.uid, { id: b.id, name: b.name });
      setProfile((p: any) => ({ ...p, badges: [...(p.badges || []), { id: b.id, name: b.name }] }));
      toast.success('Insignia asignada.');
    } catch (e: any) { toast.error('Error: ' + (e.message || e)); }
    finally { setLoading(false); }
  };

  const doRemoveBadge = async (badge: any, index: number) => {
    if (!currentUser || !profile) return;
    if (!confirm('¿Eliminar esta insignia?')) return;
    setLoading(true);
    try {
      await removeBadgeFromUser(currentUser, profile.uid, badge);
      const newBadges = [...(profile.badges || [])];
      newBadges.splice(index, 1);
      setProfile((p: any) => ({ ...p, badges: newBadges }));
      toast.success('Insignia eliminada.');
    } catch (e: any) { toast.error('Error: ' + (e.message || e)); }
    finally { setLoading(false); }
  };

  const doUploadAndAssign = async () => {
    if (!badgeFile) return toast.error('Selecciona un archivo.');
    setLoading(true);
    try {
      const url = await uploadBadgeImage(currentUser, badgeFile);
      const badge = { id: 'custom_' + Date.now(), name: badgeName || 'Custom', imgUrl: url };
      await assignBadgeToUser(currentUser, profile.uid, badge);
      setProfile((p: any) => ({ ...p, badges: [...(p.badges || []), badge] }));
      toast.success('Insignia subida y asignada.');
      setBadgeFile(null);
    } catch (e: any) { toast.error('Error: ' + (e.message || e)); }
    finally { setLoading(false); }
  };

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 mb-3">
        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nuevo displayName" className="p-2 bg-zinc-700 rounded" />
        <input value={newBio} onChange={e => setNewBio(e.target.value)} placeholder="Nueva bio" className="p-2 bg-zinc-700 rounded" />
      </div>
      <div className="flex gap-2 mb-3">
        <button onClick={doUpdateProfile} disabled={loading} className="px-3 py-1 bg-emerald-600 rounded">Guardar cambios</button>
      </div>

      <div className="mb-4 bg-zinc-800 p-2 rounded">
        <div className="text-sm text-zinc-300 mb-2">Insignias actuales:</div>
        <div className="flex flex-wrap gap-2">
          {profile.badges?.map((b: any, i: number) => (
            <div key={b.id + i} className="flex items-center gap-1 bg-zinc-900 px-2 py-1 rounded text-xs">
              {b.imgUrl ? <img src={b.imgUrl} className="w-4 h-4" /> : <span>{predefinedBadges.find(p => p.id === b.id)?.emoji || '🏅'}</span>}
              <span>{b.name}</span>
              <button onClick={() => doRemoveBadge(b, i)} disabled={loading} className="ml-1 text-red-400 hover:text-red-300"><X size={12} /></button>
            </div>
          ))}
          {(!profile.badges || profile.badges.length === 0) && <span className="text-zinc-500 text-xs">Sin insignias</span>}
        </div>
      </div>

      <div className="mb-2">
        <div className="text-sm text-zinc-300 mb-1">Asignar Predefinida:</div>
        <div className="flex gap-2">
          {predefinedBadges.map(b => (
            <button key={b.id} onClick={() => doAssignPredefined(b)} className="px-2 py-1 bg-zinc-700 rounded" disabled={loading}>{b.emoji} {b.name}</button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        <div className="text-sm text-zinc-300 mb-1">Subir insignia custom:</div>
        <input type="text" value={badgeName} onChange={e => setBadgeName(e.target.value)} placeholder="Nombre de la insignia" className="p-2 bg-zinc-700 rounded w-full mb-2" />
        <input type="file" accept="image/*" onChange={e => setBadgeFile(e.target.files ? e.target.files[0] : null)} className="mb-2" />
        <div>
          <button onClick={doUploadAndAssign} disabled={loading} className="px-3 py-1 bg-indigo-600 rounded">Subir y asignar</button>
        </div>
      </div>
    </div>
  );
}
