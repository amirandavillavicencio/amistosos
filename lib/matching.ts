import type {
  AvailabilityRow,
  ConfirmedMatchRow,
  MatchIntentRow,
  MatchingAvailability,
  SuggestedMatchBuildStats,
  SuggestedMatchCard,
  SuggestedMatchInsertRow,
  SuggestedMatchScoreBreakdown
} from '@/lib/types';
import { getSupabaseAdmin } from '@/lib/supabase';
import { hasTimeOverlap, normalizeBranch, normalizeCategory, parseWeekdays } from '@/lib/format';

export const USABLE_AVAILABILITY_STATUSES = ['open', 'active', 'published'] as const;

const USABLE_STATUS_SET = new Set<string>(USABLE_AVAILABILITY_STATUSES);
const WEEKDAY_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo'
};


export function normalizeText(value: string | null | undefined): string {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

export function normalizeId(value: string | null | undefined): string {
  return String(value ?? '').trim();
}

export function normalizeClubName(value: string | null | undefined): string {
  return normalizeText(value);
}

export function canonicalPairIds(aId: string, bId: string): { post_a_id: string; post_b_id: string } {
  const left = normalizeId(aId);
  const right = normalizeId(bId);

  return left <= right
    ? { post_a_id: left, post_b_id: right }
    : { post_a_id: right, post_b_id: left };
}

export function canonicalPairKey(aId: string, bId: string): string {
  const pair = canonicalPairIds(aId, bId);
  return `${pair.post_a_id}::${pair.post_b_id}`;
}

export function isUsableAvailabilityStatus(status: string | null | undefined): boolean {
  return USABLE_STATUS_SET.has(normalizeText(status));
}

export function formatWeekdayLabel(day: string | null | undefined): string {
  const normalized = normalizeText(day);
  return WEEKDAY_LABELS[normalized] || String(day ?? '').trim();
}

export function formatWeekdayList(days: string[]): string {
  return days.map((day) => formatWeekdayLabel(day)).filter(Boolean).join(', ');
}

export function resolveWeekdays(post: Pick<MatchingAvailability, 'weekday' | 'weekdays'>): string[] {
  return parseWeekdays(post.weekday, post.weekdays);
}

export function toMinutes(value: string | null | undefined): number | null {
  const clean = String(value ?? '').trim();
  const match = clean.match(/^([01]\d|2[0-3]):([0-5]\d)$/);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

export function formatTimeLabel(value: string | null | undefined): string {
  const clean = String(value ?? '').trim();
  return /^\d{2}:\d{2}$/.test(clean) ? clean.slice(0, 5) : '--:--';
}

export function hasValidTimeRange(post: Pick<MatchingAvailability, 'start_time' | 'end_time'>): boolean {
  const start = toMinutes(post.start_time);
  const end = toMinutes(post.end_time);

  return start !== null && end !== null && end > start;
}

export function getTimeOverlapMinutes(
  a: Pick<MatchingAvailability, 'start_time' | 'end_time'>,
  b: Pick<MatchingAvailability, 'start_time' | 'end_time'>
): number {
  const aStart = toMinutes(a.start_time);
  const aEnd = toMinutes(a.end_time);
  const bStart = toMinutes(b.start_time);
  const bEnd = toMinutes(b.end_time);

  if (aStart === null || aEnd === null || bStart === null || bEnd === null) {
    return 0;
  }

  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

export function getStartTimeDifferenceMinutes(
  a: Pick<MatchingAvailability, 'start_time'>,
  b: Pick<MatchingAvailability, 'start_time'>
): number {
  const aStart = toMinutes(a.start_time);
  const bStart = toMinutes(b.start_time);

  if (aStart === null || bStart === null) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.abs(aStart - bStart);
}

export function getSharedWeekdays(a: MatchingAvailability, b: MatchingAvailability): string[] {
  const bDays = new Set(resolveWeekdays(b));
  return resolveWeekdays(a).filter((day) => bDays.has(day));
}

function sameNormalizedValue(left: string | null | undefined, right: string | null | undefined): boolean {
  const normalizedLeft = normalizeText(left);
  const normalizedRight = normalizeText(right);

  return Boolean(normalizedLeft && normalizedRight && normalizedLeft === normalizedRight);
}

function getOverlapScore(overlapMinutes: number): number {
  if (overlapMinutes >= 120) return 20;
  if (overlapMinutes >= 90) return 15;
  if (overlapMinutes >= 60) return 10;
  if (overlapMinutes > 0) return 5;
  return 0;
}

function getSharedDaysScore(sharedDayCount: number): number {
  if (sharedDayCount >= 2) return 10;
  if (sharedDayCount === 1) return 5;
  return 0;
}

function getStartTimeScore(startTimeDifferenceMinutes: number): number {
  if (startTimeDifferenceMinutes <= 30) return 10;
  if (startTimeDifferenceMinutes <= 60) return 5;
  return 0;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function createZeroBreakdown(): SuggestedMatchScoreBreakdown {
  return {
    base: 0,
    sameComuna: 0,
    courtAvailability: 0,
    overlapScore: 0,
    sharedDaysScore: 0,
    startTimeScore: 0,
    overlapMinutes: 0,
    sharedWeekdays: [],
    startTimeDifferenceMinutes: Number.POSITIVE_INFINITY,
    totalBeforeClamp: 0,
    items: [
      { key: 'base', label: 'Base por match válido', points: 0 },
      { key: 'sameComuna', label: 'Misma comuna', points: 0 },
      { key: 'courtAvailability', label: 'Disponibilidad de cancha', points: 0 },
      { key: 'overlapScore', label: 'Overlap horario', points: 0 },
      { key: 'sharedDaysScore', label: 'Días compartidos', points: 0 },
      { key: 'startTimeScore', label: 'Cercanía de hora de inicio', points: 0 }
    ]
  };
}

export function isAvailabilityEligible(post: MatchingAvailability): boolean {
  if (!normalizeId(post.id)) return false;
  if (!normalizeClubName(post.club_name)) return false;
  if (!normalizeText(post.branch)) return false;
  if (!normalizeText(post.age_category)) return false;
  if (!hasValidTimeRange(post)) return false;
  if (resolveWeekdays(post).length === 0) return false;
  if (!isUsableAvailabilityStatus(post.status)) return false;
  return true;
}

export function canPostsMatch(a: MatchingAvailability, b: MatchingAvailability): boolean {
  if (!isAvailabilityEligible(a) || !isAvailabilityEligible(b)) return false;
  if (normalizeId(a.id) === normalizeId(b.id)) return false;
  if (normalizeClubName(a.club_name) === normalizeClubName(b.club_name)) return false;
  if (normalizeBranch(a.branch) !== normalizeBranch(b.branch)) return false;
  if (normalizeCategory(a.age_category) !== normalizeCategory(b.age_category)) return false;

  const sharedWeekdays = getSharedWeekdays(a, b);
  if (sharedWeekdays.length === 0) return false;

  if (!hasTimeOverlap(a.start_time, a.end_time, b.start_time, b.end_time)) return false;

  return true;
}

export function scoreMatch(
  a: MatchingAvailability,
  b: MatchingAvailability
): { total: number; breakdown: SuggestedMatchScoreBreakdown } {
  if (!canPostsMatch(a, b)) {
    return { total: 0, breakdown: createZeroBreakdown() };
  }

  const sharedWeekdays = getSharedWeekdays(a, b);
  const overlapMinutes = getTimeOverlapMinutes(a, b);
  const startTimeDifferenceMinutes = getStartTimeDifferenceMinutes(a, b);

  const base = 40;
  const sameComuna = sameNormalizedValue(a.comuna, b.comuna) ? 15 : 0;
  const courtAvailability = a.has_court && b.has_court ? 10 : 5;
  const overlapScore = getOverlapScore(overlapMinutes);
  const sharedDaysScore = getSharedDaysScore(sharedWeekdays.length);
  const startTimeScore = getStartTimeScore(startTimeDifferenceMinutes);
  const totalBeforeClamp = base + sameComuna + courtAvailability + overlapScore + sharedDaysScore + startTimeScore;

  const breakdown: SuggestedMatchScoreBreakdown = {
    base,
    sameComuna,
    courtAvailability,
    overlapScore,
    sharedDaysScore,
    startTimeScore,
    overlapMinutes,
    sharedWeekdays,
    startTimeDifferenceMinutes,
    totalBeforeClamp,
    items: [
      { key: 'base', label: 'Base por match válido', points: base, detail: 'Misma rama, categoría, día y cruce horario real.' },
      { key: 'sameComuna', label: 'Misma comuna', points: sameComuna },
      {
        key: 'courtAvailability',
        label: 'Disponibilidad de cancha',
        points: courtAvailability,
        detail: a.has_court && b.has_court ? 'Ambos equipos tienen cancha.' : 'Al menos uno de los equipos tiene cancha.'
      },
      {
        key: 'overlapScore',
        label: 'Overlap horario',
        points: overlapScore,
        detail: `${overlapMinutes} min de cruce real.`
      },
      {
        key: 'sharedDaysScore',
        label: 'Días compartidos',
        points: sharedDaysScore,
        detail: sharedWeekdays.length ? formatWeekdayList(sharedWeekdays) : undefined
      },
      {
        key: 'startTimeScore',
        label: 'Cercanía de hora de inicio',
        points: startTimeScore,
        detail: Number.isFinite(startTimeDifferenceMinutes) ? `${startTimeDifferenceMinutes} min de diferencia.` : undefined
      }
    ]
  };

  return {
    total: clampScore(totalBeforeClamp),
    breakdown
  };
}

function getCreatedAtTimestamp(value: string | null | undefined): number {
  const parsed = Date.parse(String(value ?? ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

function orderPair(a: MatchingAvailability, b: MatchingAvailability): [MatchingAvailability, MatchingAvailability] {
  const pair = canonicalPairIds(a.id, b.id);
  return normalizeId(a.id) === pair.post_a_id ? [a, b] : [b, a];
}

function compareSuggestedMatches(left: SuggestedMatchCard, right: SuggestedMatchCard): number {
  if (right.totalScore !== left.totalScore) {
    return right.totalScore - left.totalScore;
  }

  if (right.overlapMinutes !== left.overlapMinutes) {
    return right.overlapMinutes - left.overlapMinutes;
  }

  if (right.sharedWeekdays.length !== left.sharedWeekdays.length) {
    return right.sharedWeekdays.length - left.sharedWeekdays.length;
  }

  const rightRecency = Math.max(getCreatedAtTimestamp(right.a.created_at), getCreatedAtTimestamp(right.b.created_at));
  const leftRecency = Math.max(getCreatedAtTimestamp(left.a.created_at), getCreatedAtTimestamp(left.b.created_at));

  if (rightRecency !== leftRecency) {
    return rightRecency - leftRecency;
  }

  return left.pairKey.localeCompare(right.pairKey);
}

export function buildLiveSuggestedMatches(
  availabilities: MatchingAvailability[],
  limit = 12
): { matches: SuggestedMatchCard[]; stats: SuggestedMatchBuildStats } {
  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 12;
  const eligible = availabilities.filter(isAvailabilityEligible);
  const matches: SuggestedMatchCard[] = [];
  const seenPairs = new Set<string>();
  let pairsEvaluated = 0;

  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      pairsEvaluated += 1;

      const left = eligible[i];
      const right = eligible[j];

      if (!canPostsMatch(left, right)) {
        continue;
      }

      const pairKey = canonicalPairKey(left.id, right.id);
      if (seenPairs.has(pairKey)) {
        continue;
      }

      seenPairs.add(pairKey);

      const [a, b] = orderPair(left, right);
      const { total, breakdown } = scoreMatch(a, b);

      matches.push({
        id: pairKey,
        pairKey,
        status: 'active',
        totalScore: total,
        scheduleScore: breakdown.overlapScore + breakdown.sharedDaysScore + breakdown.startTimeScore,
        locationScore: breakdown.sameComuna,
        levelScore: breakdown.courtAvailability,
        eloScore: 0,
        branch: a.branch,
        ageCategory: a.age_category,
        overlapMinutes: breakdown.overlapMinutes,
        sharedWeekdays: breakdown.sharedWeekdays,
        a,
        b,
        breakdown
      });
    }
  }

  const sortedMatches = matches.sort(compareSuggestedMatches);
  const limitedMatches = sortedMatches.slice(0, safeLimit);

  return {
    matches: limitedMatches,
    stats: {
      totalAvailabilities: availabilities.length,
      eligibleAvailabilities: eligible.length,
      pairsEvaluated,
      validMatches: sortedMatches.length,
      returnedMatches: limitedMatches.length
    }
  };
}

export function buildSuggestedMatches(availabilities: MatchingAvailability[]): SuggestedMatchInsertRow[] {
  const { matches } = buildLiveSuggestedMatches(availabilities, Number.MAX_SAFE_INTEGER);

  return matches.map((match) => ({
    post_a_id: match.a.id,
    post_b_id: match.b.id,
    compatibility_score: match.totalScore,
    schedule_score: match.scheduleScore,
    location_score: match.locationScore,
    level_score: match.levelScore,
    elo_score: match.eloScore,
    status: 'active'
  }));
}

export function getMatchTier(score: number): 'Match alto' | 'Match medio' | 'Match bajo' {
  if (score >= 80) return 'Match alto';
  if (score >= 60) return 'Match medio';
  return 'Match bajo';
}

export function getMatchReasons(match: SuggestedMatchCard): string[] {
  const reasons: string[] = ['Misma rama y categoría'];

  if (match.sharedWeekdays.length >= 2) {
    reasons.push(`Coinciden ${match.sharedWeekdays.length} días (${formatWeekdayList(match.sharedWeekdays)})`);
  } else if (match.sharedWeekdays.length === 1) {
    reasons.push(`Coinciden el ${formatWeekdayLabel(match.sharedWeekdays[0])}`);
  }

  if (match.overlapMinutes > 0) {
    reasons.push(`Cruce horario de ${match.overlapMinutes} min`);
  }

  if (match.breakdown.courtAvailability >= 10) {
    reasons.push('Ambos equipos tienen cancha');
  } else if (match.breakdown.courtAvailability > 0) {
    reasons.push('Uno de los equipos tiene cancha');
  }

  if (match.breakdown.sameComuna > 0) {
    reasons.push('Misma comuna');
  }

  if (match.breakdown.startTimeScore > 0) {
    reasons.push(
      match.breakdown.startTimeDifferenceMinutes <= 30
        ? 'Empiezan casi a la misma hora'
        : 'Horas de inicio cercanas'
    );
  }

  reasons.push(getMatchTier(match.totalScore));

  return [...new Set(reasons)];
}

function pickRandom<T>(items: T[]): T | null {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index] ?? null;
}

export async function getNextCard(fromPostId: string, excludePostIds: string[] = []): Promise<AvailabilityRow | null> {
  const normalizedFromId = normalizeId(fromPostId);
  if (!normalizedFromId) return null;

  const supabase = getSupabaseAdmin();
  const blockedIds = new Set<string>([normalizedFromId, ...excludePostIds.map((id) => normalizeId(id))]);

  const { data: posts, error } = await supabase
    .from('availabilities')
    .select('*')
    .in('status', [...USABLE_AVAILABILITY_STATUSES])
    .returns<AvailabilityRow[]>();

  if (error) {
    console.error('getNextCard availabilities query failed', error);
    throw new Error('No pudimos cargar equipos disponibles.');
  }

  const candidates = (posts || []).filter((post) => !blockedIds.has(normalizeId(post.id)));
  return pickRandom(candidates);
}

export async function createMatchIntent(fromPostId: string, toPostId: string): Promise<{
  intent: MatchIntentRow;
  confirmedMatch: ConfirmedMatchRow | null;
}> {
  const fromId = normalizeId(fromPostId);
  const toId = normalizeId(toPostId);

  if (!fromId || !toId || fromId === toId) {
    throw new Error('Intento de match inválido.');
  }

  const now = new Date().toISOString();
  const syntheticIntent: MatchIntentRow = {
    id: `${fromId}::${toId}::${Date.now()}`,
    from_post_id: fromId,
    to_post_id: toId,
    created_at: now
  };

  return { intent: syntheticIntent, confirmedMatch: null };
}
