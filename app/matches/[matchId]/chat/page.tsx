import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getConversation, getMessages, sendMessage } from '@/app/actions';
import BackHomeLink from '@/components/back-home-link';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { ConfirmedMatchRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface MatchChatPageProps {
  params: { matchId: string };
  searchParams?: { email?: string };
}

function safeText(value: string | null | undefined, fallback = 'No informado') {
  const clean = String(value || '').trim();
  return clean || fallback;
}

function normalizeEmail(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function formatHourRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = safeText(start, '--:--').slice(0, 5);
  const e = safeText(end, '--:--').slice(0, 5);
  return `${s} - ${e}`;
}

export default async function MatchChatPage({ params, searchParams }: MatchChatPageProps) {
  const matchId = String(params.matchId || '').trim();
  const email = normalizeEmail(searchParams?.email);

  if (!email) {
    return (
      <main className="section py-10">
        <article className="card-panel mx-auto max-w-xl p-6">
          <h1 className="display-serif text-2xl text-ink">Acceso al chat de coordinación</h1>
          <p className="mt-2 text-sm text-muted">Ingresa con el correo de uno de los equipos para abrir este chat.</p>
          <form method="get" className="mt-5 space-y-3">
            <label htmlFor="email" className="block text-sm font-medium text-ink">Correo del equipo</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="equipo@club.cl"
              className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button type="submit" className="btn-accent">Abrir chat de coordinación</button>
          </form>
          <BackHomeLink className="mt-4" />
        </article>
      </main>
    );
  }

  const supabase = getSupabaseAdmin();
  const { data: match } = await supabase
    .from('confirmed_matches')
    .select('*')
    .eq('id', matchId)
    .maybeSingle<ConfirmedMatchRow>();

  if (!match || (match.status !== 'accepted' && match.status !== 'confirmed')) {
    return (
      <main className="section py-10">
        <article className="card-panel mx-auto max-w-2xl p-6 text-center">
          <h1 className="display-serif text-2xl text-ink">Chat no disponible</h1>
          <p className="mt-2 text-sm text-muted">Este chat solo existe para matches aceptados o confirmados.</p>
          <BackHomeLink className="mt-4" />
        </article>
      </main>
    );
  }

  let conversation;
  try {
    conversation = await getConversation(matchId, email);
  } catch {
    return (
      <main className="section py-10">
        <article className="card-panel mx-auto max-w-2xl p-6 text-center">
          <h1 className="display-serif text-2xl text-ink">Acceso bloqueado</h1>
          <p className="mt-2 text-sm text-muted">Solo los correos de los equipos del match pueden acceder al chat.</p>
          <BackHomeLink className="mt-4" />
        </article>
      </main>
    );
  }

  const messages = await getMessages(conversation.id);

  const { data: posts } = await supabase
    .from('availabilities')
    .select('id, club_name, weekdays, start_time, end_time')
    .in('id', [match.post_a_id, match.post_b_id]);

  const postById = new Map((posts || []).map((item) => [item.id, item]));
  const clubA = postById.get(match.post_a_id);
  const clubB = postById.get(match.post_b_id);
  const clubAName = safeText(clubA?.club_name, 'Club A');
  const clubBName = safeText(clubB?.club_name, 'Club B');
  const weekdaysA = Array.isArray(clubA?.weekdays) ? clubA?.weekdays.filter(Boolean).join(', ') : 'No informado';
  const weekdaysB = Array.isArray(clubB?.weekdays) ? clubB?.weekdays.filter(Boolean).join(', ') : 'No informado';

  async function sendMessageAction(formData: FormData) {
    'use server';

    const convId = String(formData.get('conversation_id') || '').trim();
    const senderEmail = normalizeEmail(String(formData.get('sender_email') || ''));
    const messageText = String(formData.get('message_text') || '').trim();

    await sendMessage(convId, senderEmail, messageText);

    revalidatePath(`/matches/${matchId}/chat`);
    redirect(`/matches/${matchId}/chat?email=${encodeURIComponent(senderEmail)}`);
  }

  return (
    <main className="section py-8 sm:py-10">
      <article className="card-panel mx-auto max-w-4xl p-5 sm:p-6">
        <BackHomeLink className="mb-4" />
        <header className="rounded-2xl border border-line/80 bg-paper/60 p-4">
          <h1 className="display-serif text-2xl text-ink">{clubAName} vs {clubBName}</h1>
          <p className="mt-1 text-sm text-muted">Estado del match: <strong>{match.status}</strong></p>
          <p className="mt-1 text-sm text-muted">Contactos: {conversation.club_a_email} · {conversation.club_b_email}</p>
          <p className="mt-1 text-sm text-muted">
            Horarios disponibles: {weekdaysA} ({formatHourRange(clubA?.start_time, clubA?.end_time)}) · {weekdaysB} ({formatHourRange(clubB?.start_time, clubB?.end_time)})
          </p>
        </header>

        <section className="mt-4 rounded-2xl border border-line/70 bg-paper/50 p-3 sm:p-4">
          <ul className="space-y-2">
            {messages.map((message) => (
              <li key={message.id} className="rounded-xl border border-line/70 bg-white/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{message.sender_email}</p>
                <p className="mt-1 text-sm text-ink">{message.message_text}</p>
                <p className="mt-1 text-[11px] text-muted">{new Date(message.created_at).toLocaleString('es-CL')}</p>
              </li>
            ))}
          </ul>
        </section>

        <form action={sendMessageAction} className="mt-4 space-y-3">
          <input type="hidden" name="conversation_id" value={conversation.id} />
          <input type="hidden" name="sender_email" value={email} />
          <label htmlFor="message_text" className="block text-sm font-medium text-ink">Nuevo mensaje</label>
          <textarea
            id="message_text"
            name="message_text"
            required
            rows={3}
            placeholder="Coordinar fecha exacta, dirección, árbitro o reglas del amistoso"
            className="w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
          <button type="submit" className="btn-accent">Enviar</button>
        </form>
      </article>
    </main>
  );
}
