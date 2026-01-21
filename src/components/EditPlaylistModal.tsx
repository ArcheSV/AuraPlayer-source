import React, { useState } from 'react';
import { usePlaylists } from '../context/PlaylistContext';
import { Playlist } from '../services/playlistService';
import toast from 'react-hot-toast';
import { X, Loader2, Globe, Lock } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface EditPlaylistModalProps {
    playlist: Playlist;
    onClose: () => void;
}

export function EditPlaylistModal({ playlist, onClose }: EditPlaylistModalProps) {
    const [name, setName] = useState(playlist.name);
    const [description, setDescription] = useState(playlist.description);
    const [isPublic, setIsPublic] = useState(playlist.isPublic);
    const [isLoading, setIsLoading] = useState(false);
    const { updateUserPlaylist } = usePlaylists();
    const { themeState } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("El nombre de la playlist no puede estar vacío.");
            return;
        }

        setIsLoading(true);
        const toastId = toast.loading('Guardando cambios...');

        try {
            const updates = { name, description, isPublic };
            await updateUserPlaylist(playlist.id, updates);

            toast.dismiss(toastId);
            toast.success("Playlist actualizada con éxito.");
            onClose();
        } catch (error) {
            toast.dismiss(toastId);
            toast.error("No se pudieron guardar los cambios.");
            console.error("Error al actualizar la playlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-zinc-800 p-6 rounded-lg w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Editar detalles</h2>
                    <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-700">
                        <X size={24} />
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nombre de la playlist"
                            className="w-full bg-zinc-700 p-3 rounded focus:outline-none focus:ring-2"
                            style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties}
                        />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Añade una descripción (opcional)"
                            rows={3}
                            className="w-full bg-zinc-700 p-3 rounded resize-none focus:outline-none focus:ring-2"
                            style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties}
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsPublic(true)}
                                className={`flex-1 p-3 rounded flex items-center justify-center gap-2 transition-colors font-medium ${isPublic ? 'text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                                style={{backgroundColor: isPublic ? themeState.colors.accent : ''}}
                            >
                                <Globe size={18}/> Pública
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsPublic(false)}
                                className={`flex-1 p-3 rounded flex items-center justify-center gap-2 transition-colors font-medium ${!isPublic ? 'text-white' : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                                style={{backgroundColor: !isPublic ? themeState.colors.accent : ''}}
                            >
                                <Lock size={18}/> Privada
                            </button>
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full mt-6 text-white font-bold py-3 px-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: themeState?.colors?.accent }}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : "Guardar Cambios"}
                    </button>
                </form>
            </div>
        </div>
    );
}