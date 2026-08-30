# Roadmap al día con lo ocurrido tras cerrar la Fase 1

**Fecha:** 2026-08-30 09:08
**Tipo:** Documentación
**Requisitos:** Ninguno (sincronización de `docs/` con cambios ya registrados en `changelog/`)

## Qué se hizo

`docs/roadmap.md` seguía terminando la Fase 1 en el estado del 2026-08-27 y saltaba directo a la
Fase 2, sin reflejar nada de lo ocurrido después: el despliegue a producción y las tres correcciones
que solo aparecieron al probar la app real por navegador.

Añadida una sección nueva entre la Fase 1 y la Fase 2 — **"Puesta en producción y estabilización
(post-Fase 1)"** — con cuatro entradas, todas `M-02` y sin alcance nuevo:

1. README reescrito al estado real + sección de despliegue de Vercel.
2. App desplegada en Vercel, en producción.
3. Bug crítico: el chat perdía el historial a partir del tercer turno (`ChatWindow` sustituía en
   vez de acumular). Se recoge la causa, por qué no lo detectó la verificación por `curl`, y el
   arreglo (`historial.ts` + test de regresión).
4. Auto-scroll del chat en tres iteraciones, con los dos intentos fallidos y sus reverts hasta
   `window.scrollTo` confirmado en producción.

Cada entrada apunta al changelog donde ya estaba registrada. La sección cierra con el estado actual
(148/148 tests, `build`/`tsc` limpios, git limpio) y recuerda que sigue pendiente la revisión
visual en navegador real de M-01/M-02/M-03/M-06.

## Qué se modificó

- `docs/roadmap.md` — sección nueva "Puesta en producción y estabilización (post-Fase 1)" entre la
  Fase 1 y la Fase 2. Sin cambios en el resto del archivo.

## Por qué

El roadmap es lo que se lee al arrancar una sesión para saber en qué fase está el proyecto
(`CLAUDE.md` → "Estado del proyecto y arranque"). Dejándolo cortado en el 2026-08-27 daba a
entender que tras cerrar la Fase 1 no había pasado nada, cuando en realidad la app ya está
desplegada y ha tenido un bug crítico en producción. La información estaba en `changelog/`, pero
nadie que siga el protocolo de arranque llega ahí antes de empezar a trabajar.
