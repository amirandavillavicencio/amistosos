const stripAccents = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function normalizeWeekday(value: string | null | undefined): string {
  const normalized = stripAccents(String(value ?? '').trim().toLowerCase());
  if (!normalized) return '';
  const aliases: Record<string, string> = {
    miercoles: 'miercoles',
    miércoles: 'miercoles'
  };
  return aliases[normalized] || normalized;
}

export function normalizeBranch(value: string | null | undefined): string {
  const clean = stripAccents(String(value ?? '').trim().toLowerCase());
  if (['mixta', 'mixto', 'mixed'].includes(clean)) return 'mixta';
  if (['femenina', 'femenino', 'mujeres'].includes(clean)) return 'femenina';
  if (['masculina', 'masculino', 'hombres'].includes(clean)) return 'masculina';
  return clean;
}

export function normalizeCategory(value: string | null | undefined): string {
  const clean = stripAccents(String(value ?? '').trim().toLowerCase());
  if (!clean) return '';
  if (clean === 'tc' || clean.includes('todo competidor')) return 'tc';
  const match = clean.match(/sub[-\s]?(\d{1,2})/);
  if (match) return `sub-${match[1]}`;
  return clean;
}

export function parseWeekdays(weekday: unknown, weekdays: unknown): string[] {
  const values: string[] = [];
  if (Array.isArray(weekdays)) values.push(...weekdays.map((d) => String(d)));
  else if (typeof weekdays === 'string') {
    try {
      const parsed = JSON.parse(weekdays);
      if (Array.isArray(parsed)) values.push(...parsed.map((d) => String(d)));
      else values.push(...weekdays.replace(/^\{/, '').replace(/\}$/, '').split(','));
    } catch {
      values.push(...weekdays.replace(/^\{/, '').replace(/\}$/, '').split(','));
    }
  }
  if (typeof weekday === 'string') values.push(weekday);
  return [...new Set(values.map((d) => normalizeWeekday(d)).filter(Boolean))];
}

function toMinutes(value: string | null | undefined): number | null {
  const match = String(value ?? '').trim().match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

export function hasTimeOverlap(
  aStart: string | null | undefined,
  aEnd: string | null | undefined,
  bStart: string | null | undefined,
  bEnd: string | null | undefined
): boolean {
  const startA = toMinutes(aStart);
  const endA = toMinutes(aEnd);
  const startB = toMinutes(bStart);
  const endB = toMinutes(bEnd);
  if (startA === null || endA === null || startB === null || endB === null) return false;
  return startA < endB && startB < endA;
}

export function formatPlural(count: number, singular: string, plural?: string): string {
  const safePlural = plural || `${singular}s`;
  return `${count} ${count === 1 ? singular : safePlural}`;
}
