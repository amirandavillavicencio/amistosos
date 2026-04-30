import Link from 'next/link';

export default function HomeCTA() {
  return (
    <section className="rounded-[2rem] border border-[#1d4a95] bg-[#0f3b82] p-6 text-center sm:p-7">
      <h2 className="font-display text-4xl text-white">¿Tu equipo busca rival?</h2>
      <p className="mt-2 text-sm text-[#dbe8ff]">Publica tu disponibilidad y entra al flujo de matches disponibles.</p>
      <Link href="/publicar" className="btn-accent mt-5">Publicar equipo</Link>
    </section>
  );
}
