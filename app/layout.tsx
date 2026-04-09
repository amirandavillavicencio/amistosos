import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amistosos Vóley | Encuentra equipos para jugar',
  description: 'Publica disponibilidad, mira partidos reales y revisa qué equipos están ganando más.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
