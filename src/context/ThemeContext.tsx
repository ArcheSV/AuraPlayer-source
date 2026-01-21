import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PresetKey = 'minimalista' | 'glass' | 'sunset' | 'ocean' | 'light' | 'midnight';

type SkinKey = 'default' | 'rounded' | 'compact' | 'simple' | 'mono';

interface CustomColors {
    background: string;
    text: string;
    accent: string;
    accentForeground?: string; 
}
interface ThemeState {
    preset: PresetKey;
    skin: SkinKey;
    colors: CustomColors;
}
interface ThemeContextType {
    themeState: ThemeState;
    setThemeState: (newState: Partial<ThemeState> & { skin?: SkinKey }) => void;
}

const presets: Record<PresetKey, CustomColors> = {
    minimalista: {
        background: '#18181b',
        text: '#f4f4f5',
        accent: '#16a34a',
    },
    glass: {
        background: 'rgba(15, 23, 42, 0.6)', 
        text: '#f8fafc',
        accent: '#22c55e',
    },
    sunset: {
        background: '#0b1020',
        text: '#fff7ed',
        accent: '#fb923c',
    },
    ocean: {
        background: '#021b2c',
        text: '#e6f7ff',
        accent: '#06b6d4',
    },
    light: {
        background: '#f7fafc',
        text: '#0f172a',
        accent: '#0ea5b3',
    },
    midnight: {
        background: '#000814',
        text: '#e6eef8',
        accent: '#7c3aed',
    }
};

const defaultThemeState: ThemeState = {
    preset: 'minimalista',
    skin: 'default',
    colors: {
        ...presets.minimalista,
    }
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);


const hexToRgb = (hex: string) => {
    if (!hex) return null;
    const normalized = hex.replace('#', '');
    const bigint = parseInt(normalized.length === 3 ? normalized.split('').map(c => c + c).join('') : normalized, 16);
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
};

const relativeLuminance = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const getContrastForeground = (hex: string) => {
    try {
        const lum = relativeLuminance(hex);
        
        return lum > 0.5 ? '#000000' : '#ffffff';
    } catch {
        return '#ffffff';
    }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [themeState, setThemeStateInternal] = useState<ThemeState>(() => {
        try {
            const savedThemeJSON = localStorage.getItem('aura_theme');
            if (savedThemeJSON) {
                const savedTheme = JSON.parse(savedThemeJSON);
                const preset = (savedTheme.preset || defaultThemeState.preset) as PresetKey;
                const skin = (savedTheme.skin || defaultThemeState.skin) as SkinKey;
                const baseColors = presets[preset] || defaultThemeState.colors;
                const mergedColors: CustomColors = {
                    ...baseColors,
                    ...(savedTheme.colors || {}),
                };
                mergedColors.accentForeground = getContrastForeground(mergedColors.accent);
                return {
                    preset,
                    skin,
                    colors: mergedColors,
                } as ThemeState;
            }
        } catch (error) {
            console.error("No se pudo cargar el tema desde localStorage", error);
        }
        const base = { ...defaultThemeState.colors };
        base.accentForeground = getContrastForeground(base.accent);
        return { preset: defaultThemeState.preset, skin: defaultThemeState.skin, colors: base } as ThemeState;
    });

    useEffect(() => {
        if (themeState && themeState.colors) {
            
            try { document.documentElement.style.setProperty('--app-bg', themeState.colors.background); } catch(e) {}
            try { document.documentElement.style.setProperty('--app-text', themeState.colors.text); } catch(e) {}
            try { document.documentElement.style.setProperty('--accent-foreground', themeState.colors.accentForeground || '#fff'); } catch(e) {}
            try { document.documentElement.style.setProperty('--accent-color', themeState.colors.accent); } catch(e) {}
            
            try { document.body.dataset.skin = themeState.skin; } catch (e) {}

            
            try {
                document.documentElement.classList.add('theme-animating');
                window.setTimeout(() => {
                    document.documentElement.classList.remove('theme-animating');
                }, 700);
            } catch (e) {}

            localStorage.setItem('aura_theme', JSON.stringify(themeState));
        }
    }, [themeState]);

    const setThemeState = (newState: Partial<ThemeState> & { skin?: SkinKey }) => {
        setThemeStateInternal(prev => {
            let nextPreset = prev.preset;
            let nextSkin = prev.skin;
            let baseColors = { ...prev.colors };

            if (newState.preset) {
                nextPreset = newState.preset as PresetKey;
                baseColors = { ...presets[nextPreset] };
            }

            if (newState.skin) {
                nextSkin = newState.skin as SkinKey;
            }

            if (newState.colors) {
                baseColors = { ...baseColors, ...newState.colors };
            }

            
            baseColors.accentForeground = getContrastForeground(baseColors.accent);

            
            if (!newState.colors || !('text' in newState.colors)) {
                
                try {
                    const bg = baseColors.background;
                    if (bg && bg.startsWith('rgba')) {
                        
                        baseColors.text = '#f4f4f5';
                    } else {
                        const lum = relativeLuminance(baseColors.background || '#000');
                        baseColors.text = lum > 0.5 ? '#0f172a' : '#f4f4f5';
                    }
                } catch (e) {
                    baseColors.text = '#f4f4f5';
                }
            }

            const updatedState: ThemeState = {
                preset: nextPreset,
                skin: nextSkin,
                colors: baseColors,
            };

            return updatedState;
        });
    };

    return (
        <ThemeContext.Provider value={{ themeState, setThemeState }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
    }
    return context;
};
