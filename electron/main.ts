
import { app, BrowserWindow, ipcMain, shell, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import https from 'https';
import handler from 'serve-handler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_PATH = path.join(__dirname, '../dist');
const PUBLIC_PATH = app.isPackaged ? process.resourcesPath : path.join(__dirname, '../public');


app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'MediaSessionService');
app.commandLine.appendSwitch('enable-features', 'WebRtcHideLocalIpsWithMdns');

let win: BrowserWindow | null = null;
let splashWin: BrowserWindow | null = null;

const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createSplashWindow() {
    splashWin = new BrowserWindow({
        width: 400,
        height: 300,
        frame: false,
        transparent: true,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
    });

    splashWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(`
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    width: 100vw;
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    background: linear-gradient(135deg, #10b981 0%, #000000 100%);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    color: white;
                    border-radius: 12px;
                    overflow: hidden;
                }
                h1 { font-size: 24px; margin-bottom: 20px; font-weight: 600; }
                .spinner {
                    width: 50px;
                    height: 50px;
                    border: 4px solid rgba(255,255,255,0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                p { margin-top: 20px; font-size: 14px; opacity: 0.9; }
            </style>
        </head>
        <body>
            <h1>AuraPlayer</h1>
            <div class="spinner"></div>
            <p>Comprobando actualizaciones...</p>
        </body>
        </html>
    `)}`);
}

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true,
            webSecurity: VITE_DEV_SERVER_URL ? true : false,
        },
        title: 'Aura Player',
        icon: path.join(PUBLIC_PATH, 'favicon.ico'),
        frame: true,
        autoHideMenuBar: true,
        backgroundColor: '#18181b',
    });

    win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
        if (permission === 'media') {
            callback(true);
        } else {
            callback(true);
        }
    });

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL);
    } else {
        const server = http.createServer((request, response) => {
            return handler(request, response as any, {
                public: DIST_PATH,
                rewrites: [
                    { source: '**', destination: '/index.html' }
                ]
            });
        });

        const PORT = 45678;
        server.listen(PORT, () => {
            console.log(`[Main] Server running at http://localhost:${PORT}`);
            win?.loadURL(`http://localhost:${PORT}`);
        });
    }

    win.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https:')) shell.openExternal(url);
        return { action: 'deny' };
    });

    win.once('ready-to-show', () => {
        if (splashWin) {
            splashWin.close();
            splashWin = null;
        }
        win?.show();
    });
}

app.on('window-all-closed', () => {
    win = null;
    if (process.platform !== 'darwin') app.quit();
});

app.whenReady().then(() => {
    createSplashWindow();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

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

        let ytDlpPath = '';
        const userDataBin = path.join(app.getPath('userData'), 'bin');
        const userDataExe = path.join(userDataBin, 'yt-dlp.exe');

        if (app.isPackaged) {
            const bundledPath = path.join(process.resourcesPath, 'bin', 'yt-dlp.exe');
            if (fs.existsSync(bundledPath)) {
                ytDlpPath = bundledPath;
            } else if (fs.existsSync(userDataExe)) {
                ytDlpPath = userDataExe;
            }
        } else {
            const devPath = path.join(__dirname, '../../bin/yt-dlp.exe');
            if (fs.existsSync(devPath)) {
                ytDlpPath = devPath;
            } else if (fs.existsSync(userDataExe)) {
                ytDlpPath = userDataExe;
            }
        }

        if (!ytDlpPath) {
            const { response } = await dialog.showMessageBox(win, {
                type: 'question',
                title: 'Componente Necesario',
                message: 'Para descargar música necesitas el componente "yt-dlp".',
                detail: 'No se encontró en el sistema. ¿Quieres descargarlo automáticamente ahora? (Aprox 15MB)',
                buttons: ['Sí, descargar', 'Cancelar'],
                defaultId: 0,
                cancelId: 1
            });

            if (response === 1) {
                console.log('[Main] User refused yt-dlp download');
                return;
            }

            event.sender.send('download-progress', 'Iniciando descarga de componentes...');

            try {
                if (!fs.existsSync(userDataBin)) {
                    fs.mkdirSync(userDataBin, { recursive: true });
                }

                console.log('[Main] Downloading yt-dlp to:', userDataExe);
                const downloadUrl = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe';

                await new Promise<void>((resolve, reject) => {
                    const download = (url: string) => {
                        https.get(url, (res) => {
                            if (res.statusCode === 302 || res.statusCode === 301) {
                                download(res.headers.location!);
                                return;
                            }
                            if (res.statusCode !== 200) {
                                reject(new Error(`Status code: ${res.statusCode}`));
                                return;
                            }
                            const file = fs.createWriteStream(userDataExe);
                            res.pipe(file);
                            file.on('finish', () => {
                                file.close();
                                resolve();
                            });
                            file.on('error', (err) => {
                                fs.unlink(userDataExe, () => { });
                                reject(err);
                            });
                        }).on('error', reject);
                    };
                    download(downloadUrl);
                });

                ytDlpPath = userDataExe;
                console.log('[Main] yt-dlp downloaded successfully');
                event.sender.send('download-progress', 'Componentes instalados. Iniciando descarga de canción...');

            } catch (error: any) {
                console.error('[Main] Failed to download yt-dlp', error);
                dialog.showErrorBox('Error', `No se pudo descargar yt-dlp: ${error.message}`);
                event.sender.send('download-complete', false);
                return;
            }
        }

        console.log('[Main] Using yt-dlp at:', ytDlpPath);

        const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);

        console.log('[Main] Showing save dialog...');
        const { filePath } = await dialog.showSaveDialog(win, {
            title: 'Guardar MP3',
            defaultPath: `${sanitizedTitle}.mp3`,
            filters: [{ name: 'Audio Files', extensions: ['mp3'] }]
        });

        if (!filePath) {
            console.log('[Main] User cancelled download');
            event.sender.send('download-complete', false);
            return;
        }

        console.log('[Main] Descargando en:', filePath);
        event.sender.send('download-progress', `Descargando: ${title}`);

        const ytdlp = spawn(ytDlpPath, [
            '-f', 'bestaudio',
            '--extract-audio',
            '--audio-format', 'mp3',
            '--audio-quality', '0',
            '--progress',
            '--newline',
            '--force-overwrites',
            '-o', filePath,
            videoUrl
        ]);

        ytdlp.stdout.on('data', (data) => {
            const output = data.toString();
            console.log(`[yt-dlp stdout] ${output}`);

            const percentMatch = output.match(/(\d{1,3}(?:\.\d+)?)%/);
            if (percentMatch) {
                const percent = percentMatch[1];
                console.log(`[Main] Sending progress: ${percent}%`);
                event.sender.send('download-progress', `${percent}%`);
            }
        });

        ytdlp.stderr.on('data', (data) => {
            const output = data.toString();
            console.error(`[yt-dlp stderr] ${output}`);
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
    autoUpdater.allowPrerelease = true;

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
