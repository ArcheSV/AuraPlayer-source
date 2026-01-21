import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { PlayerControls } from './components/PlayerControls';

import { useTheme } from './context/ThemeContext';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserSearchPage } from './pages/UserSearchPage';
import { PlaylistPage } from './pages/PlaylistPage';

const MainApp = () => {
  const { themeState } = useTheme();

  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden theme-pulse">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full blur-3xl animate-float" style={{ backgroundColor: 'var(--accent-color)', opacity: 0.12 }} />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl animate-float-slow" style={{ backgroundColor: 'var(--accent-color)', opacity: 0.08 }} />
      </div>
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isMobileOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto pb-40 sm:pb-32 m-0 sm:m-4 ml-0 rounded-none sm:rounded-2xl bg-transparent sm:bg-white/5 backdrop-blur-none sm:backdrop-blur-sm border-0 sm:border sm:border-white/10">
          <Header onOpenMenu={() => setIsSidebarOpen(true)} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/users" element={<UserSearchPage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings/*" element={<SettingsPage />} />
            <Route path="/playlist/:playlistId" element={<PlaylistPage />} /> { }
          </Routes>
        </main>
      </div>
      {}
      <PlayerControls />
    </div>
  );
};

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen bg-zinc-900" />;
  }

  if (user) {
    if (user.emailVerified) {
      return <MainApp />;
    } else {
      return <VerifyEmailPage />;
    }
  } else {
    return <LoginPage />;
  }
}
