import React, { useState, forwardRef, useImperativeHandle, useRef } from 'react';
import { getRecents } from '../services/recentService';
import { useAuth } from '../context/AuthContext';

function MusicChatInner(_props: any, ref: React.Ref<HTMLInputElement>) {
  const [messages, setMessages] = useState<{from: 'user'|'bot', text: string}[]>([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { user } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [isAdminEmail, setIsAdminEmail] = useState(false);
  
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!user || !user.uid) { if (mounted) setIsAdminEmail(false); return; }
        const { getUserProfile } = await import('../services/userService');
        const profile = await getUserProfile(user.uid);
        if (mounted) setIsAdminEmail(Boolean(profile && profile.email === 'clatshroyale@gmail.com'));
      } catch (e) { if (mounted) setIsAdminEmail(false); }
    })();
    return () => { mounted = false; };
  }, [user]);

  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const mergedRecents = () => {
    try {
      const anon = getRecents(null) || [];
      const userList = user && user.uid ? getRecents(user.uid) : [];
      const seen = new Set<string>();
      const merged: { id?: string; title?: string; thumbnail?: string; channel?: string }[] = [];
      for (const s of [...userList, ...anon]) {
        if (!s || !s.id) continue;
        if (seen.has(s.id)) continue;
        seen.add(s.id);
        merged.push(s);
        if (merged.length >= 7) break;
      }
      return merged.map(r => ({ title: r.title, artists: r.channel }));
    } catch (e) { return []; }
  };

  const send = async () => {
    const text = value.trim();
    if (!text) return;
    const userMsg = { from: 'user' as const, text };
    setMessages(m => [...m, userMsg]);
    setValue('');
    setLoading(true);
    try {
      const recents = mergedRecents();
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: text, recents, debug: debugMode }) });
      if (!r.ok) {
        const t = await r.text();
        setMessages(m => [...m, { from: 'bot', text: 'Error del servidor: ' + t }]);
        setLoading(false);
        return;
      }
      const j = await r.json();
      const reply = j.reply || 'No hay respuesta.';
      setMessages(m => [...m, { from: 'bot', text: reply }]);
    } catch (e) {
      setMessages(m => [...m, { from: 'bot', text: 'Error de red' }]);
    } finally {
      setLoading(false);
    }
  };

  const exportRecents = () => {
    try {
      const recents = mergedRecents();
      const payload = { recents };
      const text = JSON.stringify(payload, null, 2);
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).catch(()=>{});
      }
      
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'recents.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="bg-white/3 rounded p-4">
      <h3 className="text-lg font-semibold mb-3">Chat IA musical</h3>
      <div className="h-56 overflow-auto bg-black/10 rounded p-3 mb-3">
        {messages.length === 0 ? (
          <div className="text-zinc-400">Pregunta sobre canciones, playlists o BPMs. Ej: "Qué canciones me recomiendas según mis últimas escuchas?"</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`mb-3 ${m.from === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`${m.from === 'user' ? 'inline-block bg-emerald-600 text-white' : 'inline-block bg-white/10 text-zinc-100'} px-3 py-2 rounded`}>{m.text}</div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2 items-center">
        <input ref={inputRef} value={value} onKeyDown={onKey} onChange={e=>setValue(e.target.value)} className="flex-1 rounded-full py-2 px-4 bg-white/5 border border-white/10 focus:outline-none" placeholder="Haz una pregunta sobre música..." />
        {isAdminEmail ? (
          <>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={debugMode} onChange={(e)=>setDebugMode(e.target.checked)} className="w-4 h-4" />
              <span className="text-zinc-300">Enviar debug</span>
            </label>
            <button onClick={exportRecents} className="px-3 py-2 rounded bg-zinc-700 text-white/90">Exportar recents</button>
          </>
        ) : null}
        <button onClick={send} disabled={loading} className="px-4 py-2 rounded bg-emerald-600 text-white">{loading ? '...' : 'Enviar'}</button>
      </div>
    </div>
  );
}

export default forwardRef(MusicChatInner);
