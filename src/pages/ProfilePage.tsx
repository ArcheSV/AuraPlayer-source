import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import { getUserPlaylists, Playlist } from '../services/playlistService';
import { followUser, unfollowUser, getUserProfile, getFollowingList, getFollowersList, UserProfile as UserProfileType, adminUpdateUserProfile, assignBadgeToUser, uploadBadgeImage } from '../services/userService';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { UserCircle, Edit3, Save, XCircle, Loader2, Music } from 'lucide-react';
import { UserListModal } from '../components/UserListModal';
import Badge from '../components/Badge';
import AdminControls from '../components/AdminControls';

export function ProfilePage() {
    const { userId } = useParams<{ userId: string }>();
    const { user: currentUser } = useAuth();
    const { themeState } = useTheme();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfileType | null>(null);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isProcessingFollow, setIsProcessingFollow] = useState(false);
    const [publicPlaylists, setPublicPlaylists] = useState<Playlist[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editDisplayName, setEditDisplayName] = useState('');
    const [editBio, setEditBio] = useState('');
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalTitle, setModalTitle] = useState('');
    const [modalUsers, setModalUsers] = useState<UserProfileType[]>([]);
    const [isModalLoading, setIsModalLoading] = useState(false);

    useEffect(() => {
        const profileIdToLoad = userId || currentUser?.uid;
        if (!profileIdToLoad) {
            setIsLoadingProfile(false);
            return;
        }

        const loadAllProfileData = async () => {
            setIsLoadingProfile(true);
            try {
                const profileData = await getUserProfile(profileIdToLoad, currentUser?.uid);
                if (!profileData) {
                    toast.error("Este perfil no existe.");
                    navigate('/users');
                    return;
                }
                setProfile(profileData);
                setIsFollowing(profileData.isFollowing || false);
                setEditDisplayName(profileData.displayName);
                setEditBio(profileData.bio || '');
                setPhotoPreview(profileData.photoURL || '');

                const userPlaylists = await getUserPlaylists(profileIdToLoad);
                setPublicPlaylists(userPlaylists.filter(p => p.isPublic));

            } catch (error) {
                console.error("Error al cargar datos del perfil:", error);
                toast.error("No se pudo cargar el perfil.");
                navigate('/');
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadAllProfileData();
    }, [userId, currentUser, navigate]);

    const handleFollow = async () => {
        if (!currentUser || !profile || isProcessingFollow) return;
        setIsProcessingFollow(true);
        try {
            await followUser(currentUser, profile.uid);
            setProfile(p => p ? { ...p, followerCount: (p.followerCount || 0) + 1 } : null);
            setIsFollowing(true);
        } catch (error) {
            console.error("Error al seguir:", error);
            toast.error("No se pudo seguir al usuario.");
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser || !profile || isProcessingFollow) return;
        setIsProcessingFollow(true);
        try {
            await unfollowUser(currentUser.uid, profile.uid);
            setProfile(p => p ? { ...p, followerCount: Math.max(0, (p.followerCount || 0) - 1) } : null);
            setIsFollowing(false);
        } catch (error) {
            console.error("Error al dejar de seguir:", error);
            toast.error("No se pudo dejar de seguir.");
        } finally {
            setIsProcessingFollow(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleSaveChanges = async () => {
        if (!currentUser) return;
        if (editDisplayName.trim() === '') {
            toast.error('El nombre de usuario no puede estar vacío.');
            return;
        }

        setIsSaving(true);
        const savingToast = toast.loading('Guardando cambios...');

        let finalPhotoURL = profile?.photoURL;
        let fileToUpload: File | Blob | null = null;

        if (photoFile) {
            fileToUpload = photoFile;
        } else if (profile?.displayName !== editDisplayName && !photoFile) {
            try {
                const avatarResponse = await fetch(`https://ui-avatars.com/api/?name=${encodeURIComponent(editDisplayName)}&background=random&color=fff&size=256`);
                if (!avatarResponse.ok) throw new Error('Fallo al generar el avatar');
                fileToUpload = await avatarResponse.blob();
            } catch(error) {
                toast.dismiss(savingToast);
                toast.error("No se pudo generar el nuevo avatar.");
                setIsSaving(false);
                return;
            }
        }

        if (fileToUpload) {
            const formData = new FormData();
            formData.append('file', fileToUpload);
            formData.append('upload_preset', 'aura_player_preset');

            try {
                const response = await fetch(`https://api.cloudinary.com/v1_1/dnt9ii3g4/image/upload`, {
                    method: 'POST', body: formData,
                });
                const data = await response.json();
                if (data.secure_url) {
                    finalPhotoURL = data.secure_url;
                } else { throw new Error('Fallo en la subida a Cloudinary.'); }
            } catch (uploadError) {
                toast.dismiss(savingToast);
                toast.error("Hubo un error al subir tu foto.");
                setIsSaving(false);
                return;
            }
        }

        try {
            await Promise.all([
                updateProfile(currentUser, { displayName: editDisplayName, photoURL: finalPhotoURL }),
                updateDoc(doc(db, 'users', currentUser.uid), { displayName: editDisplayName, bio: editBio, photoURL: finalPhotoURL })
            ]);

            toast.dismiss(savingToast);
            toast.success('¡Perfil actualizado!');

            setIsEditing(false);
            setPhotoFile(null);
            setProfile(p => p ? { ...p, displayName: editDisplayName, bio: editBio, photoURL: finalPhotoURL || '' } : null);
        } catch (error) {
            toast.dismiss(savingToast);
            toast.error("Hubo un error al guardar.");
            console.error("Error al actualizar perfil en Firebase:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        if (isSaving) return;
        setIsEditing(false);
        setPhotoFile(null);
        setEditDisplayName(profile?.displayName || '');
        setEditBio(profile?.bio || '');
        setPhotoPreview(profile?.photoURL || '');
    };

    const openUserListModal = async (type: 'followers' | 'following') => {
        if (!profile) return;
        setModalTitle(type === 'followers' ? 'Seguidores' : 'Siguiendo');
        setIsModalOpen(true);
        setIsModalLoading(true);
        try {
            const fetchUsers = type === 'followers' ? getFollowersList : getFollowingList;
            const users = await fetchUsers(profile.uid);
            setModalUsers(users);
        } catch (error) {
            toast.error("No se pudo cargar la lista de usuarios.");
        } finally {
            setIsModalLoading(false);
        }
    };

    if (isLoadingProfile) return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-white" size={32} /></div>;
    if (!profile) return <div className="text-center p-10">Este perfil no existe o no se pudo cargar.</div>;

    const isOwnProfile = currentUser?.uid === profile.uid;

    return (
        <>
            <div className="max-w-2xl mx-auto">
                <div className="bg-zinc-800/50 p-6 rounded-lg relative">
                    {isOwnProfile && (
                        isEditing ? (
                            <div className="absolute top-4 right-4 flex gap-2 z-10">
                                <button onClick={handleSaveChanges} disabled={isSaving} className="p-2 rounded-full hover:opacity-90 disabled:opacity-50 flex items-center justify-center w-10 h-10" style={{ backgroundColor: isSaving ? themeState?.colors.accent + '80' : themeState?.colors.accent }}>
                                    {isSaving ? <Loader2 className="animate-spin text-white"/> : <Save size={20} className="text-white"/>}
                                </button>
                                <button onClick={handleCancelEdit} disabled={isSaving} className="bg-red-600 p-2 rounded-full hover:bg-red-700 disabled:opacity-50">
                                    <XCircle size={20} className="text-white"/>
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 bg-zinc-700 p-2 rounded-full hover:bg-zinc-600 z-10">
                                <Edit3 size={20} />
                            </button>
                        )
                    )}

                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            <img src={isEditing ? photoPreview : profile.photoURL || ''} alt="Perfil" className="w-32 h-32 rounded-full object-cover bg-zinc-700" />
                            {isEditing && (
                                <label htmlFor="photo-upload" className="absolute -bottom-1 -right-1 p-2 rounded-full cursor-pointer transition-colors" style={{ backgroundColor: themeState?.colors.accent }}>
                                    <Edit3 size={16} className="text-white" />
                                    <input id="photo-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>

                        {isEditing ? (
                            <fieldset disabled={isSaving} className="w-full space-y-4 text-center">
                                <input type="text" value={editDisplayName} onChange={(e) => setEditDisplayName(e.target.value)} className="w-full text-center text-3xl font-bold bg-zinc-700 p-2 rounded disabled:opacity-50" />
                                <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="Añade una pequeña biografía..." className="w-full text-center text-sm bg-zinc-700 p-2 rounded h-24 resize-none disabled:opacity-50" />
                            </fieldset>
                        ) : (
                            <div className="text-center">
                                <h1 className="text-3xl font-bold flex items-center justify-center">
                                  <span>{profile.displayName}</span>
                                  {Array.isArray(profile.badges) && profile.badges.map((b: any) => (
                                    <Badge key={b.id || b.name} badge={{ id: b.id || b.name, name: b.name, imgUrl: b.imgUrl, emoji: b.emoji }} size={18} />
                                  ))}
                                </h1>
                                <p className="text-sm text-zinc-400 mt-2">{profile.bio || 'Sin biografía.'}</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-around text-center my-6 py-4 border-y border-zinc-700">
                        {isOwnProfile ? (
                            <button onClick={() => openUserListModal('followers')} className="text-center hover:bg-zinc-700/50 p-2 rounded-md transition-colors w-1/2">
                                <p className="font-bold text-lg">{profile.followerCount || 0}</p>
                                <p className="text-sm text-zinc-400">Seguidores</p>
                            </button>
                        ) : (
                            <div className="text-center p-2 w-1/2">
                                <p className="font-bold text-lg">{profile.followerCount || 0}</p>
                                <p className="text-sm text-zinc-400">Seguidores</p>
                            </div>
                        )}
                        {isOwnProfile ? (
                            <button onClick={() => openUserListModal('following')} className="text-center hover:bg-zinc-700/50 p-2 rounded-md transition-colors w-1/2">
                                <p className="font-bold text-lg">{profile.followingCount || 0}</p>
                                <p className="text-sm text-zinc-400">Siguiendo</p>
                            </button>
                        ) : (
                            <div className="text-center p-2 w-1/2">
                                <p className="font-bold text-lg">{profile.followingCount || 0}</p>
                                <p className="text-sm text-zinc-400">Siguiendo</p>
                            </div>
                        )}
                    </div>

                    {!isOwnProfile && (
                        <div className="flex justify-center">
                            {isFollowing ? (
                                <button onClick={handleUnfollow} disabled={isProcessingFollow} className="px-6 py-2 rounded-full font-semibold bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50 w-32">
                                    {isProcessingFollow ? <Loader2 className="animate-spin mx-auto"/> : 'Siguiendo'}
                                </button>
                            ) : (
                                <button onClick={handleFollow} disabled={isProcessingFollow} className="px-6 py-2 rounded-full font-semibold text-white hover:opacity-90 disabled:opacity-50 w-32" style={{backgroundColor: themeState.colors.accent}}>
                                    {isProcessingFollow ? <Loader2 className="animate-spin mx-auto"/> : 'Seguir'}
                                </button>
                            )}
                        </div>
                    )}

                    {}
                    {currentUser?.email === 'clatshroyale@gmail.com' && (
                      <div className="mt-4 p-3 border border-zinc-700 rounded bg-zinc-800/40">
                        <h3 className="font-semibold mb-2">Developer tools</h3>
                        <AdminControls profile={profile} currentUser={currentUser} setProfile={setProfile} />
                      </div>
                    )}
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Playlists Públicas</h2>
                    {isLoadingProfile ? (
                        <p className='text-zinc-400'>Cargando playlists...</p>
                    ) : publicPlaylists.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {publicPlaylists.map(playlist => (
                                <Link to={`/playlist/${playlist.id}`} key={playlist.id} className="bg-zinc-800/50 p-4 rounded-lg hover:bg-zinc-700/50 transition-colors group">
                                    <div className="aspect-square mb-4 bg-zinc-700 rounded-md flex items-center justify-center">
                                        {playlist.coverArtURL ? (
                                            <img src={playlist.coverArtURL} alt={playlist.name} className="w-full h-full object-cover rounded-md" />
                                        ) : (
                                            <Music size={48} className="text-zinc-500" />
                                        )}
                                    </div>
                                    <h3 className="font-semibold truncate">{playlist.name}</h3>
                                    <p className="text-sm text-zinc-400 truncate">{playlist.songCount || 0} canciones</p>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-zinc-800/50 rounded-lg">
                            <p className="text-zinc-400">
                                {isOwnProfile ? "No tienes playlists públicas." : "Este usuario no tiene playlists públicas."}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <UserListModal
                    title={modalTitle}
                    users={modalUsers}
                    isLoading={isModalLoading}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </>
    );
}
