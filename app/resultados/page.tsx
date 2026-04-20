import Link from 'next/link';
import ResultForm from '@/components/result-form';
import { EmptyState, PageHeader, SectionShell, StatusBadge } from '@/components/ui-shell';
import { getAllTeamsMinimal, getRecentResults } from '@/lib/data';
import type { MatchResultRow, TeamRow } from '@/lib/types';

export const dynamic = 'force-dynamic';

type ResultadosPageProps = {
  searchParams?: {
    club_id?: string;
    opponent_club_id?: string;
    club_name?: string;
    opponent_name?: string;
  };
};

export default async function ResultadosPage({ searchParams }: ResultadosPageProps) {
  let teams: TeamRow[] = [];
  let recent: MatchResultRow[] = [];
  try {
    const [rawTeams, rawRecent] = await Promise.all([getAllTeamsMinimal(), getRecentResults(12)]);
    teams = Array.isArray(rawTeams) ? rawTeams : [];
    recent = Array.isArray(rawRecent) ? rawRecent : [];

    if (!Array.isArray(rawTeams) || !Array.isArray(rawRecent)) {
      console.error('ResultadosPage invalid data shape', {
        route: '/resultados',
        teamsIsArray: Array.isArray(rawTeams),
        recentIsArray: Array.isArray(rawRecent)
      });
    }
  } catch (error) {
    console.error('ResultadosPage data load failed', { route: '/resultados', error });
  }

  return (
    <main className="section">
      <PageHeader
        eyebrow="Carga de historial"
        title="Cargar resultado"
        description="Carga marcadores oficiales indicando claramente contra quién fue el amistoso."
        action={<Link href="/" className="btn-secondary">Volver al inicio</Link>}
      />

      <ResultForm
        teams={teams}
        initialClubId={searchParams?.club_id}
        initialOpponentClubId={searchParams?.opponent_club_id}
        initialClubName={searchParams?.club_name}
        initialOpponentName={searchParams?.opponent_name}
      />

      <section className="mt-6">
        <h2 className="mb-3 text-xl font-bold text-white sm:text-2xl">Historial reciente</h2>
        {recent.length === 0 ? (
          <EmptyState
            title="Sin resultados recientes"
            description="Registra el primer resultado para comenzar el historial del torneo."
          />
        ) : (
          <div className="grid gap-3">
            {recent.map((result) => {
              const tone = result.sets_won > result.sets_lost ? 'success' : result.sets_won < result.sets_lost ? 'danger' : 'warning';
              const label = result.sets_won > result.sets_lost ? 'Victoria' : result.sets_won < result.sets_lost ? 'Derrota' : 'Empate';
              return (
                <SectionShell key={result.id} className="rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge tone={tone}>{label}</StatusBadge>
                    <p className="text-xs text-slate-400">{result.match_date}</p>
                  </div>
                  <div className="mt-2 flex items-end justify-between gap-3">
                    <p className="text-sm text-slate-200">Rival: {result.opponent_name || 'Club registrado'} · {result.match_type}</p>
                    <p className="text-xl font-black text-white">{result.sets_won}-{result.sets_lost}</p>
                  </div>
                  {result.proof_photo_url ? (
                    <div className="mt-3">
                      <a href={result.proof_photo_url} target="_blank" rel="noreferrer" className="text-xs font-semibold text-violet-200 hover:underline">
                        Ver foto comprobante
                      </a>
                    </div>
                  ) : null}
                </SectionShell>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
