import React from 'react';
import { auth } from '../services/firebase';
import { useTheme } from '../context/ThemeContext';
import { MailCheck } from 'lucide-react';

export function VerifyEmailPage() {
    const { themeState } = useTheme();

    const handleLogout = () => {
        auth.signOut();
    };

    
    const handleRefresh = () => {
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center text-center p-4">
            <div className="w-full max-w-md p-8 bg-zinc-800 rounded-lg shadow-lg">
                <MailCheck className="mx-auto h-16 w-16" style={{ color: themeState?.colors?.accent }}/>
                <h1 className="text-3xl font-bold text-white mt-4">¡Un último paso!</h1>
                <p className="text-zinc-300 mt-2">
                    Hemos enviado un enlace de verificación a tu correo electrónico:
                </p>
                <p className="font-semibold text-white mt-2 mb-6">{auth.currentUser?.email}</p>
                <p className="text-sm text-zinc-400">
                    Por favor, haz clic en el enlace para activar tu cuenta. Si no lo encuentras, revisa tu carpeta de spam.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleRefresh}
                        className="w-full sm:w-auto text-white font-bold py-2 px-6 rounded-full transition-opacity hover:opacity-90"
                        style={{ backgroundColor: themeState?.colors?.accent }}
                    >
                        Ya lo he verificado
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full sm:w-auto bg-zinc-600 hover:bg-zinc-700 text-white font-bold py-2 px-6 rounded-full transition-colors"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    );
}