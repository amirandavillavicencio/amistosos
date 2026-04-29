'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/post-card';
import { EmptyState } from '@/components/ui-shell';
import type { AvailabilityWithTeam } from '@/lib/types';
import { capitalize, formatComuna } from '@/lib/presentation';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
const branchOptions = [
  { value: 'femenina', label: 'Femenino' },
  { value: 'masculina', label: 'Masculino' },
  { value: 'mixta', label: 'Mixto' }
] as const;

export default function ExplorarFilters({ posts }: { posts: AvailabilityWithTeam[] }) {
  const [comuna, setComuna] = useState('');
  const [branch, setBranch] = useState('');
  const [ageCategory, setAgeCategory] = useState('');
  const [hasCourt, setHasCourt] = useState<'' | 'true' | 'false'>('');
  const [days, setDays] = useState<string[]>([]);

  const comunas = useMemo(() => Array.from(new Set(posts.map((p) => p.comuna).filter(Boolean))).sort(), [posts]);

  const filtered = useMemo(() => posts.filter((post) => {
    const postDays = Array.isArray(post.weekdays) ? post.weekdays : post.weekday ? [post.weekday] : [];
    if (comuna && post.comuna !== comuna) return false;
    if (branch && post.branch !== branch) return false;
    if (ageCategory && post.age_category !== ageCategory) return false;
    if (hasCourt === 'true' && !post.has_court) return false;
    if (hasCourt === 'false' && post.has_court) return false;
    if (days.length > 0 && !days.some((day) => postDays.includes(day))) return false;
    return true;
  }), [posts, comuna, branch, ageCategory, hasCourt, days]);

  return (
    <>
      <section className="app-card mb-5 grid gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="field" aria-label="Filtrar por comuna">
            <option value="">Todas las comunas</option>
            {comunas.map((item) => <option key={item} value={item}>{formatComuna(item)}</option>)}
          </select>
          <select value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} className="field" aria-label="Filtrar por categoría">
            <option value="">Todas las categorías</option>
            <option value="sub-12">Sub-12</option><option value="sub-14">Sub-14</option><option value="sub-16">Sub-16</option><option value="sub-18">Sub-18</option><option value="sub-20">Sub-20</option><option value="tc">TC</option>
          </select>
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-700 px-2 py-2 sm:col-span-2 lg:col-span-2">
            {branchOptions.map((option) => {
              const active = branch === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBranch(active ? '' : option.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-fuchsia-300/70 bg-fuchsia-500/20 text-fuchsia-100' : 'border-slate-600/70 bg-slate-900/60 text-slate-200 hover:border-fuchsia-300/40'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 px-2 py-2" aria-label="Filtro de cancha">
            <span className="text-xs text-slate-300">Cancha:</span>
            {[
              { value: 'true', label: 'Con cancha' },
              { value: 'false', label: 'Sin cancha' }
            ].map((option) => {
              const active = hasCourt === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setHasCourt(active ? '' : option.value as 'true' | 'false')}
                  className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-emerald-300/70 bg-emerald-500/20 text-emerald-100' : 'border-slate-600/70 bg-slate-900/60 text-slate-200 hover:border-emerald-300/40'}`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          <button type="button" className="btn-secondary" onClick={() => { setComuna(''); setAgeCategory(''); setBranch(''); setHasCourt(''); setDays([]); }}>Limpiar</button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekdays.map((day) => (
            <label key={day} className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/30 px-2 py-2 text-xs text-slate-100">
              <input type="checkbox" checked={days.includes(day)} onChange={(e) => setDays((prev) => e.target.checked ? [...prev, day] : prev.filter((d) => d !== day))} />
              <span>{capitalize(day)}</span>
            </label>
          ))}
        </div>
      </section>

      <p className="mb-4 text-sm font-semibold text-slate-200">{filtered.length} equipos encontrados</p>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🚀"
          title="No hay publicaciones que coincidan"
          description="Prueba limpiando filtros o publica tu disponibilidad para activar cruces en tu zona."
          action={<Link href="/publicar" className="btn-accent">Publicar ahora</Link>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </>
  );
}
