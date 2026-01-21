import React from 'react';
import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { auth, db } from '../services/firebase';
import { doc, writeBatch } from 'firebase/firestore';
import { Bell, ChevronLeft, ChevronRight, LogOut, Settings as SettingsIcon, User as UserIcon, UserCircle, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getUserProfile } from '../services/userService';
import Badge from './Badge';

type HeaderProps = { onOpenMenu?: () => void };
export function Header({ onOpenMenu }: HeaderProps) {
    const { user } = useAuth();
    const { themeState } = useTheme();
    const { notifications, unreadCount } = useNotifications();
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                if (user && user.uid) {
                    const p = await getUserProfile(user.uid);
                    if (mounted) setProfile(p);
                } else {
                    if (mounted) setProfile(null);
                }
            } catch (e) { if (mounted) setProfile(null); }
        })();
        return () => { mounted = false; };
    }, [user]);

    const handleLogout = () => { auth.signOut(); };

    const handleOpenNotifications = async (isOpen: boolean) => {
        if (isOpen && unreadCount > 0 && user) {
            try {
                const batch = writeBatch(db);
                notifications.forEach(n => {
                    if (!n.read) {
                        const notifRef = doc(db, `users/${user.uid}/notifications`, n.id);
                        batch.update(notifRef, { read: true });
                    }
                });
                await batch.commit();
            } catch (error) {
                console.error("Error al marcar notificaciones como leídas:", error);
            }
        }
    };

    const accent = themeState.colors.accent;
    const accentFg = themeState.colors.accentForeground;

    return (
        <header className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
                <button onClick={onOpenMenu} className="md:hidden rounded-full p-2 transition-all duration-200 transform hover:scale-105" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.04)`, boxShadow: `0 6px 18px var(--accent-color)22` }}><Menu /></button>
                <div className="hidden md:flex items-center gap-3">
                    <button className="rounded-full p-1.5 transition-all duration-200 transform hover:scale-105" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.04)`, boxShadow: `0 6px 18px var(--accent-color)22` }}><ChevronLeft /></button>
                    <button className="rounded-full p-1.5 transition-all duration-200 transform hover:scale-105" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.04)`, boxShadow: `0 6px 18px var(--accent-color)22` }}><ChevronRight /></button>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <DropdownMenu.Root onOpenChange={handleOpenNotifications}>
                    <DropdownMenu.Trigger asChild>
                        <button className="p-2 rounded-full relative transition-all duration-200 transform hover:scale-105" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.03)` }}>
                            <Bell />
                            {unreadCount > 0 && (
                                <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full" style={{ backgroundColor: 'var(--accent-color)' }}></span>
                            )}

                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className="w-80 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-md p-2 shadow-xl mt-2 text-sm z-50 menu-blur menu-blur-anim" sideOffset={5}>
                            <DropdownMenu.Label className="px-2 py-1.5 font-semibold">Notificaciones</DropdownMenu.Label>
                            <div className='max-h-80 overflow-y-auto'>
                                {notifications.length > 0 ? notifications.map(n => (
                                    <DropdownMenu.Item key={n.id} asChild>
                                        <Link to={`/profile/${n.fromUserId}`} className="flex items-center gap-3 px-2 py-2 rounded-sm outline-none cursor-pointer hover:bg-white/5">
                                            <img src={n.fromUserPhotoURL} alt={n.fromUserName} className='w-10 h-10 rounded-full object-cover' />
                                            <p className='flex-1 text-zinc-300'><strong className='text-white font-medium'>{n.fromUserName}</strong> ha comenzado a seguirte.</p>
                                            {!n.read && <div className='w-2 h-2 rounded-full' style={{ backgroundColor: 'var(--accent-color)' }} />}
                                        </Link>
                                    </DropdownMenu.Item>
                                )) : <p className='text-zinc-400 text-center py-4'>No hay notificaciones nuevas.</p>}
                            </div>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>

                <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                        <button className="flex items-center gap-2 rounded-full p-1 pr-3 transition-all duration-200 transform hover:scale-105" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
                            {user?.photoURL ? (<img src={user.photoURL} alt="Perfil" className="w-8 h-8 rounded-full object-cover" />) : (<UserCircle className="w-8 h-8 text-zinc-400" />)}
                            <span className="font-semibold text-sm max-w-[140px] truncate hidden sm:block">{(profile && profile.displayName) || user?.displayName || user?.email}</span>
                            {profile && Array.isArray(profile.badges) && profile.badges.map((b: any) => (
                                <Badge key={b.id || b.name} badge={{ id: b.id || b.name, name: b.name, imgUrl: b.imgUrl, emoji: b.emoji }} size={12} />
                            ))}
                        </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                        <DropdownMenu.Content className="w-56 bg-zinc-900/90 backdrop-blur-md border border-white/10 rounded-md p-1 shadow-xl mt-2 text-sm z-50 menu-blur menu-blur-anim" sideOffset={5}>
                            <DropdownMenu.Label className="px-2 py-1.5 text-xs text-zinc-400">Sesión iniciada como {user?.displayName}</DropdownMenu.Label>
                            <DropdownMenu.Separator className="h-[1px] bg-white/10 m-1" />
                            <Link to={`/profile/${user?.uid}`}>
                                <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-white/5">
                                    <UserIcon size={16} /><span>Mi Perfil</span>
                                </DropdownMenu.Item>
                            </Link>
                            <Link to="/settings/appearance">
                                <DropdownMenu.Item className="flex items-center gap-2 px-2 py-1.5 rounded-sm outline-none cursor-pointer hover:bg-white/5">
                                    <SettingsIcon size={16} /><span>Configuración</span>
                                </DropdownMenu.Item>
                            </Link>
                            <DropdownMenu.Separator className="h-[1px] bg-white/10 m-1" />
                            <DropdownMenu.Item onSelect={handleLogout} className="flex items-center gap-2 px-2 py-1.5 rounded-sm outline-none cursor-pointer text-red-400 hover:text-red-300 hover:bg-red-600/20">
                                <LogOut size={16} /><span>Cerrar sesión</span>
                            </DropdownMenu.Item>
                        </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                </DropdownMenu.Root>
            </div>
        </header>
    );
}
