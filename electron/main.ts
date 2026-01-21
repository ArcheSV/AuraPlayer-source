


import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = path.join(__dirname, '../dist');
const PUBLIC_PATH = app.isPackaged ? DIST_PATH : path.join(__dirname, '../public');

let win: BrowserWindow | null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        title: 'Aura Player',
        icon: path.join(PUBLIC_PATH, 'favicon.ico'),
        frame: true,
        autoHideMenuBar: true,
        backgroundColor: '#18181b',
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {

        win.loadFile(path.join(DIST_PATH, 'index.html'));
    }

    win.webContents.openDevTools();

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });
}

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
    createWindow();


    ipcMain.handle('search-song', async (event, query) => {
        try {
            console.log('[Main] Buscando:', query);
            const playDl = await import('play-dl');
            const searchResults = await playDl.search(query, { limit: 25, source: { youtube: 'video' } });

            const songs = searchResults.map((video: any) => ({
                id: video.id,
                title: video.title || '',
                thumbnail: video.thumbnails?.[0]?.url || '',
                channel: video.channel?.name || 'Unknown',
                duration: video.durationRaw || '',
                views: video.views || 0,
            }));

            console.log(`[Main] Found ${songs.length} results`);
            return { items: songs };
        } catch (error) {
            console.error('[Main] Search error:', error);
            return { items: [] };
        }
    });

    ipcMain.on('download-song', async (event, data) => {
        const { videoId, title } = data;
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
        console.log('[Main] download-song IPC received', { videoId, title });

        const win = BrowserWindow.getFocusedWindow();
        if (!win) {
            console.error('[Main] No focused window found');
            return;
        }


        const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);

        console.log('[Main] Showing save dialog...');
        const { filePath } = await dialog.showSaveDialog(win, {
            title: 'Guardar MP3',
            defaultPath: `${sanitizedTitle}.mp3`,
            filters: [{ name: 'Audio Files', extensions: ['mp3'] }]
        });

        if (!filePath) {
            console.log('[Main] User cancelled download');
            return;
        }

        console.log('[Main] Descargando en:', filePath);
        event.sender.send('download-progress', `Descargando: ${title}`);

        const ytdlp = spawn('yt-dlp', [
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--progress',
            '--newline',
            '-o', filePath,
            videoUrl
        ]);

        ytdlp.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[yt-dlp] ${output}`);


            if (output.includes('[download]') && output.includes('%')) {
                const match = output.match(/(\d+\.\d+)%/);
                if (match) {
                    event.sender.send('download-progress', `Descargando: ${match[1]}%`);
                }
            }
        });

        ytdlp.stderr.on('data', (data) => {
            console.error(`[yt-dlp error] ${data}`);
        });

        ytdlp.on('close', (code) => {
            console.log(`[Main] yt-dlp exited with code ${code}`);
            if (code === 0) {
                event.sender.send('download-complete', true);
                shell.showItemInFolder(filePath);
            } else {
                event.sender.send('download-complete', false);
            }
        });
    });

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('update-available', (info) => {
        console.log('[AutoUpdater] Update available:', info.version);
        if (win) {
            dialog.showMessageBox(win, {
                type: 'info',
                title: 'Actualización Disponible',
                message: `Nueva versión ${info.version} disponible. ¿Descargar ahora?`,
                buttons: ['Sí', 'Más tarde']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.downloadUpdate();
                }
            });
        }
    });

    autoUpdater.on('update-not-available', () => {
        console.log('[AutoUpdater] No updates available');
    });

    autoUpdater.on('download-progress', (progress) => {
        console.log(`[AutoUpdater] Download progress: ${progress.percent.toFixed(2)}%`);
    });

    autoUpdater.on('update-downloaded', () => {
        console.log('[AutoUpdater] Update downloaded');
        if (win) {
            dialog.showMessageBox(win, {
                type: 'info',
                title: 'Actualización Lista',
                message: 'La actualización se instalará al cerrar la aplicación.',
                buttons: ['Reiniciar Ahora', 'Más Tarde']
            }).then((result) => {
                if (result.response === 0) {
                    autoUpdater.quitAndInstall();
                }
            });
        }
    });

    autoUpdater.on('error', (err) => {
        console.error('[AutoUpdater] Error:', err);
    });

    setTimeout(() => {
        autoUpdater.checkForUpdates();
    }, 3000);
});
