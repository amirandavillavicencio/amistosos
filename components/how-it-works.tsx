export default function HowItWorks() {
  const steps = [
    { title: 'Publica disponibilidad', text: 'Indica cuándo puede jugar tu equipo.' },
    { title: 'Revisa cruces', text: 'Compara equipos con días, horarios y categoría compatibles.' },
    { title: 'Confirman', text: 'Cada equipo acepta con el correo usado al publicar.' }
  ];

  return (
    <section className="rounded-[2rem] border border-[#c6daf8] bg-white p-5 sm:p-6">
      <h2 className="font-display text-4xl text-[#0f2f6a]">Cómo funciona</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-2xl border border-[#d4e2fa] bg-[#f6faff] p-4">
            <p className="font-display text-3xl text-[#f0bb00]">{index + 1}</p>
            <p className="mt-2 font-semibold text-[#0f2f6a]">{step.title}</p>
            <p className="mt-1 text-sm text-[#2d4f88]">{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
