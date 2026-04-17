import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import HomeHero from "@/components/home-hero";
import HomeRankingPreview from "@/components/home-ranking-preview";
import HomeResultsPreview from "@/components/home-results-preview";
import PostCard from "@/components/post-card";
import { rebuildSuggestedMatches } from "@/app/actions";
import { createMatchIntent, getNextCard } from "@/lib/matching";
import {
  getClubStatsRanking,
  getOpenAvailabilities,
  getRecentResults,
} from "@/lib/data";
import { getSupabaseAdmin } from "@/lib/supabase";
import type {
  AvailabilityRow,
  AvailabilityWithTeam,
  ClubStatsCard,
  MatchResultRow,
} from "@/lib/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: {
    from?: string;
    skip?: string;
    ok?: string;
  };
};

function getSkipIds(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function buildRedirect(fromPostId: string, skipIds: string[], ok?: string) {
  const params = new URLSearchParams();
  params.set("from", fromPostId);

  if (skipIds.length) {
    params.set("skip", Array.from(new Set(skipIds)).join(","));
  }

  if (ok) {
    params.set("ok", ok);
  }

  return `/?${params.toString()}`;
}

async function getDefaultFromPostId(): Promise<string | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("availabilities")
    .select("id")
    .in("status", ["open", "active", "published"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("HomePage default from post query failed", error);
    return null;
  }

  return data?.[0]?.id ?? null;
}

function formatAvailability(post: AvailabilityWithTeam): string {
  const weekdays = Array.isArray(post.weekdays)
    ? post.weekdays
    : post.weekday
      ? [post.weekday]
      : [];
  const daysLabel = weekdays.filter(Boolean).join(", ") || "Días por confirmar";
  const start = post.start_time?.slice(0, 5) || "--:--";
  const end = post.end_time?.slice(0, 5) || "--:--";
  return `${daysLabel} · ${start}-${end}`;
}

export default async function HomePage({ searchParams }: PageProps) {
  await rebuildSuggestedMatches();

  const skipIds = getSkipIds(searchParams?.skip);
  const fromPostId = searchParams?.from || (await getDefaultFromPostId());

  async function passCard(formData: FormData) {
    "use server";

    const toPostId = String(formData.get("to_post_id") || "").trim();
    if (!fromPostId) {
      redirect("/");
    }

    const nextSkipIds = toPostId ? [...skipIds, toPostId] : skipIds;
    redirect(buildRedirect(fromPostId, nextSkipIds));
  }

  async function likeCard(formData: FormData) {
    "use server";

    const toPostId = String(formData.get("to_post_id") || "").trim();
    if (!fromPostId || !toPostId) {
      redirect("/");
    }

    const result = await createMatchIntent(fromPostId, toPostId);
    revalidatePath("/");

    const nextSkipIds = [...skipIds, toPostId];
    const status = result.confirmedMatch ? "match" : "intent";
    redirect(buildRedirect(fromPostId, nextSkipIds, status));
  }

  let featuredMatch: AvailabilityRow | null = null;
  let posts: AvailabilityWithTeam[] = [];
  let ranking: ClubStatsCard[] = [];
  let recentResults: MatchResultRow[] = [];

  try {
    const [suggested, openPosts, topRanking, results] = await Promise.all([
      fromPostId ? getNextCard(fromPostId, skipIds) : Promise.resolve(null),
      getOpenAvailabilities(4),
      getClubStatsRanking(5),
      getRecentResults(5),
    ]);

    featuredMatch = suggested;
    posts = Array.isArray(openPosts) ? openPosts : [];
    ranking = Array.isArray(topRanking) ? topRanking : [];
    recentResults = Array.isArray(results) ? results : [];
  } catch (error) {
    console.error("HomePage data load failed", error);
  }

  const statusMessage =
    searchParams?.ok === "match"
      ? "¡Match confirmado! Ambos equipos ya se propusieron partido."
      : searchParams?.ok === "intent"
        ? "Propuesta enviada. Si el otro equipo también da ❤️, se confirma el match."
        : null;

  return (
    <main className="section relative isolate py-8 sm:py-10 md:py-12">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_12%,rgba(168,85,247,0.16),transparent_32%),radial-gradient(circle_at_85%_18%,rgba(236,72,153,0.14),transparent_30%),radial-gradient(circle_at_50%_85%,rgba(37,99,235,0.14),transparent_32%)]" />
      <div className="space-y-5 sm:space-y-6">
        <HomeHero />

        {statusMessage ? (
          <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/20 px-4 py-3 text-sm font-semibold text-emerald-100 shadow-[0_12px_32px_rgba(16,185,129,0.2)]">
            {statusMessage}
          </div>
        ) : null}

        <section className="relative overflow-hidden rounded-3xl border border-violet-300/25 bg-slate-950 p-4 shadow-[0_24px_60px_rgba(2,6,23,0.75)] sm:p-5">
          <div className="pointer-events-none absolute -left-12 top-10 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-fuchsia-200">
                  Match destacado
                </p>
                <h2 className="mt-1 text-xl font-black text-white sm:text-2xl">
                  Encuentra rival ahora
                </h2>
              </div>
              <Link
                href="/explorar"
                className="text-sm font-semibold text-slate-200 hover:text-fuchsia-200"
              >
                Ver todas las publicaciones
              </Link>
            </div>

            {!featuredMatch ? (
              <article className="rounded-2xl border border-slate-600/80 bg-slate-900/80 p-5 text-sm text-slate-100">
                <p className="text-base font-semibold text-white">
                  No encontramos un rival sugerido por ahora
                </p>
                <p className="mt-1 text-slate-300">
                  Publica o actualiza tu disponibilidad y revisa nuevamente en
                  unos minutos.
                </p>
                <Link
                  href="/publicar"
                  className="mt-4 inline-flex rounded-full border border-violet-300/50 bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Publica tu disponibilidad
                </Link>
              </article>
            ) : (
              <article className="max-w-lg rounded-3xl border border-fuchsia-300/30 bg-gradient-to-br from-slate-900 via-indigo-950/90 to-slate-900 p-5 shadow-[0_24px_52px_rgba(12,8,30,0.8)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-300">
                  Sugerido para ti
                </p>
                <h3 className="mt-2 text-2xl font-semibold text-white">
                  {featuredMatch.club_name}
                </h3>
                <p className="mt-1 text-sm text-slate-300">
                  {featuredMatch.comuna || featuredMatch.city} · Nivel{" "}
                  {featuredMatch.level || "por definir"}
                </p>

                <div className="mt-4 space-y-2 rounded-2xl border border-white/15 bg-white/10 p-3 text-sm text-slate-100">
                  <p>
                    <span className="text-slate-400">Disponibilidad:</span>{" "}
                    {formatAvailability(featuredMatch)}
                  </p>
                  <p>
                    <span className="text-slate-400">Cancha:</span>{" "}
                    {featuredMatch.has_court
                      ? "Sí tiene cancha"
                      : "Busca cancha"}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href={`/publicaciones/${featuredMatch.id}`}
                    className="btn-secondary border-white/20 bg-white/10 text-white hover:text-white"
                  >
                    Ver detalle
                  </Link>
                  <form action={likeCard}>
                    <input
                      type="hidden"
                      name="to_post_id"
                      value={featuredMatch.id}
                    />
                    <button
                      type="submit"
                      className="inline-flex rounded-full border border-fuchsia-300/60 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-orange-400 px-4 py-2 text-sm font-bold text-white transition hover:brightness-110"
                    >
                      Proponer amistoso
                    </button>
                  </form>
                  <form action={passCard}>
                    <input
                      type="hidden"
                      name="to_post_id"
                      value={featuredMatch.id}
                    />
                    <button
                      type="submit"
                      className="rounded-full border border-white/25 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/15"
                    >
                      Ver otro rival
                    </button>
                  </form>
                </div>
              </article>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-700/70 bg-slate-900/80 p-4 shadow-[0_18px_50px_rgba(2,6,23,0.55)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-blue-300">
                Publicaciones disponibles
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                Equipos activos en búsqueda
              </h2>
            </div>
            <Link
              href="/explorar"
              className="text-sm font-semibold text-blue-200 hover:text-blue-100"
            >
              Ver todas
            </Link>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-600 p-4 text-sm text-slate-300">
              Aún no hay publicaciones activas. Publica la tuya para abrir la
              rueda de amistosos.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} compact />
              ))}
            </div>
          )}
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <HomeRankingPreview teams={ranking} />
          <HomeResultsPreview results={recentResults} />
        </div>
      </div>
    </main>
  );
}
