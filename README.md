<h1 align="center">Landing · Agente de diagnóstico financiero</h1>

<p align="center">
  Landing page con un chatbot de diagnóstico financiero inicial para una asesoría financiera.<br>
  El visitante llega por una URL enviada por email, completa una entrevista guiada y recibe en el
  propio chat un diagnóstico y una propuesta preliminar.
</p>

<p align="center">
  <a href="./LICENSE"><img alt="Licencia MIT" src="https://img.shields.io/badge/licencia-MIT-blue"></a>
  <img alt="pnpm v11" src="https://img.shields.io/badge/pnpm-v11-f69220">
</p>

---

## ¿Qué es esto?

Una asesoría financiera necesita una primera entrevista con cada persona interesada para recoger
datos básicos (ingresos, gastos, deudas, objetivo) antes de saber si el caso encaja y qué línea de
trabajo tiene sentido. Esta landing traslada esa primera entrevista a un agente conversacional:
el visitante llega desde un enlace que le manda el asesor por email, habla con el chat, y al
cerrar la conversación recibe ahí mismo un diagnóstico de su situación y una propuesta preliminar,
generados por un motor de análisis determinista sobre la política de inversión de la asesoría.

Cada conversación completada se guarda y dispara un aviso automático al asesor, que decide después
cómo continuar con ese lead (llamada, reunión) fuera del sistema.

No es una herramienta de asesoramiento de inversión regulado: el chat lo deja explícito con un
disclaimer al inicio de la conversación y junto al propio diagnóstico. Es orientación educativa a
partir de los datos que da el visitante; la relación de asesoramiento real la establece el asesor
después.

**Estado actual:** documentación completa (`docs/`), implementación sin empezar.

---

## Requisitos previos

- Node.js y [pnpm](https://pnpm.io/) v11 — no se usa `npm` ni `yarn` en este proyecto.
- Un proyecto de [Supabase](https://supabase.com/) (base de datos + autenticación del panel del
  asesor).
- Una clave de la [API de Anthropic (Claude)](https://console.anthropic.com/) para el agente
  conversacional.

## Variables de entorno

Copia `.env.example` como `.env.local` y rellena los valores reales. Nunca comitees `.env.local`
ni ningún archivo con credenciales. El detalle de cada variable y para qué sirve está en
`docs/architecture.md` → "Estrategia de despliegue".

## Instalación y desarrollo

```bash
pnpm install
pnpm dev
```

## Estructura de carpetas

```
docs/             → documentación del proyecto: producto, arquitectura, modelo de datos,
                     design system, roadmap, flujos de usuario, testing
docs/features/    → fichas de las features acordadas, con su tabla de cobertura
changelog/        → registro de cada cambio importante
mejoras/          → ideas futuras no implementadas
scripts/          → verificación de que ninguna ficha deja un requisito sin validar
```

La estructura de `src/` (Next.js + `lib/motor/` + componentes del chat) está diseñada en
`docs/architecture.md` → "Estructura de carpetas", pero todavía no existe: es lo primero que se
crea al empezar la implementación.

## Documentos de trabajo del negocio

Además de `docs/`, la raíz del repo tiene los documentos originales que definen las reglas del
propio agente y de la asesoría — son la fuente de verdad del negocio, y el código se construye
traduciéndolos, no reescribiéndolos libremente:

- `instrucciones-sistema.md` — guion y contrato de datos del Módulo 1 (entrevista).
- `instrucciones-motor.md` — pipeline y catálogo de casos borde del Módulo 2 (análisis).
- `plantilla-entrevista.md` — guion completo de la entrevista, pregunta a pregunta.
- `docs/criterio/politica-de-inversion.md` — fuente única de criterio financiero del motor.

## Cómo contribuir

Este proyecto sigue el protocolo de `CLAUDE.md`: toda sesión de trabajo empieza leyendo `docs/`,
cada feature se acuerda en una ficha de `docs/features/` antes de construirse, y cada cambio
importante deja registro en `changelog/`. Si usas Claude Code, `CLAUDE.md` se lee automáticamente;
si no, léelo antes de tocar nada.

## Licencia

MIT © 2026 Rafael Moreno Vicens. Ver [`LICENSE`](./LICENSE).
