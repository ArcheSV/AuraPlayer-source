import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const ColorPicker = ({ label, value, onChange }: { label: string, value: string, onChange: (color: string) => void }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-zinc-700/30 rounded">
            <label className="text-sm text-zinc-300">{label}</label>
            <div className="relative w-10 h-10">
                <input
                    type="color"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div
                    className="w-full h-full rounded border-2 border-white/10"
                    style={{ backgroundColor: value }}
                ></div>
            </div>
        </div>
    );
};

export function AppearanceSettings() {
    const { themeState, setThemeState } = useTheme();
    if (!themeState || !themeState.colors) {
        return <div>Cargando...</div>;
    }

    const handleColorChange = (colorKey: 'background' | 'text' | 'accent', value: string) => {
        
        setThemeState({ colors: { ...themeState.colors, [colorKey]: value } });
    };

    const presets = [
        { key: 'minimalista', label: 'Minimalista' },
        { key: 'glass', label: 'Glass' },
        { key: 'sunset', label: 'Sunset' },
        { key: 'ocean', label: 'Ocean' },
        { key: 'light', label: 'Light' },
        { key: 'midnight', label: 'Midnight' },
    ];

    return (
        <div className="bg-zinc-900/60 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Apariencia</h2>

            <div className="mb-6">
                <label className="block mb-2 text-sm text-zinc-400">Presets</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {presets.map(p => {
                        const isActive = themeState.preset === p.key;
                        return (
                            <button
                                key={p.key}
                                onClick={() => setThemeState({ preset: p.key as any })}
                                className={`p-3 rounded-lg text-left border transition-transform duration-200 hover:scale-105 ${isActive ? 'ring-2 ring-white/20 scale-105' : 'border-white/5'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-16 h-10 rounded-md overflow-hidden border border-white/6 preset-swatch ${isActive ? 'ring-1 ring-white/20' : ''}`}>
                                        {}
                                        <div className="w-full h-full flex flex-col">
                                            <div className="flex-1" style={{ background: `linear-gradient(180deg, ${isActive ? themeState.colors.background : '#0b0b0b'}, ${isActive ? themeState.colors.background : '#111827'})` }} />
                                            <div className="p-1 flex items-center justify-between" style={{ background: isActive ? themeState.colors.accent : '#111827' }}>
                                                <div style={{ width: 18, height: 12, background: isActive ? themeState.colors.accent : '#374151' }} />
                                                <div style={{ width: 20, height: 10, background: isActive ? themeState.colors.accent + '66' : '#6b7280' }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium">{p.label}</div>
                                        <div className="text-xs text-zinc-400 mt-1">Aplica todo el estilo a la interfaz</div>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <h3 className="font-medium mb-3">Acento</h3>
                <div className="grid grid-cols-1 gap-4 max-w-full sm:max-w-sm">
                    <ColorPicker
                        label="Acento"
                        value={themeState.colors.accent}
                        onChange={(color) => handleColorChange('accent', color)}
                    />
                </div>

                <div className="mt-6 p-3 sm:p-4 rounded-lg bg-white/3 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${themeState.colors.accent}, ${themeState.colors.accent}33)`}}>
                        <div style={{ width: 28, height: 28, backgroundColor: themeState.colors.accent, color: themeState.colors.accentForeground }} />
                    </div>
                    <div>
                        <div className="text-sm font-semibold" style={{ color: themeState.colors.text }}>Vista previa</div>
                        <div className="text-xs text-zinc-400">El color de acento controla los circulitos de las esquinas y elementos destacados.</div>
                    </div>
                </div>

                <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-2">Skins</h4>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: 'default', label: 'Default' },
                            { key: 'rounded', label: 'Rounded' },
                            { key: 'compact', label: 'Compact' },
                            { key: 'simple', label: 'Simple' },
                            { key: 'mono', label: 'Mono' },
                        ].map(s => {
                            const active = themeState.skin === s.key;
                            return (
                                <button
                                    key={s.key}
                                    onClick={() => setThemeState({ skin: s.key as any })}
                                    className={`px-3 py-2 rounded-md text-sm border transition-transform duration-200 btn-animated ${active ? 'bg-white/10 border-white/20 shadow-lg transform scale-105' : 'bg-transparent border-white/5'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-6 h-6 rounded ${s.key === 'rounded' ? 'rounded-xl' : 'rounded-md'} border border-white/8`} style={{ background: s.key === 'simple' ? 'linear-gradient(90deg,#ff7a7a,#ffd47a)' : (s.key === 'mono' ? '#0b0b0b' : 'transparent') }} />
                                        <span>{s.label}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
