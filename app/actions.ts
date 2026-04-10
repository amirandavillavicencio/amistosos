'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { confidenceFromHistory, resolveMatchOutcome, updateElo, BASE_ELO } from '@/lib/elo';
import { areCompatible, calculateCompatibility } from '@/lib/matching';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AvailabilityWithTeam, Branch, Level, MatchType, TeamRow } from '@/lib/types';

const validBranches = new Set<Branch>(['femenina', 'masculina', 'mixta']);
const validLevels = new Set<Level>(['principiante', 'intermedio', 'avanzado']);
const validMatchTypes = new Set<MatchType>(['amistoso', 'torneo', 'entrenamiento', 'competitivo']);
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

async function resolveOrCreateTeam(input: {
  clubName: string;
  contactEmail: string;
  instagram: string;
  comuna: string;
  city: string;
  branch: Branch;
  level: Level;
}) {
  const supabase = getSupabaseAdmin();
  const clubNameKey = normalizeIdentity(input.clubName);
  const emailKey = normalizeIdentity(input.contactEmail);
  const instagramKey = normalizeIdentity(input.instagram);

  const { data: existing } = await supabase
    .from('teams')
    .select('*')
    .eq('club_name_key', clubNameKey)
    .eq('email_key', emailKey)
    .eq('instagram_key', instagramKey)
    .maybeSingle<TeamRow>();

  if (existing) {
    const { data: updated } = await supabase
      .from('teams')
      .update({
        club_name: input.clubName,
        contact_email: input.contactEmail,
        instagram: input.instagram,
        comuna: input.comuna,
        city: input.city,
        branch: input.branch,
        declared_level: input.level,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select('*')
      .single<TeamRow>();

    return updated || existing;
  }

  const { data: created, error } = await supabase
    .from('teams')
    .insert({
      club_name: input.clubName,
      club_name_key: clubNameKey,
      contact_email: input.contactEmail,
      email_key: emailKey,
      instagram: input.instagram,
      instagram_key: instagramKey,
      comuna: input.comuna,
      city: input.city,
      branch: input.branch,
      declared_level: input.level,
      current_elo: BASE_ELO
    })
    .select('*')
    .single<TeamRow>();

  if (error || !created) {
    throw new Error('No pudimos crear o resolver el club. Intenta nuevamente.');
  }

  return created;
}

async function refreshMatchesForAvailability(newAvailabilityId: string) {
  const supabase = getSupabaseAdmin();
  const { data: inserted } = await supabase
    .from('availabilities')
    .select('*, team:teams(*)')
    .eq('id', newAvailabilityId)
    .single<AvailabilityWithTeam>();

  if (!inserted) return;

  const { data: candidates } = await supabase
    .from('availabilities')
    .select('*, team:teams(*)')
    .neq('id', newAvailabilityId)
    .eq('status', 'open');

  const rows = ((candidates || []) as AvailabilityWithTeam[])
    .filter((candidate) => areCompatible(inserted, candidate))
    .map((candidate) => {
      const score = calculateCompatibility(inserted, candidate);
      return {
        post_a_id: inserted.id,
        post_b_id: candidate.id,
        compatibility_score: score.total,
        schedule_score: score.schedule,
        location_score: score.location,
        level_score: score.level,
        elo_score: score.elo,
        status: 'active' as const
      };
    })
    .sort((a, b) => b.compatibility_score - a.compatibility_score)
    .slice(0, 16);

  if (rows.length > 0) {
    await supabase.from('suggested_matches').insert(rows);
  }
}

export async function createAvailability(formData: FormData) {
  assertHoneypot(formData);
  await assertRateLimit('publish');

  const clubName = String(formData.get('club_name') || '').trim();
  const contactEmail = String(formData.get('contact_email') || '').trim();
  const instagram = String(formData.get('instagram') || '').trim();
  const address = String(formData.get('address') || '').trim();
  const comuna = String(formData.get('comuna') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const playDate = normalizeOptional(formData.get('play_date'));
  const weekday = normalizeOptional(formData.get('weekday'));
  const startTime = String(formData.get('start_time') || '').trim();
  const endTime = String(formData.get('end_time') || '').trim();
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const level = String(formData.get('level') || '').trim() as Level;
  const hasCourt = String(formData.get('has_court') || 'false') === 'true';
  const notes = normalizeOptional(formData.get('notes'));

  if (!clubName || !contactEmail || !instagram || !address || !comuna || !city || !startTime || !endTime) {
    throw new Error('Completa todos los campos requeridos.');
  }

  if (!playDate && !weekday) {
    throw new Error('Debes ingresar fecha específica o día de la semana.');
  }

  if (!validBranches.has(branch) || !validLevels.has(level)) {
    throw new Error('Rama o nivel inválidos.');
  }

  if (parseTime(startTime) >= parseTime(endTime)) {
    throw new Error('La hora de inicio debe ser menor a la hora de término.');
  }

  const team = await resolveOrCreateTeam({
    clubName,
    contactEmail,
    instagram,
    comuna,
    city,
    branch,
    level
  });

  const supabase = getSupabaseAdmin();
  const { data: inserted, error } = await supabase
    .from('availabilities')
    .insert({
      team_id: team.id,
      address,
      comuna,
      city,
      play_date: playDate,
      weekday,
      start_time: startTime,
      end_time: endTime,
      branch,
      desired_level: level,
      has_court: hasCourt,
      notes,
      status: 'open'
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !inserted) {
    throw new Error('No pudimos guardar la publicación. Intenta nuevamente.');
  }

  await refreshMatchesForAvailability(inserted.id);

  revalidatePath('/');
  revalidatePath('/explorar');
  revalidatePath('/ranking');

  return { ok: true };
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
