const { ipcRenderer, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    searchSong: (query) => ipcRenderer.invoke('search-song', query),
    downloadSong: (videoId, title) => ipcRenderer.send('download-song', { videoId, title }),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
    removeListener: (channel, func) => {
        ipcRenderer.removeListener(channel, func);
    }
});
