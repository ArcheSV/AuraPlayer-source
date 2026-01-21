import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Song } from '../services/youtube';

export type LoopMode = 'none' | 'one' | 'all';

interface PlayerState {
  playlist: Song[];
  originalPlaylist: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  isShuffle: boolean;
  loopMode: LoopMode;
  volume: number;
}

interface PlayerContextType {
  playerState: PlayerState;
  currentSong: Song | null;
  loadPlaylist: (songs: Song[], startIndex?: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  toggleShuffle: () => void;
  setLoopMode: (mode: LoopMode) => void;
  setVolume: (volume: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [playerState, setPlayerState] = useState<PlayerState>({
    playlist: [],
    originalPlaylist: [],
    currentSongIndex: -1,
    isPlaying: false,
    isShuffle: false,
    loopMode: 'none',
    volume: 0.8,
  });

  const currentSong = playerState.playlist[playerState.currentSongIndex] || null;


  const loadPlaylist = useCallback((songs: Song[], startIndex: number = 0) => {
    setPlayerState(prev => {
      const newOriginalPlaylist = [...songs];
      const newPlaylist = prev.isShuffle ? shuffleArray([...newOriginalPlaylist]) : newOriginalPlaylist;
      const songToFind = songs[startIndex];
      const newIndex = prev.isShuffle ? newPlaylist.findIndex(s => s.id === songToFind.id) : startIndex;

      return {
        ...prev,
        playlist: newPlaylist,
        originalPlaylist: newOriginalPlaylist,
        currentSongIndex: newIndex >= 0 ? newIndex : 0,
        isPlaying: true,
      };
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (playerState.playlist.length > 0) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
    }
  }, [playerState.playlist.length]);

  const playNext = useCallback(() => {
    if (playerState.playlist.length === 0) return;
    setPlayerState(prev => {
      const nextIndex = prev.currentSongIndex + 1;
      if (nextIndex >= prev.playlist.length) {
        return prev.loopMode === 'all'
            ? { ...prev, currentSongIndex: 0, isPlaying: true }
            : { ...prev, isPlaying: false };
      }
      return { ...prev, currentSongIndex: nextIndex, isPlaying: true };
    });
  }, [playerState.playlist.length]);

  const playPrevious = useCallback(() => {
    if (playerState.playlist.length === 0) return;
    setPlayerState(prev => {
      const prevIndex = prev.currentSongIndex - 1;
      if (prevIndex < 0) {
        return prev.loopMode === 'all'
            ? { ...prev, currentSongIndex: prev.playlist.length - 1, isPlaying: true }
            : prev;
      }
      return { ...prev, currentSongIndex: prevIndex, isPlaying: true };
    });
  }, [playerState.playlist.length]);

  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => {
      const newShuffleState = !prev.isShuffle;
      const songToKeep = prev.playlist[prev.currentSongIndex];
      if (!songToKeep) return prev;

      if (newShuffleState) {
        const shuffled = shuffleArray([...prev.originalPlaylist].filter(s => s.id !== songToKeep.id));
        return { ...prev, isShuffle: true, playlist: [songToKeep, ...shuffled], currentSongIndex: 0 };
      } else {
        const newIndex = prev.originalPlaylist.findIndex(s => s.id === songToKeep.id);
        return { ...prev, isShuffle: false, playlist: [...prev.originalPlaylist], currentSongIndex: newIndex >= 0 ? newIndex : 0 };
      }
    });
  }, []);

  const setLoopMode = useCallback((mode: LoopMode) => {
    setPlayerState(prev => ({ ...prev, loopMode: mode }));
  }, []);

  const setVolume = useCallback((volume: number) => {
    setPlayerState(prev => ({ ...prev, volume }));
  }, []);

  return (
      <PlayerContext.Provider
          value={{ playerState, currentSong, loadPlaylist, togglePlay, playNext, playPrevious, toggleShuffle, setLoopMode, setVolume }}
      >
        {children}
      </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer debe ser usado dentro de un PlayerProvider');
  }
  return context;
};

function shuffleArray<T>(array: T[]): T[] {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}