import React from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';

const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: (checked: boolean) => void }) => {
    const { themeState } = useTheme();
    return (
        <button
            onClick={() => onChange(!checked)}
            className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out flex-shrink-0"
            style={{ backgroundColor: checked ? themeState.colors.accent : '#4b5563' }}
        >
      <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${checked ? 'translate-x-6' : 'translate-x-1'}`}
      />
        </button>
    );
};

export function SearchSettings() {
    const { settings, saveSettings } = useSettings();
    return (
        <div className="bg-zinc-800/50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Búsqueda</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex-grow">
                    <h3 className="font-medium">Búsqueda Precisa (Solo Música)</h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Recomendado. Filtra los resultados para mostrar solo canales "Topic", VEVO y audios oficiales, y ordena por relevancia.
                    </p>
                </div>
                <ToggleSwitch
                    checked={settings.isPreciseSearch}
                    onChange={(checked) => saveSettings({ isPreciseSearch: checked })}
                />
            </div>
        </div>
    );
}
