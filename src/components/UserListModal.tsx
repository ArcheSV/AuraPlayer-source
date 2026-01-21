import React from 'react';
import { Link } from 'react-router-dom';
import { UserProfile as UserProfileType } from '../services/userService';
import { UserCircle, X } from 'lucide-react';

interface UserListModalProps {
    title: string;
    users: UserProfileType[];
    isLoading: boolean;
    onClose: () => void;
}

export function UserListModal({ title, users, isLoading, onClose }: UserListModalProps) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-800 rounded-lg shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-zinc-700">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-700">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4 overflow-y-auto">
                    {isLoading && <p className="text-center">Cargando...</p>}
                    {!isLoading && users.length === 0 && <p className="text-center text-zinc-400">No hay usuarios que mostrar.</p>}
                    <div className="space-y-3">
                        {!isLoading && users.map(user => (
                            <Link to={`/profile/${user.uid}`} onClick={onClose} key={user.uid} className="flex items-center gap-4 p-2 rounded-lg hover:bg-zinc-700/50">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-full object-cover" />
                                ) : (
                                    <UserCircle className="w-10 h-10 text-zinc-500" />
                                )}
                                <span className="font-medium">{user.displayName}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}