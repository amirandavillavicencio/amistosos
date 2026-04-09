import type { AvailabilityWithTeam, Level } from '@/lib/types';

const levelWeight: Record<Level, number> = {
  principiante: 1,
  intermedio: 2,
  avanzado: 3
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

function scheduleScore(a: AvailabilityWithTeam, b: AvailabilityWithTeam): number {
  let score = 0;

  if (a.play_date && b.play_date && a.play_date === b.play_date) score += 16;
  else if (a.weekday && b.weekday && a.weekday === b.weekday) score += 12;

  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  if (overlap >= 90) score += 14;
  else if (overlap >= 60) score += 10;
  else if (overlap > 0) score += 5;

  return score;
}

function locationScore(a: AvailabilityWithTeam, b: AvailabilityWithTeam): number {
  if (a.comuna.toLowerCase() === b.comuna.toLowerCase()) return 20;
  if (a.city.toLowerCase() === b.city.toLowerCase()) return 10;
  return 0;
}

function levelScore(a: AvailabilityWithTeam, b: AvailabilityWithTeam): number {
  let score = 0;
  if (a.branch === b.branch) score += 15;

  const distance = Math.abs(levelWeight[a.desired_level] - levelWeight[b.desired_level]);
  if (distance === 0) score += 10;
  else if (distance === 1) score += 6;
  else score += 2;

  if (a.has_court !== b.has_court) score += 10;
  else if (a.has_court && b.has_court) score += 7;
  else score += 4;

  return score;
}

function eloClosenessScore(aElo: number, bElo: number): number {
  const diff = Math.abs(aElo - bElo);
  if (diff <= 40) return 15;
  if (diff <= 80) return 12;
  if (diff <= 140) return 9;
  if (diff <= 220) return 6;
  return 3;
}

export function calculateCompatibility(a: AvailabilityWithTeam, b: AvailabilityWithTeam) {
  const schedule = scheduleScore(a, b);
  const location = locationScore(a, b);
  const level = levelScore(a, b);

  const historyReady = a.team.matches_played >= 3 && b.team.matches_played >= 3;
  const elo = historyReady ? eloClosenessScore(a.team.current_elo, b.team.current_elo) : 8;

  const total = Math.min(100, schedule + location + level + elo);

  return {
    total,
    schedule,
    location,
    level,
    elo
  };
}

export function areCompatible(a: AvailabilityWithTeam, b: AvailabilityWithTeam): boolean {
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  const sameDateOrDay =
    Boolean(a.play_date && b.play_date && a.play_date === b.play_date) ||
    Boolean(a.weekday && b.weekday && a.weekday === b.weekday);

  return overlap > 0 && sameDateOrDay && a.branch === b.branch;
}
