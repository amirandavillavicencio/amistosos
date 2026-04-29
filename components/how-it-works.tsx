export default function HowItWorks() {
  const steps = [
    { title: 'Publicas disponibilidad', text: 'Indica cuándo puede jugar tu equipo.' },
    { title: 'Revisas cruces', text: 'Compara equipos con días, horarios y categoría compatibles.' },
    { title: 'Confirman', text: 'Cada equipo acepta con el correo usado al publicar.' }
  ];

  return (
    <section className="rounded-[2rem] border border-[#ddcdbf] bg-[#fffaf3] p-5 sm:p-6">
      <h2 className="font-display text-3xl text-[#3f2d1f]">Cómo funciona</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-2xl border border-[#e2d5c8] bg-[#f8efe4] p-4">
            <p className="font-display text-2xl text-[#7a4c37]">{index + 1}</p>
            <p className="mt-2 font-semibold text-[#3f2d1f]">{step.title}</p>
            <p className="mt-1 text-sm text-[#6b5a4c]">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
