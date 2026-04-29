const modules = [
  { title: 'Publica disponibilidad', text: 'Deja día, horario, categoría y si tienes cancha.' },
  { title: 'Revisa cruces', text: 'Te mostramos equipos que calzan con tu disponibilidad.' },
  { title: 'Coordina con otro equipo', text: 'Cuando ambos aceptan, el cruce queda confirmado.' },
  { title: 'Registra resultados', text: 'Guarda el resultado del partido jugado.' },
  { title: 'Ranking en beta', text: 'Los resultados ayudarán a ordenar el ranking.' }
];

export default function HomeModules() {
  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((item) => (
        <article key={item.title} className="rounded-3xl border border-[#e2d5c8] bg-[#fffaf3] p-5">
          <h3 className="font-display text-2xl text-[#3f2d1f]">{item.title}</h3>
          <p className="mt-2 text-sm text-[#6b5a4c]">{item.text}</p>
        </article>
      ))}
    </section>
  );
}
