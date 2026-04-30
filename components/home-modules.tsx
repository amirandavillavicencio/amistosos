const modules = [
  { title: 'Publica disponibilidad', text: 'Indica días, horario, categoría y si tienes cancha.' },
  { title: 'Revisa matches', text: 'Mira equipos compatibles y abre el detalle para coordinar.' },
  { title: 'Confirma con tu código', text: 'Ambos equipos deben validar para confirmar el match.' }
];

export default function HomeModules() {
  return (
    <section className="rounded-[2rem] border border-[#d8e5fb] bg-white p-5 sm:p-6">
      <h2 className="font-display text-3xl text-[#0f2f6a]">Resumen rápido</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {modules.map((item) => (
          <article key={item.title} className="rounded-2xl border border-[#d4e2fa] bg-[#f7faff] p-4">
            <h3 className="font-display text-2xl leading-none text-[#0f2f6a]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#2d4f88]">{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
