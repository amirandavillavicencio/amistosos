import type { Level, PostRow } from '@/lib/types';

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

export function calculateCompatibility(a: PostRow, b: PostRow): number {
  let score = 0;

  if (a.comuna.toLowerCase() === b.comuna.toLowerCase()) {
    score += 30;
  } else if (a.city.toLowerCase() === b.city.toLowerCase()) {
    score += 10;
  }

  if (a.play_date && b.play_date && a.play_date === b.play_date) {
    score += 20;
  } else if (a.weekday && b.weekday && a.weekday === b.weekday) {
    score += 15;
  }

  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  if (overlap >= 60) {
    score += 20;
  } else if (overlap > 0) {
    score += 10;
  }

  if (a.branch === b.branch) {
    score += 10;
  }

  const distance = Math.abs(levelWeight[a.level] - levelWeight[b.level]);
  if (distance === 0) {
    score += 5;
  } else if (distance === 1) {
    score += 3;
  }

  if (a.has_court !== b.has_court) {
    score += 5;
  } else if (a.has_court && b.has_court) {
    score += 3;
  }

  return score;
}

export function areCompatible(a: PostRow, b: PostRow): boolean {
  const overlap = overlapInMinutes(a.start_time, a.end_time, b.start_time, b.end_time);
  const sameDateOrDay =
    Boolean(a.play_date && b.play_date && a.play_date === b.play_date) ||
    Boolean(a.weekday && b.weekday && a.weekday === b.weekday);

  return overlap > 0 && sameDateOrDay && a.branch === b.branch;
}
