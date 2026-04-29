import type { Metadata } from 'next';
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google';
import Footer from '@/components/footer';
import './globals.css';

const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-display' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-sans' });

const siteUrl = 'https://amistosos.vercel.app';
const ogImage = `${siteUrl}/og-image.jpg`;

export const metadata: Metadata = {
  title: 'Amistosos Vóley | Encuentra equipos para jugar',
  description: 'Publica disponibilidad, mira partidos reales y revisa qué equipos están ganando más.',
  openGraph: { title: 'Amistosos Vóley', description: 'Coordina amistosos de vóley, publica disponibilidad y sigue el ranking ELO.', url: siteUrl, siteName: 'Amistosos Vóley', images: [{ url: ogImage, width: 1200, height: 630, alt: 'Amistosos Vóley - Comunidad para coordinar partidos' }], locale: 'es_CL', type: 'website' },
  twitter: { card: 'summary_large_image', title: 'Amistosos Vóley', description: 'Publica disponibilidad y encuentra equipos reales para jugar vóley.', images: [ogImage] }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${fraunces.variable} ${jakarta.variable}`}>
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
