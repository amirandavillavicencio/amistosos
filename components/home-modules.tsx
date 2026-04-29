const modules = [
  { title: 'Publica disponibilidad', text: 'Indica días, horario, categoría y si tienes cancha.' },
  { title: 'Revisa cruces', text: 'Mira equipos que calzan con tus datos de disponibilidad.' },
  { title: 'Coordina el amistoso', text: 'Si ambos aceptan, el cruce queda confirmado.' },
  { title: 'Registra resultados', text: 'Sube el marcador del partido jugado.' },
  { title: 'Sigue el ranking', text: 'Los resultados van ordenando la tabla general.' }
];

export default function HomeModules() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((item) => (
        <article key={item.title} className="rounded-[1.6rem] border border-[#d4e2fa] bg-white p-5 shadow-[0_4px_20px_rgba(16,52,111,0.06)]">
          <h3 className="font-display text-[2rem] leading-none text-[#0f2f6a]">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[#2d4f88]">{item.text}</p>
        </article>
      ))}
    </section>
  );
}
