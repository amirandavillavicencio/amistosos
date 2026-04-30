import type { Metadata } from 'next';
import Footer from '@/components/footer';
import './globals.css';

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
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;700;800;900&family=DM+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="flex min-h-screen flex-col">
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
