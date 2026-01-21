# AuraPlayer

Desktop music player for Windows with YouTube search, playlists, user profiles, and customizable themes. Features automatic updates via GitHub Releases.

## Features

**Core Functionality**
- YouTube music search and playback
- Custom playlists with drag-and-drop
- User authentication (Firebase)
- Cross-device synchronization via cloud
- Recently played tracking
- Personalized recommendations

**Desktop Application**
- Native Windows application
- Automatic updates via GitHub Releases
- Native MP3 downloads with yt-dlp
- Offline-capable search using play-dl
- No API quotas or rate limits

**Appearance**
- Customizable themes and color presets
- Dark mode interface
- Visual effects and animations

## Tech Stack

**Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- React Router v6 for navigation
- Radix UI components
- Lucide icons

**Backend**
- Firebase (Auth + Firestore + Storage)
- play-dl for YouTube scraping
- yt-dlp for audio downloads

**Desktop**
- Electron 40
- electron-builder for packaging
- electron-updater for auto-updates

## Project Structure

```
.
├── src/                    # React application
│   ├── components/         # UI components
│   ├── pages/             # Route pages
│   ├── context/           # React contexts
│   ├── services/          # API services
│   └── hooks/             # Custom hooks
├── electron/              # Electron main process
│   ├── main.ts           # Main process entry
│   └── preload.ts        # Preload script
└── dist/                # Build output
```

## Requirements

- Node.js 18+
- npm or yarn
- yt-dlp installed (for audio downloads)

## Installation

### Clone and Install

```bash
git clone https://github.com/ArcheSV/AuraPlayer-source.git
cd AuraPlayer-source
npm install
```

### Configuration

**Database**: The application uses a shared Firebase database. No configuration needed - all users connect to the same backend automatically.

**Firestore Rules**: The database is configured with security rules that ensure:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      match /recents/{songId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /playlists/{playlistId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Development

### Run in Development Mode

```bash
npm run dev
```

This starts the Electron app in development mode with hot reload.

## Building

### Build Windows Application

```bash
npm run build
```

This generates:
- `dist/AuraPlayer Setup 0.0.1.exe` - Windows installer
- `dist/win-unpacked/` - Portable version
- `dist/latest.yml` - Auto-update metadata

## Auto-Update System

The desktop application includes automatic updates:

1. App checks for updates 3 seconds after launch
2. If new version available, prompts user to download
3. Downloads update in background
4. Installs automatically on app close

### Publishing Updates

1. Update version in `package.json`
2. Build the application
3. Create GitHub Release with version tag
4. Attach the `.exe` file to the release
5. Users will auto-update on next launch

## Architecture

### Search & Playback
- Uses `play-dl` library for YouTube search (no API quota needed)
- ReactPlayer for embedded playback
- Fallback mechanisms for reliability

### Audio Downloads
- yt-dlp spawns native process
- Saves to user-selected location
- Shows progress in real-time

### Data Synchronization
- Recently played songs sync to Firestore in real-time
- Playlists stored per-user in Firestore
- Cross-device sync across all installations

## Known Issues

- Notification system in progress
- User following feature incomplete

## Security Notes

- Firebase credentials are public by design
- Security enforced through Firestore rules
- Each user can only access their own data

## License

MIT

## Author

ArcheSV

## Repository

https://github.com/ArcheSV/AuraPlayer-source
