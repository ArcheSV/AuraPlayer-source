import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
    createPlaylist,
    getUserPlaylists,
    deletePlaylist as deletePlaylistService,
    updatePlaylistDetails as updatePlaylistDetailsService,
    Playlist
} from '../services/playlistService';
import { auth } from '../services/firebase';

interface PlaylistContextType {
    playlists: Playlist[];
    isLoading: boolean;
    createNewPlaylist: (name: string, isPublic: boolean, description?: string) => Promise<string>;
    updateUserPlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
    deleteUserPlaylist: (playlistId: string) => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);


export const PlaylistProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getUserPlaylists(user.uid)
                .then(userPlaylists => {
                    setPlaylists(userPlaylists);
                })
                .catch(error => {
                    console.error("Error al cargar las playlists del usuario:", error);
                })
                .finally(() => setIsLoading(false));
        } else {
            setPlaylists([]);
            setIsLoading(false);
        }
    }, [user]);

    const createNewPlaylist = useCallback(async (name: string, isPublic: boolean, description: string = ''): Promise<string> => {
        try {
            const newPlaylistId = await createPlaylist(name, isPublic, description);
            const user = auth.currentUser!;
            const newPlaylistObject: Playlist = {
                id: newPlaylistId,
                name,
                description,
                isPublic,
                ownerId: user.uid,
                ownerName: user.displayName || 'Usuario Anónimo',
                coverArtURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=18181b&color=fff&bold=true`,
                songCount: 0,
                createdAt: { toDate: () => new Date() },
            };

            setPlaylists(prevPlaylists => [newPlaylistObject, ...prevPlaylists]);
            return newPlaylistId;
        } catch (error) {
            console.error("Error en createNewPlaylist (Context):", error);
            throw error;
        }
    }, []);

    const updateUserPlaylist = useCallback(async (playlistId: string, updates: Partial<Playlist>) => {
        try {
            await updatePlaylistDetailsService(playlistId, updates);
            setPlaylists(prev => prev.map(p => p.id === playlistId ? { ...p, ...updates } : p));
        } catch (error) {
            console.error("Error al actualizar la playlist (Context):", error);
            throw error;
        }
    }, []);

    const deleteUserPlaylist = useCallback(async (playlistId: string) => {
        try {
            await deletePlaylistService(playlistId);
            setPlaylists(prev => prev.filter(p => p.id !== playlistId));
        } catch (error) {
            console.error("Error al borrar la playlist (Context):", error);
            throw error;
        }
    }, []);


    return (
        <PlaylistContext.Provider value={{ playlists, isLoading, createNewPlaylist, updateUserPlaylist, deleteUserPlaylist }}>
            {children}
        </PlaylistContext.Provider>
    );
};



export const usePlaylists = () => {
    const context = useContext(PlaylistContext);
    if (context === undefined) {
        throw new Error('usePlaylists debe ser usado dentro de un PlaylistProvider');
    }
    return context;
};