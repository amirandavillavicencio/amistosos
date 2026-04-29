import Link from 'next/link';

export default function HomeCTA() {
  return (
    <section className="rounded-[2rem] border border-[#cfb9a8] bg-[#f1dfd0] p-6 text-center sm:p-8">
      <h2 className="font-display text-4xl text-[#3f2d1f]">¿Tu equipo busca rival?</h2>
      <p className="mt-2 text-[#5f4d3e]">Publica tu disponibilidad y revisa cruces disponibles.</p>
      <Link href="/publicar" className="btn-accent mt-5">Publicar equipo</Link>
    </section>
  );
}
