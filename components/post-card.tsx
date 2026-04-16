import Link from "next/link";
import type { AvailabilityWithTeam } from "@/lib/types";

interface PostCardProps {
  post: AvailabilityWithTeam;
  compact?: boolean;
}

const categoryLabel: Record<AvailabilityWithTeam["age_category"], string> = {
  "sub-12": "Sub-12",
  "sub-14": "Sub-14",
  "sub-16": "Sub-16",
  "sub-18": "Sub-18",
  "sub-20": "Sub-20",
  tc: "Todo Competidor (TC)",
};

function phoneHref(phone: string | null) {
  if (!phone) return null;
  const keepPlus = phone.trim().startsWith("+");
  const digits = phone.replace(/[\s()\-]/g, "");
  return keepPlus ? `+${digits.replace(/^\+/, "")}` : digits;
}

export default function PostCard({ post, compact = false }: PostCardProps) {
  const startTime = post.start_time?.slice(0, 5) || "--:--";
  const endTime = post.end_time?.slice(0, 5) || "--:--";
  const weekdays = Array.isArray(post?.weekdays)
    ? post.weekdays
    : post?.weekday
      ? [post.weekday]
      : [];
  const days = weekdays.filter(Boolean).join(", ");
  const tel = phoneHref(post.phone);

  return (
    <article
      className={`group rounded-2xl border border-slate-700/80 bg-slate-950/80 backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-fuchsia-300/40 hover:shadow-[0_18px_42px_rgba(168,85,247,0.22)] ${compact ? "p-3.5 sm:p-4" : "p-4 sm:p-5"}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3
            className={`break-words font-bold text-white ${compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
          >
            <Link
              href={`/publicaciones/${post.id}`}
              className="transition group-hover:text-fuchsia-200"
            >
              {post.club_name || "Equipo sin nombre"}
            </Link>
          </h3>
          <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
            <span className="rounded-full border border-blue-300/30 bg-blue-500/10 px-2 py-0.5 text-blue-100">
              {post.comuna || "Sin comuna"}
            </span>
            <span className="rounded-full border border-violet-300/30 bg-violet-500/10 px-2 py-0.5 text-violet-100">
              {categoryLabel[post.age_category]}
            </span>
            <span className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-100">
              {post.branch}
            </span>
          </div>
        </div>
        {post.logo_url ? (
          <img
            src={post.logo_url}
            alt={`Logo ${post.club_name}`}
            className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-full border border-slate-600 object-cover`}
          />
        ) : (
          <div
            className={`${compact ? "h-12 w-12" : "h-14 w-14"} flex items-center justify-center rounded-full border border-dashed border-slate-600 text-[11px] text-slate-300`}
          >
            Sin logo
          </div>
        )}
      </div>
      <ul
        className={`space-y-1.5 ${compact ? "text-xs" : "text-sm"} text-slate-200`}
      >
        <li>
          <strong className="text-slate-100">Horario:</strong> {startTime} -{" "}
          {endTime}
        </li>
        <li>
          <strong className="text-slate-100">Días:</strong>{" "}
          {days || "Sin días informados"}
        </li>
        <li>
          <strong className="text-slate-100">Cancha:</strong>{" "}
          {post.has_court ? "Sí pone cancha" : "No pone cancha"}
        </li>
        {post.phone && tel && (
          <li>
            <strong className="text-slate-100">Tel:</strong>{" "}
            <a
              href={`tel:${tel}`}
              className="font-medium text-orange-300 hover:underline"
            >
              {post.phone}
            </a>
          </li>
        )}
      </ul>
      {!compact && post.notes && (
        <p className="mt-3 border-t border-slate-700/80 pt-3 text-sm text-slate-300">
          {post.notes}
        </p>
      )}
      <div className="mt-3 border-t border-slate-700/80 pt-3">
        <Link
          href={`/publicaciones/${post.id}`}
          className={`font-semibold text-fuchsia-200 hover:text-fuchsia-100 hover:underline ${compact ? "text-xs" : "text-sm"}`}
        >
          Ver detalle / Editar disponibilidad
        </Link>
      </div>
    </article>
  );
}
