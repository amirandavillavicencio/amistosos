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
  // Fuerza el recálculo en cada request del render de la home (server-side).
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
          <div className="relative">
            {!featuredMatch ? (
              <article>No encontramos rival</article>
            ) : (
              <article>{featuredMatch.club_name}</article>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
