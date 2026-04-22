export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/90 px-4 py-5 text-center text-xs text-slate-400 backdrop-blur sm:px-6">
      <p className="mx-auto max-w-4xl leading-relaxed">
        Desarrollado por{' '}
        <a
          href="https://www.linkedin.com/in/andresmiranda"
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-200 hover:underline"
        >
          Andrés Miranda
        </a>{' '}
        · Versión beta
      </p>
    </footer>
  );
}
