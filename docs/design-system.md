# Design System

<!-- Fuente de verdad visual del proyecto.
     Consultar antes de crear cualquier componente nuevo.
     Actualizar cuando se añadan nuevos patrones, componentes o se modifique la identidad visual. -->

**Nombre de marca: pendiente de decidir.** Mientras tanto, la landing y los textos usan
`[Nombre de la asesoría]` como placeholder visible — no un nombre inventado — para que quede claro
que falta por definir. Actualizar este archivo y todo el copy en cuanto se decida.

---

## Paleta de colores

| Rol | Nombre | Hex |
|-----|--------|-----|
| Primary | Azul confianza | #3457D5 |
| Secondary | Verde crecimiento | #2F9E6E |
| Accent | Coral cálido | #FF6B4A |
| Background | Fondo base | #FFFFFF |
| Surface | Fondo de cards / burbujas del agente | #F4F6FB |
| Text primary | Texto principal | #1A1F36 |
| Text secondary | Texto secundario | #5B6478 |
| Success | Estados positivos | #22C55E |
| Error | Estados de error | #E5484D |
| Warning | Advertencias | #F5A623 |

Razonamiento: azul (Primary) transmite la confianza esperable de algo financiero, pero se combina
con verde (Secondary, asociado a crecimiento/patrimonio) y un acento coral cálido (Accent, para
CTAs y momentos de cercanía) en vez de quedarse en la paleta fría típica de banca tradicional — es
la traducción visual del "cercano y humano" que ya define el tono del propio agente en
`instrucciones-sistema.md`. Text primary usa un azul-marino muy oscuro en vez de negro puro, más
suave.

---

## Tipografía

- **Display / Headings:** Sora — geométrica, moderna, con calidez (evita el aspecto corporativo
  frío de una grotesca pura).
- **Body / UI (incluido el chat):** Inter — muy legible en pantalla, estándar de producto.
- **Cifras (importes, porcentajes en el diagnóstico):** Inter con `font-variant-numeric:
  tabular-nums` — las cifras del diagnóstico y la ficha deben alinearse verticalmente y no
  "bailar" al actualizarse.

| Nivel | Fuente | Tamaño | Peso |
|-------|--------|--------|------|
| H1 | Sora | 40px | 700 |
| H2 | Sora | 28px | 600 |
| H3 | Sora | 20px | 600 |
| Body | Inter | 16px | 400 |
| Body chat | Inter | 15px | 400 |
| Caption / disclaimer | Inter | 13px | 400 |

---

## Espaciado y grid

- Escala: base 4px (4, 8, 12, 16, 24, 32, 48, 64, 96).
- Grid: 12 columnas en escritorio, gutter 24px, max-width 1120px. En móvil, columna única con
  padding lateral de 16px.
- El bloque de chat, tanto en escritorio como en móvil, se reserva un ancho máximo de lectura
  cómoda (~640px) aunque el contenedor sea más ancho — un chat a todo lo ancho de una pantalla
  grande es difícil de seguir.

---

## Estilo de componentes

- Border radius: 16px en cards y burbujas de chat, 8px en inputs y botones, full en badges/avatar
  del agente.
- Sombras: suaves y solo en la burbuja de chat activa y en cards elevadas (p. ej. el resumen de
  diagnóstico); nunca decorativas en el resto de la landing.
- Densidad: el chat necesita aire entre turnos (mínimo 16px entre burbujas) — no debe sentirse como
  un formulario comprimido.
- Iconos: Lucide, tamaño base 20px.
- Diferenciación visual agente/visitante en el chat: burbujas del agente alineadas a la izquierda
  en `Surface` con acento `Primary` en el borde o el avatar; burbujas del visitante alineadas a la
  derecha en `Primary` con texto blanco. El disclaimer regulatorio y el diagnóstico final llevan su
  propio tratamiento visual (card diferenciada, no una burbuja de chat más) para que no se confundan
  con conversación casual.

---

## Tono visual

Cercano y humano, profesional sin ser frío — el mismo registro que ya define
`instrucciones-sistema.md` para el propio agente ("tono cercano y profesional... sin tecnicismos
innecesarios, pero transmitiendo seriedad en el manejo de los datos"). La landing debe sentirse
como una conversación con alguien de confianza, no como un formulario bancario.

Qué evitar: iconografía genérica de banca de imágenes (trajeados dándose la mano, gráficas de bolsa
de stock), tono corporativo distante, exceso de disclaimers legales gritando en rojo. El disclaimer
regulatorio es obligatorio pero se integra con el mismo cuidado visual que el resto — informa, no
asusta.

El chat es el protagonista de la página, no un widget flotante añadido encima de una landing de
marketing genérica: la landing existe para dar contexto y confianza antes de que el visitante entre
a la conversación.

---

## Componentes definidos

### ChatBubble
Burbuja de un turno de la conversación. Props: `sender: 'agent' | 'visitor'`, `content`.
Estilo según sender (ver "Estilo de componentes"). Usar solo dentro del flujo de entrevista.

### DisclosureBanner
Aviso regulatorio ("orientación educativa, no asesoramiento de inversión regulado"). Se muestra al
inicio de la conversación y junto al diagnóstico/propuesta final. No es una burbuja de chat: es una
card fija con tratamiento propio, para que no se pueda confundir con contenido conversacional
normal ni perderse entre los turnos.

### InterviewProgress
Indicador de progreso de la entrevista (bloque actual de 8). Ayuda al visitante a saber cuánto
queda; reduce abandono en una conversación de ~14 turnos. Se define su forma exacta (barra, pasos
numerados) al construir la UI.

### DiagnosisCard
Card diferenciada que presenta el diagnóstico y la propuesta preliminar generados por el motor al
final de la conversación (`M-03` del PRD). Usa cifras con `tabular-nums`, jerarquía tipográfica
clara entre situación actual / proyección / gap, y lleva siempre el `DisclosureBanner` adjunto.
Cuando aplica (`M-07`), incluye la probabilidad de cumplimiento como banda (Alta/Razonable/Frágil/
Baja) con su rango de percentiles — nunca como una única cifra determinista, para no dar una falsa
sensación de precisión.

---

## Referencias visuales

Sin referencias externas concretas aportadas por el usuario. El tono se deriva directamente del
definido en `instrucciones-sistema.md` para el propio agente conversacional, trasladado a lo
visual.
