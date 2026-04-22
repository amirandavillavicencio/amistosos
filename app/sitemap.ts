import type { MetadataRoute } from 'next';

const base = 'https://amistosos.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    '',
    '/explorar',
    '/publicar',
    '/ranking',
    '/resultados'
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date()
  }));
}
