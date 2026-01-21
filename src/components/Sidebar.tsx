import React, { useState } from 'react';
import { Home, Users, Settings, Library, Plus, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { usePlaylists } from '../context/PlaylistContext';
import { CreatePlaylistModal } from './CreatePlaylistModal';
import { useTheme } from '../context/ThemeContext';

type SidebarProps = { isMobileOpen?: boolean; onClose?: () => void };

export function Sidebar({ isMobileOpen = false, onClose }: SidebarProps) {
  const { playlists, isLoading } = usePlaylists();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { themeState } = useTheme();

  const getLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const baseClasses = 'flex flex-row items-center gap-4 text-base font-semibold p-3 rounded-lg transition-all duration-200 transform';

    return isActive
        ? `${baseClasses} text-white` : `${baseClasses} text-zinc-300 hover:text-white hover:scale-105`;
  };

  return (
      <>
        {}
        <aside className="hidden md:flex w-72 m-3 md:m-4 mr-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-col">
          <nav className="space-y-2">
            <NavLink to="/" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
              <Home size={24} />
              <span>Inicio</span>
            </NavLink>
            <NavLink to="/users" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
              <Users size={24} />
              <span>Buscar Usuarios</span>
            </NavLink>
            <NavLink to="/settings/appearance" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
              <Settings size={24} />
              <span>Configuración</span>
            </NavLink>
          </nav>

          <div className="mt-6 pt-6 border-t border-white/10 flex flex-col flex-1 min-h-0">
            <div className='flex items-center justify-between mb-4'>
              <div className="flex items-center gap-3 text-zinc-300 cursor-default">
                <Library size={24} />
                <span className="text-sm font-bold">Tu Biblioteca</span>
              </div>
              <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="text-zinc-300 p-2 rounded-full transition-all duration-200 transform hover:scale-110"
                  title="Crear nueva playlist"
                  style={{ backgroundColor: 'rgba(255,255,255,0.02)', boxShadow: `0 6px 18px var(--accent-color)22`, border: '1px solid rgba(255,255,255,0.03)'}}
              >
                <Plus size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto space-y-1 pr-2">
              {isLoading ? (
                  <p className="text-sm text-zinc-400 px-2">Cargando...</p>
              ) : (
                  playlists.length > 0 ? playlists.map(playlist => (
                      <NavLink
                          to={`/playlist/${playlist.id}`}
                          key={playlist.id}
                          onClick={onClose}
                          className={({isActive}) => `block p-2 rounded text-sm truncate transition-colors border border-transparent ${isActive ? 'text-white bg-white/10 border-white/10' : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/5 hover:border-white/10'}`}
                      >
                        {playlist.name}
                      </NavLink>
                  )) : (
                      <div className="text-center text-sm text-zinc-500 p-4 bg-white/5 rounded-lg border border-white/10">
                        <p>Crea tu primera playlist.</p>
                      </div>
                  )
              )}
            </nav>
          </div>
        </aside>

        {}
        <div className={`md:hidden ${isMobileOpen ? 'fixed inset-0 z-40' : 'pointer-events-none fixed inset-0 z-40'}`} aria-hidden={!isMobileOpen}>
          {}
          <div
            className={`absolute inset-0 bg-black/50 transition-opacity ${isMobileOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={onClose}
          />
          {}
          <aside className={`absolute top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-zinc-900/95 backdrop-blur-md border-r border-white/10 p-4 flex flex-col transform transition-transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-zinc-300">
                <Library size={20} />
                <span className="text-sm font-semibold">Tu Biblioteca</span>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5">
                <X size={18} />
              </button>
            </div>

            <nav className="space-y-2 mt-2">
              <NavLink to="/" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
                <Home size={24} />
                <span>Inicio</span>
              </NavLink>
              <NavLink to="/users" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
                <Users size={24} />
                <span>Buscar Usuarios</span>
              </NavLink>
              <NavLink to="/settings/appearance" className={getLinkClassName} onClick={onClose} style={({isActive}) => isActive ? { boxShadow: `inset 4px 0 0 var(--accent-color)` } : undefined}>
                <Settings size={24} />
                <span>Configuración</span>
              </NavLink>
            </nav>

            <div className="mt-6 pt-4 border-t border-white/10 flex flex-col flex-1 min-h-0">
              <div className='flex items-center justify-between mb-3'>
                <div className="flex items-center gap-2 text-zinc-300 cursor-default">
                  <span className="text-xs font-semibold">Playlists</span>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="text-zinc-300 p-2 rounded-full transition-all duration-200 transform hover:scale-110"
                    title="Crear nueva playlist"
                    style={{ backgroundColor: 'rgba(255,255,255,0.02)', boxShadow: `0 6px 18px var(--accent-color)22`, border: '1px solid rgba(255,255,255,0.03)'}}
                >
                  <Plus size={18} />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto space-y-1 pr-1">
                {isLoading ? (
                    <p className="text-sm text-zinc-400 px-2">Cargando...</p>
                ) : (
                    playlists.length > 0 ? playlists.map(playlist => (
                        <NavLink
                            to={`/playlist/${playlist.id}`}
                            key={playlist.id}
                            onClick={onClose}
                            className={({isActive}) => `block p-2 rounded text-sm truncate transition-colors border border-transparent ${isActive ? 'text-white bg-white/10 border-white/10' : 'text-zinc-300 hover:text-zinc-100 hover:bg-white/5 hover:border-white/10'}`}
                        >
                          {playlist.name}
                        </NavLink>
                    )) : (
                        <div className="text-center text-sm text-zinc-500 p-4 bg-white/5 rounded-lg border border-white/10">
                          <p>Crea tu primera playlist.</p>
                        </div>
                    )
                )}
              </nav>
            </div>
          </aside>
        </div>

        {isCreateModalOpen && <CreatePlaylistModal onClose={() => setIsCreateModalOpen(false)} />}
      </>
  );
}
