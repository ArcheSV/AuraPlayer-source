
const INVIDIOUS_INSTANCES = [
  'https://invidious.fdn.fr',
  'https://inv.nadeko.net',
  'https://invidious.privacyredirect.com',
  'https://inv.riverside.rocks',
  'https://invidious.nerdvpn.de',
];

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi-libre.kavin.rocks',
];

const YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3/search";

export interface Song {
  id: string;
  title: string;
  thumbnail: string;
  channel: string;
}




const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '';

async function searchWithBackendProxy(query: string): Promise<Song[]> {
  try {
    
    
    
    const res = await fetch(`${API_URL}/api/invidious-proxy?q=${encodeURIComponent(query)}&type=search`);

    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (e) {
    console.error('Backend proxy search failed:', e);
  }
  return [];
}

async function relatedWithBackendProxy(videoId: string): Promise<Song[]> {
  try {
    const res = await fetch(`${API_URL}/api/invidious-proxy?q=${encodeURIComponent(videoId)}&type=related`);

    if (res.ok) {
      const data = await res.json();
      if (data.items && Array.isArray(data.items)) {
        return data.items;
      }
    }
  } catch (e) {
    console.error('Backend proxy related failed:', e);
  }
  return [];
}



async function searchWithYouTubeAPI(query: string, apiKey: string): Promise<Song[]> {
  try {
    const res = await fetch(
      `${YOUTUBE_API_URL}?part=snippet&q=${encodeURIComponent(query)}&type=video&key=${encodeURIComponent(apiKey)}&maxResults=40`
    );
    if (res.ok) {
      const data = await res.json();
      return processYouTubeSearchData(data);
    }
  } catch (e) {
    console.error('YouTube API error:', e);
  }
  return [];
}

async function relatedWithYouTubeAPI(videoId: string, apiKey: string): Promise<Song[]> {
  try {
    const res = await fetch(
      `${YOUTUBE_API_URL}?part=snippet&relatedToVideoId=${encodeURIComponent(videoId)}&type=video&key=${encodeURIComponent(apiKey)}&maxResults=25`
    );
    if (res.ok) {
      const data = await res.json();
      return processYouTubeSearchData(data);
    }
  } catch (e) {
    console.error('YouTube API error:', e);
  }
  return [];
}

function processYouTubeSearchData(data: any): Song[] {
  if (!data || !Array.isArray(data.items)) return [];
  return data.items
    .filter((item: any) => item.id && (item.id.videoId || item.id.kind === 'youtube#video'))
    .map((item: any) => ({
      id: item.id.videoId || item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
      channel: item.snippet.channelTitle,
    }));
}



export async function searchSongs(
  query: string,
  userApiKey?: string,
  isPrecise: boolean = false
): Promise<Song[]> {
  console.log(`🔍 Searching: "${query}" (precise: ${isPrecise})`);

  
  if (window.electronAPI) {
    try {
      console.log('🖥️ Using Electron Desktop Backend');
      const data = await window.electronAPI.searchSong(query);
      if (data.items && Array.isArray(data.items)) {
        return isPrecise ? applyPreciseFilter(data.items, query) : data.items;
      }
    } catch (e) {
      console.error('Electron IPC error:', e);
    }
  }

  
  let results = await searchWithBackendProxy(query);
  if (results.length > 0) {
    console.log(`✅ Found ${results.length} results via Backend Proxy`);
    return isPrecise ? applyPreciseFilter(results, query) : results;
  }

  
  if (userApiKey) {
    console.log('⚠️ Using YouTube API (user key) as fallback');
    results = await searchWithYouTubeAPI(query, userApiKey);
    return isPrecise ? applyPreciseFilter(results, query) : results;
  }

  console.warn('❌ All search methods failed for query:', query);
  return [];
}

export async function relatedSongs(videoId: string, userApiKey?: string): Promise<Song[]> {
  console.log(`🔗 Finding related songs for: ${videoId}`);

  
  let results = await relatedWithBackendProxy(videoId);
  if (results.length > 0) {
    console.log(`✅ Found ${results.length} related via Backend Proxy`);
    return results;
  }

  
  if (userApiKey) {
    console.log('⚠️ Using YouTube API (user key) for related songs');
    return await relatedWithYouTubeAPI(videoId, userApiKey);
  }

  console.warn('❌ Could not find related songs for:', videoId);
  return [];
}



function applyPreciseFilter(songs: Song[], query: string): Song[] {
  const queryLower = query.toLowerCase();

  const scoredItems = songs.map((song: Song) => {
    let score = 0;
    const title = song.title.toLowerCase();
    const channel = song.channel.toLowerCase();

    
    if (channel.endsWith(' - topic')) score += 100;
    if (channel.includes('vevo')) score += 100;

    
    const artistGuess = queryLower.split(' ')[0];
    if (channel.replace(/\s/g, '').includes(artistGuess)) score += 50;

    
    const officialKeywords = [
      'official video', 'official audio', 'video oficial',
      'audio oficial', 'official lyric video'
    ];
    if (officialKeywords.some(keyword => title.includes(keyword))) score += 20;

    
    const nonStudioKeywords = [
      'cover', 'live', 'directo', 'en vivo', 'unplugged',
      'acústico', 'tutorial', 'reacción', 'reaction'
    ];
    if (nonStudioKeywords.some(keyword => title.includes(keyword))) score -= 50;

    
    const otherKeywords = ['remix', 'lyrics', 'letra', 'karaoke'];
    if (otherKeywords.some(keyword => title.includes(keyword))) score -= 20;

    return { song, score };
  });

  return scoredItems
    .sort((a, b) => b.score - a.score)
    .map(item => item.song);
}
