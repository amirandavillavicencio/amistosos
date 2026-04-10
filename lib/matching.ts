import type { AvailabilityWithTeam } from '@/lib/types';

function minutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + m;
}

function overlapInMinutes(aStart: string, aEnd: string, bStart: string, bEnd: string): number {
  const start = Math.max(minutes(aStart), minutes(bStart));
  const end = Math.min(minutes(aEnd), minutes(bEnd));
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

export function calculateCompatibility(a: AvailabilityWithTeam, b: AvailabilityWithTeam) {
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  const days = sharedWeekdays(a, b);
  const sameComuna = safeComuna(a) && safeComuna(a) === safeComuna(b);

  const schedule = Math.min(40, days.length * 10 + Math.min(20, Math.floor(overlap / 15) * 2));
  const location = sameComuna ? 25 : 8;
  const court = (a.has_court || b.has_court) ? (a.has_court && b.has_court ? 15 : 10) : 0;
  const base = 20; // misma rama + categoría ya validado en areCompatible
  const total = Math.min(100, base + schedule + location + court);

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
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);

  return (
    a.age_category === b.age_category &&
    a.branch === b.branch &&
    sharedWeekdays(a, b).length > 0 &&
    overlap > 0 &&
    (a.has_court || b.has_court)
  );
}

export function getMatchTier(score: number): 'Match alto' | 'Match medio' | 'Match bajo' {
  if (score >= 80) return 'Match alto';
  if (score >= 60) return 'Match medio';
  return 'Match bajo';
}

export function getMatchReasons(a: AvailabilityWithTeam, b: AvailabilityWithTeam, score: number): string[] {
  const reasons: string[] = ['Misma rama y categoría'];
  const meta = calculateCompatibility(a, b);

  if (meta.sharedDays.length) {
    const [first] = meta.sharedDays;
    reasons.push(meta.sharedDays.length > 1 ? `Comparten ${meta.sharedDays.length} días (incluye ${first})` : `Comparten ${first}`);
  }

  if (meta.overlapMinutes > 0) reasons.push(`Sus horarios se cruzan (${meta.overlapMinutes} min)`);
  if (a.has_court && b.has_court) reasons.push('Ambos equipos pueden poner cancha');
  else if (a.has_court || b.has_court) reasons.push('Uno de los equipos pone cancha');
  if (meta.sameComuna) reasons.push('Misma comuna');
  reasons.push(getMatchTier(score));

  return reasons;
}
