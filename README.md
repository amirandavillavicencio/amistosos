# Amistosos Vóley MVP (sin login)

Aplicación web en **Next.js 14 + TypeScript + Tailwind + Supabase** para coordinar amistosos de vóley entre clubes/equipos sin cuentas de usuario.

## Funcionalidades del MVP

- Landing dark premium de una página.
- Formulario público para publicar disponibilidad.
- Listado público de publicaciones recientes.
- Matching automático por criterios de compatibilidad.
- Sección de coincidencias sugeridas.
- Contacto directo por correo e Instagram.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Supabase (DB PostgreSQL)

## 1) Configurar base de datos en Supabase

1. Crea un proyecto en Supabase.
2. Abre el SQL editor y ejecuta el contenido de:

```sql
-- archivo: supabase/schema.sql
```

## 2) Variables de entorno

Crea `.env.local` con:

```bash
NEXT_PUBLIC_SUPABASE_URL=tu_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

> `SUPABASE_SERVICE_ROLE_KEY` se usa en acciones de servidor para insertar posts y matches sin requerir auth.

## 3) Correr local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## 4) Deploy en Vercel

1. Sube el repo a GitHub/GitLab/Bitbucket.
2. Importa el proyecto en Vercel.
3. Define las mismas variables de entorno.
4. Deploy.

## Reglas de negocio del matching

Al crear una publicación, el sistema compara contra publicaciones abiertas y sugiere matches compatibles, priorizando:

1. Comuna (o ciudad si no coincide comuna).
2. Fecha exacta o día de semana.
3. Traslape horario.
4. Rama.
5. Nivel similar.
6. Disponibilidad de cancha.

## Estructura principal

- `app/page.tsx`: landing + listado + matches + CTA.
- `components/publish-form.tsx`: formulario público conectado a server action.
- `app/actions.ts`: validaciones, creación de post y generación de matches.
- `lib/matching.ts`: reglas de compatibilidad.
- `supabase/schema.sql`: esquema DB.

