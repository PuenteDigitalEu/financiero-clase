# Landing pública (M-01)

**Fecha:** 2026-08-25 13:16
**Tipo:** Feature
**Requisitos:** M-01

## Qué se hizo

Cuarta tarea de la Fase 1 del roadmap: la landing pública. Siguiendo `docs/design-system.md` al
pie de la letra — paleta (`#3457D5`/`#2F9E6E`/`#FF6B4A`), tipografía Sora (titulares) + Inter
(cuerpo) vía `next/font/google`, tono "cercano y humano" — con tres secciones: hero (presentación
+ CTA a `/chat`), "Cómo funciona" (3 pasos) y "Tus datos, con cuidado" (nota de confianza previa
al consentimiento RGPD real de `M-06`, que ocurre dentro del chat).

Se usa literalmente el placeholder `[Nombre de la asesoría]` en el copy, tal como exige
`design-system.md` — el nombre comercial sigue sin decidirse y no se ha inventado uno.

Se creó también `/chat` como placeholder ("en construcción"), para que el CTA de la landing no
lleve a un 404 mientras `M-02` no está construido.

## Verificación realizada

`pnpm lint`, `pnpm build` (ambas rutas prerenderizadas como contenido estático) y `pnpm test`
(41/41) limpios. Servidor de desarrollo (`pnpm dev`) arrancado y comprobado: `GET /` y `GET /chat`
devuelven 200 sin errores de compilación ni de servidor; el HTML devuelto contiene el copy
esperado.

**Sin revisión visual real:** se intentó usar la extensión de Chrome para verlo en un navegador de
verdad (así lo pide `CLAUDE.md` para cambios de UI), pero no estaba conectada en este entorno sin
supervisión y no había forma de pedir al usuario que la conectara. Queda marcada como pendiente de
revisión visual antes de dar `M-01` por completamente cerrada.

## Qué se modificó

- Nuevo: `src/components/landing/{hero,como-funciona,proteccion-datos,footer,cta-button}.tsx`.
- Nuevo: `src/app/chat/page.tsx` (placeholder).
- `src/app/page.tsx` — reescrita para usar los componentes de landing en vez del placeholder
  genérico de `create-next-app`.
- `src/app/layout.tsx` — fuentes Sora/Inter vía `next/font/google`; `<body>` con los tokens de
  color reales.
- `src/app/globals.css` — paleta completa de `design-system.md` como tokens de Tailwind v4
  (`@theme`), reemplazando los tokens de ejemplo del scaffold.
- `docs/roadmap.md` — `M-01` marcada como parcial (`[~]`), con la nota de verificación visual
  pendiente.

## Nota aparte

`next dev` añadió un bloque `<!-- BEGIN:nextjs-agent-rules -->` al final de `CLAUDE.md` (Next.js
16 avisando de que sus APIs difieren del entrenamiento del modelo, con instrucciones de leer
`node_modules/next/dist/docs/`). Es un comportamiento normal del propio Next.js 16 al arrancar
el servidor de desarrollo por primera vez, no una edición externa ni una pérdida de contenido — se
deja tal cual, como indica el propio bloque.

## Por qué

Continuación de la Fase 1 del roadmap, autorizado por el usuario a avanzar sin confirmación en
cada paso.
