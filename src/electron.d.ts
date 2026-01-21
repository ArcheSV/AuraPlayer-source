export interface ElectronAPI {
    searchSong: (query: string) => Promise<{ items: any[] }>;
    downloadSong: (videoId: string, title: string) => void;
    onDownloadProgress: (callback: (event: any, data: string) => void) => void;
    onDownloadComplete: (callback: (event: any, success: boolean) => void) => void;
    removeListener: (channel: string, func: any) => void;
}

declare global {
    interface Window {
        electronAPI?: ElectronAPI;
    }
}
