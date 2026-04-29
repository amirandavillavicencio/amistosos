'use client';

import { useMemo, useState, type ReactNode } from 'react';
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
      <section className="rounded-[1.7rem] border border-[#d4e2fa] bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto]">
          <Field label="Comuna">
            <select value={comuna} onChange={(e) => setComuna(e.target.value)} className="field" aria-label="Filtrar por comuna">
              <option value="">Todas las comunas</option>
              {comunas.map((item) => <option key={item} value={item}>{formatComuna(item)}</option>)}
            </select>
          </Field>

          <Field label="Categoría">
            <select value={ageCategory} onChange={(e) => setAgeCategory(e.target.value)} className="field" aria-label="Filtrar por categoría">
              <option value="">Todas las categorías</option>
              <option value="sub-12">Sub-12</option><option value="sub-14">Sub-14</option><option value="sub-16">Sub-16</option><option value="sub-18">Sub-18</option><option value="sub-20">Sub-20</option><option value="tc">TC</option>
            </select>
          </Field>

          <Field label="Rama">
            <div className="flex h-[46px] items-center gap-2 rounded-xl border border-[#c5d8f8] bg-[#f7faff] px-2">
              {branchOptions.map((option) => {
                const active = branch === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setBranch(active ? '' : option.value)} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'border-[#1f58ad] bg-[#1f58ad] text-white' : 'border-[#bad0f5] bg-white text-[#1a4a91] hover:border-[#1f58ad]'}`}>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Cancha">
            <div className="flex h-[46px] items-center gap-2 rounded-xl border border-[#c5d8f8] bg-[#f7faff] px-2">
              {[{ value: 'true', label: 'Con cancha' }, { value: 'false', label: 'Sin cancha' }].map((option) => {
                const active = hasCourt === option.value;
                return (
                  <button key={option.value} type="button" onClick={() => setHasCourt(active ? '' : option.value as 'true' | 'false')} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${active ? 'border-[#f5bf00] bg-[#ffd447] text-[#0f2f6a]' : 'border-[#bad0f5] bg-white text-[#1a4a91] hover:border-[#1f58ad]'}`}>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <button type="button" className="btn-secondary h-[46px]" onClick={() => { setComuna(''); setAgeCategory(''); setBranch(''); setHasCourt(''); setDays([]); }}>Limpiar</button>
        </div>

        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#21529f]">Días</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {weekdays.map((day) => {
              const active = days.includes(day);
              return (
                <label key={day} className={`flex cursor-pointer items-center justify-center rounded-xl border px-2 py-2 text-xs font-medium transition ${active ? 'border-[#1f58ad] bg-[#1f58ad] text-white' : 'border-[#c5d8f8] bg-[#f7faff] text-[#1a4a91] hover:border-[#1f58ad]'}`}>
                  <input type="checkbox" className="sr-only" checked={active} onChange={(e) => setDays((prev) => e.target.checked ? [...prev, day] : prev.filter((d) => d !== day))} />
                  <span>{capitalize(day)}</span>
                </label>
              );
            })}
          </div>
        </div>
      </section>

      <p className="mb-4 mt-5 text-sm font-semibold text-[#1a4a91]">{filtered.length} equipos encontrados</p>

      {filtered.length === 0 ? (
        <EmptyState icon="🏐" title="No hay publicaciones que coincidan" description="Prueba limpiando filtros o publica tu disponibilidad para activar cruces en tu zona." action={<Link href="/publicar" className="btn-accent">Publicar equipo</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#21529f]">{label}</span>
      {children}
    </label>
  );
}
