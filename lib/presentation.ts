const AVATAR_COLORS = ['bg-violet-600', 'bg-sky-600', 'bg-emerald-600', 'bg-fuchsia-600', 'bg-orange-500', 'bg-indigo-600'] as const;

export function toTitleCase(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLocaleLowerCase('es-CL')
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('es-CL'));
}

export function formatComuna(value: string | null | undefined): string {
  const comuna = toTitleCase(value);
  return comuna || 'Sin comuna';
}

export function formatBranch(value: string | null | undefined): string {
  const clean = String(value || '').trim().toLocaleLowerCase('es-CL');
  if (clean === 'femenina' || clean === 'femenino') return 'Femenino';
  if (clean === 'masculina' || clean === 'masculino') return 'Masculino';
  if (clean === 'mixta' || clean === 'mixto') return 'Mixto';
  return toTitleCase(clean) || 'Sin rama';
}

export function formatCategory(value: string | null | undefined): string {
  const clean = String(value || '').trim().toLocaleLowerCase('es-CL');
  if (clean === 'tc') return 'TC';
  if (clean.startsWith('sub-')) return `Sub-${clean.split('-')[1] || ''}`;
  return toTitleCase(clean) || 'Sin categoría';
}

export function getInitials(name: string | null | undefined): string {
  const words = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (words.length === 0) return 'EQ';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
}

export function avatarColorClass(seed: string | null | undefined): string {
  const text = String(seed || 'equipo');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function hasValidImageUrl(value: string | null | undefined): boolean {
  const raw = String(value || '').trim();
  if (!raw) return false;

  try {
    const parsed = new URL(raw);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
