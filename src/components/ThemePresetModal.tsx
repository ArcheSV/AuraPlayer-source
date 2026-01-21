import React from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from '../context/ThemeContext';

const presetsList = [
  { key: 'minimalista', name: 'Minimalista' },
  { key: 'glass', name: 'Glass' },
  { key: 'sunset', name: 'Sunset' },
  { key: 'ocean', name: 'Ocean' },
  { key: 'light', name: 'Light' },
  { key: 'midnight', name: 'Midnight' },
] as const;

const skinsList = [
  { key: 'default', name: 'Default' },
  { key: 'rounded', name: 'Rounded' },
  { key: 'compact', name: 'Compact' },
  { key: 'simple', name: 'Simple' },
  { key: 'mono', name: 'Mono' },
] as const;

export function ThemePresetModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { themeState, setThemeState } = useTheme();

  if (!open) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white/5 border border-white/10 rounded-2xl p-6 w-[92%] max-w-2xl mx-4 backdrop-blur-md shadow-xl animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Elegir Preset y Skin</h3>
          <button className="text-zinc-300 px-2 py-1" onClick={onClose}>Cerrar</button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {presetsList.map((p) => (
            <button
              key={p.key}
              onClick={() => { setThemeState({ preset: p.key as any }); onClose(); }}
              className={`p-3 rounded-lg text-left border transition-shadow hover:shadow-lg ${themeState.preset === p.key ? 'ring-2 ring-offset-2 ring-white/20' : 'border-white/5'}`}
            >
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-zinc-400 mt-1">Aplica todo el estilo al interfaz</div>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-2">Skins (cambia apariencia de componentes)</h4>
          <div className="flex gap-2 flex-wrap">
            {skinsList.map(s => (
              <button
                key={s.key}
                onClick={() => { setThemeState({ skin: s.key as any }); onClose(); }}
                className={`px-3 py-2 rounded-md text-sm border transition-colors ${themeState.skin === s.key ? 'bg-white/10 border-white/20' : 'bg-transparent border-white/5'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
