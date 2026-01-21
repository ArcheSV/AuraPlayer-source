import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchUsers } from '../services/userService';
import { UserProfile as UserProfileType } from '../services/userService';
import { UserCircle, Search, Loader2 } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function UserSearchPage() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserProfileType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { themeState } = useTheme();
    const { user: currentUser } = useAuth();

    const debouncedQuery = useDebounce(query, 500);

    useEffect(() => {
        const fetchUsers = async () => {
            if (debouncedQuery.trim()) {
                setIsLoading(true);
                try {
                    const users = await searchUsers(debouncedQuery);
                    const filteredUsers = users.filter(user => user.uid !== currentUser?.uid);

                    setResults(filteredUsers);
                } catch (error) {
                    console.error("Error al buscar usuarios:", error);
                    toast.error("No se pudo realizar la búsqueda.");
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
            }
        };

        fetchUsers();
    }, [debouncedQuery, currentUser]); 

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Buscar Usuarios</h1>
            <div className="relative mb-8">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Busca por nombre de usuario..."
                    className="bg-zinc-800/50 text-sm focus:outline-none rounded-full py-3 pl-12 pr-4 w-full"
                    style={{'--ring-color': themeState?.colors?.accent, outlineColor: 'transparent'} as React.CSSProperties}
                    onFocus={(e) => e.target.style.outlineColor = themeState?.colors?.accent || ''}
                    onBlur={(e) => e.target.style.outlineColor = 'transparent'}
                />
                <Search className="w-5 h-5 text-zinc-400 absolute top-1/2 left-4 -translate-y-1/2" />
            </div>

            <div className="space-y-3">
                {isLoading && (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin" />
                    </div>
                )}
                {!isLoading && results.length > 0 && results.map(user => (
                    <Link
                        to={`/profile/${user.uid}`}
                        key={user.uid}
                        className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-700/50 transition-colors"
                    >
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <UserCircle className="w-12 h-12 text-zinc-500" />
                        )}
                        <div>
                            <p className="font-semibold">{user.displayName}</p>
                            <p className="text-sm text-zinc-400">{user.followerCount || 0} seguidores</p>
                        </div>
                    </Link>
                ))}
                {!isLoading && results.length === 0 && debouncedQuery && (
                    <p className="text-center text-zinc-400 py-8">No se encontraron usuarios con ese nombre.</p>
                )}
                {!isLoading && !debouncedQuery && (
                    <p className="text-center text-zinc-400 py-8">Escribe en la barra para empezar a buscar usuarios.</p>
                )}
            </div>
        </div>
    );
}