import React, { useEffect } from 'react';
import { Play, MoreHorizontal, Plus, Download } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { Song } from '../services/youtube';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { usePlaylists } from '../context/PlaylistContext';
import { addSongToPlaylist } from '../services/playlistService';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

interface SearchResultsProps {
    songs: Song[];
}

export function SearchResults({ songs }: SearchResultsProps) {
    const { loadPlaylist } = usePlayer();
    const { playlists } = usePlaylists();
    const { themeState } = useTheme();

    
    useEffect(() => {
        if (!window.electronAPI) return;

        const handleProgress = (_event: any, message: string) => {
            console.log('[Download Progress]', message);
        };

        const handleComplete = (_event: any, success: boolean) => {
            if (success) {
                toast.success('¡Descarga completada! El archivo se guardó correctamente.', {
                    duration: 4000,
                    icon: '✅'
                });
            } else {
                toast.error('Error al descargar el archivo.', {
                    duration: 4000,
                    icon: '❌'
                });
            }
        };

        window.electronAPI.onDownloadProgress(handleProgress);
        window.electronAPI.onDownloadComplete(handleComplete);

        return () => {
            window.electronAPI?.removeListener('download-progress', handleProgress);
            window.electronAPI?.removeListener('download-complete', handleComplete);
        };
    }, []);

    const handleAddSong = async (playlistId: string, song: Song) => {
        const toastId = toast.loading('Añadiendo canción...');
        try {
            await addSongToPlaylist(playlistId, song);
            toast.dismiss(toastId);
            toast.success(`¡Canción añadida con éxito!`);
        } catch (error: any) {
            toast.dismiss(toastId);
            if (error.message.includes("ya está en la playlist")) {
                toast.error("Esta canción ya está en la playlist.");
            } else {
                toast.error("No se pudo añadir la canción.");
            }
            console.error("Error al añadir canción:", error);
        }
    };

    const handlePlayFromSearch = (clickedSongIndex: number) => {
        loadPlaylist(songs, clickedSongIndex);
    };

    const handleDownload = (songId: string, songTitle: string) => {
        
        if (window.electronAPI) {
            toast('Iniciando descarga...', { icon: '🖥️' });
            window.electronAPI.downloadSong(songId, songTitle);
            return;
        }

        
        const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';
        const downloadUrl = `${API_URL}/api/download?id=${songId}`;

        
        window.open(downloadUrl, '_blank');
        toast.success(`Descargando: ${songTitle}`);
    };

    if (songs.length === 0) {
        return (
            <div className="text-center text-zinc-400 mt-10">
                <h2 className="text-2xl font-bold">Empieza a buscar</h2>
                <p>Encuentra tu música favorita para empezar a escuchar.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {songs.map((song, index) => (
                <div key={song.id} className="bg-white/5 border border-white/10 p-3 rounded-xl flex flex-col gap-2 hover:bg-white/10 transition-all group relative hover:-translate-y-0.5">

                    <div className="relative w-full aspect-square overflow-hidden rounded-lg bg-zinc-700/40">
                        <img
                            src={song.thumbnail}
                            alt={song.title}
                            className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                    </div>

                    <strong className="font-semibold text-sm truncate mt-2">{song.title}</strong>
                    <span className="text-xs text-zinc-400 truncate">{song.channel}</span>

                    <button
                        onClick={() => handlePlayFromSearch(index)}
                        className="w-12 h-12 flex items-center justify-center pl-1 rounded-full absolute bottom-20 right-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-hover:-translate-y-2 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-foreground)' }}
                    >
                        <Play fill="currentColor" />
                    </button>

                    <div className="absolute top-2 right-2">
                        <DropdownMenu.Root>
                            <DropdownMenu.Trigger asChild>
                                <button className="p-1 rounded-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity bg-black/50">
                                    <MoreHorizontal size={20} />
                                </button>
                            </DropdownMenu.Trigger>

                            <DropdownMenu.Portal>
                                <DropdownMenu.Content
                                    className="w-56 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-md p-1 shadow-xl text-sm z-20 menu-blur menu-blur-anim"
                                    sideOffset={5} align="end"
                                >
                                    <DropdownMenu.Sub>
                                        <DropdownMenu.SubTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-white/5">
                                            <Plus size={16} />
                                            <span>Añadir a playlist</span>
                                        </DropdownMenu.SubTrigger>
                                        <DropdownMenu.Portal>
                                            <DropdownMenu.SubContent className="w-56 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-md p-1 shadow-xl text-sm z-30 menu-blur menu-blur-anim" sideOffset={-4} alignOffset={-5}>
                                                {playlists.length > 0 ? (
                                                    playlists.map(playlist => (
                                                        <DropdownMenu.Item
                                                            key={playlist.id}
                                                            onSelect={() => handleAddSong(playlist.id, song)}
                                                            className="px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-white/5"
                                                        >
                                                            {playlist.name}
                                                        </DropdownMenu.Item>
                                                    ))
                                                ) : (
                                                    <DropdownMenu.Label className="px-2 py-1.5 text-xs text-zinc-400">
                                                        No tienes playlists. Crea una primero.
                                                    </DropdownMenu.Label>
                                                )}
                                            </DropdownMenu.SubContent>
                                        </DropdownMenu.Portal>
                                    </DropdownMenu.Sub>

                                    <DropdownMenu.Item
                                        onSelect={() => handleDownload(song.id, song.title)}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-white/5"
                                    >
                                        <Download size={16} />
                                        <span>Descargar MP3</span>
                                    </DropdownMenu.Item>
                                </DropdownMenu.Content>
                            </DropdownMenu.Portal>
                        </DropdownMenu.Root>
                    </div>
                </div>
            ))}
        </div>
    );
}
