import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
    getPlaylistById,
    getSongsFromPlaylist,
    updatePlaylistCover,
    removeSongFromPlaylist,
    Playlist,
    PlaylistSong
} from '../services/playlistService';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { usePlaylists } from '../context/PlaylistContext';
import { useTheme } from '../context/ThemeContext';
import { Loader2, Clock, Play, Edit, Trash2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { EditPlaylistModal } from '../components/EditPlaylistModal';

export function PlaylistPage() {
    const { playlistId } = useParams<{ playlistId: string }>();
    const { loadPlaylist } = usePlayer();
    const { user } = useAuth();
    const { updateUserPlaylist } = usePlaylists()
    const { themeState } = useTheme();

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [songs, setSongs] = useState<PlaylistSong[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const isOwner = user?.uid === playlist?.ownerId;

    useEffect(() => {
        if (!playlistId) return;

        const fetchPlaylistData = async () => {
            setIsLoading(true);
            try {
                const playlistDetails = await getPlaylistById(playlistId);
                if (!playlistDetails) {
                    toast.error("No se pudo encontrar esta playlist.");
                    return;
                }
                setPlaylist(playlistDetails);

                const playlistSongs = await getSongsFromPlaylist(playlistId);
                setSongs(playlistSongs);

            } catch (error) {
                console.error("Error al cargar la playlist:", error);
                toast.error("Hubo un error al cargar la playlist.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlaylistData();
    }, [playlistId]);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const items = Array.from(songs);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setSongs(items);
        toast.success("Orden actualizado visualmente.");
    };

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !playlist) {
            return;
        }

        const file = e.target.files[0];
        const toastId = toast.loading('Subiendo nueva portada...');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'aura_player_preset'); 

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/dnt9ii3g4/image/upload`,
                {
                    method: 'POST',
                    body: formData,
                }
            );
            const data = await response.json();

            if (!data.secure_url) {
                throw new Error('Fallo en la subida a Cloudinary.');
            }

            const newCoverURL = data.secure_url;

            await updatePlaylistCover(playlist.id, newCoverURL);
            const updatedPlaylist = { ...playlist, coverArtURL: newCoverURL };
            setPlaylist(updatedPlaylist);
            updateUserPlaylist(playlist.id, { coverArtURL: newCoverURL });
            toast.dismiss(toastId);
            toast.success("¡Portada actualizada!");

        } catch (error) {
            toast.dismiss(toastId);
            toast.error("No se pudo cambiar la portada.");
            console.error("Error al cambiar la portada:", error);
        }
    };

    const handleRemoveSong = async (songId: string) => {
        if (!playlist) return;
        if (window.confirm("¿Seguro que quieres eliminar esta canción de la playlist?")) {
            const toastId = toast.loading("Eliminando canción...");
            try {
                await removeSongFromPlaylist(playlist.id, songId);
                setSongs(s => s.filter(song => song.id !== songId));
                const newSongCount = Math.max(0, (playlist.songCount || 0) - 1);
                setPlaylist(p => p ? { ...p, songCount: newSongCount } : null);
                updateUserPlaylist(playlist.id, { songCount: newSongCount });
                toast.dismiss(toastId);
                toast.success("Canción eliminada.");
            } catch (error) {
                toast.dismiss(toastId);
                toast.error("No se pudo eliminar la canción.");
            }
        }
    };

    const handlePlaySong = (clickedSongIndex: number) => {
        const formattedSongs = songs.map(song => ({
            id: song.id,
            title: song.title,
            thumbnail: song.thumbnail,
            channel: song.channel,
        }));
        loadPlaylist(formattedSongs, clickedSongIndex);
    };

    if (isLoading) {
        return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto" size={32} /></div>;
    }
    if (!playlist) {
        return <div className="text-center p-10">Playlist no encontrada.</div>;
    }

    return (
        <>
            <div>
                <div className="flex flex-col md:flex-row items-center md:items-end gap-6 mb-8 group relative">
                    <div className="relative flex-shrink-0">
                        <img src={playlist.coverArtURL} alt={`Portada de ${playlist.name}`} className="w-48 h-48 md:w-56 md:h-56 object-cover rounded-lg shadow-2xl bg-zinc-800" />
                        {isOwner && (
                            <label htmlFor="cover-upload" className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Edit size={40} />
                                <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                            </label>
                        )}
                    </div>
                    <div className="flex flex-col gap-2 text-center md:text-left">
                        <span className="text-sm font-bold">Playlist {playlist.isPublic ? 'Pública' : 'Privada'}</span>
                        <div className="flex items-center gap-2 justify-center md:justify-start">
                            <h1 className="text-4xl md:text-6xl font-black break-words">{playlist.name}</h1>
                            {isOwner && <button onClick={() => setIsEditModalOpen(true)} className="p-2 rounded-full hover:bg-zinc-800/50"><Edit/></button>}
                        </div>
                        <p className="text-zinc-400 text-sm">{playlist.description}</p>
                        <div className="flex items-center gap-2 mt-2 justify-center md:justify-start text-sm">
                            <Link to={`/profile/${playlist.ownerId}`} className="font-semibold hover:underline">{playlist.ownerName}</Link>
                            <span className="text-zinc-400">• {playlist.songCount} canciones</span>
                        </div>
                    </div>
                </div>

                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="grid grid-cols-[auto,1fr,auto] gap-4 px-4 py-2 text-sm text-zinc-400 border-b border-zinc-800">
                        <div className="text-center w-8">#</div>
                        <div>Título</div>
                        <div className="w-8"></div>
                    </div>
                    <Droppable droppableId="songs">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {songs.map((song, index) => (
                                    <Draggable key={song.id} draggableId={song.id} index={index} isDragDisabled={!isOwner}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`grid grid-cols-[auto,1fr,auto] gap-4 items-center p-2 rounded-md group ${snapshot.isDragging ? 'bg-zinc-700 shadow-lg' : 'hover:bg-zinc-800/50'}`}
                                            >
                                                <div className="flex items-center justify-center w-8 text-zinc-400">
                                                    {isOwner ? (
                                                        <div {...provided.dragHandleProps} className="cursor-grab p-1 relative z-10">
                                                            <GripVertical size={18} />
                                                        </div>
                                                    ) : (
                                                        <span className="w-full text-center">{index + 1}</span>
                                                    )}
                                                </div>
                                                <div
                                                    className="flex items-center gap-4"
                                                    onDoubleClick={() => handlePlaySong(index)}
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <img src={song.thumbnail} alt={song.title} className="w-10 h-10 rounded" />
                                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                            <button onClick={() => handlePlaySong(index)} className="text-white">
                                                                <Play size={24} fill="white" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold">{song.title}</p>
                                                        <p className="text-sm text-zinc-400">{song.channel}</p>
                                                    </div>
                                                </div>

                                                <div className="w-8 text-right">
                                                    {isOwner && (
                                                        <button onClick={() => handleRemoveSong(song.id)} className="p-1 text-zinc-400 hover:text-white opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={16}/>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
                {songs.length === 0 && !isLoading && (
                    <p className="text-center text-zinc-500 py-10">Esta playlist aún no tiene canciones. ¡Añade algunas desde la búsqueda!</p>
                )}
            </div>

            {isEditModalOpen && playlist && (
                <EditPlaylistModal playlist={playlist} onClose={() => setIsEditModalOpen(false)} />
            )}
        </>
    );
}
