# M-02 verificado en vivo con Claude real

**Fecha:** 2026-08-25 20:29
**Tipo:** Documentación (verificación, sin cambio de código)
**Requisitos:** M-02

## Qué se hizo

El usuario rellenó `ANTHROPIC_API_KEY` en `.env.local` (directamente en el archivo, nunca visto
por este agente). Con el servidor de desarrollo reiniciado para recoger la variable, se hicieron
llamadas reales a `POST /api/chat`:

1. `{"messages":[{"role":"user","content":"Hola"}]}` → la respuesta trae la apertura completa de
   `plantilla-entrevista.md` (disclaimer regulatorio incluido) y pasa directamente al bloque 0
   (presentación), pidiendo nombre y email con la razón exacta que se escribió esta sesión.
2. Añadiendo `"Me llamo Marta, mi email es marta.prueba@example.com"` como turno siguiente → el
   agente confirma el email, usa el nombre dado, y avanza correctamente al bloque 1 (ingresos),
   una pregunta a la vez.

Primer intento falló con `invalid_request_error: Your credit balance is too low` — no era un bug:
la cuenta de Anthropic del usuario no tenía saldo. Confirmó además que el manejo de errores de la
ruta (502 con mensaje, ver `route.test.ts`) funciona igual en un fallo real que en el mock. Tras
añadir saldo, la segunda llamada funcionó de principio a fin.

Nota aparte: el texto se veía con caracteres corruptos (`�`) en la salida de `curl` en esta
terminal — se comprobó con Python forzando UTF-8 en stdout que es solo un problema de
visualización del terminal (mismo tipo de cosa que ya pasó con la salida del motor en Python),
no una corrupción real del contenido.

## Qué queda sin verificar

La revisión visual en navegador sigue pendiente: "Claude in Chrome" requiere un plan de pago que
la cuenta del usuario no tiene — no es un problema de configuración ni de conexión, así que no se
puede resolver desde aquí. El usuario puede seguir probando directamente en
`http://localhost:3000/chat` con su propio navegador, sin la extensión.

## Qué se modificó

- `docs/roadmap.md` — `M-02` marcada como hecha (`[x]`), con el detalle de la verificación en
  vivo.

## Por qué

Cerrar con evidencia real la duda que quedaba abierta desde el commit anterior: si la integración
con Claude funcionaba de verdad o solo contra el mock de los tests.
