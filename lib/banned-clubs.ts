import type { SupabaseClient } from '@supabase/supabase-js';

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function normalizeClubNameKey(value: string | null | undefined): string {
  return stripAccents(String(value ?? ''))
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export async function getActiveBannedClubNameKeys(client: SupabaseClient): Promise<Set<string>> {
  try {
    const { data, error } = await client
      .from('banned_clubs')
      .select('club_name_key')
      .eq('is_active', true);

    if (error) {
      console.error('getActiveBannedClubNameKeys failed', error);
      return new Set<string>();
    }

    const keys = (data || [])
      .map((row) => normalizeClubNameKey((row as { club_name_key?: string | null }).club_name_key || ''))
      .filter(Boolean);

    return new Set(keys);
  } catch (error) {
    console.error('getActiveBannedClubNameKeys crashed', error);
    return new Set<string>();
  }
}

export async function isClubBannedByName(client: SupabaseClient, clubName: string): Promise<boolean> {
  const clubNameKey = normalizeClubNameKey(clubName);
  if (!clubNameKey) return false;

  try {
    const { data, error } = await client
      .from('banned_clubs')
      .select('id')
      .eq('club_name_key', clubNameKey)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('isClubBannedByName failed', error);
      return false;
    }

    return Boolean(data?.id);
  } catch (error) {
    console.error('isClubBannedByName crashed', error);
    return false;
  }
}
