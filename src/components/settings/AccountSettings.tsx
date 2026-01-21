import React from 'react';
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';
export function AccountSettings() {
    const { themeState } = useTheme();

    const handlePasswordReset = async () => {
        const user = auth.currentUser;
        if (user && user.email) {
            const toastId = toast.loading('Enviando correo...');
            try {
                await sendPasswordResetEmail(auth, user.email);
                toast.dismiss(toastId);
                toast.success(`Enlace de restablecimiento enviado a ${user.email}.`);
            } catch (err) {
                toast.dismiss(toastId);
                toast.error('Ocurrió un error. Inténtalo de nuevo.');
                console.error("Error al enviar el correo de restablecimiento:", err);
            }
        } else {
            toast.error('No se pudo encontrar el correo del usuario actual.');
        }
    };

    return (
        <div className="bg-zinc-800/50 p-4 sm:p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-6">Seguridad de la Cuenta</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="font-medium">Cambiar Contraseña</h3>
                    <p className="text-sm text-zinc-400 mt-1 mb-3">
                        Haremos clic en el botón para enviar un enlace a tu correo electrónico, donde podrás establecer una nueva contraseña de forma segura.
                    </p>
                    <button
                        onClick={handlePasswordReset}
                        className="px-4 py-2 rounded font-semibold text-white transition-opacity hover:opacity-90"
                        style={{ backgroundColor: themeState.colors.accent }}
                    >
                        Enviar enlace de cambio
                    </button>
                </div>
                <div>
                    <h3 className="font-medium">Cambiar Correo Electrónico</h3>
                    <p className="text-sm text-zinc-400 mt-1 mb-3">
                        Esta función requiere volver a autenticar al usuario y aún no está implementada.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input type="email" placeholder="Nuevo correo" disabled className="bg-zinc-700/50 p-2 rounded cursor-not-allowed flex-grow" />
                        <button disabled className="bg-zinc-600/50 px-4 py-2 rounded font-semibold cursor-not-allowed">
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
