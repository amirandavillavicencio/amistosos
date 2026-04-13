import type {
  MatchingAvailability,
  SuggestedMatchInsertRow,
  SuggestedMatchScoreBreakdown,
  SuggestedMatchCard
} from '@/lib/types';

const VALID_WEEKDAYS = new Set([
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
  'domingo'
]);

export function normalizeId(value: string | null | undefined): string {
  return String(value || '').trim();
}

export function normalizeClubName(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

function normalizeText(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

export function canonicalPairIds(aId: string, bId: string): { post_a_id: string; post_b_id: string } {
  const left = normalizeId(aId);
  const right = normalizeId(bId);
  return left < right
    ? { post_a_id: left, post_b_id: right }
    : { post_a_id: right, post_b_id: left };
}

export function canonicalPairKey(aId: string, bId: string): string {
  const pair = canonicalPairIds(aId, bId);
  return `${pair.post_a_id}::${pair.post_b_id}`;
}

export function resolveWeekdays(post: Pick<MatchingAvailability, 'weekday' | 'weekdays'>): string[] {
  const fromWeekdays = Array.isArray(post.weekdays) ? post.weekdays : [];
  const merged = [...fromWeekdays, post.weekday || ''];
  const seen = new Set<string>();

  return merged
    .map((day) => String(day || '').trim().toLowerCase())
    .filter((day) => VALID_WEEKDAYS.has(day))
    .filter((day) => {
      if (seen.has(day)) return false;
      seen.add(day);
      return true;
    });
}

export function toMinutes(value: string | null | undefined): number {
  const clean = String(value || '').trim();
  const match = clean.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return -1;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function hasValidTimeRange(post: Pick<MatchingAvailability, 'start_time' | 'end_time'>): boolean {
  const start = toMinutes(post.start_time);
  const end = toMinutes(post.end_time);
  return start >= 0 && end >= 0 && end > start;
}

export function overlapMinutes(
  a: Pick<MatchingAvailability, 'start_time' | 'end_time'>,
  b: Pick<MatchingAvailability, 'start_time' | 'end_time'>
): number {
  const aStart = toMinutes(a.start_time);
  const aEnd = toMinutes(a.end_time);
  const bStart = toMinutes(b.start_time);
  const bEnd = toMinutes(b.end_time);

  if (aStart < 0 || aEnd < 0 || bStart < 0 || bEnd < 0) return 0;
  return Math.max(0, Math.min(aEnd, bEnd) - Math.max(aStart, bStart));
}

function hasUsableStatus(status: string | null | undefined): boolean {
  const normalized = normalizeText(status);

  if (!normalized) return true;

  return ['open', 'active', 'published'].includes(normalized);
}

function hasCompatibleBranch(a: MatchingAvailability, b: MatchingAvailability): boolean {
  const aBranch = normalizeText(a.branch);
  const bBranch = normalizeText(b.branch);

  if (!aBranch || !bBranch) return true;
  return aBranch === bBranch;
}

function hasCompatibleAgeCategory(a: MatchingAvailability, b: MatchingAvailability): boolean {
  const aCategory = normalizeText(a.age_category);
  const bCategory = normalizeText(b.age_category);

  if (!aCategory || !bCategory) return true;
  return aCategory === bCategory;
}

function hasEnoughScheduleData(post: MatchingAvailability): boolean {
  if (!hasValidTimeRange(post)) return false;
  return resolveWeekdays(post).length > 0;
}

export function isAvailabilityEligible(post: MatchingAvailability): boolean {
  if (!normalizeId(post.id)) return false;
  if (!hasUsableStatus(post.status)) return false;
  if (!normalizeClubName(post.club_name)) return false;
  if (!hasEnoughScheduleData(post)) return false;
  return true;
}

function sharedWeekdays(a: MatchingAvailability, b: MatchingAvailability): string[] {
  const bDays = new Set(resolveWeekdays(b));
  return resolveWeekdays(a).filter((day) => bDays.has(day));
}

function normalizedComuna(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

export function canPostsMatch(a: MatchingAvailability, b: MatchingAvailability): boolean {
  if (!isAvailabilityEligible(a) || !isAvailabilityEligible(b)) return false;
  if (normalizeId(a.id) === normalizeId(b.id)) return false;
  if (normalizeClubName(a.club_name) === normalizeClubName(b.club_name)) return false;

  if (!hasCompatibleBranch(a, b)) return false;
  if (!hasCompatibleAgeCategory(a, b)) return false;

  const sharedDays = sharedWeekdays(a, b);
  if (sharedDays.length === 0) return false;

  const overlap = overlapMinutes(a, b);
  if (overlap <= 0) return false;

  if (!a.has_court && !b.has_court) return false;

  return true;
}

function timeClosenessScore(a: MatchingAvailability, b: MatchingAvailability): number {
  const startDiff = Math.abs(toMinutes(a.start_time) - toMinutes(b.start_time));
  const endDiff = Math.abs(toMinutes(a.end_time) - toMinutes(b.end_time));
  const totalDiff = startDiff + endDiff;

  if (totalDiff <= 20) return 12;
  if (totalDiff <= 40) return 9;
  if (totalDiff <= 70) return 6;
  if (totalDiff <= 100) return 3;
  return 0;
}

export function scoreMatch(
  a: MatchingAvailability,
  b: MatchingAvailability
): { total: number; breakdown: SuggestedMatchScoreBreakdown } {
  const sharedDays = sharedWeekdays(a, b);
  const overlap = overlapMinutes(a, b);
  const sameComuna =
    normalizedComuna(a.comuna) !== '' && normalizedComuna(a.comuna) === normalizedComuna(b.comuna);

  const sameBranch =
    normalizeText(a.branch) !== '' &&
    normalizeText(b.branch) !== '' &&
    normalizeText(a.branch) === normalizeText(b.branch);

  const sameAgeCategory =
    normalizeText(a.age_category) !== '' &&
    normalizeText(b.age_category) !== '' &&
    normalizeText(a.age_category) === normalizeText(b.age_category);

  const breakdown: SuggestedMatchScoreBreakdown = {
    base: 20,
    sharedDays: Math.min(20, sharedDays.length * 7),
    overlapMinutes: Math.min(24, Math.floor(overlap / 20) * 4),
    sameComuna: sameComuna ? 8 : 0,
    courtAvailability: a.has_court && b.has_court ? 10 : 5,
    timeCloseness: timeClosenessScore(a, b),
    strongMatchBonus: sharedDays.length >= 2 && overlap >= 90 ? 8 : 0,
    marginalOverlapPenalty: overlap < 45 ? -4 : 0,
    overlapRawMinutes: overlap,
    sharedWeekdays: sharedDays
  };

  const branchScore = sameBranch ? 18 : 0;
  const ageCategoryScore = sameAgeCategory ? 12 : 0;

  const total = Math.max(
    0,
    Math.min(
      100,
      breakdown.base +
        branchScore +
        ageCategoryScore +
        breakdown.sharedDays +
        breakdown.overlapMinutes +
        breakdown.sameComuna +
        breakdown.courtAvailability +
        breakdown.timeCloseness +
        breakdown.strongMatchBonus +
        breakdown.marginalOverlapPenalty
    )
  );

  return { total, breakdown };
}

export function buildSuggestedMatches(availabilities: MatchingAvailability[]): SuggestedMatchInsertRow[] {
  const eligible = availabilities.filter(isAvailabilityEligible);
  const rowsByPair = new Map<string, SuggestedMatchInsertRow>();

  console.log('[matching] total availabilities:', availabilities.length);
  console.log('[matching] eligible availabilities:', eligible.length);

  for (let i = 0; i < eligible.length; i += 1) {
    for (let j = i + 1; j < eligible.length; j += 1) {
      const a = eligible[i];
      const b = eligible[j];

      if (!canPostsMatch(a, b)) continue;

      const pair = canonicalPairIds(a.id, b.id);
      const pairKey = canonicalPairKey(pair.post_a_id, pair.post_b_id);

      if (rowsByPair.has(pairKey)) continue;

      const { total, breakdown } = scoreMatch(a, b);

      rowsByPair.set(pairKey, {
        post_a_id: pair.post_a_id,
        post_b_id: pair.post_b_id,
        compatibility_score: total,
        schedule_score: breakdown.sharedDays + breakdown.overlapMinutes + breakdown.timeCloseness,
        location_score: breakdown.sameComuna,
        level_score: breakdown.courtAvailability,
        elo_score: 0,
        status: 'active'
      });
    }
  }

  return [...rowsByPair.values()].sort((a, b) => b.compatibility_score - a.compatibility_score);
}

export function getMatchTier(score: number): 'Match alto' | 'Match medio' | 'Match bajo' {
  if (score >= 82) return 'Match alto';
  if (score >= 62) return 'Match medio';
  return 'Match bajo';
}

export function getMatchReasons(match: SuggestedMatchCard): string[] {
  const reasons: string[] = ['Cruce real de horario'];

  if (match.breakdown.sharedWeekdays.length > 0) {
    reasons.push(
      match.breakdown.sharedWeekdays.length > 1
        ? `Comparten ${match.breakdown.sharedWeekdays.length} días`
        : `Comparten ${match.breakdown.sharedWeekdays[0]}`
    );
  }

  if (match.breakdown.overlapRawMinutes > 0) {
    reasons.push(`Cruce horario (${match.breakdown.overlapRawMinutes} min)`);
  }

  reasons.push(match.breakdown.courtAvailability >= 10 ? 'Ambos ponen cancha' : 'Un equipo pone cancha');

  if (match.breakdown.sameComuna > 0) {
    reasons.push('Misma comuna');
  }

  reasons.push(getMatchTier(match.totalScore));

  return reasons;
}