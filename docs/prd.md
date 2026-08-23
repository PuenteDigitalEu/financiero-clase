# Product Requirements Document (PRD)

<!-- Fuente de verdad sobre qué construimos y por qué.
     Actualizar este archivo cuando cambie el alcance, las funcionalidades o el usuario objetivo.
     Si algo se mueve a "fuera de alcance", no borrar: mover a la sección correspondiente. -->

---

## Resumen ejecutivo

Landing page para la asesoría financiera del usuario, con un agente conversacional (chatbot)
integrado que conduce a cada visitante a través del diagnóstico financiero inicial ya diseñado
(`plantilla-entrevista.md`) y, al cerrar la conversación, ejecuta el motor de análisis
(`docs/criterio/reglas-recomendacion.md` + `instrucciones-motor.md`) para mostrarle en el propio chat un
diagnóstico y una propuesta preliminar.

El acceso es cerrado: no hay tráfico orgánico ni SEO — se llega mediante una URL que el asesor
envía por email a cada persona interesada. El resultado de cada conversación se guarda y dispara
un aviso automático al asesor, que decide después cómo continuar (llamada, reunión) con cada lead.

Existe ya un sistema de instrucciones para un agente de IA que hace esta entrevista y este
análisis (pensado originalmente para uso interno del asesor vía chat de texto). Este proyecto le
pone una cara pública — landing + chat embebido — y lo abre directamente al visitante final.

---

## Problema que resuelve

Hoy, cada persona interesada en asesoramiento financiero tiene que pasar por una primera
conversación manual con el asesor solo para recoger los datos básicos (ingresos, gastos, deudas,
objetivo) antes de poder decir si el caso encaja y qué línea de trabajo tiene sentido. Eso consume
tiempo del asesor en algo repetitivo y estructurado, y retrasa que el interesado reciba una primera
foto de su situación.

La landing con chatbot traslada esa primera entrevista y un primer diagnóstico automático al propio
visitante, en cualquier momento, sin que el asesor tenga que estar presente — y deja al asesor con
la ficha de datos, el diagnóstico y la propuesta ya generados cuando decide retomar el caso.

---

## Usuario objetivo

**Perfil 1 — Visitante / cliente potencial**
Persona que ha mostrado interés en asesoramiento financiero y recibe por email la URL de acceso.
No necesariamente tiene conocimientos financieros. Motivación principal: entender dónde está
respecto a un objetivo de ahorro/inversión. Frustración que resuelve: no tener que agendar una
reunión solo para dar información básica y esperar a que alguien la analice.

**Perfil 2 — El asesor (usuario dueño del producto)**
Gestiona la asesoría financiera, envía la URL a sus leads, y recibe aviso por email cada vez que
alguien completa la conversación. Usa la ficha, el diagnóstico y la propuesta generados como punto
de partida para la siguiente conversación con esa persona — no como sustituto de su criterio.

---

## Funcionalidades core (MoSCoW)

### MUST
- **[M-01] Landing pública con presentación de la asesoría y el agente** — Dado un visitante que
  abre la URL recibida por email, cuando carga la página, entonces ve una landing que presenta la
  asesoría financiera y el agente conversacional, con un punto de entrada claro para iniciar el
  chat.

- **[M-02] Entrevista guiada por chat** — Dado un visitante que inicia el chat, cuando responde a
  las preguntas, entonces el agente sigue el orden fijo de `plantilla-entrevista.md` (ingresos →
  gastos → deudas → ahorro/inversión → colchón → objetivo → horizonte/riesgo → edad/situación
  vital), una pregunta cada vez, respetando las reglas ya definidas de repregunta única, datos
  sensibles saltables y tope de ~14 turnos.
  *Negativo:* dado un visitante que se niega a dar un dato sensible, cuando lo indica, entonces el
  agente lo marca como pendiente, avisa en una frase de que el diagnóstico será menos preciso en
  ese punto, y continúa sin insistir.

- **[M-03] Diagnóstico y propuesta automáticos en el propio chat** — Dado un visitante que termina
  la entrevista y confirma el resumen de sus datos, cuando el sistema genera la ficha, entonces
  ejecuta el motor de análisis (política de inversión) sobre esa ficha y muestra en el chat, en el
  mismo momento, el diagnóstico (situación actual, % de camino recorrido, proyección, gap) y la
  propuesta preliminar (aportación, cartera objetivo), acompañados siempre del disclaimer de que es
  orientación educativa no regulada y que el asesor la revisará después.
  *Negativo:* dado un caso con datos críticos pendientes (R9) o flujo libre ≤ 0, cuando
  se genera el diagnóstico, entonces el chat muestra únicamente escenarios condicionados o el modo
  de estabilización correspondiente — nunca una propuesta ejecutable no soportada por los datos.

- **[M-04] Persistencia de cada conversación** — Dado que un visitante completa el chat, cuando se
  genera la ficha y el diagnóstico, entonces ambos quedan guardados de forma duradera (base de
  datos), asociados a esa conversación, consultables por el asesor después.

- **[M-05] Aviso automático al asesor** — Dado que un visitante completa el chat, cuando se genera
  el diagnóstico, entonces el sistema envía un email automático al asesor con el resumen del caso
  (o un enlace para consultarlo), sin que el asesor tenga que estar revisando activamente.

- **[M-06] Consentimiento de tratamiento de datos antes de empezar** — Dado un visitante que pulsa
  el punto de entrada del chat, cuando se le presenta la solicitud de consentimiento de tratamiento
  de datos, entonces la conversación no se crea ni se persiste ningún dato hasta que acepta
  explícitamente; al aceptar, se registra la fecha y hora del consentimiento.
  *Negativo:* dado un visitante que no acepta, cuando cierra o abandona esa pantalla, entonces no
  queda ninguna fila de conversación ni dato personal asociado.

### SHOULD
- **[S-01] Panel de consulta para el asesor** — Dado que el asesor quiere revisar casos pasados,
  cuando accede al panel, entonces ve el listado de conversaciones completadas con su ficha y
  diagnóstico, sin depender solo de los emails de aviso.

### COULD
- **[C-01] Historial accesible para el propio visitante** — Dado un visitante que cerró el chat,
  cuando vuelve a abrir la misma URL más adelante, entonces puede recuperar su diagnóstico ya
  generado (sujeto a decidir cómo se identifica sin cuentas de usuario).

### WON'T (esta versión)
- Cuentas de usuario o login para los visitantes.
- Cobro o pago dentro del sitio (la herramienta es de captación, gratuita).
- URLs personalizadas por destinatario (el enlace es genérico para todos; el chat pregunta el
  nombre como parte de la entrevista).
- Simulación de probabilidad de cumplimiento por Monte Carlo (`docs/criterio/reglas-recomendacion.md`,
  R10, ya la deja marcada como no implementada en el motor; este proyecto no la añade).
- Recomendación de productos financieros concretos (excluido por política de inversión, no es
  negociable en esta capa).
- Soporte multi-asesor / multi-tenant (el producto es para una sola asesoría).

<!-- Las WON'T no llevan ID ni criterio: no se van a construir. Si alguna entra más adelante,
     se le asigna ID nuevo al moverla de sección. -->

---

## Flujos de usuario principales

**Flujo del visitante:**
Recibe un email del asesor con la URL de la landing. Entra, ve la presentación de la asesoría y del
agente, y pulsa para iniciar el chat. Antes de que se cree ninguna conversación, acepta el
consentimiento de tratamiento de datos (`M-06`) — si no acepta, no queda ningún rastro. El agente se
presenta, da el disclaimer regulatorio y conduce
la entrevista de 8 bloques, una pregunta cada vez. Al terminar, repasa con el visitante un resumen
de confirmación de los datos. Con la confirmación, el sistema genera la ficha internamente y, sin
pasos adicionales por parte del visitante, ejecuta el motor de análisis y le muestra en el chat su
diagnóstico y una propuesta preliminar, con el disclaimer de que un asesor humano la revisará. El
chat cierra indicando que el asesor se pondrá en contacto.

**Flujo del asesor:**
Envía la URL genérica por email a cada persona interesada. Cuando alguien completa el chat, recibe
un aviso automático por email. A partir de ahí, consulta la ficha/diagnóstico generados (por email
o, si se construye, por el panel de `S-01`) y decide cómo continuar la relación con ese lead fuera
del sistema (llamada, reunión, propuesta formal).

---

## Requisitos no funcionales

- **Cumplimiento normativo:** el disclaimer de "orientación educativa, no asesoramiento de
  inversión regulado" debe aparecer al inicio de la conversación y de nuevo junto al
  diagnóstico/propuesta automáticos (`M-03`), dado que ahora se entregan directamente al visitante
  sin revisión previa del asesor — esto es una decisión consciente del usuario que se aparta del
  diseño original de `instrucciones-sistema.md`/`instrucciones-motor.md`, y esos documentos deberán
  actualizarse para reflejarlo antes de construir sobre ellos.
- **Confidencialidad de datos financieros:** los datos recogidos son sensibles (ingresos, deudas,
  patrimonio). Cifrado en tránsito y en reposo, acceso a la base de datos restringido al asesor.
- **Protección de datos (RGPD):** el tratamiento de datos personales requiere consentimiento
  explícito antes de que exista cualquier registro (`M-06`); minimización de datos (no se sabe quién
  es el visitante hasta que da nombre y email dentro del chat); las conversaciones tienen fecha de
  expiración. Pendiente de revisión legal antes de producción.
- **Protección contra abuso:** el chat es de acceso público y cada mensaje tiene coste real (API de
  Claude). Debe existir un límite de uso por origen (ver `docs/architecture.md` → "Protección contra
  abuso") antes de exponer la landing públicamente.
- **Responsive:** el enlace llega por email y es razonable esperar que una parte relevante de
  visitantes lo abra desde el móvil; la landing y el chat deben ser usables en pantalla pequeña.
- **Idioma:** español, único idioma de esta versión.
- **Disponibilidad:** tráfico bajo y por invitación (no hay picos de campaña ni SEO); no se
  requiere infraestructura de alta escala.

---

## Fuera de alcance (explícito)

- SEO y captación orgánica: el acceso es siempre por URL enviada por el asesor, no se optimiza la
  landing para buscadores ni se promociona públicamente.
- Cuentas de usuario, login o áreas privadas para el visitante.
- Cualquier flujo de pago o cobro en el sitio.
- Generación de documentos descargables (PDF, etc.) para el visitante en esta versión — el
  resultado se muestra en el propio chat.
- Simulación Monte Carlo de probabilidad de cumplimiento (pendiente en el motor, no se construye
  aquí).
- Integración con más de un asesor o marca.
