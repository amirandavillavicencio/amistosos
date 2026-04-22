'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/auth-client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const supabase = getSupabaseBrowserClient();
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      router.replace('/');
    };

    run();
  }, [router]);

  return <main className="section"><p className="text-sm text-slate-300">Completando inicio de sesión…</p></main>;
}
