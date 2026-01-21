import React, { useState, useRef, useEffect } from 'react';
import { usePlayer, LoopMode } from '../context/PlayerContext';
import ReactPlayer from 'react-player';
import * as Slider from '@radix-ui/react-slider';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, Volume1, VolumeX,
  Shuffle, Repeat, Repeat1, Download
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { addRecent, addRecentCloud } from '../services/recentService';
import toast from 'react-hot-toast';

interface ProgressState {
  played: number;
  playedSeconds: number;
  loaded: number;
  loadedSeconds: number;
}

export function PlayerControls() {
  const {
    playerState,
    currentSong,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    setLoopMode,
    setVolume
  } = usePlayer();

  const { themeState } = useTheme();
  const { user } = useAuth();
  const playerRef = useRef<any>(null);

  const [progress, setProgress] = useState<ProgressState>({ played: 0, playedSeconds: 0, loaded: 0, loadedSeconds: 0 });
  const [duration, setDuration] = useState(0);
  const [playerError, setPlayerError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    setProgress({ played: 0, playedSeconds: 0, loaded: 0, loadedSeconds: 0 });
  }, [currentSong]);


  useEffect(() => {
    if (!window.electronAPI) return;

    const handleProgress = (_event: any, message: string) => {
      console.log('[Download Progress]', message);
      if (message.includes('%')) {
        const percent = parseFloat(message.replace('%', ''));
        if (!isNaN(percent)) {
          setDownloadProgress(percent);
        }
      }
    };

    const handleComplete = (_event: any, success: boolean) => {
      setIsDownloading(false);
      setDownloadProgress(0);
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

  const handleProgress = (state: ProgressState) => {
    setProgress(state);
  };

  const handleDuration = (duration: number) => {
    setDuration(duration);
  };

  const handleSeek = (value: number[]) => {
    if (playerRef.current) {
      playerRef.current.seekTo(value[0], 'fraction');
    }
  };

  const handleLoop = () => {
    const modes: LoopMode[] = ['none', 'all', 'one'];
    const currentIndex = modes.indexOf(playerState.loopMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setLoopMode(modes[nextIndex]);
  };

  const handleOnEnded = () => {
    if (playerState.loopMode !== 'one') {
      playNext();
    }
  };

  const handlePlayPrevious = () => {
    if (progress.playedSeconds > 3) {
      playerRef.current?.seekTo(0);
    } else {
      playPrevious();
    }
  };

  const handleDownload = () => {
    if (!currentSong) return;


    if (window.electronAPI) {
      if (isDownloading) return;
      setIsDownloading(true);
      setDownloadProgress(0);
      toast('Iniciando descarga...', { icon: '🖥️' });
      window.electronAPI.downloadSong(currentSong.id, currentSong.title);
      return;
    }


    const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';
    const downloadUrl = `${API_URL}/api/download?id=${currentSong.id}`;
    window.open(downloadUrl, '_blank');
    toast.success(`Descargando: ${currentSong.title}`);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  if (!currentSong) {
    return <footer className="fixed bottom-0 left-0 right-0 h-[92px] bg-zinc-900 border-t border-zinc-700 flex items-center justify-center"><p className="text-zinc-500">Selecciona una canción para reproducir</p></footer>;
  }

  const canGoNext = playerState.currentSongIndex < playerState.playlist.length - 1 || playerState.loopMode === 'all';
  const canGoPrevious = true;

  return (
    <>
      <div className="hidden">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentSong.id}`}
          playing={playerState.isPlaying}
          volume={playerState.volume}
          muted={false}
          loop={playerState.loopMode === 'one'}
          onEnded={handleOnEnded}
          onProgress={handleProgress}
          onDuration={handleDuration}
          controls={false}
          width="1px"
          height="1px"
          onError={(e) => {
            console.error('ReactPlayer error', e);
            try {
              toast.error('No se pudo reproducir la canción (YouTube).');
              setPlayerError(true);
              if (playerState.isPlaying) togglePlay();
            } catch (e) { }
          }}
          onPlay={() => { try { if (currentSong) { addRecent(user?.uid, currentSong); if (user?.uid) addRecentCloud(user.uid, currentSong); } } catch (e) { } }}
          config={{
            youtube: {
              playerVars: {
                origin: typeof window !== 'undefined' ? window.location.origin : undefined,
                enablejsapi: 1,
                modestbranding: 1,
                rel: 0,
                playsinline: 1
              }
            }
          } as any}
        />
      </div>
      <footer className="fixed bottom-0 left-0 right-0 bg-zinc-900/80 backdrop-blur-md border-t border-zinc-700 px-3 sm:px-6 py-3 sm:py-4 flex items-center gap-3 sm:gap-6 z-10" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
        <div className="hidden sm:flex items-center gap-3 w-64">
          <img src={currentSong.thumbnail} width={56} height={56} alt={currentSong.title} className="rounded" />
          <div className="flex flex-col overflow-hidden">
            <strong className="font-normal text-sm truncate">{currentSong.title}</strong>
            <span className="text-xs text-zinc-400 truncate">{currentSong.channel}</span>
          </div>
        </div>
        {playerError && (
          <div className="absolute left-1/2 -translate-x-1/2 -top-12 bg-red-600/90 text-white px-3 py-1 rounded-md shadow-md z-50 flex items-center gap-3">
            <span>No se pudo reproducir en este entorno.</span>
            <button onClick={() => {

              setPlayerError(false);

              if (!playerState.isPlaying) togglePlay();
              toast('Reintentando...');
            }} className="px-2 py-1 bg-white/10 rounded">Reintentar</button>
            <a target="_blank" rel="noreferrer" href={`https://www.youtube.com/watch?v=${currentSong.id}`} className="px-2 py-1 bg-white/10 rounded">Abrir en YouTube</a>
          </div>
        )}

        <div className="flex flex-col items-center gap-2 flex-1">
          { }
          <div className="sm:hidden w-full flex items-center gap-2 justify-center -mt-1">
            <span className="text-xs text-zinc-300 truncate max-w-[60vw]">{currentSong.title}</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <button onClick={toggleShuffle} className="text-zinc-400 hover:text-white" title="Aleatorio">
              <Shuffle size={20} color={playerState.isShuffle ? themeState.colors.accent : 'currentColor'} />
            </button>
            <button onClick={handlePlayPrevious} className="text-zinc-400 hover:text-white" title="Anterior">
              <SkipBack size={20} />
            </button>
            <button onClick={togglePlay} className="w-10 h-10 flex items-center justify-center rounded-full hover:scale-105 transition-transform" style={{ backgroundColor: 'var(--accent-color)', color: 'var(--accent-foreground)' }}>
              {playerState.isPlaying ? <Pause size={20} color={'currentColor'} /> : <Play size={20} color={'currentColor'} className="pl-0.5" />}
            </button>
            <button onClick={playNext} className="text-zinc-400 hover:text-white disabled:text-zinc-600 disabled:cursor-not-allowed" disabled={!canGoNext} title="Siguiente">
              <SkipForward size={20} />
            </button>
            <button onClick={handleLoop} className="text-zinc-400 hover:text-white relative" title="Repetir">
              {playerState.loopMode === 'one' && <Repeat1 size={20} color={themeState.colors.accent} />}
              {playerState.loopMode === 'all' && <Repeat size={20} color={themeState.colors.accent} />}
              {playerState.loopMode === 'none' && <Repeat size={20} />}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-zinc-400 w-10 text-right">{formatTime(progress.playedSeconds)}</span>
            <Slider.Root
              className="relative flex items-center select-none touch-none w-full h-1 cursor-pointer group"
              value={[progress.played]} max={1} step={0.001}
              onValueChange={handleSeek}
            >
              <Slider.Track className="bg-zinc-600 relative grow rounded-full h-1">
                <Slider.Range className="absolute rounded-full h-full" style={{ backgroundColor: themeState.colors.accent }} />
              </Slider.Track>
              <Slider.Thumb className="block w-3 h-3 bg-white shadow-md rounded-full focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" />
            </Slider.Root>
            <span className="text-xs text-zinc-400 w-10">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 w-64 justify-end">
          {isDownloading ? (
            <div className="flex flex-col w-24 mr-2">
              <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                <span>Descargando</span>
                <span>{Math.round(downloadProgress)}%</span>
              </div>
              <div className="bg-zinc-700 h-1 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-300 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <button onClick={handleDownload} className="text-zinc-400 hover:text-white mr-2" title="Descargar MP3">
              <Download size={20} />
            </button>
          )}
          {playerState.volume > 0.5 && <Volume2 size={20} />}
          {playerState.volume > 0 && playerState.volume <= 0.5 && <Volume1 size={20} />}
          {playerState.volume === 0 && <VolumeX size={20} />}
          <Slider.Root
            className="relative flex items-center select-none touch-none w-24 h-1 cursor-pointer group"
            value={[playerState.volume]} max={1} step={0.01}
            onValueChange={(value) => setVolume(value[0])}
          >
            <Slider.Track className="bg-zinc-600 relative grow rounded-full h-1">
              <Slider.Range className="absolute rounded-full h-full" style={{ backgroundColor: themeState.colors.accent }} />
            </Slider.Track>
            <Slider.Thumb className="block w-3 h-3 bg-white shadow-md rounded-full focus:outline-none opacity-0 group-hover:opacity-100 transition-opacity" />
          </Slider.Root>
        </div>
      </footer>
    </>
  );
}
