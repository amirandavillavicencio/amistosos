export default function Footer() {
  /*
   * ASCII Easter egg:
   * los amigos del voley pueden desaparcer , la persona que amas puede desaparecer, pero los arreboles van a desaparecer
   */
  return (
    <footer className="border-t border-line/80 bg-ivory/80 px-4 py-5 text-center text-xs text-muted backdrop-blur-sm sm:px-6">
      <p className="mx-auto max-w-4xl leading-relaxed">
        Desarrollado por{' '}
        <a
          href="https://youtu.be/XD00TJ-6WSw?t=9"
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium text-ink underline-offset-4 transition hover:text-accent hover:underline"
        >
          Andrés Miranda
        </a>{' '}
        · Versión beta
      </p>
    </footer>
  );
}
