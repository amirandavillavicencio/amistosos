import Link from 'next/link';

export default function HomeCTA() {
  return (
    <section className="rounded-[2rem] border border-[#1d4a95] bg-[#0f3b82] p-6 text-center sm:p-8">
      <h2 className="font-display text-5xl text-white">¿Tu equipo busca rival?</h2>
      <p className="mt-2 text-[#dbe8ff]">Publica tu disponibilidad y revisa cruces disponibles.</p>
      <Link href="/publicar" className="btn-accent mt-5">Publicar equipo</Link>
    </section>
  );
}
