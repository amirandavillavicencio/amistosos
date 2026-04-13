import type { AvailabilityWithTeam } from '@/lib/types';

function minutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return -1;
  return h * 60 + m;
}

function overlapInMinutes(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const aStartMinutes = minutes(aStart);
  const aEndMinutes = minutes(aEnd);
  const bStartMinutes = minutes(bStart);
  const bEndMinutes = minutes(bEnd);

  if (aStartMinutes < 0 || aEndMinutes < 0 || bStartMinutes < 0 || bEndMinutes < 0) return 0;

  const start = Math.max(aStartMinutes, bStartMinutes);
  const end = Math.min(aEndMinutes, bEndMinutes);
  return Math.max(0, end - start);
}

function resolveWeekdays(post: AvailabilityWithTeam): string[] {
  if (post.weekdays?.length) return post.weekdays;
  if (post.weekday) return [post.weekday];
  return [];
}

function sharedWeekdays(a: AvailabilityWithTeam, b: AvailabilityWithTeam): string[] {
  const bDays = new Set(resolveWeekdays(b));
  return resolveWeekdays(a).filter((day, index, arr) => bDays.has(day) && arr.indexOf(day) === index);
}

function safeComuna(post: AvailabilityWithTeam) {
  return (post.comuna || '').trim().toLowerCase();
}

function safeClub(post: AvailabilityWithTeam) {
  return (post.club_name || '').trim().toLowerCase();
}

function timeClosenessBonus(a: AvailabilityWithTeam, b: AvailabilityWithTeam): number {
  const aStart = minutes(a.start_time);
  const bStart = minutes(b.start_time);
  const aEnd = minutes(a.end_time);
  const bEnd = minutes(b.end_time);

  if (aStart < 0 || bStart < 0 || aEnd < 0 || bEnd < 0) return 0;

  const startDiff = Math.abs(aStart - bStart);
  const endDiff = Math.abs(aEnd - bEnd);
  const totalDiff = startDiff + endDiff;

  if (totalDiff <= 30) return 12;
  if (totalDiff <= 60) return 9;
  if (totalDiff <= 90) return 6;
  if (totalDiff <= 120) return 3;
  return 0;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, value));
}

export function calculateCompatibility(a: AvailabilityWithTeam, b: AvailabilityWithTeam) {
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  const days = sharedWeekdays(a, b);
  const sameComuna = safeComuna(a) !== '' && safeComuna(a) === safeComuna(b);

  const daysScore = Math.min(24, days.length * 8);
  const overlapScore = Math.min(30, Math.floor(overlap / 15) * 3);
  const proximityScore = timeClosenessBonus(a, b);
  const schedule = Math.min(42, daysScore + overlapScore + proximityScore);

  const location = sameComuna ? 18 : 0;
  const court = a.has_court && b.has_court ? 20 : a.has_court || b.has_court ? 10 : 0;
  const base = 20;

  const total = clampScore(base + schedule + location + court);

  return {
    total,
    schedule,
    location,
    court,
    sharedDays: days,
    overlapMinutes: overlap,
    sameComuna
  };
}

export function areCompatible(a: AvailabilityWithTeam, b: AvailabilityWithTeam): boolean {
  if (!a?.id || !b?.id) return false;
  if (a.id === b.id) return false;

  const clubA = safeClub(a);
  const clubB = safeClub(b);
  if (!clubA || !clubB || clubA === clubB) return false;

  if (a.age_category !== b.age_category) return false;
  if (a.branch !== b.branch) return false;

  const days = sharedWeekdays(a, b);
  if (days.length === 0) return false;

  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  if (overlap <= 0) return false;

  if (!a.has_court && !b.has_court) return false;

  return true;
}

export function getMatchTier(score: number): 'Match alto' | 'Match medio' | 'Match bajo' {
  if (score >= 82) return 'Match alto';
  if (score >= 62) return 'Match medio';
  return 'Match bajo';
}

export function getMatchReasons(a: AvailabilityWithTeam, b: AvailabilityWithTeam, score: number): string[] {
  const reasons: string[] = ['Misma rama y categoría'];
  const meta = calculateCompatibility(a, b);

  if (meta.sharedDays.length) {
    const [first] = meta.sharedDays;
    reasons.push(meta.sharedDays.length > 1 ? `Comparten ${meta.sharedDays.length} días (incluye ${first})` : `Comparten ${first}`);
  }

  if (meta.overlapMinutes > 0) reasons.push(`Cruce horario real (${meta.overlapMinutes} min)`);
  if (a.has_court && b.has_court) reasons.push('Ambos equipos pueden poner cancha');
  else if (a.has_court || b.has_court) reasons.push('Un equipo pone cancha');
  if (meta.sameComuna) reasons.push('Misma comuna');
  reasons.push(getMatchTier(score));

  return reasons;
}
