import { createClient } from '@supabase/supabase-js';

const isProd = process.env.NODE_ENV === 'production';
const allowPreviewSeed = process.env.ALLOW_PREVIEW_SEED === 'true';

if (isProd && !allowPreviewSeed) {
  console.log('Seed bloqueado en producción. Usa ALLOW_PREVIEW_SEED=true para habilitarlo.');
  process.exit(0);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Faltan NEXT_PUBLIC_SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

const demoTeams = [
  {
    club_name: 'Aurora Vóley',
    club_name_key: 'aurora voley',
    contact_email: 'aurora@example.com',
    email_key: 'aurora@example.com',
    instagram: '@aurora_voley',
    instagram_key: 'aurora_voley',
    comuna: 'Providencia',
    city: 'Santiago',
    branch: 'femenina',
    age_category: 'sub-18',
    responsible_name: 'Camila Rojas',
    declared_level: 'intermedio'
  },
  {
    club_name: 'Rayo Norte',
    club_name_key: 'rayo norte',
    contact_email: 'rayo@example.com',
    email_key: 'rayo@example.com',
    instagram: '@rayo_norte',
    instagram_key: 'rayo_norte',
    comuna: 'Ñuñoa',
    city: 'Santiago',
    branch: 'masculina',
    age_category: 'tc',
    responsible_name: 'Diego Paredes',
    declared_level: 'competitivo'
  },
  {
    club_name: 'Marea Mixta',
    club_name_key: 'marea mixta',
    contact_email: 'marea@example.com',
    email_key: 'marea@example.com',
    instagram: '@marea_mixta',
    instagram_key: 'marea_mixta',
    comuna: 'Maipú',
    city: 'Santiago',
    branch: 'mixta',
    age_category: 'sub-20',
    responsible_name: 'Martina Salas',
    declared_level: 'novato'
  }
];

const { data: teams, error: teamErr } = await supabase
  .from('teams')
  .upsert(demoTeams, { onConflict: 'club_name_key,email_key,instagram_key' })
  .select('id,club_name');
if (teamErr) {
  console.error('Error creando equipos demo:', teamErr.message);
  process.exit(1);
}

const byName = Object.fromEntries((teams || []).map((t) => [t.club_name, t.id]));

const demoPosts = [
  {
    team_id: byName['Aurora Vóley'],
    address: 'Av. Providencia 1234',
    comuna: 'Providencia',
    city: 'Santiago',
    play_date: null,
    weekday: 'martes',
    weekdays: ['martes', 'jueves'],
    start_time: '20:00',
    end_time: '22:00',
    branch: 'femenina',
    age_category: 'sub-18',
    desired_level: 'intermedio',
    has_court: true,
    notes: 'Cancha indoor',
    status: 'open'
  },
  {
    team_id: byName['Rayo Norte'],
    address: 'Av. Irarrázaval 555',
    comuna: 'Ñuñoa',
    city: 'Santiago',
    play_date: null,
    weekday: 'jueves',
    weekdays: ['jueves'],
    start_time: '21:00',
    end_time: '23:00',
    branch: 'masculina',
    age_category: 'tc',
    desired_level: 'competitivo',
    has_court: false,
    notes: 'Preferimos ida y vuelta',
    status: 'open'
  },
  {
    team_id: byName['Marea Mixta'],
    address: 'Camino a Melipilla 1000',
    comuna: 'Maipú',
    city: 'Santiago',
    play_date: null,
    weekday: 'sábado',
    weekdays: ['sábado', 'domingo'],
    start_time: '11:00',
    end_time: '13:00',
    branch: 'mixta',
    age_category: 'sub-20',
    desired_level: 'novato',
    has_court: true,
    notes: 'Buen ambiente competitivo',
    status: 'open'
  }
].filter((item) => item.team_id);

const { error: postsErr } = await supabase.from('availabilities').insert(demoPosts);
if (postsErr) {
  console.error('Error creando disponibilidades demo:', postsErr.message);
  process.exit(1);
}

console.log(`Seed demo completado: ${demoPosts.length} disponibilidades.`);
