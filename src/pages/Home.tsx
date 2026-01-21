import React, { useEffect, useState } from 'react';
import { SearchResults } from '../components/SearchResults';
import { searchSongs, relatedSongs, Song } from '../services/youtube';
import { Search } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { getRecents, setLocalRecents, subscribeRecentsCloud, seedCloudFromLocalIfEmpty } from '../services/recentService';
import toast from 'react-hot-toast';


export function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recents, setRecents] = useState<Song[]>([]);
  const { settings } = useSettings();
  const { user } = useAuth();

  useEffect(() => {
    let unsub: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (user?.uid) {
          await seedCloudFromLocalIfEmpty(user.uid);
          if (cancelled) return;
          unsub = subscribeRecentsCloud(user.uid, (list) => {
            setRecents(list);
            setLocalRecents(user.uid!, list);
          });
        } else {
          setRecents(getRecents(null));
        }
      } catch {
        setRecents(getRecents(user?.uid));
      }
    })();
    return () => { cancelled = true; if (unsub) unsub(); };
  }, [user?.uid]);

  
  
  

  const isSameDay = (ts1: number, ts2: number) => {
    const d1 = new Date(ts1), d2 = new Date(ts2);
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  };

  useEffect(() => {
    
  }, [recents, settings.userApiKey, user?.uid]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      const songs = await searchSongs(query, settings.userApiKey, settings.isPreciseSearch);
      setResults(songs);
    } catch (error) {
      console.error(error);
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleSearch} className="relative mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busca artistas, canciones o podcasts..."
          className="bg-white/5 backdrop-blur-sm border border-white/10 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none rounded-full py-3 pl-12 pr-4 w-full placeholder:text-zinc-400"
        />
        <Search className="w-5 h-5 text-zinc-400 absolute top-1/2 left-4 -translate-y-1/2" />
      </form>

      {isLoading ? (
        <div className="text-center text-zinc-400 mt-10">
          <p>Buscando...</p>
        </div>
      ) : (
        results.length > 0 ? (
          <SearchResults songs={results} />
        ) : (
          recents.length > 0 ? (
            <div className="space-y-8">
              <section>
                <h2 className="text-lg font-semibold mb-3">Escuchado recientemente</h2>
                <SearchResults songs={recents} />
              </section>
              {}
            </div>
          ) : (
            <SearchResults songs={[]} />
          )
        )
      )}
    </div>
  );
}
