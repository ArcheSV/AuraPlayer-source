import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, db } from '../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useTheme } from '../context/ThemeContext';
import { Loader2, ArrowLeft } from 'lucide-react';

export function Login() {
  const [view, setView] = useState<'login' | 'register' | 'forgotPassword'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { themeState } = useTheme();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      if (view === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        if (displayName.trim() === '') {
          throw new Error('Por favor, introduce un nombre de usuario.');
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128`;
        await sendEmailVerification(user);
        try {
          await Promise.all([
            updateProfile(user, {
              displayName: displayName,
              photoURL: avatarUrl
            }),
            setDoc(doc(db, "users", user.uid), {
              uid: user.uid,
              displayName: displayName,
              email: user.email,
              photoURL: avatarUrl,
              createdAt: serverTimestamp(),
              followerCount: 0,
              followingCount: 0,
              bio: ''
            })
          ]);
        } catch (profileError) {
          console.error("Error secundario al crear el perfil en la base de datos:", profileError);}
      }
    } catch (err: any) {
      if (err.message === 'Por favor, introduce un nombre de usuario.') {
        setError(err.message);
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Este correo electrónico ya está registrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('La combinación de correo y contraseña es incorrecta.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, introduce tu correo electrónico.');
      return;
    }
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Correo de restablecimiento enviado. Revisa tu bandeja de entrada.');
      setView('login');
    } catch (err: any) {
      setError('Ocurrió un error al intentar enviar el correo.');
    } finally {
      setIsLoading(false);
    }
  };

  const changeView = (newView: 'login' | 'register' | 'forgotPassword') => {
    if (isLoading) return;
    setView(newView);
    setError('');
    setSuccessMessage('');
    setEmail('');
    setPassword('');
    setDisplayName('');
  };

  return (
      <div className="w-full max-w-sm p-8 bg-zinc-800/80 backdrop-blur-sm rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-center text-white mb-6">
          {view === 'login' && 'Iniciar Sesión'}
          {view === 'register' && 'Crear Cuenta'}
          {view === 'forgotPassword' && 'Restablecer Contraseña'}
        </h2>

        {view !== 'forgotPassword' && (
            <form onSubmit={handleAuthSubmit}>
              <fieldset disabled={isLoading} className="space-y-4">
                {view === 'register' && (
                    <div>
                      <label className="block text-zinc-400 mb-2" htmlFor="displayName">Nombre de usuario</label>
                      <input type="text" id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required className="w-full px-3 py-2 bg-zinc-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50" style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties} />
                    </div>
                )}
                <div>
                  <label className="block text-zinc-400 mb-2" htmlFor="email">Email</label>
                  <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-zinc-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50" style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties} />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-2" htmlFor="password">Contraseña</label>
                  <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full px-3 py-2 bg-zinc-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50" style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties} />
                </div>
              </fieldset>

              {error && <p className="text-red-500 text-sm my-4 text-center">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm my-4 text-center">{successMessage}</p>}

              <button type="submit" disabled={isLoading} className="w-full mt-6 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: themeState?.colors?.accent }}>
                {isLoading ? <Loader2 className="animate-spin" /> : (view === 'login' ? 'Entrar' : 'Crear Cuenta')}
              </button>
            </form>
        )}

        {view === 'forgotPassword' && (
            <form onSubmit={handlePasswordResetSubmit}>
              <p className="text-zinc-300 text-sm text-center mb-4">Introduce tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.</p>
              <fieldset disabled={isLoading} className="space-y-4">
                <div>
                  <label className="block text-zinc-400 mb-2" htmlFor="email-reset">Email</label>
                  <input type="email" id="email-reset" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full px-3 py-2 bg-zinc-700 text-white rounded focus:outline-none focus:ring-2 disabled:opacity-50" style={{'--ring-color': themeState?.colors?.accent } as React.CSSProperties} />
                </div>
              </fieldset>

              {error && <p className="text-red-500 text-sm my-4 text-center">{error}</p>}
              {successMessage && <p className="text-green-500 text-sm my-4 text-center">{successMessage}</p>}

              <button type="submit" disabled={isLoading} className="w-full mt-6 text-white font-bold py-2 px-4 rounded-full flex items-center justify-center transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed" style={{ backgroundColor: themeState?.colors?.accent }}>
                {isLoading ? <Loader2 className="animate-spin" /> : 'Enviar enlace'}
              </button>
            </form>
        )}

        <div className={isLoading ? 'opacity-50 pointer-events-none' : ''}>
          {view === 'login' && (
              <>
                <div className="text-center mt-4">
                  <button onClick={() => changeView('forgotPassword')} className="text-sm text-zinc-400 hover:text-white hover:underline">
                    ¿Has olvidado la contraseña?
                  </button>
                </div>
                <p className="text-center text-zinc-400 mt-4">
                  ¿No tienes cuenta?
                  <button onClick={() => changeView('register')} className="hover:underline ml-1 font-semibold" style={{ color: themeState?.colors?.accent }}>
                    Regístrate
                  </button>
                </p>
              </>
          )}
          {view === 'register' && (
              <p className="text-center text-zinc-400 mt-4">
                ¿Ya tienes cuenta?
                <button onClick={() => changeView('login')} className="hover:underline ml-1 font-semibold" style={{ color: themeState?.colors?.accent }}>
                  Inicia Sesión
                </button>
              </p>
          )}
          {view === 'forgotPassword' && (
              <div className="text-center mt-4">
                <button onClick={() => changeView('login')} className="text-sm text-zinc-400 hover:text-white hover:underline flex items-center justify-center w-full gap-2">
                  <ArrowLeft size={16} /> Volver a Iniciar Sesión
                </button>
              </div>
          )}
        </div>
      </div>
  );
}