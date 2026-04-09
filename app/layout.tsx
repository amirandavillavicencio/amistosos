import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Amistosos Vóley | Matchmaking entre clubes',
  description: 'Publica disponibilidad y encuentra rivales compatibles para amistosos de vóley.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
