import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export function AdvancedSettings() {
    const { settings, saveSettings } = useSettings();
    const { themeState } = useTheme();
    const [localApiKey, setLocalApiKey] = useState(settings.userApiKey);

    const handleSaveApiKey = () => {
        saveSettings({ userApiKey: localApiKey });
        toast.success('¡API Key guardada correctamente!');
    };

    return (
        <div className="bg-zinc-800/50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Avanzado</h2>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col">
                    <label htmlFor="api-key-input" className="mb-1 font-medium">Tu API Key de YouTube Data v3</label>
                    <p className="text-sm text-zinc-400 mt-1 mb-3">
                        Opcional. Úsala si la clave por defecto de la aplicación alcanza su límite de cuota diario. Puedes obtener la tuya desde la Consola de Google Cloud.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            id="api-key-input"
                            type="password"
                            placeholder="Pega tu API Key aquí"
                            value={localApiKey}
                            onChange={(e) => setLocalApiKey(e.target.value)}
                            className="flex-grow bg-zinc-700 p-2 rounded focus:outline-none focus:ring-2"
                            style={{'--ring-color': themeState.colors.accent} as React.CSSProperties}
                        />
                        <button
                            onClick={handleSaveApiKey}
                            className="px-4 py-2 rounded font-semibold text-white transition-opacity hover:opacity-90"
                            style={{ backgroundColor: themeState.colors.accent }}
                        >
                            Guardar
                        </button>
                    </div>
                </div>

                <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div className="flex-grow">
                        <h3 className="font-medium">Mostrar Recomendados</h3>
                        <p className="text-sm text-zinc-400 mt-1">
                            Activa o desactiva la sección de recomendaciones en Inicio.
                        </p>
                    </div>
                    <button
                        onClick={() => saveSettings({ showRecommendations: !settings.showRecommendations })}
                        className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out flex-shrink-0"
                        style={{ backgroundColor: settings.showRecommendations ? themeState.colors.accent : '#4b5563' } as any}
                    >
                        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${settings.showRecommendations ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

            </div>
        </div>
    );
}
