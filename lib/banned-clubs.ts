import type { SupabaseClient } from '@supabase/supabase-js';

const BANNED_CLUBS_ENABLED = false;

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeClubNameKey(value: string | null | undefined): string {
  return stripAccents(String(value ?? ''))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function getActiveBannedClubNameKeys(_client: SupabaseClient): Promise<Set<string>> {
  if (!BANNED_CLUBS_ENABLED) {
    return new Set<string>();
  }

  return new Set<string>();
}

export async function isClubBannedByName(_client: SupabaseClient, clubName: string): Promise<boolean> {
  const clubNameKey = normalizeClubNameKey(clubName);
  if (!clubNameKey) return false;

  if (!BANNED_CLUBS_ENABLED) {
    return false;
  }

  return false;
}
