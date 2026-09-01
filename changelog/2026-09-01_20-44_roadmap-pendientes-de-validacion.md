# Roadmap: qué queda para cerrar la validación con visitantes

**Fecha:** 2026-09-01 20:44
**Tipo:** Documentación
**Requisitos:** Ninguno (sincronización de `docs/roadmap.md`)

## Qué se hizo

`docs/roadmap.md` tenía el "Objetivo de validación" de la Fase 1 pero no decía qué pasos concretos
faltan para darla por cerrada. Añadido un bloque **"Qué queda para cerrar la validación"** con tres
tareas pendientes:

1. Recorrido completo del asesor en producción, de principio a fin (consentimiento → entrevista →
   diagnóstico y plan en el chat → email de aviso → conversación `completada` en Supabase).
2. Enviar el enlace genérico a las primeras 5-10 personas y esperar 1-2 semanas antes de revisar.
3. Revisar con los datos reales: abandono (hay 3 consultas SQL preparadas, entregadas el
   2026-09-01), coherencia y utilidad de los diagnósticos, y ahorro real de la primera llamada.

Se anota también lo ya hecho de la preparación (variables de entorno de producción verificadas,
revisión visual de M-01, fix del cierre con edad decimal).

## Qué se modificó

- `docs/roadmap.md` — bloque nuevo tras "Objetivo de validación" en la sección de la Fase 1.

## Por qué

El roadmap es lo que se lee al arrancar una sesión para saber en qué punto está el proyecto. Con
M-09 cerrado, lo siguiente de verdad es la validación con gente real, y hasta ahora esos pasos solo
vivían en la conversación y en la memoria del agente, no en `docs/`.
