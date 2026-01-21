import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app';
import './index.css';
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PlayerProvider } from './context/PlayerContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { PlaylistProvider } from './context/PlaylistContext';


const _origWarn = console.warn.bind(console);
const _origError = console.error.bind(console);
const _suppressMsg = 'Support for defaultProps will be removed from memo components';
console.warn = (...args: any[]) => {
    try {
        if (typeof args[0] === 'string' && args[0].includes(_suppressMsg)) return;
    } catch (e) { }
    _origWarn(...args);
};
console.error = (...args: any[]) => {
    try {
        if (typeof args[0] === 'string' && args[0].includes(_suppressMsg)) return;
    } catch (e) { }
    _origError(...args);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
    <HashRouter>
        <AuthProvider>
            <ThemeProvider>
                <SettingsProvider>
                    <PlaylistProvider>
                        <PlayerProvider>
                            <App />
                        </PlayerProvider>
                    </PlaylistProvider>
                </SettingsProvider>
            </ThemeProvider>
        </AuthProvider>
    </HashRouter>
);
