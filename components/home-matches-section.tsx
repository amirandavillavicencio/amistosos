const modules = [
  {
    icon: '📋',
    title: 'Publicaciones activas',
    text: 'Todos los equipos publicados esperando un rival compatible.',
    tone: '#eef3ff'
  },
  {
    icon: '💡',
    title: 'Cómo funciona',
    text: 'Publica disponibilidad, revisa matches y confirma con tu código.',
    tone: '#e2f5ec'
  },
  {
    icon: '🏆',
    title: 'Ranking',
    text: 'Los resultados alimentan la tabla general de la temporada.',
    tone: '#fff4cc'
  }
];

export default function HomeModules() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {modules.map((item) => (
        <article
          key={item.title}
          className="min-h-[130px] rounded-[22px] border border-[#dce9fd] bg-white p-[22px] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(10,36,71,0.07)]"
        >
          <div
            className="mb-3 grid h-9 w-9 place-items-center rounded-[10px] text-[17px]"
            style={{ background: item.tone }}
            aria-hidden="true"
          >
            {item.icon}
          </div>
          <h3 className="font-display text-2xl font-black uppercase leading-none tracking-tight text-[#0a2447]">
            {item.title}
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-normal text-[#5a7bb5]">
            {item.text}
          </p>
        </article>
      ))}
    </section>
  );
}
