'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import PostCard from '@/components/post-card';
import { EmptyState } from '@/components/ui-shell';
import type { AvailabilityWithTeam } from '@/lib/types';

const weekdays = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

export default function ExplorarFilters({ posts }: { posts: AvailabilityWithTeam[] }) {
  const [comuna, setComuna] = useState('');
  const [branch, setBranch] = useState('');
  const [ageCategory, setAgeCategory] = useState('');
  const [hasCourt, setHasCourt] = useState(false);
  const [days, setDays] = useState<string[]>([]);

  const comunas = useMemo(() => Array.from(new Set(posts.map((p) => p.comuna).filter(Boolean))).sort(), [posts]);

  const filtered = useMemo(() => posts.filter((post) => {
    const postDays = Array.isArray(post.weekdays) ? post.weekdays : post.weekday ? [post.weekday] : [];
    if (comuna && post.comuna !== comuna) return false;
    if (branch && post.branch !== branch) return false;
    if (ageCategory && post.age_category !== ageCategory) return false;
    if (hasCourt && !post.has_court) return false;
    if (days.length > 0 && !days.some((day) => postDays.includes(day))) return false;
    return true;
  }), [posts, comuna, branch, ageCategory, hasCourt, days]);

  return (
    <>
      <section className="app-card mb-5 grid gap-3 p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="field">
            <option value="">Todas las comunas</option>
            {comunas.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} className="field">
            <option value="">Todas las categorías</option>
            <option value="sub-12">Sub-12</option><option value="sub-14">Sub-14</option><option value="sub-16">Sub-16</option><option value="sub-18">Sub-18</option><option value="sub-20">Sub-20</option><option value="tc">TC</option>
          </select>
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="field">
            <option value="">Todas las ramas</option>
            <option value="femenina">Femenino</option><option value="masculina">Masculino</option><option value="mixta">Mixto</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-slate-700 px-3 text-sm text-slate-200"><input type="checkbox" checked={hasCourt} onChange={(e) => setHasCourt(e.target.checked)} /> ¿Pone cancha?</label>
          <button type="button" className="btn-secondary" onClick={() => { setComuna(''); setAgeCategory(''); setBranch(''); setHasCourt(false); setDays([]); }}>Limpiar</button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {weekdays.map((day) => (
            <label key={day} className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/30 px-2 py-2 text-xs text-slate-100">
              <input type="checkbox" checked={days.includes(day)} onChange={(e) => setDays((prev) => e.target.checked ? [...prev, day] : prev.filter((d) => d !== day))} />
              <span className="capitalize">{day}</span>
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
