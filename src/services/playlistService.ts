import { db, auth, storage } from './firebase'; 
import {
    collection,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    serverTimestamp,
    writeBatch,
    increment,
    orderBy,
    limit,
    collectionGroup,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Song as YoutubeSong } from './youtube';



export interface Playlist {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    ownerName: string;
    isPublic: boolean;
    coverArtURL: string;
    songCount: number;
    createdAt: any;
}

export interface PlaylistSong {
    id: string;
    title: string;
    thumbnail: string;
    channel: string;
    addedAt: any;
}




export const createPlaylist = async (name: string, isPublic: boolean, description: string = ''): Promise<string> => {
    const user = auth.currentUser;
    if (!user) throw new Error("Usuario no autenticado.");

    const playlistsCollectionRef = collection(db, 'playlists');
    const defaultCoverArt = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=18181b&color=fff&bold=true`;

    const newPlaylistData = {
        name, description, isPublic,
        ownerId: user.uid,
        ownerName: user.displayName || 'Usuario Anónimo',
        coverArtURL: defaultCoverArt,
        createdAt: serverTimestamp(),
        songCount: 0,
    };

    const docRef = await addDoc(playlistsCollectionRef, newPlaylistData);
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
};

export const getPlaylistById = async (playlistId: string): Promise<Playlist | null> => {
    const playlistDocRef = doc(db, 'playlists', playlistId);
    const docSnap = await getDoc(playlistDocRef);
    return docSnap.exists() ? docSnap.data() as Playlist : null;
};

export const getUserPlaylists = async (userId: string): Promise<Playlist[]> => {
    const q = query(collection(db, 'playlists'), where('ownerId', '==', userId), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Playlist);
};

export const updatePlaylistDetails = async (playlistId: string, updates: { name?: string; description?: string; isPublic?: boolean }) => {
    const playlistRef = doc(db, 'playlists', playlistId);
    await updateDoc(playlistRef, updates);
};

export const updatePlaylistCover = async (playlistId: string, newCoverURL: string): Promise<void> => {
    if (!playlistId || !newCoverURL) {
        throw new Error("Faltan datos para actualizar la portada.");
    }
    const playlistRef = doc(db, 'playlists', playlistId);
    await updateDoc(playlistRef, { coverArtURL: newCoverURL });
};

export const deletePlaylist = async (playlistId: string) => {
    const playlistRef = doc(db, 'playlists', playlistId);

    
    const songsRef = collection(db, `playlists/${playlistId}/songs`);
    const songsSnapshot = await getDocs(songsRef);
    const batch = writeBatch(db);
    songsSnapshot.forEach(songDoc => {
        batch.delete(songDoc.ref);
    });
    await batch.commit();

    
    await deleteDoc(playlistRef);
};




export const addSongToPlaylist = async (playlistId: string, song: YoutubeSong): Promise<void> => {
    const playlistRef = doc(db, 'playlists', playlistId);
    const songRef = doc(db, `playlists/${playlistId}/songs`, song.id);

    
    const songSnap = await getDoc(songRef);
    if (songSnap.exists()) {
        throw new Error("Esta canción ya está en la playlist.");
    }

    const batch = writeBatch(db);
    batch.set(songRef, {
        id: song.id, title: song.title, thumbnail: song.thumbnail,
        channel: song.channel, addedAt: serverTimestamp(),
    });
    batch.update(playlistRef, { songCount: increment(1) });
    await batch.commit();
};

export const removeSongFromPlaylist = async (playlistId: string, songId: string): Promise<void> => {
    const playlistRef = doc(db, 'playlists', playlistId);
    const songRef = doc(db, `playlists/${playlistId}/songs`, songId);

    const batch = writeBatch(db);
    batch.delete(songRef);
    batch.update(playlistRef, { songCount: increment(-1) });
    await batch.commit();
};

export const getSongsFromPlaylist = async (playlistId: string): Promise<PlaylistSong[]> => {
    const songsRef = collection(db, `playlists/${playlistId}/songs`);
    const q = query(songsRef, orderBy('addedAt', 'asc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as PlaylistSong);
};