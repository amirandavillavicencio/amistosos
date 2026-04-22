import { formatWeekdayList, resolveWeekdays } from '@/lib/matching';
import type { AvailabilityRow } from '@/lib/types';

const MATCH_NOTIFICATION_SUBJECT = 'Tienes un rival disponible en Amistosos Vóley';

type OwnerWithEmail = {
  ownerId: string;
  email: string;
};

function getAppUrl(): string {
  return String(process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

function getResendApiKey(): string | null {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  if (!apiKey) {
    console.warn('[match-email] RESEND_API_KEY no configurada, se omite envío de notificación.');
    return null;
  }

  return apiKey;
}

function getSenderEmail(): string {
  return String(process.env.RESEND_FROM_EMAIL || 'Amistosos Vóley <onboarding@resend.dev>').trim();
}

function getRivalSchedule(post: AvailabilityRow): string {
  const days = formatWeekdayList(resolveWeekdays(post));
  const start = String(post.start_time || '').slice(0, 5);
  const end = String(post.end_time || '').slice(0, 5);
  const timeRange = start && end ? `${start} - ${end}` : 'Horario por coordinar';
  return `${days || 'Día por coordinar'} · ${timeRange}`;
}

function getEmailHtml(params: {
  recipientTeamName: string;
  rivalPost: AvailabilityRow;
  link: string;
}): string {
  const { recipientTeamName, rivalPost, link } = params;
  const rivalName = rivalPost.club_name || 'Equipo rival';
  const comuna = rivalPost.comuna || 'No informada';
  const schedule = getRivalSchedule(rivalPost);
  const court = rivalPost.has_court ? 'Sí, pone cancha' : 'No pone cancha';

  return `
    <div style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
      <h2 style="margin-bottom: 8px;">¡Hay un rival compatible para ${recipientTeamName || 'tu equipo'}!</h2>
      <p style="margin-top: 0;">Detectamos un nuevo cruce en Amistosos Vóley.</p>
      <ul>
        <li><strong>Equipo rival:</strong> ${rivalName}</li>
        <li><strong>Comuna:</strong> ${comuna}</li>
        <li><strong>Día y horario:</strong> ${schedule}</li>
        <li><strong>Cancha:</strong> ${court}</li>
      </ul>
      <p>
        Revisa el match y coordina directo desde la app:<br />
        <a href="${link}">${link}</a>
      </p>
    </div>
  `;
}

async function sendOneMatchEmail(input: {
  resendApiKey: string;
  to: string;
  ownPost: AvailabilityRow;
  rivalPost: AvailabilityRow;
  link: string;
}) {
  const { resendApiKey, to, ownPost, rivalPost, link } = input;
  const html = getEmailHtml({
    recipientTeamName: ownPost.club_name || 'tu equipo',
    rivalPost,
    link
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: getSenderEmail(),
      to: [to],
      subject: MATCH_NOTIFICATION_SUBJECT,
      html
    })
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`[match-email] Resend API error ${response.status}: ${responseText}`);
  }
}

export async function sendMatchNotificationEmails(params: {
  postA: AvailabilityRow;
  postB: AvailabilityRow;
  ownerA: OwnerWithEmail | null;
  ownerB: OwnerWithEmail | null;
  suggestedMatchId?: string | null;
}) {
  const resendApiKey = getResendApiKey();
  if (!resendApiKey) return;

  const link = params.suggestedMatchId
    ? `${getAppUrl()}/matches/aceptar?matchId=${encodeURIComponent(params.suggestedMatchId)}`
    : `${getAppUrl()}/`;

  const tasks: Promise<unknown>[] = [];

  if (params.ownerA?.email) {
    tasks.push(
      sendOneMatchEmail({
        resendApiKey,
        to: params.ownerA.email,
        ownPost: params.postA,
        rivalPost: params.postB,
        link
      })
    );
  }

  if (params.ownerB?.email) {
    tasks.push(
      sendOneMatchEmail({
        resendApiKey,
        to: params.ownerB.email,
        ownPost: params.postB,
        rivalPost: params.postA,
        link
      })
    );
  }

  if (!tasks.length) {
    console.warn('[match-email] No se enviaron correos: ninguno de los owners tiene email válido.');
    return;
  }

  const results = await Promise.allSettled(tasks);
  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[match-email] Falló el envío de notificación de match', result.reason);
    }
  }
}
