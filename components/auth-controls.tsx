'use client';

import { useEffect, useMemo, useState } from 'react';
import { getSupabaseBrowserClient } from '@/lib/auth-client';

export interface AuthState {
  userId: string | null;
  email: string | null;
  accessToken: string | null;
  loading: boolean;
}

export function useAuthState(): AuthState {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [state, setState] = useState<AuthState>({ userId: null, email: null, accessToken: null, loading: true });

  useEffect(() => {
    let mounted = true;

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!mounted) return;
      setState({
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        accessToken: session?.access_token ?? null,
        loading: false
      });
    };

    syncSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setState({
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        accessToken: session?.access_token ?? null,
        loading: false
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return state;
}

export default function AuthControls() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { email, loading } = useAuthState();
  const [magicEmail, setMagicEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loginWithGoogle = async () => {
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (loginError) setError(loginError.message);
  };

  const sendMagicLink = async () => {
    setError(null);
    setMessage(null);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: magicEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    });
    if (otpError) {
      setError(otpError.message);
      return;
    }
    setMessage('Te enviamos un enlace de acceso a tu correo.');
  };

  if (loading) return <p className="text-xs text-slate-300">Cargando sesión...</p>;

  if (email) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
        <span className="rounded-full border border-emerald-300/40 bg-emerald-500/15 px-3 py-1 text-emerald-100">Sesión: {email}</span>
        <button
          type="button"
          className="btn-secondary"
          onClick={async () => {
            await supabase.auth.signOut();
          }}
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2 rounded-2xl border border-slate-700/70 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-300">Inicia sesión para publicar, editar o eliminar tus publicaciones.</p>
      <div className="flex flex-wrap gap-2">
        <input
          type="email"
          value={magicEmail}
          onChange={(event) => setMagicEmail(event.target.value)}
          className="field"
          placeholder="tu-email@club.cl"
        />
        <button type="button" onClick={sendMagicLink} className="btn-accent">Entrar por email</button>
        <button type="button" onClick={loginWithGoogle} className="btn-secondary">Google</button>
      </div>
      {message ? <p className="text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
