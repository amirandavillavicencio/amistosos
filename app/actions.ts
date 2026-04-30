'use server';

import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createHash, randomBytes } from 'crypto';
import { confidenceFromHistory, resolveMatchOutcome, updateElo } from '@/lib/elo';
import { getActiveBannedClubNameKeys, isClubBannedByName, normalizeClubNameKey } from '@/lib/banned-clubs';
import { sendMatchNotificationEmails } from '@/lib/email/send-match-notification';
import { USABLE_AVAILABILITY_STATUSES } from '@/lib/matching';
import { hasTimeOverlap, normalizeBranch, normalizeCategory, parseWeekdays } from '@/lib/format';
import { getSupabaseAdmin } from '@/lib/supabase';
import type {
  AvailabilityRow,
  AgeCategory,
  Branch,
  ConfirmedMatchRow,
  MatchConversationRow,
  MatchMessageRow,
  MatchType,
  TeamRow
} from '@/lib/types';

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


function isMatchingDebugEnabled(): boolean {
  return String(process.env.DEBUG_MATCHING || '').trim().toLowerCase() === 'true';
}

function debugMatchingLog(message: string, payload: Record<string, unknown>) {
  if (!isMatchingDebugEnabled()) return;
  console.log(`[matching:debug] ${message}`, payload);
}


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

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function hashCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function normalizeCodeSegment(value: string, fallback: string): string {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 12);

  return normalized || fallback;
}

function branchCode(value: Branch): string {
  if (value === 'femenina') return 'FEM';
  if (value === 'masculina') return 'MAS';
  return 'MIX';
}

function categoryCode(value: AgeCategory): string {
  return value.replace('-', '').toUpperCase();
}

function randomConfirmationSuffix(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(6);
  return Array.from(bytes)
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
}

function generateAvailabilityConfirmationCode(input: {
  clubName: string;
  branch: Branch;
  ageCategory: AgeCategory;
}): string {
  return [
    normalizeCodeSegment(input.clubName, 'EQUIPO'),
    branchCode(input.branch),
    categoryCode(input.ageCategory),
    randomConfirmationSuffix()
  ].join('-');
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

async function getUserIdFromAccessToken(accessTokenRaw: FormDataEntryValue | null) {
  const accessToken = String(accessTokenRaw || '').trim();
  if (!accessToken) {
    return { ok: false as const, message: 'Debes iniciar sesión para continuar.' };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error || !data?.user?.id) {
    return { ok: false as const, message: 'Tu sesión expiró. Inicia sesión nuevamente.' };
  }

  return { ok: true as const, userId: data.user.id };
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

        const daysA = parseWeekdays((a as { weekday?: unknown })?.weekday, (a as { weekdays?: unknown })?.weekdays);
        const daysB = parseWeekdays((b as { weekday?: unknown })?.weekday, (b as { weekdays?: unknown })?.weekdays);
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

        const hasOverlappingTime = hasTimeOverlap(
          (a as { start_time?: string | null })?.start_time ?? null,
          (a as { end_time?: string | null })?.end_time ?? null,
          (b as { start_time?: string | null })?.start_time ?? null,
          (b as { end_time?: string | null })?.end_time ?? null
        );
        if (hasOverlappingTime) {
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

        if (hasOverlappingTime) {
          compatibilityScore += 8;
          scheduleScore += 8;
        }

        const aBranch = normalizeBranch((a as { branch?: unknown })?.branch as string);
        const bBranch = normalizeBranch((b as { branch?: unknown })?.branch as string);
        const aCategory = normalizeCategory((a as { age_category?: unknown })?.age_category as string);
        const bCategory = normalizeCategory((b as { age_category?: unknown })?.age_category as string);

        if (aBranch && bBranch && aBranch === bBranch) {
          compatibilityScore += 12;
          levelScore += 6;
        }

        if (aCategory && bCategory && aCategory === bCategory) {
          compatibilityScore += 10;
          levelScore += 4;
        }

        if (aLevel && bLevel && aLevel === bLevel) {
          compatibilityScore += 4;
          levelScore += 4;
        }

        const aHasCourt = Boolean((a as { has_court?: unknown })?.has_court);
        const bHasCourt = Boolean((b as { has_court?: unknown })?.has_court);
        if (aHasCourt !== bHasCourt) {
          compatibilityScore += 12;
          locationScore += 8;
        } else if (aHasCourt && bHasCourt) {
          compatibilityScore += 8;
          locationScore += 5;
        } else {
          compatibilityScore += 2;
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

    const { data: existingMatches, error: existingMatchesError } = await supabase
      .from('suggested_matches')
      .select('id,post_a_id,post_b_id,status,updated_at,created_at');

    if (existingMatchesError) {
      console.error('rebuildSuggestedMatches existing matches read failed', existingMatchesError);
      return { ok: false, error: 'match_rebuild_failed' as const };
    }

    const existingByPair = new Map<string, Array<{
      id: string;
      post_a_id: string;
      post_b_id: string;
      status: string;
      updated_at: string | null;
      created_at: string | null;
    }>>();
    for (const row of existingMatches || []) {
      const postAId = safeString((row as { post_a_id?: unknown }).post_a_id);
      const postBId = safeString((row as { post_b_id?: unknown }).post_b_id);
      if (!isUuid(postAId) || !isUuid(postBId)) continue;
      const [stableA, stableB] = postAId < postBId ? [postAId, postBId] : [postBId, postAId];
      const pairKey = `${stableA}::${stableB}`;
      const list = existingByPair.get(pairKey) || [];
      list.push({
        id: safeString((row as { id?: unknown }).id),
        post_a_id: stableA,
        post_b_id: stableB,
        status: safeString((row as { status?: unknown }).status),
        updated_at: safeString((row as { updated_at?: unknown }).updated_at) || null,
        created_at: safeString((row as { created_at?: unknown }).created_at) || null
      });
      existingByPair.set(pairKey, list);
    }

    const availabilityById = new Map<string, AvailabilityRow>();
    for (const post of sourcePosts) {
      const postId = safeString((post as { id?: unknown })?.id);
      if (isUuid(postId)) {
        availabilityById.set(postId, post as AvailabilityRow);
      }
    }

    const ownerEmailById = new Map<string, string>();
    const ownerIds = new Set(
      [...availabilityById.values()].map((post) => safeString(post.owner_id)).filter(Boolean)
    );

    for (const ownerId of ownerIds) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(ownerId);
        if (authError) {
          console.error('rebuildSuggestedMatches owner email lookup failed', { ownerId, authError });
          continue;
        }

        const email = safeString(authData?.user?.email).toLowerCase();
        if (email) {
          ownerEmailById.set(ownerId, email);
        }
      } catch (authLookupError) {
        console.error('rebuildSuggestedMatches owner email lookup exception', { ownerId, authLookupError });
      }
    }

    const rowByPair = new Map<string, (typeof safeRows)[number]>();
    for (const row of safeRows) {
      rowByPair.set(`${row.post_a_id}::${row.post_b_id}`, row);
    }

    let insertedMatches = 0;
    let updatedMatches = 0;
    let archivedMatches = 0;
    let duplicateRowsDeleted = 0;
    const duplicateIdsToDelete = new Set<string>();

    const pickPrimaryMatch = (rowsForPair: Array<{
      id: string;
      post_a_id: string;
      post_b_id: string;
      status: string;
      updated_at: string | null;
      created_at: string | null;
    }>) => {
      return [...rowsForPair].sort((a, b) => {
        const score = (value: { status: string; updated_at: string | null; created_at: string | null }) => {
          const normalizedStatus = safeString(value.status).toLowerCase();
          const activeBonus = normalizedStatus === 'active' ? 1 : 0;
          const ts = Date.parse(value.updated_at || value.created_at || '1970-01-01T00:00:00.000Z') || 0;
          return activeBonus * 10_000_000_000_000 + ts;
        };
        return score(b) - score(a);
      })[0];
    };

    for (const [pairKey, row] of rowByPair.entries()) {
      const existingForPair = existingByPair.get(pairKey) || [];
      const primary = existingForPair.length ? pickPrimaryMatch(existingForPair) : null;
      const primaryStatus = safeString(primary?.status).toLowerCase();
      const terminalStatuses = new Set(['completed', 'archived', 'expired']);
      const nextStatus: 'active' | 'matched' | 'completed' | 'archived' | 'expired' | 'unconfirmed' = terminalStatuses.has(primaryStatus)
        ? (primaryStatus as 'completed' | 'archived' | 'expired')
        : 'active';
      if (primary && nextStatus !== primaryStatus) {
        debugMatchingLog('rebuildSuggestedMatches reactivated non-terminal pair', {
          pairKey,
          matchId: primary.id,
          previousStatus: primaryStatus || '(empty)',
          nextStatus
        });
      }
      const updatePayload = {
        post_a_id: row.post_a_id,
        post_b_id: row.post_b_id,
        compatibility_score: row.compatibility_score,
        schedule_score: row.schedule_score,
        location_score: row.location_score,
        level_score: row.level_score,
        elo_score: row.elo_score,
        status: nextStatus,
        updated_at: new Date().toISOString()
      };

      if (primary) {
        const { error: updateError } = await supabase
          .from('suggested_matches')
          .update(updatePayload)
          .eq('id', primary.id);

        if (updateError) {
          console.error('rebuildSuggestedMatches update existing failed', { pairKey, primaryId: primary.id, updateError });
          return { ok: false, error: 'match_rebuild_failed' as const };
        }

        updatedMatches += 1;

        for (const duplicate of existingForPair) {
          if (duplicate.id !== primary.id) {
            duplicateIdsToDelete.add(duplicate.id);
          }
        }
      } else {
        const { data: inserted, error: insertError } = await supabase
          .from('suggested_matches')
          .insert(row)
          .select('id')
          .single();

        if (insertError) {
          console.error('rebuildSuggestedMatches insert failed', { pairKey, insertError });
          return { ok: false, error: 'match_rebuild_failed' as const };
        }

        insertedMatches += 1;

        const postA = availabilityById.get(row.post_a_id);
        const postB = availabilityById.get(row.post_b_id);
        const ownerAId = safeString(postA?.owner_id);
        const ownerBId = safeString(postB?.owner_id);

        if (postA && postB && ownerAId && ownerBId) {
          try {
            await sendMatchNotificationEmails({
              postA,
              postB,
              ownerA: ownerEmailById.has(ownerAId) ? { ownerId: ownerAId, email: ownerEmailById.get(ownerAId)! } : null,
              ownerB: ownerEmailById.has(ownerBId) ? { ownerId: ownerBId, email: ownerEmailById.get(ownerBId)! } : null,
              suggestedMatchId: inserted?.id || null
            });
          } catch (emailError) {
            console.error('rebuildSuggestedMatches sendMatchNotificationEmails failed', {
              pairKey,
              suggestedMatchId: inserted?.id || null,
              emailError
            });
          }
        } else {
          console.warn('rebuildSuggestedMatches skipped match notification due to missing post/owner metadata', {
            pairKey,
            postAFound: Boolean(postA),
            postBFound: Boolean(postB),
            ownerAId: ownerAId || null,
            ownerBId: ownerBId || null
          });
        }
      }
    }

    for (const [pairKey, rowsForPair] of existingByPair.entries()) {
      const computedRow = rowByPair.get(pairKey);
      if (!computedRow) {
        const activeIds = rowsForPair
          .filter((row) => safeString(row.status).toLowerCase() === 'active')
          .map((row) => row.id);

        if (activeIds.length > 0) {
          const { error: archiveError } = await supabase
            .from('suggested_matches')
            .update({ status: 'archived', updated_at: new Date().toISOString() })
            .in('id', activeIds);

          if (archiveError) {
            console.error('rebuildSuggestedMatches archive stale active rows failed', { pairKey, activeIds, archiveError });
            return { ok: false, error: 'match_rebuild_failed' as const };
          }

          archivedMatches += activeIds.length;
        }
      }
    }

    if (duplicateIdsToDelete.size > 0) {
      const duplicateIds = [...duplicateIdsToDelete];
      const { error: duplicateDeleteError } = await supabase
        .from('suggested_matches')
        .delete()
        .in('id', duplicateIds);

      if (duplicateDeleteError) {
        console.error('rebuildSuggestedMatches duplicate cleanup failed', { duplicateIds, duplicateDeleteError });
        return { ok: false, error: 'match_rebuild_failed' as const };
      }

      duplicateRowsDeleted = duplicateIds.length;
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

    debugMatchingLog('rebuildSuggestedMatches status distribution', {
      existingStatuses: (existingMatches || []).reduce<Record<string, number>>((acc, row) => {
        const key = safeString((row as { status?: unknown }).status).toLowerCase() || '(empty)';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    });

    console.log('rebuildSuggestedMatches completed', {
      availabilitiesCount: availabilities.length,
      activeAvailabilitiesCount: sourcePosts.length,
      pairsEvaluated,
      generatedMatches: rows.length,
      insertedMatches,
      updatedMatches,
      archivedMatches,
      duplicateRowsDeleted,
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
  try {
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

    const { count: activeCount } = await supabase
      .from('availabilities')
      .select('id', { head: true, count: 'exact' })
      .eq('contact_email', contact_email)
      .in('status', ['open', 'active', 'published']);

    if ((activeCount || 0) >= 3) {
      return { ok: false, message: 'Ya tienes 3 publicaciones activas. Cierra una para crear otra.' };
    }

    const confirmationCode = generateAvailabilityConfirmationCode({
      clubName: club_name,
      branch,
      ageCategory: age_category
    });

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
        confirmation_code: confirmationCode,
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

      return { ok: false, message: error?.message || 'No se pudo guardar la publicación.' };
    }

    await rebuildSuggestedMatches();

    revalidatePath('/');
    revalidatePath('/explorar');
    revalidatePath('/ranking');

    return { ok: true, id: inserted.id, confirmationCode };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo guardar la publicación.';
    return { ok: false, message };
  }
}


export async function verifyAvailabilityOwnership(id: string, accessToken: string) {
  const safeId = String(id || '').trim();
  if (!safeId) {
    return { ok: false, message: 'No encontramos la publicación a editar.' };
  }

  const authUser = await getUserIdFromAccessToken(accessToken);
  if (!authUser.ok) return authUser;

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('availabilities')
    .select('id, owner_id')
    .eq('id', safeId)
    .maybeSingle<{ id: string; owner_id: string | null }>();

  if (existingError || !existing) {
    return { ok: false, message: 'No encontramos la publicación indicada.' };
  }

  if (!existing.owner_id || existing.owner_id !== authUser.userId) {
    return { ok: false, message: 'No tienes permiso para modificar esta publicación.' };
  }

  return {
    ok: true,
    verifiedEmail: authUser.userId,
    message: 'Propiedad verificada.'
  };
}

export async function updateAvailability(formData: FormData) {
  assertHoneypot(formData);

  const id = String(formData.get('id') || '').trim();
  const authUser = await getUserIdFromAccessToken(formData.get('access_token'));
  if (!authUser.ok) return authUser;
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

  const supabase = getSupabaseAdmin();
  const { data: existing, error: existingError } = await supabase
    .from('availabilities')
    .select('id, owner_id, club_name')
    .eq('id', id)
    .maybeSingle<{ id: string; owner_id: string | null; club_name: string }>();

  if (existingError || !existing) {
    return { ok: false, message: 'No encontramos la publicación indicada.' };
  }

  if (!existing.owner_id || existing.owner_id !== authUser.userId) {
    return { ok: false, message: 'No tienes permiso para editar esta publicación.' };
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



function normalizeEmail(value: FormDataEntryValue | null): string | null {
  const email = String(value || '').trim().toLowerCase();
  if (!email) return null;
  return email;
}

function isValidEmail(value: string | null): value is string {
  if (!value) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function canAccessConversation(conversation: MatchConversationRow, email: string): boolean {
  return conversation.club_a_email === email || conversation.club_b_email === email;
}

export async function createConversationIfNotExists(matchId: string) {
  const normalizedMatchId = String(matchId || '').trim();
  if (!isUuid(normalizedMatchId)) {
    throw new Error('Match inválido para crear conversación.');
  }

  const supabase = getSupabaseAdmin();
  const { data: match, error: matchError } = await supabase
    .from('confirmed_matches')
    .select('*')
    .eq('id', normalizedMatchId)
    .maybeSingle<ConfirmedMatchRow>();

  if (matchError || !match) {
    throw new Error('No encontramos el match solicitado.');
  }

  if (match.status !== 'accepted' && match.status !== 'confirmed') {
    throw new Error('El chat solo está disponible para matches aceptados o confirmados.');
  }

  if (!isValidEmail(match.club_a_email) || !isValidEmail(match.club_b_email)) {
    throw new Error('El match no tiene correos de contacto válidos.');
  }

  const { data, error } = await supabase
    .from('match_conversations')
    .upsert({
      match_id: match.id,
      club_a_email: match.club_a_email,
      club_b_email: match.club_b_email,
      status: 'active'
    }, { onConflict: 'match_id' })
    .select('*')
    .single<MatchConversationRow>();

  if (error || !data) {
    throw new Error('No pudimos iniciar el chat de coordinación.');
  }

  const { count, error: messageCountError } = await supabase
    .from('match_messages')
    .select('id', { head: true, count: 'exact' })
    .eq('conversation_id', data.id);

  if (!messageCountError && (count || 0) === 0) {
    const { data: posts } = await supabase
      .from('availabilities')
      .select('id, club_name')
      .in('id', [match.post_a_id, match.post_b_id]);
    const postById = new Map((posts || []).map((item) => [item.id, String(item.club_name || '').trim()]));
    const clubAName = postById.get(match.post_a_id) || 'Club A';
    const clubBName = postById.get(match.post_b_id) || 'Club B';
    const starterText = `Match confirmado entre ${clubAName} y ${clubBName}. Coordinen aquí los detalles del partido.`;
    await supabase
      .from('match_messages')
      .insert({
        conversation_id: data.id,
        sender_email: data.club_a_email,
        message_text: starterText
      });
  }

  return data;
}

export async function getConversation(matchId: string, email: string) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw new Error('Correo inválido para acceder al chat.');
  }

  const conversation = await createConversationIfNotExists(matchId);
  if (!canAccessConversation(conversation, normalizedEmail)) {
    throw new Error('No tienes acceso a este chat.');
  }

  return conversation;
}

export async function getMessages(conversationId: string) {
  const normalizedConversationId = String(conversationId || '').trim();
  if (!isUuid(normalizedConversationId)) {
    throw new Error('Conversación inválida.');
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('match_messages')
    .select('*')
    .eq('conversation_id', normalizedConversationId)
    .order('created_at', { ascending: true })
    .returns<MatchMessageRow[]>();

  if (error) {
    throw new Error('No pudimos cargar los mensajes.');
  }

  return data || [];
}

export async function sendMessage(conversationId: string, senderEmail: string, messageText: string) {
  const normalizedConversationId = String(conversationId || '').trim();
  const normalizedSenderEmail = String(senderEmail || '').trim().toLowerCase();
  const normalizedMessageText = String(messageText || '').trim();

  if (!isUuid(normalizedConversationId)) {
    throw new Error('Conversación inválida.');
  }
  if (!isValidEmail(normalizedSenderEmail)) {
    throw new Error('Debes enviar un correo válido.');
  }
  if (!normalizedMessageText) {
    throw new Error('El mensaje no puede estar vacío.');
  }

  const supabase = getSupabaseAdmin();
  const { data: conversation, error: conversationError } = await supabase
    .from('match_conversations')
    .select('*')
    .eq('id', normalizedConversationId)
    .maybeSingle<MatchConversationRow>();

  if (conversationError || !conversation) {
    throw new Error('No encontramos la conversación.');
  }

  if (!canAccessConversation(conversation, normalizedSenderEmail)) {
    throw new Error('No tienes permiso para enviar mensajes en este chat.');
  }

  const { error } = await supabase
    .from('match_messages')
    .insert({
      conversation_id: normalizedConversationId,
      sender_email: normalizedSenderEmail,
      message_text: normalizedMessageText
    });

  if (error) {
    throw new Error('No pudimos enviar tu mensaje.');
  }
}

export async function getMatchContact(formData: FormData): Promise<
  | {
    ok: true;
    contact: { clubName: string; comuna: string; hasCourt: boolean; contactEmail: string; notes: string | null };
    matchDone: boolean;
    persisted: boolean;
    successMessage: string;
  }
  | { ok: false; message: string }
> {
  try {
    assertHoneypot(formData);

    const matchId = String(formData.get('match_id') || '').trim();
    console.log('[getMatchContact] matchId recibido:', matchId);
    const emailInput = normalizeEmail(formData.get('email'));

    console.log('[getMatchContact] matchId:', matchId);

    if (!isUuid(matchId)) {
      return { ok: false, message: 'El match seleccionado no es válido.' };
    }

    if (!isValidEmail(emailInput)) {
      return { ok: false, message: 'Ingresa un correo válido.' };
    }

    const supabase = getSupabaseAdmin();
    const { data: match, error: matchError } = await supabase
      .from('suggested_matches')
      .select('id,post_a_id,post_b_id,status')
      .eq('id', matchId)
      .maybeSingle<{ id: string; post_a_id: string; post_b_id: string; status: string }>();

    if (matchError || !match) {
      return { ok: false, message: 'No encontramos este match.' };
    }

    const normalizedMatchStatus = safeString(match.status).toLowerCase();
    console.log('[getMatchContact] match leído:', {
      id: match.id,
      post_a_id: match.post_a_id,
      post_b_id: match.post_b_id,
      status: match.status
    });
    console.log('[getMatchContact] current status:', normalizedMatchStatus || '(empty)');

    if (normalizedMatchStatus !== 'active' && normalizedMatchStatus !== 'matched') {
      return { ok: false, message: 'Este match ya no está disponible.' };
    }

    const { data: teams, error: teamsError } = await supabase
      .from('availabilities')
      .select('id,club_name,comuna,has_court,contact_email,notes')
      .in('id', [match.post_a_id, match.post_b_id]);

    if (teamsError || !teams || teams.length !== 2) {
      return { ok: false, message: 'No encontramos la información de ambos equipos.' };
    }

    const byId = new Map(teams.map((team) => [team.id, team]));
    const teamA = byId.get(match.post_a_id);
    const teamB = byId.get(match.post_b_id);

    if (!teamA || !teamB) {
      return { ok: false, message: 'No encontramos la información de ambos equipos.' };
    }

    const teamAEmail = normalizeEmail(teamA.contact_email);
    const teamBEmail = normalizeEmail(teamB.contact_email);

    if (emailInput !== teamAEmail && emailInput !== teamBEmail) {
      return { ok: false, message: 'Este correo no está asociado a este match.' };
    }

    const rival = emailInput === teamAEmail ? teamB : teamA;
    const rivalEmail = normalizeEmail(rival.contact_email);

    if (!rivalEmail) {
      return { ok: false, message: 'El equipo rival no tiene correo de contacto disponible.' };
    }

    let persisted = normalizedMatchStatus === 'matched';
    let finalStatus = normalizedMatchStatus;

    if (normalizedMatchStatus === 'active') {
      const updatePayload = { status: 'matched' as const };
      console.log('[getMatchContact] status antes del update:', normalizedMatchStatus);
      console.log('[getMatchContact] intentando update status active -> matched');
      console.log('[getMatchContact] update payload:', updatePayload);
      const { data: updateResult, error: updateError } = await supabase
        .from('suggested_matches')
        .update(updatePayload)
        .eq('id', matchId)
        .eq('status', 'active')
        .select('id,status');

      console.log('[getMatchContact] resultado del update:', updateResult);
      if (updateError) {
        console.error('[getMatchContact] update error:', updateError);
      }

      const updateAffectedRows = Array.isArray(updateResult) ? updateResult.length : 0;
      console.log('[getMatchContact] update affected rows:', updateAffectedRows);

      if (updateError || updateAffectedRows === 0) {
        console.error('[getMatchContact] failed to move suggested match to matched after successful validation', {
          matchId: match.id,
          updateError,
          updateAffectedRows
        });
        if (updateAffectedRows === 0) {
          console.error('[getMatchContact] update afectó 0 filas para matchId', matchId);
        }
      }

      const { data: persistedMatch, error: persistedMatchError } = await supabase
        .from('suggested_matches')
        .select('id,status')
        .eq('id', matchId)
        .maybeSingle<{ id: string; status: string }>();

      console.log('[getMatchContact] select posterior al update:', persistedMatch);

      if (persistedMatchError) {
        console.error('[getMatchContact] error verificando persistencia tras update:', persistedMatchError);
      }

      finalStatus = safeString(persistedMatch?.status).toLowerCase();
      persisted = finalStatus === 'matched';
      console.log('[getMatchContact] status real después del update:', finalStatus || '(empty)');

      if (!persisted) {
        console.error('[getMatchContact] update ejecutado pero status final no quedó matched', {
          matchId: match.id,
          persistedStatus: persistedMatch?.status ?? null
        });
        return { ok: false, message: 'No pudimos marcar el match como coordinado en el sistema. Intenta nuevamente.' };
      }
    }

    const matchDone = finalStatus === 'matched';
    if (persisted) {
      revalidatePath('/');
      revalidatePath('/matches/aceptar');
      revalidatePath(`/matches/aceptar?matchId=${matchId}`);
    }

    return {
      ok: true,
      matchDone,
      persisted,
      successMessage: persisted
        ? 'Match coordinado. Ya tienes el contacto del rival.'
        : 'Contacto desbloqueado, pero no pudimos marcar el match como coordinado en el sistema.',
      contact: {
        clubName: safeString(rival.club_name) || 'Club rival',
        comuna: safeString(rival.comuna) || 'Comuna no informada',
        hasCourt: Boolean(rival.has_court),
        contactEmail: rivalEmail,
        notes: normalizeOptional(rival.notes)
      }
    };
  } catch (error) {
    console.error('[getMatchContact] unexpected error', error);
    return { ok: false, message: 'No pudimos validar el correo en este momento. Intenta nuevamente.' };
  }
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
  const teamACode = String(formData.get('codigo_equipo_a') || '').trim();
  const teamBCode = String(formData.get('codigo_equipo_b') || '').trim();

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
  const teamACodeHash = teamACode ? hashCode(teamACode) : hashCode(randomBytes(12).toString('hex'));
  const teamBCodeHash = teamBCode ? hashCode(teamBCode) : hashCode(randomBytes(12).toString('hex'));
  const nowIso = new Date().toISOString();
  const teamAConfirmedAt = teamACode ? nowIso : null;
  const teamBConfirmedAt = teamBCode ? nowIso : null;
  const rankingValidatedAt = teamACode && teamBCode ? nowIso : null;
  const rankingStatus = teamACode && teamBCode ? 'confirmado' : 'pendiente';
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

  await supabase.from('match_results').insert({
    club_id: club.id,
    opponent_club_id: opponent.id,
    winner_club_id: winnerClubId,
    opponent_name: opponent.club_name,
    match_date: matchDate,
    branch,
    match_type: matchType,
    sets_won: setsWon,
    sets_lost: setsLost,
    set_scores: setScores,
    location,
    notes,
    proof_photo_url: proofPhotoUrl,
    elo_before: club.current_elo,
    elo_after: ownUpdate.newRating,
    elo_delta: ownUpdate.delta,
    team_a_code_hash: teamACodeHash,
    team_b_code_hash: teamBCodeHash,
    team_a_result_confirmed_at: teamAConfirmedAt,
    team_b_result_confirmed_at: teamBConfirmedAt,
    ranking_validated_at: rankingValidatedAt,
    ranking_status: rankingStatus
  });

  revalidatePath('/');
  revalidatePath('/ranking');
  revalidatePath(`/club/${club.id}`);
  revalidatePath(`/club/${opponent.id}`);
  revalidatePath('/resultados');

  return { ok: true };
}

export async function saveMatchStream(formData: FormData) {
  const matchId = String(formData.get('match_id') || '').trim();
  const email = String(formData.get('correo_equipo') || '').trim().toLowerCase();
  const streamUrl = String(formData.get('stream_url') || '').trim();
  if (!matchId || !email || !streamUrl) return { ok: false, message: 'Completa todos los campos.' };
  if (!isValidHttpUrl(streamUrl)) return { ok: false, message: 'Ingresa un enlace válido (http/https).' };
  const supabase = getSupabaseAdmin();
  const { data: match } = await supabase
    .from('suggested_matches')
    .select('id,post_a_id,post_b_id,status')
    .eq('id', matchId)
    .maybeSingle<{ id: string; post_a_id: string; post_b_id: string; status: string }>();
  if (!match || match.status !== 'matched') return { ok: false, message: 'El cruce no está confirmado.' };
  const { data: posts } = await supabase.from('availabilities').select('id,contact_email').in('id', [match.post_a_id, match.post_b_id]);
  const authorizedPost = (posts || []).find((p) => String(p.contact_email || '').trim().toLowerCase() === email);
  if (!authorizedPost) return { ok: false, message: 'Solo un equipo involucrado puede editar la transmisión.' };
  await supabase.from('suggested_matches').update({
    stream_url: streamUrl,
    stream_submitted_by_post_id: authorizedPost.id,
    stream_submitted_at: new Date().toISOString()
  }).eq('id', matchId);
  revalidatePath('/');
  return { ok: true, message: 'Transmisión guardada correctamente.' };
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
