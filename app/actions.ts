'use server';

import { revalidatePath } from 'next/cache';
import { areCompatible, calculateCompatibility } from '@/lib/matching';
import { getSupabaseAdmin } from '@/lib/supabase';
import type { Branch, Level, PostRow } from '@/lib/types';

const validBranches = new Set<Branch>(['femenina', 'masculina', 'mixta']);
const validLevels = new Set<Level>(['principiante', 'intermedio', 'avanzado']);

function parseTime(value: string) {
  const [h, m] = value.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return -1;
  }
  return h * 60 + m;
}

function normalizeOptional(value: FormDataEntryValue | null) {
  const v = String(value || '').trim();
  return v.length ? v : null;
}

export async function createPost(formData: FormData) {
  const clubName = String(formData.get('club_name') || '').trim();
  const contactEmail = String(formData.get('contact_email') || '').trim();
  const instagram = String(formData.get('instagram') || '').trim();
  const address = String(formData.get('address') || '').trim();
  const comuna = String(formData.get('comuna') || '').trim();
  const city = String(formData.get('city') || '').trim();
  const playDate = normalizeOptional(formData.get('play_date'));
  const weekday = normalizeOptional(formData.get('weekday'));
  const startTime = String(formData.get('start_time') || '').trim();
  const endTime = String(formData.get('end_time') || '').trim();
  const branch = String(formData.get('branch') || '').trim() as Branch;
  const level = String(formData.get('level') || '').trim() as Level;
  const hasCourt = String(formData.get('has_court') || 'false') === 'true';
  const notes = normalizeOptional(formData.get('notes'));

  if (
    !clubName ||
    !contactEmail ||
    !instagram ||
    !address ||
    !comuna ||
    !city ||
    !startTime ||
    !endTime
  ) {
    throw new Error('Completa todos los campos requeridos.');
  }

  if (!playDate && !weekday) {
    throw new Error('Debes ingresar fecha específica o día de la semana.');
  }

  if (!validBranches.has(branch) || !validLevels.has(level)) {
    throw new Error('Rama o nivel inválidos.');
  }

  if (parseTime(startTime) >= parseTime(endTime)) {
    throw new Error('La hora de inicio debe ser menor a la hora de término.');
  }

  const supabase = getSupabaseAdmin();

  const { data: inserted, error: insertError } = await supabase
    .from('posts')
    .insert({
      club_name: clubName,
      contact_email: contactEmail,
      instagram: instagram,
      address,
      comuna,
      city,
      play_date: playDate,
      weekday,
      start_time: startTime,
      end_time: endTime,
      branch,
      level,
      has_court: hasCourt,
      notes,
      status: 'open'
    })
    .select('*')
    .single<PostRow>();

  if (insertError || !inserted) {
    throw new Error('No pudimos guardar la publicación. Intenta nuevamente.');
  }

  const { data: candidates, error: candidatesError } = await supabase
    .from('posts')
    .select('*')
    .neq('id', inserted.id)
    .eq('status', 'open')
    .returns<PostRow[]>();

  if (!candidatesError && candidates) {
    const matches = candidates
      .filter((candidate) => areCompatible(inserted, candidate))
      .map((candidate) => ({
        post_a_id: inserted.id,
        post_b_id: candidate.id,
        compatibility_score: calculateCompatibility(inserted, candidate),
        status: 'active' as const
      }))
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 12);

    if (matches.length > 0) {
      await supabase.from('suggested_matches').insert(matches);
    }
  }

  revalidatePath('/');
  return { ok: true };
}
