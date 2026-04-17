'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { confidenceFromHistory, resolveMatchOutcome, updateElo } from '@/lib/elo';
import { getActiveBannedClubNameKeys, isClubBannedByName, normalizeClubNameKey } from '@/lib/banned-clubs';
import { buildSuggestedMatches } from '@/lib/matching';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AgeCategory, AvailabilityRow, Branch, MatchType, TeamRow } from '@/lib/types';

const validBranches = new Set<Branch>(['femenina', 'masculina', 'mixta']);
const validAgeCategories = new Set<AgeCategory>(['sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc']);
const validMatchTypes = new Set<MatchType>(['amistoso', 'torneo', 'entrenamiento', 'competitivo']);
const validWeekdays = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']);
const requestStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function parseTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return -1;
  }
  return h * 60 + m;
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const v = String(value || '').trim();
  return v.length ? v : null;
}

function normalizeIdentity(value: string) {
  return value.trim().toLowerCase().replace(/^@/, '');
}

function normalizePhone(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim();
  return raw || null;
}


function normalizeInstagram(value: FormDataEntryValue | null) {
  const raw = String(value || '').trim();
  if (!raw) return null;

  const withoutAt = raw.replace(/^@+/, '');
  try {
    const url = new URL(withoutAt);
    if (url.hostname.includes('instagram.com')) {
      const firstSegment = url.pathname.split('/').filter(Boolean)[0];
      if (firstSegment) return firstSegment.toLowerCase();
    }
  } catch {}

  return withoutAt.split('/')[0].trim().toLowerCase() || null;
}

function assertHoneypot(formData: FormData) {
  const honeypot = String(formData.get('website') || '').trim();
  if (honeypot) {
    throw new Error('Solicitud bloqueada.');
  }
}

async function getRequestIp() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || 'unknown-ip';
  return requestHeaders.get('x-real-ip') || 'unknown-ip';
}

async function assertRateLimit(scope: 'publish' | 'results') {
  const ip = await getRequestIp();
  const key = `${scope}:${ip}`;
  const now = Date.now();
  const existing = requestStore.get(key) || [];
  const recent = existing.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= RATE_LIMIT_MAX) {
    throw new Error('Superaste el límite de envíos (5 por hora). Intenta más tarde.');
  }

  recent.push(now);
  requestStore.set(key, recent);
}

async function assertClubNotBanned(clubName: string) {
  const supabase = getSupabaseAdmin();
  const banned = await isClubBannedByName(supabase, clubName);

  if (banned) {
    throw new Error('Este club está bloqueado por administración y no puede publicar disponibilidades.');
  }
}

export async function rebuildSuggestedMatches() {
  try {
    const supabase = getSupabaseAdmin();

    const { data: openAvailabilities, error: openError } = await supabase
      .from('availabilities')
      .select('*')
      .in('status', ['open', 'active', 'published'])
      .returns<AvailabilityRow[]>();

    if (openError) {
      console.error('rebuildSuggestedMatches open availabilities failed', openError);
      return { ok: false, error: 'match_rebuild_failed' as const };
    }

    const bannedClubNameKeys = await getActiveBannedClubNameKeys(supabase);
    const sourcePosts = (openAvailabilities || []).filter(
      (post) => !bannedClubNameKeys.has(normalizeClubNameKey(post.club_name))
    );
    const rows = buildSuggestedMatches(sourcePosts);
    const safeRows: typeof rows = [];

    for (const row of rows) {
      if (!row?.post_a_id || !row?.post_b_id) {
        const a = sourcePosts.find((post) => post.id === row?.post_a_id);
        const b = sourcePosts.find((post) => post.id === row?.post_b_id);
        console.error('MATCH INVALIDO', { a, b });
        continue;
      }

      safeRows.push(row);
    }

    const { error: deleteError } = await supabase
      .from('suggested_matches')
      .delete()
      .not('id', 'is', null);
    if (deleteError) {
      console.error('rebuildSuggestedMatches truncate failed', deleteError);
      return { ok: false, error: 'match_rebuild_failed' as const };
    }

    if (safeRows.length > 0) {
      const { error: insertError } = await supabase.from('suggested_matches').insert(safeRows);
      if (insertError) {
        console.error('rebuildSuggestedMatches insert failed', insertError);
        return { ok: false, error: 'match_rebuild_failed' as const };
      }
    }

    console.log('rebuildSuggestedMatches completed', {
      openPosts: sourcePosts.length,
      generatedMatches: rows.length,
      insertedMatches: safeRows.length
    });
    revalidatePath('/');
    revalidatePath('/explorar');
    revalidatePath('/publicaciones');

    return { ok: true, inserted: safeRows.length };
  } catch (error) {
    console.error('rebuildSuggestedMatches ERROR', error);
    return { ok: false, error: 'match_rebuild_failed' as const };
  }
}

function validateAvailabilityPayload(input: {
  comuna: string;
  weekdays: string[];
  start_time: string;
  end_time: string;
  branch: Branch;
  age_category: AgeCategory;
}) {
  if (!input.comuna.trim()) {
    throw new Error('La comuna es obligatoria.');
  }

  if (!input.weekdays.length || input.weekdays.some((day) => !validWeekdays.has(day))) {
    throw new Error('Debes seleccionar días válidos para la disponibilidad.');
  }

  const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!hhmmRegex.test(input.start_time) || !hhmmRegex.test(input.end_time)) {
    throw new Error('La hora debe tener formato HH:mm.');
  }

  if (parseTime(input.start_time) >= parseTime(input.end_time)) {
    throw new Error('La hora de inicio debe ser menor a la hora de término.');
  }

  if (!validBranches.has(input.branch) || !validAgeCategories.has(input.age_category)) {
    throw new Error('Clasificación inválida. Revisa categoría y rama.');
  }
}

export async function createAvailability(formData: FormData) {
  assertHoneypot(formData);
  await assertRateLimit('publish');

  const club_name = String(formData.get('club_name') || '').trim();
  const comuna = String(formData.get('comuna') || '').trim();
  const city = String(formData.get('city') || 'Santiago').trim() || 'Santiago';
  const weekdays = formData.getAll('weekdays').map((day) => String(day || '').trim()).filter(Boolean);
  const start_time = String(formData.get('start_time') || '').trim();
  const end_time = String(formData.get('end_time') || '').trim();
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const age_category = String(formData.get('age_category') || '').trim() as AgeCategory;
  const phone = normalizePhone(formData.get('phone'));
  const instagram = normalizeInstagram(formData.get('instagram'));
  const responsible_name = normalizeOptional(formData.get('responsible_name'));
  const logo_url = normalizeOptional(formData.get('logo_url'));
  const has_court = String(formData.get('has_court') || 'false') === 'true';
  const notes = normalizeOptional(formData.get('notes'));
  const contact_email = normalizeOptional(formData.get('contact_email'));

  if (!club_name || !comuna) {
    throw new Error('Completa todos los campos requeridos.');
  }

  validateAvailabilityPayload({ comuna, weekdays, start_time, end_time, branch, age_category });

  if (!contact_email) {
    throw new Error('El correo de contacto es obligatorio para editar luego la publicación.');
  }

  await assertClubNotBanned(club_name);

  const supabase = getSupabaseAdmin();

  const { data: inserted, error } = await supabase
    .from('availabilities')
    .insert({
      club_name,
      comuna,
      city,
      weekday: weekdays?.[0] ?? null,
      weekdays,
      start_time,
      end_time,
      branch,
      age_category,
      has_court,
      notes,
      contact_email,
      responsible_name,
      phone,
      instagram,
      logo_url,
      status: 'open'
    })
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('[createAvailability ERROR]', {
      error,
      inserted,
      payload: {
        club_name,
        comuna,
        city,
        weekdays,
        start_time,
        end_time
      }
    });

    return { ok: false, message: 'Insert falló' };
  }

  await rebuildSuggestedMatches();

  revalidatePath('/');
  revalidatePath('/explorar');
  revalidatePath('/ranking');

  return { ok: true, id: inserted.id };
}

export async function updateAvailability(formData: FormData) {
  assertHoneypot(formData);

  const id = String(formData.get('id') || '').trim();
  const email = normalizeOptional(formData.get('contact_email'));
  const comuna = String(formData.get('comuna') || '').trim();
  const weekdays = formData.getAll('weekdays').map((day) => String(day || '').trim()).filter(Boolean);
  const start_time = String(formData.get('start_time') || '').trim();
  const end_time = String(formData.get('end_time') || '').trim();
  const has_court = String(formData.get('has_court') || 'false') === 'true';
  const notes = normalizeOptional(formData.get('notes'));
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const age_category = String(formData.get('age_category') || '').trim() as AgeCategory;
  const phone = normalizePhone(formData.get('phone'));
  const instagram = normalizeInstagram(formData.get('instagram'));
  const responsible_name = normalizeOptional(formData.get('responsible_name'));
  const logo_url = normalizeOptional(formData.get('logo_url'));

  if (!id) return { ok: false, message: 'No encontramos la publicación a editar.' };
  if (!email) return { ok: false, message: 'Debes ingresar el correo de contacto.' };

  validateAvailabilityPayload({ comuna, weekdays, start_time, end_time, branch, age_category });

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('availabilities')
    .select('id, contact_email, club_name')
    .eq('id', id)
    .maybeSingle<{ id: string; contact_email: string | null; club_name: string }>();

  if (existingError || !existing) {
    return { ok: false, message: 'No encontramos la publicación indicada.' };
  }

  if (!existing.contact_email) {
    return { ok: false, message: 'Esta publicación no se puede editar porque no tiene correo asociado.' };
  }

  if (existing.contact_email.trim().toLowerCase() !== email.toLowerCase()) {
    return { ok: false, message: 'Correo incorrecto. No tienes permiso para editar esta publicación.' };
  }

  await assertClubNotBanned(existing.club_name || '');

  const payload = {
    comuna,
    weekday: weekdays[0] || null,
    weekdays,
    start_time,
    end_time,
    has_court,
    notes,
    branch,
    age_category,
    phone,
    instagram,
    responsible_name,
    logo_url,
    status: 'open' as const
  };

  const { error: updateError } = await supabase.from('availabilities').update(payload).eq('id', id);
  if (updateError) {
    return { ok: false, message: 'No pudimos guardar los cambios de la publicación.' };
  }

  await rebuildSuggestedMatches();

  revalidatePath('/');
  revalidatePath('/explorar');
  revalidatePath('/publicaciones');
  revalidatePath(`/publicaciones/${id}`);

  return { ok: true, id };
}

export async function registerMatchResult(formData: FormData) {
  assertHoneypot(formData);
  await assertRateLimit('results');

  const clubId = String(formData.get('club_id') || '').trim();
  const opponentClubIdRaw = normalizeOptional(formData.get('opponent_club_id'));
  const matchDate = String(formData.get('match_date') || '').trim();
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const matchType = String(formData.get('match_type') || '').trim() as MatchType;
  const setsWon = Number(formData.get('sets_won') || 0);
  const setsLost = Number(formData.get('sets_lost') || 0);
  const setScores = normalizeOptional(formData.get('set_scores'));
  const location = normalizeOptional(formData.get('location'));
  const notes = normalizeOptional(formData.get('notes'));

  if (!clubId || !matchDate || !validBranches.has(branch) || !validMatchTypes.has(matchType)) {
    throw new Error('Completa los datos requeridos del resultado.');
  }

  if (Number.isNaN(setsWon) || Number.isNaN(setsLost) || setsWon < 0 || setsLost < 0) {
    throw new Error('Los sets ganados/perdidos deben ser números válidos.');
  }

  if (!opponentClubIdRaw) {
    throw new Error('Debes seleccionar un rival existente para registrar el resultado.');
  }

  const supabase = getSupabaseAdmin();

  const { data: club } = await supabase.from('teams').select('*').eq('id', clubId).maybeSingle<TeamRow>();
  if (!club) throw new Error('No encontramos el club principal.');

  const opponentClubId = opponentClubIdRaw || null;
  const { data: opponent } = opponentClubId
    ? await supabase.from('teams').select('*').eq('id', opponentClubId).maybeSingle<TeamRow>()
    : { data: null as TeamRow | null };

  if (!opponent) {
    throw new Error('Debes seleccionar un rival existente para actualizar el ranking ELO.');
  }

  const ownActual = resolveMatchOutcome(setsWon, setsLost);
  const ownConfidence = confidenceFromHistory(club.matches_played);

  const opponentRating = opponent.current_elo;
  const rivalConfidence = confidenceFromHistory(opponent.matches_played);

  const ownUpdate = updateElo({
    ownRating: club.current_elo,
    opponentRating,
    actualScore: ownActual,
    setsWon,
    setsLost,
    confidenceMultiplier: ownConfidence * rivalConfidence
  });

  const { error: insertResultError } = await supabase.from('match_results').insert({
    club_id: club.id,
    opponent_club_id: opponent.id,
    opponent_name: opponent.club_name,
    match_date: matchDate,
    branch,
    match_type: matchType,
    sets_won: setsWon,
    sets_lost: setsLost,
    set_scores: setScores,
    location,
    notes,
    elo_before: club.current_elo,
    elo_after: ownUpdate.newRating,
    elo_delta: ownUpdate.delta
  });

  if (insertResultError) {
    throw new Error('No pudimos guardar el resultado.');
  }

  await supabase
    .from('teams')
    .update({
      current_elo: ownUpdate.newRating,
      matches_played: club.matches_played + 1,
      wins: club.wins + (ownActual === 1 ? 1 : 0),
      losses: club.losses + (ownActual === 0 ? 1 : 0),
      draws: club.draws + (ownActual === 0.5 ? 1 : 0),
      updated_at: new Date().toISOString()
    })
    .eq('id', club.id);

  const oppActual = ownActual === 1 ? 0 : ownActual === 0 ? 1 : 0.5;
  const opponentUpdate = updateElo({
    ownRating: opponent.current_elo,
    opponentRating: club.current_elo,
    actualScore: oppActual,
    setsWon: setsLost,
    setsLost: setsWon,
    confidenceMultiplier: ownConfidence * rivalConfidence
  });

  await supabase.from('match_results').insert({
    club_id: opponent.id,
    opponent_club_id: club.id,
    opponent_name: club.club_name,
    match_date: matchDate,
    branch,
    match_type: matchType,
    sets_won: setsLost,
    sets_lost: setsWon,
    set_scores: setScores,
    location,
    notes,
    elo_before: opponent.current_elo,
    elo_after: opponentUpdate.newRating,
    elo_delta: opponentUpdate.delta
  });

  await supabase
    .from('teams')
    .update({
      current_elo: opponentUpdate.newRating,
      matches_played: opponent.matches_played + 1,
      wins: opponent.wins + (oppActual === 1 ? 1 : 0),
      losses: opponent.losses + (oppActual === 0 ? 1 : 0),
      draws: opponent.draws + (oppActual === 0.5 ? 1 : 0),
      updated_at: new Date().toISOString()
    })
    .eq('id', opponent.id);

  revalidatePath('/');
  revalidatePath('/ranking');
  revalidatePath(`/club/${club.id}`);
  revalidatePath(`/club/${opponent.id}`);
  revalidatePath('/resultados');

  return { ok: true };
}

function parseResultScore(value: string): { ownSets: number; rivalSets: number; ownWon: boolean } | null {
  const clean = value.trim();
  const match = clean.match(/^(\d)\s*-\s*(\d)$/);
  if (!match) return null;

  const ownSets = Number(match[1]);
  const rivalSets = Number(match[2]);

  const validOwnWinner = ownSets === 3 && rivalSets >= 0 && rivalSets <= 2;
  const validRivalWinner = rivalSets === 3 && ownSets >= 0 && ownSets <= 2;

  if (!validOwnWinner && !validRivalWinner) return null;

  return { ownSets, rivalSets, ownWon: ownSets > rivalSets };
}

async function upsertClubStats(input: {
  clubName: string;
  clubNameKey: string;
  matchDate: string;
  ownWon: boolean;
}) {
  const supabase = getSupabaseAdmin();

  const { data: existing } = await supabase
    .from('club_stats')
    .select('*')
    .eq('club_name_key', input.clubNameKey)
    .maybeSingle<{
      id: string;
      matches_played: number;
      wins: number;
      losses: number;
      last_match_date: string | null;
    }>();

  if (!existing) {
    await supabase.from('club_stats').insert({
      club_name: input.clubName,
      club_name_key: input.clubNameKey,
      matches_played: 1,
      wins: input.ownWon ? 1 : 0,
      losses: input.ownWon ? 0 : 1,
      last_match_date: input.matchDate
    });
    return;
  }

  await supabase
    .from('club_stats')
    .update({
      club_name: input.clubName,
      matches_played: existing.matches_played + 1,
      wins: existing.wins + (input.ownWon ? 1 : 0),
      losses: existing.losses + (input.ownWon ? 0 : 1),
      last_match_date: input.matchDate,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);
}


export async function uploadTeamLogo(formData: FormData) {
  const file = formData.get('logo');
  if (!(file instanceof File)) {
    return { ok: false, message: 'Debes seleccionar una imagen.' };
  }

  const validTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!validTypes.has(file.type)) {
    return { ok: false, message: 'Formato no permitido. Usa JPG, PNG o WEBP.' };
  }

  if (file.size > 4 * 1024 * 1024) {
    return { ok: false, message: 'La imagen supera el máximo permitido (4MB).' };
  }

  const supabase = getSupabaseAdmin();
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `logos/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage.from('team-logos').upload(path, fileBuffer, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false
  });

  if (error) return { ok: false, message: 'No pudimos subir el logo. Intenta nuevamente.' };

  const { data } = supabase.storage.from('team-logos').getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

export async function uploadMatchPhoto(formData: FormData) {
  const clubName = String(formData.get('club_name') || '').trim();
  const opponentName = String(formData.get('opponent_name') || '').trim();
  const matchDate = String(formData.get('match_date') || '').trim();
  const comuna = String(formData.get('comuna') || '').trim();
  const result = normalizeOptional(formData.get('result'));
  const comment = normalizeOptional(formData.get('comment'));
  const image = formData.get('image');

  if (!clubName || !opponentName || !matchDate || !comuna) {
    throw new Error('Completa los campos requeridos.');
  }

  if (!(image instanceof File) || image.size === 0) {
    throw new Error('Debes subir una imagen del partido.');
  }

  if (image.size > 6 * 1024 * 1024) {
    throw new Error('La imagen debe pesar menos de 6MB.');
  }

  const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
  if (!allowedMime.has(image.type)) {
    throw new Error('Formato de imagen no permitido. Usa JPG, PNG o WEBP.');
  }

  const parsed = result ? parseResultScore(result) : null;
  if (result && !parsed) {
    throw new Error('Resultado inválido. Usa formato como 3-0 o 3-2.');
  }

  const supabase = getSupabaseAdmin();
  const clubNameKey = normalizeIdentity(clubName);
  const ext = image.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
  const path = `${clubNameKey}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;

  const fileBuffer = Buffer.from(await image.arrayBuffer());

  const { error: storageError } = await supabase.storage.from('match-photos').upload(path, fileBuffer, {
    contentType: image.type,
    cacheControl: '3600',
    upsert: false
  });

  if (storageError) {
    throw new Error('No pudimos subir la foto. Intenta con otra imagen.');
  }

  const { data: publicUrlData } = supabase.storage.from('match-photos').getPublicUrl(path);

  const { error: insertError } = await supabase.from('match_photos').insert({
    club_name: clubName,
    club_name_key: clubNameKey,
    opponent_name: opponentName,
    match_date: matchDate,
    comuna,
    result,
    comment,
    image_url: publicUrlData.publicUrl
  });

  if (insertError) {
    throw new Error('La imagen se subió, pero no pudimos guardar el partido.');
  }

  if (parsed) {
    await upsertClubStats({
      clubName,
      clubNameKey,
      matchDate,
      ownWon: parsed.ownWon
    });
  }

  revalidatePath('/');
  revalidatePath('/ranking');

  return { ok: true };
}
