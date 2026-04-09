# Amistosos Vóley (MVP+ competitivo sin login obligatorio)

Aplicación web en **Next.js 14 + TypeScript + Tailwind + Supabase** para coordinar amistosos de vóley entre clubes/equipos, con historial de resultados y ranking ELO.

## Funcionalidades

- Landing dark premium + publicación rápida de disponibilidad.
- Exploración pública de disponibilidades abiertas.
- Matching automático con score desglosado:
  - fecha/horario
  - ubicación
  - rama + nivel declarado + cancha
  - cercanía de ELO (con fallback neutro para equipos nuevos)
- Registro de resultados históricos (amistoso/torneo/entrenamiento/competitivo).
- Perfil de club con ficha competitiva y últimos resultados.
- Ranking general por ELO y destacados de actividad.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)

## 1) Configurar base de datos en Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL editor y ejecuta el contenido de:

```sql
-- archivo: supabase/schema.sql
```

### Nota de migración

El esquema incluye backfill automático para instalaciones antiguas que solo tenían `posts`:

- Normaliza clubes en `teams`.
- Migra publicaciones a `availabilities` sin perder publicaciones previas.
- Mantiene identidad de club por `club_name + email + instagram` normalizados.

## 2) Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY` se usa en server actions para escribir en DB sin requerir auth de usuario final.

## 3) Correr local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## 4) Rutas principales

- `/`: landing + destacados + publicación + sugerencias
- `/explorar`: disponibilidades abiertas
- `/ranking`: ranking ELO + equipos activos
- `/club/[id]`: ficha competitiva + historial
- `/resultados`: formulario para registrar partidos

## 5) Módulos clave

- `lib/elo.ts`: fórmula ELO, expected score, K y ajustes por sets/confianza.
- `lib/matching.ts`: motor de compatibilidad con score por bloques + ELO.
- `app/actions.ts`: creación de disponibilidad normalizada + registro de resultados.
- `supabase/schema.sql`: esquema completo y migración desde modelo legacy.

