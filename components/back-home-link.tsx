import Link from 'next/link';

type BackHomeLinkProps = {
  className?: string;
};

export default function BackHomeLink({ className = '' }: BackHomeLinkProps) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center rounded-xl border border-[#c0d4f5] bg-white px-4 py-2.5 text-sm font-semibold text-[#1042a0] transition hover:border-[#1a55c8] hover:bg-[#f3f8ff] ${className}`}
    >
      Volver al inicio
    </Link>
  );
}
