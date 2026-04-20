'use server';

import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  clearAdminSession,
  createAdminSession,
  getAdminSession,
  getAdminUsername,
  verifyAdminCredentials
} from '@/lib/admin-auth';
import { rebuildSuggestedMatches } from '@/app/actions';
import { normalizeClubNameKey } from '@/lib/banned-clubs';
import { getSupabaseAdmin } from '@/lib/supabase';

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 12;
const loginAttemptStore = new Map<string, number[]>();

function sanitizeText(value: FormDataEntryValue | null, maxLength = 220): string {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function parseNonNegativeInt(value: FormDataEntryValue | null): number | null {
  const clean = String(value ?? '').trim();
  if (!/^\d+$/.test(clean)) return null;
  const parsed = Number(clean);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
}

function redirectWithNotice(path: '/admin' | '/admin/login', params: Record<string, string>): never {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value) continue;
    searchParams.set(key, value);
  }
  const query = searchParams.toString();
  redirect(query ? `${path}?${query}` : path);
}

async function getRequesterIp(): Promise<string> {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
  }
  return requestHeaders.get('x-real-ip') || 'unknown-ip';
}

async function assertLoginRateLimit() {
  const ip = await getRequesterIp();
  const key = `admin-login:${ip}`;
  const now = Date.now();
  const previous = loginAttemptStore.get(key) || [];
  const recent = previous.filter((ts) => now - ts < LOGIN_WINDOW_MS);

  if (recent.length >= LOGIN_MAX_ATTEMPTS) {
    redirectWithNotice('/admin/login', {
      error: 'Demasiados intentos de login. Espera unos minutos antes de reintentar.'
    });
  }

  recent.push(now);
  loginAttemptStore.set(key, recent);
}

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!session) {
    redirectWithNotice('/admin/login', { error: 'Sesion expirada. Inicia sesion nuevamente.' });
  }
  return session;
}


async function rebuildMatchesAndRevalidateAvailabilityPaths(availabilityId: string) {
  await rebuildSuggestedMatches();

  revalidatePath('/admin');
  revalidatePath('/');
  revalidatePath('/explorar');
  revalidatePath('/publicaciones');
  revalidatePath(`/publicaciones/${availabilityId}`);
  revalidatePath(`/publicaciones/${availabilityId}/editar`);
  revalidatePath('/ranking');
  revalidatePath('/matches/aceptar');
}

export async function adminLogin(formData: FormData) {
  await assertLoginRateLimit();
  const requesterIp = await getRequesterIp();

  const username = sanitizeText(formData.get('username'), 80).toLowerCase();
  const password = String(formData.get('password') || '');

  try {
    const ok = verifyAdminCredentials({ username, password });
    if (!ok) {
      redirectWithNotice('/admin/login', { error: 'Usuario o clave incorrectos.' });
    }
  } catch (error) {
    console.error('adminLogin config error', error);
    redirectWithNotice('/admin/login', { error: 'Configuracion admin incompleta en servidor.' });
  }

  loginAttemptStore.delete(`admin-login:${requesterIp}`);
  await createAdminSession(getAdminUsername());
  redirect('/admin');
}

export async function adminLogout() {
  await clearAdminSession();
  redirectWithNotice('/admin/login', { notice: 'Sesion cerrada.' });
}

export async function adminUpdateTeamRanking(formData: FormData) {
  await requireAdminSession();

  const teamId = sanitizeText(formData.get('team_id'), 80);
  const currentElo = parseNonNegativeInt(formData.get('current_elo'));
  const matchesPlayed = parseNonNegativeInt(formData.get('matches_played'));
  const wins = parseNonNegativeInt(formData.get('wins'));
  const losses = parseNonNegativeInt(formData.get('losses'));
  const draws = parseNonNegativeInt(formData.get('draws'));

  if (!teamId || currentElo === null || matchesPlayed === null || wins === null || losses === null || draws === null) {
    redirectWithNotice('/admin', {
      section: 'ranking',
      error: 'Datos invalidos para actualizar ranking.'
    });
  }

  if (matchesPlayed < wins + losses + draws) {
    redirectWithNotice('/admin', {
      section: 'ranking',
      error: 'Partidos jugados no puede ser menor que victorias + derrotas + empates.'
    });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('teams')
    .update({
      current_elo: currentElo,
      matches_played: matchesPlayed,
      wins,
      losses,
      draws,
      updated_at: new Date().toISOString()
    })
    .eq('id', teamId);

  if (error) {
    console.error('adminUpdateTeamRanking failed', error);
    redirectWithNotice('/admin', { section: 'ranking', error: 'No se pudo actualizar el ranking del equipo.' });
  }

  revalidatePath('/admin');
  revalidatePath('/ranking');
  revalidatePath('/');
  revalidatePath(`/club/${teamId}`);

  redirectWithNotice('/admin', { section: 'ranking', notice: 'Ranking actualizado.' });
}

export async function adminCreateManualMatch(formData: FormData) {
  const session = await requireAdminSession();

  const postAId = sanitizeText(formData.get('post_a_id'), 80);
  const postBId = sanitizeText(formData.get('post_b_id'), 80);
  const notes = sanitizeText(formData.get('notes'), 280) || null;

  if (!postAId || !postBId) {
    redirectWithNotice('/admin', { section: 'manual', error: 'Debes seleccionar dos publicaciones.' });
  }

  if (postAId === postBId) {
    redirectWithNotice('/admin', { section: 'manual', error: 'No puedes crear un match con la misma publicacion.' });
  }

  const supabase = getSupabaseAdmin();
  const { data: posts, error: postsError } = await supabase
    .from('availabilities')
    .select('id, club_name, branch, age_category')
    .in('id', [postAId, postBId]);

  if (postsError || !posts || posts.length !== 2) {
    console.error('adminCreateManualMatch posts lookup failed', postsError);
    redirectWithNotice('/admin', { section: 'manual', error: 'No se encontraron las publicaciones seleccionadas.' });
  }

  const postA = posts.find((item) => item.id === postAId);
  const postB = posts.find((item) => item.id === postBId);

  if (!postA || !postB) {
    redirectWithNotice('/admin', { section: 'manual', error: 'No se encontraron las publicaciones seleccionadas.' });
  }

  const { error } = await supabase.from('admin_manual_matches').insert({
    post_a_id: postAId,
    post_b_id: postBId,
    post_a_club_name: postA.club_name,
    post_b_club_name: postB.club_name,
    branch: postA.branch || postB.branch || null,
    age_category: postA.age_category || postB.age_category || null,
    status: 'active',
    notes,
    created_by: session.username
  });

  if (error) {
    console.error('adminCreateManualMatch insert failed', error);
    redirectWithNotice('/admin', { section: 'manual', error: 'No se pudo crear el match manual.' });
  }

  revalidatePath('/admin');
  redirectWithNotice('/admin', { section: 'manual', notice: 'Match manual creado.' });
}

export async function adminArchiveManualMatch(formData: FormData) {
  await requireAdminSession();

  const id = sanitizeText(formData.get('manual_match_id'), 80);
  if (!id) {
    redirectWithNotice('/admin', { section: 'manual', error: 'Match manual invalido.' });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('admin_manual_matches')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('adminArchiveManualMatch failed', error);
    redirectWithNotice('/admin', { section: 'manual', error: 'No se pudo archivar el match manual.' });
  }

  revalidatePath('/admin');
  redirectWithNotice('/admin', { section: 'manual', notice: 'Match manual archivado.' });
}

export async function adminCloseAvailability(formData: FormData) {
  await requireAdminSession();

  const availabilityId = sanitizeText(formData.get('availability_id'), 80);
  const confirmWord = sanitizeText(formData.get('confirm_word'), 20).toUpperCase();

  if (!availabilityId) {
    redirectWithNotice('/admin', { section: 'posts', error: 'Publicacion invalida.' });
  }

  if (confirmWord !== 'CERRAR') {
    redirectWithNotice('/admin', { section: 'posts', error: 'Para cerrar una publicacion, escribe CERRAR.' });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from('availabilities')
    .update({ status: 'closed' })
    .eq('id', availabilityId);

  if (error) {
    console.error('adminCloseAvailability failed', error);
    redirectWithNotice('/admin', { section: 'posts', error: 'No se pudo cerrar la publicacion.' });
  }

  await rebuildMatchesAndRevalidateAvailabilityPaths(availabilityId);

  redirectWithNotice('/admin', { section: 'posts', notice: 'Publicacion desactivada y matches reconstruidos.' });
}

export async function adminDeleteAvailability(formData: FormData) {
  await requireAdminSession();

  const availabilityId = sanitizeText(formData.get('availability_id'), 80);
  const confirmWord = sanitizeText(formData.get('confirm_word'), 20).toUpperCase();

  if (!availabilityId) {
    redirectWithNotice('/admin', { section: 'posts', error: 'Publicacion invalida.' });
  }

  if (confirmWord !== 'ELIMINAR') {
    redirectWithNotice('/admin', { section: 'posts', error: 'Para eliminar una publicacion, escribe ELIMINAR.' });
  }

  const supabase = getSupabaseAdmin();

  const { data: existing, error: existingError } = await supabase
    .from('availabilities')
    .select('id')
    .eq('id', availabilityId)
    .maybeSingle();

  if (existingError) {
    console.error('adminDeleteAvailability exists lookup failed', existingError);
    redirectWithNotice('/admin', { section: 'posts', error: 'No se pudo verificar la publicacion a eliminar.' });
  }

  if (!existing) {
    redirectWithNotice('/admin', { section: 'posts', error: 'La publicacion ya no existe o fue eliminada.' });
  }

  const { error: deleteError } = await supabase
    .from('availabilities')
    .delete()
    .eq('id', availabilityId);

  if (deleteError) {
    console.error('adminDeleteAvailability failed', deleteError);
    redirectWithNotice('/admin', { section: 'posts', error: 'No se pudo eliminar la publicacion.' });
  }

  await rebuildMatchesAndRevalidateAvailabilityPaths(availabilityId);

  redirectWithNotice('/admin', { section: 'posts', notice: 'Publicacion eliminada y matches reconstruidos.' });
}

export async function adminBanClub(formData: FormData) {
  await requireAdminSession();

  const clubName = sanitizeText(formData.get('club_name'), 120);
  const reason = sanitizeText(formData.get('reason'), 280) || null;
  const clubNameKey = normalizeClubNameKey(clubName);

  if (!clubName || !clubNameKey) {
    redirectWithNotice('/admin', { section: 'bans', error: 'Nombre de club invalido.' });
  }

  void reason;
  redirectWithNotice('/admin', {
    section: 'bans',
    error: 'La gestión de baneos no está disponible en este entorno.'
  });
}

export async function adminUnbanClub(formData: FormData) {
  await requireAdminSession();

  const bannedId = sanitizeText(formData.get('banned_id'), 80);
  if (!bannedId) {
    redirectWithNotice('/admin', { section: 'bans', error: 'Registro de baneo invalido.' });
  }

  void bannedId;
  redirectWithNotice('/admin', {
    section: 'bans',
    error: 'La gestión de baneos no está disponible en este entorno.'
  });
}
