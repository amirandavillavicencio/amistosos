'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { confidenceFromHistory, resolveMatchOutcome, updateElo } from '@/lib/elo';
import { getActiveBannedClubNameKeys, isClubBannedByName, normalizeClubNameKey } from '@/lib/banned-clubs';
import { USABLE_AVAILABILITY_STATUSES } from '@/lib/matching';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { AgeCategory, Branch, MatchType, TeamRow } from '@/lib/types';

const validBranches = new Set<Branch>(['femenina', 'masculina', 'mixta']);
const validAgeCategories = new Set<AgeCategory>(['sub-12', 'sub-14', 'sub-16', 'sub-18', 'sub-20', 'tc']);
const validMatchTypes = new Set<MatchType>(['amistoso', 'torneo', 'entrenamiento', 'competitivo']);
const validWeekdays = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo']);
const validLevels = new Set(['principiante', 'novato', 'intermedio', 'avanzado', 'competitivo']);
const requestStore = new Map<string, number[]>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const MIN_GAME_TIME_MINUTES = 8 * 60;
const MAX_GAME_TIME_MINUTES = 23 * 60;

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

function normalizeForComparison(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeDay(day: string): string {
  return day
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getNormalizedDaysFromAvailability(
  weekdayValue: unknown,
  weekdaysValue: unknown
): string[] {
  const normalizeDays = (days: unknown[]): string[] => (
    days
      .map((day) => normalizeDay(String(day ?? '')))
      .filter(Boolean)
  );

  if (Array.isArray(weekdaysValue)) {
    return normalizeDays(weekdaysValue);
  }

  if (typeof weekdaysValue === 'string') {
    const raw = weekdaysValue.trim();
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return normalizeDays(parsed);
      }
    } catch {}

    const withoutBraces = raw.replace(/^\{/, '').replace(/\}$/, '');
    return normalizeDays(withoutBraces.split(','));
  }

  if (typeof weekdayValue === 'string' && weekdayValue.trim()) {
    return [normalizeDay(weekdayValue)];
  }

  return [];
}

function safeString(value: unknown): string {
  return String(value ?? '').trim();
}

function isUuid(value: unknown): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(safeString(value));
}

function parseMinutesSafe(value: unknown): number | null {
  const raw = safeString(value);
  if (!raw) return null;

  const normalized = raw.length >= 5 ? raw.slice(0, 5) : raw;
  const parsed = parseTime(normalized);
  if (parsed < 0) return null;

  return parsed;
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

    const { data: allAvailabilities, error: allError } = await supabase
      .from('availabilities')
      .select('*');

    if (allError) {
      console.error('rebuildSuggestedMatches availabilities read failed', allError);
      return { ok: false, error: 'match_rebuild_failed' as const };
    }

    const availabilities = Array.isArray(allAvailabilities) ? allAvailabilities : [];
    const discoveredAvailabilityColumns = new Set<string>();
    for (const row of availabilities.slice(0, 50)) {
      for (const key of Object.keys(row || {})) {
        discoveredAvailabilityColumns.add(key);
      }
    }

    const availabilitiesWithValidId = availabilities.filter((row) => isUuid((row as { id?: unknown })?.id)).length;
    const availabilitiesWithWeekdays = availabilities.filter((row) => {
      const normalizedDays = getNormalizedDaysFromAvailability(
        (row as { weekday?: unknown })?.weekday,
        (row as { weekdays?: unknown })?.weekdays
      );
      return normalizedDays.length > 0;
    }).length;
    const availabilitiesWithTimeRange = availabilities.filter((row) => {
      const start = parseMinutesSafe((row as { start_time?: unknown })?.start_time);
      const end = parseMinutesSafe((row as { end_time?: unknown })?.end_time);
      return start !== null && end !== null && end > start;
    }).length;
    const weekdayOnlyCount = availabilities.filter((row) => {
      const weekday = normalizeForComparison((row as { weekday?: unknown })?.weekday);
      const weekdays = (row as { weekdays?: unknown })?.weekdays;
      const weekdayArrayCount = Array.isArray(weekdays)
        ? weekdays.filter((day) => normalizeForComparison(day)).length
        : 0;
      return Boolean(weekday) && weekdayArrayCount === 0;
    }).length;
    const weekdaysOnlyCount = availabilities.filter((row) => {
      const weekday = normalizeForComparison((row as { weekday?: unknown })?.weekday);
      const weekdays = (row as { weekdays?: unknown })?.weekdays;
      const weekdayArrayCount = Array.isArray(weekdays)
        ? weekdays.filter((day) => normalizeForComparison(day)).length
        : 0;
      return !weekday && weekdayArrayCount > 0;
    }).length;

    const usableStatus = new Set<string>(USABLE_AVAILABILITY_STATUSES);
    const activeAvailabilities = availabilities.filter((post) => {
      const status = normalizeForComparison((post as { status?: unknown })?.status);
      if (!status) return true;
      return usableStatus.has(status);
    });

    const bannedClubNameKeys = await getActiveBannedClubNameKeys(supabase);
    const sourcePosts = activeAvailabilities.filter(
      (post) =>
        !bannedClubNameKeys.has(
          normalizeClubNameKey(safeString((post as { club_name?: unknown })?.club_name))
        )
    );

    const rows: Array<{
      post_a_id: string;
      post_b_id: string;
      compatibility_score: number;
      schedule_score: number;
      location_score: number;
      level_score: number;
      elo_score: number;
      status: 'active';
    }> = [];

    let pairsEvaluated = 0;
    let skippedSameClub = 0;
    let skippedByScore = 0;
    let invalidRowsSkipped = 0;
    let pairsWithSharedDays = 0;
    let pairsWithTimeOverlap = 0;
    let pairsPassingThreshold = 0;

    const pairKeys = new Set<string>();

    for (let i = 0; i < sourcePosts.length; i += 1) {
      const a = sourcePosts[i];
      for (let j = i + 1; j < sourcePosts.length; j += 1) {
        const b = sourcePosts[j];
        pairsEvaluated += 1;

        const postAId = safeString((a as { id?: unknown })?.id);
        const postBId = safeString((b as { id?: unknown })?.id);

        if (!isUuid(postAId) || !isUuid(postBId)) {
          invalidRowsSkipped += 1;
          continue;
        }

        if (postAId === postBId) {
          invalidRowsSkipped += 1;
          continue;
        }

        const [stableA, stableB] = postAId < postBId ? [postAId, postBId] : [postBId, postAId];
        const pairKey = `${stableA}::${stableB}`;
        if (pairKeys.has(pairKey)) {
          continue;
        }
        pairKeys.add(pairKey);

        const aClub = normalizeForComparison((a as { club_name?: unknown })?.club_name);
        const bClub = normalizeForComparison((b as { club_name?: unknown })?.club_name);
        if (aClub && bClub && aClub === bClub) {
          skippedSameClub += 1;
          continue;
        }

        const aCity = normalizeForComparison((a as { city?: unknown })?.city);
        const bCity = normalizeForComparison((b as { city?: unknown })?.city);
        const aComuna = normalizeForComparison((a as { comuna?: unknown })?.comuna);
        const bComuna = normalizeForComparison((b as { comuna?: unknown })?.comuna);
        const aLevel =
          normalizeForComparison((a as { level?: unknown })?.level)
          || normalizeForComparison((a as { expected_level?: unknown })?.expected_level);
        const bLevel =
          normalizeForComparison((b as { level?: unknown })?.level)
          || normalizeForComparison((b as { expected_level?: unknown })?.expected_level);

        const daysA = getNormalizedDaysFromAvailability(
          (a as { weekday?: unknown })?.weekday,
          (a as { weekdays?: unknown })?.weekdays
        );
        const daysB = getNormalizedDaysFromAvailability(
          (b as { weekday?: unknown })?.weekday,
          (b as { weekdays?: unknown })?.weekdays
        );
        const hasSharedDay = daysA.some((d) => daysB.includes(d));
        console.log('rebuildSuggestedMatches shared day evaluation', {
          postAId,
          postBId,
          daysA,
          daysB,
          hasSharedDay
        });
        if (hasSharedDay) {
          pairsWithSharedDays += 1;
        }

        const aStart = parseMinutesSafe((a as { start_time?: unknown })?.start_time);
        const aEnd = parseMinutesSafe((a as { end_time?: unknown })?.end_time);
        const bStart = parseMinutesSafe((b as { start_time?: unknown })?.start_time);
        const bEnd = parseMinutesSafe((b as { end_time?: unknown })?.end_time);
        const hasTimeOverlap =
          aStart !== null &&
          aEnd !== null &&
          bStart !== null &&
          bEnd !== null &&
          aStart < bEnd &&
          bStart < aEnd;
        if (hasTimeOverlap) {
          pairsWithTimeOverlap += 1;
        }

        let compatibilityScore = 0;
        let locationScore = 0;
        let scheduleScore = 0;
        let levelScore = 0;

        if (aCity && bCity && aCity === bCity) {
          compatibilityScore += 10;
          locationScore += 10;
        }

        if (aComuna && bComuna && aComuna === bComuna) {
          compatibilityScore += 5;
          locationScore += 5;
        }

        if (hasSharedDay) {
          compatibilityScore += 8;
          scheduleScore += 8;
        }

        if (hasTimeOverlap) {
          compatibilityScore += 8;
          scheduleScore += 8;
        }

        if (aLevel && bLevel && aLevel === bLevel) {
          compatibilityScore += 4;
          levelScore += 4;
        }

        if (Boolean((a as { has_court?: unknown })?.has_court) && Boolean((b as { has_court?: unknown })?.has_court)) {
          compatibilityScore += 3;
          locationScore += 3;
        }

        if (compatibilityScore < 15) {
          skippedByScore += 1;
          continue;
        }
        pairsPassingThreshold += 1;

        rows.push({
          post_a_id: stableA,
          post_b_id: stableB,
          compatibility_score: compatibilityScore,
          schedule_score: scheduleScore,
          location_score: locationScore,
          level_score: levelScore,
          elo_score: 0,
          status: 'active'
        });
      }
    }

    const safeRows = rows.filter((row) => {
      const postAId = safeString(row?.post_a_id);
      const postBId = safeString(row?.post_b_id);
      if (!isUuid(postAId) || !isUuid(postBId) || postAId === postBId) {
        return false;
      }
      return true;
    });
    invalidRowsSkipped += rows.length - safeRows.length;

    const { error: deleteError } = await supabase
      .from('suggested_matches')
      .delete()
      .not('id', 'is', null);
    if (deleteError) {
      console.error('rebuildSuggestedMatches truncate failed', deleteError);
      return { ok: false, error: 'match_rebuild_failed' as const };
    }

    let insertedMatches = 0;
    if (safeRows.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('suggested_matches')
        .insert(safeRows)
        .select('id');

      if (insertError) {
        console.error('rebuildSuggestedMatches insert failed', insertError);
        return { ok: false, error: 'match_rebuild_failed' as const };
      }

      insertedMatches = Array.isArray(inserted) ? inserted.length : safeRows.length;
    }

    const { count: suggestedMatchesFinalCount, error: suggestedMatchesCountError } = await supabase
      .from('suggested_matches')
      .select('id', { count: 'exact', head: true });

    if (suggestedMatchesCountError) {
      console.warn('rebuildSuggestedMatches suggested_matches count failed', suggestedMatchesCountError);
    }

    const bannedClubsTableAvailable = false;

    let mainCause = 'matches_generated_normally';
    if (sourcePosts.length < 2) {
      mainCause = 'not_enough_active_availabilities';
    } else if (!pairsWithSharedDays) {
      mainCause = 'weekday_data_missing_or_not_overlapping';
    } else if (!pairsWithTimeOverlap) {
      mainCause = 'time_ranges_missing_or_not_overlapping';
    } else if (!pairsPassingThreshold) {
      mainCause = 'score_threshold_filtered_all_pairs';
    }

    console.log('rebuildSuggestedMatches completed', {
      availabilitiesCount: availabilities.length,
      activeAvailabilitiesCount: sourcePosts.length,
      pairsEvaluated,
      generatedMatches: rows.length,
      insertedMatches,
      invalidRowsSkipped,
      pairsWithSharedDays,
      pairsWithTimeOverlap,
      discoveredAvailabilityColumns: [...discoveredAvailabilityColumns].sort(),
      availabilitiesWithValidId,
      availabilitiesWithWeekdays,
      availabilitiesWithTimeRange,
      weekdayOnlyCount,
      weekdaysOnlyCount,
      suggestedMatchesFinalCount: suggestedMatchesFinalCount ?? null,
      bannedClubsTableAvailable,
      mainCause,
      skippedSameClub,
      skippedByScore
    });

    revalidatePath('/');
    revalidatePath('/explorar');
    revalidatePath('/publicaciones');

    return { ok: true, inserted: insertedMatches };
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

  const startMinutes = parseTime(input.start_time);
  const endMinutes = parseTime(input.end_time);

  if (startMinutes < MIN_GAME_TIME_MINUTES || startMinutes > MAX_GAME_TIME_MINUTES) {
    throw new Error('La hora de inicio debe estar entre 08:00 y 23:00.');
  }

  if (endMinutes < MIN_GAME_TIME_MINUTES || endMinutes > MAX_GAME_TIME_MINUTES) {
    throw new Error('La hora de término debe estar entre 08:00 y 23:00.');
  }

  if (startMinutes >= endMinutes) {
    throw new Error('La hora de término debe ser mayor a la hora de inicio.');
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
  const levelRaw = normalizeOptional(formData.get('level'));
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
      level: levelRaw,
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


export async function verifyAvailabilityOwnership(id: string, emailInput: string) {
  const safeId = String(id || '').trim();
  const email = normalizeOptional(emailInput);

  if (!safeId) {
    return { ok: false, message: 'No encontramos la publicación a editar.' };
  }

  if (!email) {
    return { ok: false, message: 'Debes ingresar un correo para verificar.' };
  }

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('availabilities')
    .select('id, contact_email')
    .eq('id', safeId)
    .maybeSingle<{ id: string; contact_email: string | null }>();

  if (existingError || !existing) {
    return { ok: false, message: 'No encontramos la publicación indicada.' };
  }

  if (!existing.contact_email) {
    return { ok: false, message: 'Esta publicación no se puede editar porque no tiene correo asociado.' };
  }

  if (existing.contact_email.trim().toLowerCase() !== email.toLowerCase()) {
    return { ok: false, message: 'Este correo no tiene permiso para modificar esta publicación.' };
  }

  return {
    ok: true,
    verifiedEmail: email,
    message: 'Correo verificado, puedes editar esta disponibilidad.'
  };
}

export async function updateAvailability(formData: FormData) {
  assertHoneypot(formData);

  const id = String(formData.get('id') || '').trim();
  const email = normalizeOptional(formData.get('contact_email'));
  const intent = String(formData.get('intent') || 'update').trim().toLowerCase();
  const comuna = String(formData.get('comuna') || '').trim();
  const city = String(formData.get('city') || 'Santiago').trim() || 'Santiago';
  const weekdays = formData.getAll('weekdays').map((day) => String(day || '').trim()).filter(Boolean);
  const start_time = String(formData.get('start_time') || '').trim();
  const end_time = String(formData.get('end_time') || '').trim();
  const has_court = String(formData.get('has_court') || 'false') === 'true';
  const notes = normalizeOptional(formData.get('notes'));
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const age_category = String(formData.get('age_category') || '').trim() as AgeCategory;
  const levelRaw = normalizeOptional(formData.get('level'));
  const phone = normalizePhone(formData.get('phone'));
  const instagram = normalizeInstagram(formData.get('instagram'));
  const responsible_name = normalizeOptional(formData.get('responsible_name'));
  const logo_url = normalizeOptional(formData.get('logo_url'));

  if (!id) return { ok: false, message: 'No encontramos la publicación a editar.' };
  if (!email) return { ok: false, message: 'Debes ingresar el correo de contacto.' };

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

  if (intent === 'deactivate') {
    const { error: deactivateError } = await supabase
      .from('availabilities')
      .update({ status: 'closed' })
      .eq('id', id);

    if (deactivateError) {
      return { ok: false, message: 'No pudimos desactivar la publicación.' };
    }

    await rebuildSuggestedMatches();

    revalidatePath('/');
    revalidatePath('/explorar');
    revalidatePath('/publicaciones');
    revalidatePath(`/publicaciones/${id}`);
    revalidatePath(`/publicaciones/${id}/editar`);

    return { ok: true, id, action: 'deactivated' as const };
  }

  validateAvailabilityPayload({ comuna, weekdays, start_time, end_time, branch, age_category });

  if (levelRaw && !validLevels.has(levelRaw)) {
    return { ok: false, message: 'Nivel inválido. Revisa el campo nivel.' };
  }

  await assertClubNotBanned(existing.club_name || '');

  const payload = {
    comuna,
    city,
    weekday: weekdays[0] || null,
    weekdays,
    start_time,
    end_time,
    has_court,
    notes,
    branch,
    age_category,
    level: levelRaw,
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
  revalidatePath(`/publicaciones/${id}/editar`);

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
  const winnerClubId = String(formData.get('winner_club_id') || '').trim();
  const proofPhoto = formData.get('proof_photo');

  if (!clubId || !matchDate || !validBranches.has(branch) || !validMatchTypes.has(matchType)) {
    throw new Error('Completa los datos requeridos del resultado.');
  }

  if (Number.isNaN(setsWon) || Number.isNaN(setsLost) || setsWon < 0 || setsLost < 0) {
    throw new Error('Los sets ganados/perdidos deben ser números válidos.');
  }

  if (!opponentClubIdRaw) {
    throw new Error('Debes seleccionar un rival existente para registrar el resultado.');
  }
  if (!winnerClubId) {
    throw new Error('Debes indicar quién ganó el partido.');
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
  if (winnerClubId !== club.id && winnerClubId !== opponent.id) {
    throw new Error('El ganador debe ser el club local o el rival seleccionado.');
  }
  if (winnerClubId === club.id && setsWon <= setsLost) {
    throw new Error('El ganador seleccionado no coincide con el marcador.');
  }
  if (winnerClubId === opponent.id && setsLost <= setsWon) {
    throw new Error('El ganador seleccionado no coincide con el marcador.');
  }

  let proofPhotoUrl: string | null = null;
  if (proofPhoto instanceof File && proofPhoto.size > 0) {
    if (proofPhoto.size > 6 * 1024 * 1024) {
      throw new Error('La foto comprobante debe pesar menos de 6MB.');
    }

    const allowedMime = new Set(['image/jpeg', 'image/png', 'image/webp']);
    if (!allowedMime.has(proofPhoto.type)) {
      throw new Error('Formato de foto no permitido. Usa JPG, PNG o WEBP.');
    }

    const ext = proofPhoto.name.split('.').pop()?.toLowerCase() || 'jpg';
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg';
    const filePath = `results/${club.id}/${Date.now()}-${crypto.randomUUID()}.${safeExt}`;
    const fileBuffer = Buffer.from(await proofPhoto.arrayBuffer());

    const { error: uploadError } = await supabase.storage.from('match-photos').upload(filePath, fileBuffer, {
      contentType: proofPhoto.type,
      cacheControl: '3600',
      upsert: false
    });

    if (uploadError) {
      throw new Error('No pudimos subir la foto comprobante.');
    }

    const { data: urlData } = supabase.storage.from('match-photos').getPublicUrl(filePath);
    proofPhotoUrl = urlData.publicUrl;
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


  revalidatePath('/');
  revalidatePath('/ranking');

  return { ok: true };
}
