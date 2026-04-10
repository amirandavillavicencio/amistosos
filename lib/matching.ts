import type { AvailabilityWithTeam, Level } from '@/lib/types';

const levelWeight: Record<Level, number> = {
  principiante: 1,
  novato: 2,
  intermedio: 3,
  avanzado: 4,
  competitivo: 5
};

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

function hasScheduleCompatibility(a: AvailabilityWithTeam, b: AvailabilityWithTeam): boolean {
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  if (overlap <= 0) return false;

  const aDays = new Set(resolveWeekdays(a));
  const bDays = resolveWeekdays(b);
  return bDays.some((day) => aDays.has(day));
}

export function calculateCompatibility(a: AvailabilityWithTeam, b: AvailabilityWithTeam) {
  const sameComuna = a.comuna.toLowerCase() === b.comuna.toLowerCase();
  const sameCategory = a.age_category === b.age_category;
  const sameBranch = a.branch === b.branch;
  const levelDistance = Math.abs(levelWeight[a.desired_level] - levelWeight[b.desired_level]);
  const compatibleLevel = levelDistance <= 1;
  const compatibleSchedule = hasScheduleCompatibility(a, b);
  const hasCourt = a.has_court || b.has_court;

  const location = sameComuna ? 3 : 0;
  const categoryBranchLevel = (sameCategory ? 5 : 0) + (sameBranch ? 5 : 0) + (compatibleLevel ? 3 : 0);
  const schedule = compatibleSchedule ? 4 : 0;
  const court = hasCourt ? 2 : 0;
  const total = location + categoryBranchLevel + schedule + court;

  return {
    total,
    schedule,
    location,
    level: categoryBranchLevel,
    elo: court
  };
}

export function areCompatible(a: AvailabilityWithTeam, b: AvailabilityWithTeam): boolean {
  const levelDistance = Math.abs(levelWeight[a.desired_level] - levelWeight[b.desired_level]);

  return (
    a.age_category === b.age_category &&
    a.branch === b.branch &&
    levelDistance <= 1 &&
    hasScheduleCompatibility(a, b) &&
    (a.has_court || b.has_court)
  );
}
