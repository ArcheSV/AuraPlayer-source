import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
    userApiKey: string;
    isPreciseSearch: boolean;
    showRecommendations: boolean;
}

interface SettingsContextType {
    settings: Settings;
    saveSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
    userApiKey: '',
    isPreciseSearch: true,
    showRecommendations: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const savedSettings = localStorage.getItem('aura_settings');
            return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
        } catch {
            return defaultSettings;
        }
    });

    useEffect(() => {
        localStorage.setItem('aura_settings', JSON.stringify(settings));
    }, [settings]);

    const saveSettings = (newSettings: Partial<Settings>) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    return (
        <SettingsContext.Provider value={{ settings, saveSettings }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings debe ser usado dentro de un SettingsProvider');
    }
    return context;
};
