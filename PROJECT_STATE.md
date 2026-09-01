# PROJECT_STATE.md

> Documento de memoria técnica. Si esta conversación llega al límite de
> contexto, abre una nueva conversación, sube/adjunta este archivo (o el
> proyecto completo) y pide a Claude que lo lea antes de continuar.
> Actualízalo al terminar cada fase — no antes.

---

## 0. Identidad de marca: LAUVO

**El nombre de la marca es LAUVO** (Instagram `@wearelauvo`), confirmado
por Cristian en la consolidación de Fases 1-4.2. **LAUVO no tiene
slogan oficial por ahora.** La frase "FROM IDEA TO BEYOND" (tomada de la
ficha de referencia de ORB.02) no es una decisión de marca aprobada —
no es tagline, no es subtítulo permanente, no es elemento principal de
identidad, y se eliminó de todo lugar donde había quedado (título/meta
de `index.html`). La frase "Una buena idea merece una buena ejecución."
sí puede conservarse como una frase narrativa/de marca dentro de la
experiencia cuando más adelante tenga sentido — pero tampoco debe
tratarse como slogan permanente.

**ORB.02** es una entidad separada del universo LAUVO (no es el logo,
no se mezcla con la identidad de marca): forma orbital/circular,
blanca, translúcida, visor oscuro sin boca, ojos de luz blanca
verticales, pequeñas esferas de energía flotantes, antena con esfera de
luz. Paleta: `#FFFFFF`, `#E9F1FF`, `#0A0D12`, `#CBC9FF`. Comportamiento:
observa y acompaña sin distraer, responde sutilmente al cursor, aparece
en momentos clave, no habla (o muy ocasionalmente, nunca como chatbot).
Escala aproximada: 0.6-0.8× la altura de la cabeza de una persona
promedio. Existe una ficha de referencia visual completa (vistas
técnicas, expresiones, poses, especificaciones de material) que
Cristian proporcionó — **ORB.02 todavía NO está implementado en 3D**;
ver sección 14 para el estado exacto y por qué se difirió.

## 1. Concepto general

Sitio web premium para LAUVO, una marca de experiencias digitales
(sitios web, landing pages, tiendas online, experiencias digitales,
rediseño/optimización, soluciones personalizadas). LAUVO no debe
sentirse como una agencia web genérica: analiza la idea del cliente
(definida, incompleta, o inexistente) y encuentra el encaje entre idea,
experiencia, tecnología y presupuesto, explicado en lenguaje humano.

**Filosofía/slogan de marca: ninguno confirmado todavía.** La frase
heredada "IF YOU CAN IMAGINE IT, WE CAN BUILD IT." (de la etapa
"Studio", previa al nombre LAUVO) NO es la identidad oficial actual y
no debe tratarse como tagline permanente. LAUVO no tiene slogan oficial
por ahora — ver sección 0. La decisión de frase(s) para el Hero queda
pendiente y corresponde a Cristian, no a una elección hecha dentro de
una consolidación (ver sección 14).

**Concepto visual:** "FROM EARTH TO THE MOON" — consistente con la
metáfora de marca de LAUVO (sección 7 del brief de consolidación:
IDEA → FORMA → CONSTRUCCIÓN → CRECIMIENTO → ASCENSO → ESPACIO → LUNA).
El visitante inicia en la Tierra, llega a una ciudad, observa la
construcción de un rascacielos mientras hace scroll —
**"THE WEBSITE IS THE BUILDING"** (concepto central de la Fase 2) — y
la cámara continúa hacia el cielo, el espacio y la Luna (Fase 4,
Etapas 4.1-4.2 implementadas; Luna sin implementar, Fase 5).

## 2. Objetivo del sitio

Ser en sí mismo la demostración del servicio: una experiencia 3D
cinematográfica, no una landing corporativa. Debe convertir (contacto,
portfolio, paquetes) sin dejar de sentirse como estudio creativo /
arquitectura futurista / tecnología premium.

## 3. Arquitectura del proyecto

Proyecto Vite + React. El sitio se estructura en tres capas:

- **Capa 3D (fija):** un único `<Canvas>` de React Three Fiber montado en
  `Experience.jsx`, fijo a viewport completo, detrás de todo.
- **Capa cinematográfica (fija, solo CSS):** `cinematic-vignette`, entre
  el canvas y el contenido (viñeta + grano sutil, sin draw calls extra).
- **Capa de contenido (scrollable):** secciones HTML en `src/sections/`,
  dentro de un `journey-track` cuya altura determina cuánto dura el
  scroll. Un único `ScrollTrigger` (GSAP) sobre ese track publica el
  progreso 0-1 en `JourneyContext`.

`JourneyContext` (`src/context/JourneyContext.jsx`) sigue siendo la
única fuente de verdad de `progress` (0–1).

**Mapeo de progreso:** `src/lib/journeyMap.js` divide ese `progress`
compartido en segmentos, uno por fase, cada uno con su propio
`<segmento>Local(progress)` que lo renormaliza a 0-1 — el patrón que
introdujo `buildingLocal` en la Fase 2 y que la Fase 4 extiende dos
veces (4.1 y 4.2) sin tocar los segmentos anteriores:
- `[0, HERO_END≈0.0341]` → hero fijado + aproximación a la ciudad.
- `[HERO_END, BUILDING_END≈0.4267]` → narrativa de construcción del
  rascacielos, renormalizada vía `buildingLocal(progress)`.
- `[BUILDING_END, ASCENT_END=2/3]` → Fase 4.1: ascenso alejándose del
  edificio terminado, renormalizada vía `ascentLocal(progress)`.
- `[ASCENT_END, 1]` → Fase 4.2: espacio profundo (estrellas + Tierra
  distante), renormalizada vía `deepSpaceLocal(progress)`.

`src/scenes/skyscraper/buildingConfig.js` define las 6 etapas de
construcción como fracciones de `buildingLocal` (foundation 0-0.10,
structure 0.10-0.25, floors 0.25-0.45, facade 0.45-0.60, windows
0.60-0.75, systems+completion 0.75-1), siguiendo los porcentajes
aproximados del brief. `ConstructionSite.jsx` calcula estas fracciones
una sola vez y las reparte a los sub-componentes — sigue existiendo un
único `ScrollTrigger` para todo el sitio, sin triggers independientes
compitiendo.

**Altura del `journey-track`:** 3750vh en desktop, 3075vh en ≤1024px
(`global.css`). La Fase 4.2 añadió ~1250vh (1025vh en tablet) sobre el
total de la Fase 4.1 (2500vh/2050vh) para dar espacio real al espacio
profundo. Cada ampliación del track (4.1 y 4.2) escala el total exacto
por 1.5×, lo que mantiene el álgebra de `journeyMap.js` exacta: `HERO_END`
y `BUILDING_END` se recalcularon otra vez (multiplicados por
`DEEP_SPACE_SCALE=2/3`) para que `buildingLocal` y `ascentLocal` sigan
produciendo EXACTAMENTE los mismos valores que antes de la Fase 4.2, en
la misma posición absoluta de scroll (verificado numéricamente con
Node antes de cerrar la etapa — ver sección 11).

```
agency-site/
├── PROJECT_STATE.md
├── index.html
├── src/
│   ├── App.jsx                    ← Provider + Layout + Canvas + journey-track (Hero + Captions)
│   ├── main.jsx
│   ├── styles/
│   │   ├── tokens.css              ← paleta, tipografía, espaciado
│   │   └── global.css              ← reset + vignette/grain + hero + botones + captions + journey-track (3750vh/3075vh) + responsive
│   ├── context/
│   │   └── JourneyContext.jsx      ← progress/phase compartido
│   ├── hooks/
│   │   └── useJourneyScroll.js     ← ScrollTrigger (GSAP) → progress
│   ├── lib/
│   │   ├── seededRandom.js          ← PRNG determinista (mulberry32)
│   │   ├── journeyMap.js            ← HERO_END, BUILDING_END, ASCENT_END, buildingLocal(), ascentLocal(), deepSpaceLocal()
│   │   └── device.js                ← isLowDetailDevice() para reducir detalle
│   ├── components/
│   │   ├── layout/Layout.jsx       ← canvas fijo + cinematic-vignette + contenido scrollable
│   │   ├── canvas/
│   │   │   ├── Experience.jsx       ← <Canvas> único: calcula lowDetail/reveal/ascent/deepSpace, ensambla CityScene + ConstructionSite + AtmosphereDust + AtmosphereTransition + DeepSpaceScene + CameraRig
│   │   │   ├── CameraRig.jsx        ← keyframes de Fases 1-3 + Ascenso (reescalados por ASCENT_END) + keyframes de Espacio Profundo (Fase 4.2), un solo sistema
│   │   │   └── AtmosphereDust.jsx   ← partículas ligeras, cuenta reducida con lowDetail
│   │   └── ui/                     (vacío)
│   ├── scenes/
│   │   ├── city/
│   │   │   ├── CityScene.jsx        ← terreno + sky dome + luces frías/cálidas
│   │   │   ├── CityBlocks.jsx       ← skyline en 2 capas, cuenta reducida y capa lejana omitida con lowDetail
│   │   │   └── SkyDome.jsx          ← shader de gradiente, radio 2500 (180→500→2500 a través de Fases 1/4.1/4.2), nombrada "sky-dome" para que AtmosphereTransition la encuentre
│   │   ├── skyscraper/
│   │   │   ├── buildingConfig.js     ← constantes compartidas: FLOOR_COUNT=16, FLOOR_HEIGHT=1.9, FINAL_HEIGHT≈30.4, FOOTPRINT=4.6, STAGES, bandT(), skeletonHeightT()
│   │   │   ├── ConstructionSite.jsx  ← ensamblador: plataforma+hoarding, calcula las fracciones de etapa y las reparte
│   │   │   ├── Skeleton.jsx          ← 4 columnas de esquina + núcleo central + vigas de anillo por piso (Foundation+Structure)
│   │   │   ├── Floors.jsx            ← losas por piso, InstancedMesh, revelado piso por piso con variación sutil
│   │   │   ├── Facade.jsx            ← paneles de vidrio + mullions por piso (2 InstancedMesh, mullions omitidos con lowDetail)
│   │   │   ├── Windows.jsx           ← ventanas InstancedMesh agrupadas por "sala" (piso+lado) con umbral compartido; `lowDetail` reduce ventanas por lado (3→2)
│   │   │   ├── RooftopSystems.jsx    ← elevador de obra (sube y se retira), parapeto de remate, antena/baliza de azotea
│   │   │   ├── GhostOutline.jsx      ← contorno fantasma de la altura final; se disuelve por completo al llegar a completion
│   │   │   └── Crane.jsx             ← grúa (heredada de Fase 1), mástil sobre FINAL_HEIGHT, cable se retrae en completion
│   │   ├── space/                                        ← (Fase 4, contenido nuevo)
│   │   │   ├── AtmosphereTransition.jsx ← sin geometría propia: encadena dos lerps (ciudad→borde de atmósfera vía `ascentLocal`, borde→espacio profundo vía `deepSpaceLocal`) sobre fog/cielo
│   │   │   ├── DeepSpaceScene.jsx    ← (Fase 4.2, nuevo) ensamblador: monta Stars + EarthGlobe, mismo patrón que CityScene/ConstructionSite
│   │   │   ├── Stars.jsx             ← (Fase 4.2, nuevo) campo de estrellas: 1 Points/shader, revelado progresivo por umbral aleatorio por vértice, sin miles de objetos individuales
│   │   │   └── EarthGlobe.jsx        ← (Fase 4.2, nuevo) Tierra distante procedural (shader propio + halo de Fresnel), sin texturas, opacidad fade-in tardío
│   │   └── moon/                   (vacío — Fase 5)
│   ├── sections/
│   │   ├── HeroSection.jsx         ← hero con reveal enmascarado, pin + fade/scale-out
│   │   └── ScrollCaptions.jsx      ← narrativa 01-06 sobre `buildingLocal` + 07 "Ascent" sobre `ascentLocal` + 08 "Deep space"/09 "Earth" (provisionales) sobre `deepSpaceLocal`
│   ├── data/                       (vacío — fase comercial futura)
```

## 4. Tecnologías utilizadas

- **React 19 + Vite**, **Three.js + @react-three/fiber + @react-three/drei**, **GSAP + ScrollTrigger**.
- Sin router, sin CSS framework.
- **No se agregaron librerías nuevas en la Fase 2**, conforme a la
  instrucción explícita del brief — toda la construcción usa geometría
  procedural nativa de Three.js (`InstancedMesh`, `BoxGeometry`,
  `CylinderGeometry`, `ShaderMaterial`).

## 5. Sistema de diseño (decisiones de diseño)

Paleta sin cambios respecto al polish pass de Fase 1 (`--color-void`,
`--color-crane`, `--color-concrete`, `--color-blueprint`,
`--color-earth-clay`). Tipografía sin cambios (Space Grotesk / Inter /
IBM Plex Mono).

**Regla de iluminación de tres capas (Fase 2):**
- **Ciudad = ambiente frío** (`CityScene`: luz clave azulada, ambiental
  fría tenue).
- **Sitio de construcción = cálido** (`ConstructionSite`: luz puntual +
  spotlight ámbar, más intensos mientras el esqueleto/pisos suben, se
  atenúan una vez que el edificio tiene su propia iluminación).
- **Edificio = iluminación elegante y controlada** (`Windows`: mezcla
  mayoritariamente de blanco frío (`#dce6f5`) con acentos cálidos
  ocasionales (`#f2d9a8`, ~22% de las ventanas), encendido escalonado
  por umbral seedeado, ~12% de ventanas que nunca se encienden — evita
  que el edificio compita visualmente con el ámbar saturado de la grúa).

## 6. Componentes existentes

Ver el árbol de la sección 3 para la lista completa. Resumen de lo nuevo
en Fase 2, todos en `src/scenes/skyscraper/`:

- `buildingConfig.js` — única fuente de verdad numérica (alturas, pisos,
  huella, bandas de etapa).
- `Skeleton` — columnas de esquina + núcleo + vigas de anillo; crecen por
  escala/posición (no opacidad), cubriendo Foundation y Structure como
  una misma estructura que sube.
- `Floors` — losas InstancedMesh, revelado piso por piso con easing
  cuadrático, variación de huella por piso vía PRNG con semilla.
- `Facade` — paneles perimetrales InstancedMesh tipo vidrio estilizado,
  crecen verticalmente desde la línea de piso hacia arriba.
- `Windows` — InstancedMesh con `instanceColor` recalculado solo cuando
  el progreso cambia de forma significativa (cuantizado), no cada frame.
- `RooftopSystems` — elevador que sube una vez durante la etapa systems,
  antena + baliza que aparecen en completion.
- `GhostOutline` — ahora se disuelve del todo (`opacity → 0`) conforme
  `completionT → 1`, en vez de estabilizarse en una opacidad fija.
- `Crane` — misma grúa de Fase 1, extraída a componente propio, con
  parámetro `active` que modula la amplitud del balanceo idle.

`CameraRig`: keyframes pre-ascenso (heredados de Fases 2-3, reescalados
por `ASCENT_END` para no cambiar su posición absoluta de scroll) más los
keyframes de ascenso de la Fase 4.1 (reescalados junto con ellos) más
los nuevos keyframes de espacio profundo de la Fase 4.2, todo en el
mismo array y la misma función de interpolación — sin un segundo
sistema de cámara.

`Experience.jsx` calcula `lowDetail` una vez al montar
(`isLowDetailDevice()`) y lo distribuye a `CityScene` (capa lejana
omitida + cuenta cercana reducida), `ConstructionSite`→`Windows`/`Facade`
(ventanas por lado 3→2, mullions omitidos), `AtmosphereDust`
(partículas reducidas ~45%) y `DeepSpaceScene`→`Stars`/`EarthGlobe`
(cuenta de estrellas reducida ~70%, esfera de Tierra con menos
segmentos), además de desactivar sombras y limitar `dpr` a 1 en el
propio `Canvas`.

`AtmosphereTransition` (`scenes/space/`) — sin geometría propia; usa
`useThree`/`useFrame` para encadenar dos interpolaciones sobre el fog de
la escena y el gradiente del `SkyDome` (encontrado por nombre, sin prop
drilling): ciudad→borde de atmósfera vía `ascentLocal` (Fase 4.1),
borde de atmósfera→espacio profundo vía `deepSpaceLocal` (Fase 4.2).

**Nuevos en Fase 4.2:** `DeepSpaceScene` (ensamblador, mismo patrón que
`CityScene`/`ConstructionSite`), `Stars` (un solo `Points`/`ShaderMaterial`,
revelado progresivo por umbral aleatorio por vértice — no aparecen todas
a la vez ni de golpe), `EarthGlobe` (esfera procedural con shader propio
+ halo de Fresnel, sin texturas, opacidad que se activa tarde y gradual
dentro de la etapa).

## 7. Secciones existentes

- **Hero** (Fase 1 + polish pass, sin cambios desde entonces).
- **Scroll captions**: narrativa 01-06 (Foundation, Structure, Floors,
  Design, Development, Interaction) sobre `buildingLocal`, **07 — Ascent**
  (Fase 4.1) sobre `ascentLocal`, y **08 — Deep space** / **09 — Earth**
  (Fase 4.2, textos provisionales "The atmosphere is behind us now." /
  "This is where we started.", sin contenido comercial) sobre
  `deepSpaceLocal`.

## 8. Estado actual

**Fase actual: Fase 4 — "SPACE", Etapa 4.2 (Deep Space) — COMPLETADA.**

Fase 3 (Foundation a Summit) y Fase 4.1 (Ascenso) permanecen terminadas
y sin cambios de comportamiento — verificado numéricamente que
`buildingLocal(progress)` y `ascentLocal(progress)` producen exactamente
los mismos valores que antes en la misma posición absoluta de scroll
(ver sección 11).

Esta ejecución retomó un trabajo que se había quedado sin tokens a
mitad de la implementación. Antes de escribir nada se inspeccionó el
estado real de los archivos (`journeyMap.js`, `CameraRig.jsx`,
`Experience.jsx`, `AtmosphereTransition.jsx`, `Stars.jsx`, árbol de
`scenes/space/`) para determinar exactamente qué ya estaba guardado:

- **Ya completo al retomar:** `journeyMap.js` (con `ASCENT_END` y
  `deepSpaceLocal` ya agregados), `CameraRig.jsx` (keyframes de espacio
  profundo ya añadidos y reescalados), `SkyDome.jsx` (radio ya ampliado
  a 2500), `global.css` (track ya en 3750vh/3075vh), y `Stars.jsx`
  (componente completo y correcto: campo de estrellas en volumen 3D real
  con revelado por umbral por vértice).
- **Pendiente al retomar, completado en esta continuación:**
  `EarthGlobe.jsx` (no existía), `DeepSpaceScene.jsx` (no existía),
  extensión de `AtmosphereTransition.jsx` para encadenar el estado de
  espacio profundo (seguía solo con ciudad→ascenso), conexión de todo en
  `Experience.jsx` (import de `deepSpaceLocal`, far plane de cámara
  ampliado, montaje de `DeepSpaceScene`), y los captions provisionales
  08/09 en `ScrollCaptions.jsx`.

No se rehizo nada de lo ya guardado — se completó únicamente lo
faltante.

## 9. Funcionalidades terminadas

Fase 1 + polish pass + Fase 2 + Fase 3 (Etapas 1 y 2) + Fase 4.1: sin
cambios respecto a lo ya documentado en revisiones anteriores de este
archivo.

**Fase 4 — Etapa 4.2 (Deep Space) — completada:**
- [x] Inspección del estado real de archivos antes de modificar,
      confirmando qué ya estaba implementado (ver sección 8).
- [x] `journeyMap.js`: nuevo límite `ASCENT_END=2/3` que cierra el
      segmento de ascenso y abre el de espacio profundo; `HERO_END` y
      `BUILDING_END` recalculados con el mismo factor
      (`DEEP_SPACE_SCALE=2/3`) para preservar el comportamiento exacto
      de `buildingLocal` y `ascentLocal`; nueva función
      `deepSpaceLocal(progress)`.
- [x] `global.css`: `journey-track` extendido de 2500vh/2050vh a
      3750vh/3075vh (los ~1250vh/1025vh nuevos son el espacio profundo).
- [x] `CameraRig.jsx`: keyframes existentes (Fases 1-3 + Ascenso)
      reescalados por `ASCENT_END` + 4 keyframes nuevos de espacio
      profundo, en el mismo array/sistema — la cámara sigue el mismo
      tipo de movimiento (ascenso, apertura de lente) en vez de cambiar
      de modo, y deriva gradualmente hacia la Tierra sin centrarla.
- [x] `SkyDome.jsx`: radio ampliado de 500 a 2500 (la cámara del espacio
      profundo llega a ~1180 unidades).
- [x] `Stars.jsx` (nuevo, `scenes/space/`): campo de estrellas en un
      solo `Points`/`ShaderMaterial`, distribución en volumen 3D real
      (cáscara esférica, no una textura plana), revelado progresivo por
      umbral aleatorio por vértice (no todas a la vez), variación de
      tamaño/tinte/parpadeo sutil, `lowDetail` reduce la cuenta ~70%.
- [x] `EarthGlobe.jsx` (nuevo, `scenes/space/`): esfera procedural con
      shader propio (sin texturas) + halo de Fresnel, posicionada lejos
      del plano del suelo de la ciudad (evita z-fighting), opacidad que
      empieza a activarse solo bien avanzada la etapa y nunca domina la
      composición.
- [x] `DeepSpaceScene.jsx` (nuevo, `scenes/space/`): ensamblador que
      monta `Stars` + `EarthGlobe`, mismo patrón que `CityScene`/
      `ConstructionSite`.
- [x] `AtmosphereTransition.jsx`: extendido (no duplicado) para
      encadenar un segundo lerp (borde de atmósfera→espacio profundo)
      sobre el mismo fog/cielo que ya manejaba.
- [x] `Experience.jsx`: far plane de cámara ampliado de 900 a 4200;
      `deepSpaceLocal` calculado y pasado a `AtmosphereTransition` y
      `DeepSpaceScene`.
- [x] `ScrollCaptions.jsx`: captions provisionales "08 — Deep space" y
      "09 — Earth" sobre `deepSpaceLocal`, sin tocar el contenido de las
      7 captions anteriores.
- [x] Verificado numéricamente (con Node) que `buildingLocal` y
      `ascentLocal` reproducen exactamente los mismos valores que antes
      de la Fase 4.2, en la misma posición absoluta de scroll.
- [x] Verificado: sin imports rotos, fuente única de progreso intacta,
      `lowDetail` extendido sin regresiones.
- [x] Build de producción verificado sin errores (61 módulos).

## 10. Funcionalidades pendientes

- [ ] Fase 5 (Moon): superficie lunar, aterrizaje, y el límite
      `DEEP_SPACE_END` en `journeyMap.js` que cerraría el segmento de
      espacio profundo y abriría el de la Luna — mismo patrón de
      extensión usado en 4.1 y 4.2 (nuevo límite, reescalar lo anterior,
      extender `journey-track`, extender `CameraRig`).
- [ ] Refinamiento visual del espacio profundo si al revisar se nota
      necesario: la posición/escala exacta de `EarthGlobe` y el ritmo de
      revelado de `Stars` se definieron sin verificación visual directa
      (ver Problemas conocidos).
- [ ] Contenido comercial (servicios, industrias, portfolio, paquetes,
      contacto, IA/automatizaciones, traducción al español, WhatsApp,
      correo, ubicación, nombre definitivo de empresa) — pospuesto
      explícitamente por Cristian a una fase posterior sin numerar
      todavía (`src/data/`, aún vacío).
- [ ] Optimización final (code-splitting del bundle de three.js),
      medición de rendimiento en hardware real (iPad/iPhone físicos).

## 11. Decisiones técnicas

Heredadas de fases anteriores: un solo `<Canvas>`, progreso centralizado
en `JourneyContext`, PRNG con semilla para layouts estables, `damp` en
vez de `lerp` fijo, geometría procedural en vez de `.glb`, sin
librerías nuevas salvo necesidad real. El esqueleto del edificio se
completa al final de la etapa "floors" y todo lo posterior es
decoración sobre un frame ya completo; `Windows` recalcula su buffer de
color solo cuando el progreso cambia de forma significativa, no cada
frame; el elevador de obra y la grúa usan una sola interpolación de
posición/escala en vez de simulación física; los mullions de la fachada
son una segunda `InstancedMesh` independiente para poder omitirse con
`lowDetail`. El patrón "segmento + `<segmento>Local()`" (introducido por
`buildingLocal` en la Fase 2) se ha extendido dos veces sin sustituirse:
`ascentLocal` (4.1) y ahora `deepSpaceLocal` (4.2) — cada extensión
reescala los límites y keyframes anteriores por un factor exacto,
verificado numéricamente, en vez de re-tunearlos a mano.

**Nuevas en Fase 4.2 (Deep Space):**
- El factor de reescalado (`DEEP_SPACE_SCALE = 2/3`) se aplicó a
  `HERO_END` y `BUILDING_END` como una multiplicación explícita en el
  propio archivo (`0.0512 * DEEP_SPACE_SCALE`), no como números
  redondeados a mano — mantiene la derivación auditable y exacta, y
  `ASCENT_END` se define directamente como ese mismo factor porque,
  por construcción, marca dónde terminaba el track justo antes de esta
  etapa.
- Igual que en 4.1, el array completo de keyframes anteriores
  (`PRE_ASCENT_KEYFRAMES` + `ASCENT_KEYFRAMES`) se reescaló con un solo
  `.map()` por `ASCENT_END`, en vez de tocar cada `p` a mano — mismo
  patrón, un nivel más profundo.
- `Stars` usa un `ShaderMaterial` con un atributo `aThreshold` aleatorio
  por vértice en vez de animar visibilidad por estrella desde JS — el
  encendido escalonado ("pocas estrellas, luego más") ocurre enteramente
  en GPU a partir de un único uniforme (`uReveal`), sin costo adicional
  por más estrellas que se agreguen. Distribución en volumen 3D real
  (cáscara esférica con radio cúbico-aleatorio) en vez de un plano de
  fondo, para que el movimiento de cámara produzca profundidad genuina.
- El radio interior de la cáscara de estrellas (1200) se eligió por
  encima de la distancia máxima de la cámara en esta etapa (~1180) para
  que las estrellas nunca queden "delante" de la cámara ni exista un
  hueco visible cerca del punto de vista.
- `EarthGlobe` usa un `ShaderMaterial` propio con una dirección de luz
  fija en vez de depender de las luces de la escena (`DirectionalLight`
  de `CityScene`, pensadas para el rango de distancias de la ciudad) —
  más confiable a >1000 unidades de distancia y más barato que calcular
  iluminación real a esa escala.
- La Tierra se posicionó deliberadamente lejos del origen/plano del
  suelo (no tangente a él) para evitar z-fighting entre el plano plano
  de 400×400 de la ciudad y la curvatura de una esfera de gran radio
  vista a distancias extremas — una decisión de composición explicada
  al usuario antes de implementarla (ver conversación), documentada
  también como limitación conocida más abajo.
- El halo atmosférico de `EarthGlobe` es una segunda esfera ligeramente
  más grande con Fresnel (`BackSide`, aditivo) — el truco estándar más
  barato para un "glow" de atmósfera sin post-procesado ni librerías
  nuevas.
- `AtmosphereTransition` se extendió (no se duplicó) para aceptar
  `deepSpaceLocal` además de `ascentLocal` y encadenar un segundo lerp
  sobre los mismos targets de fog/cielo — los tres estados (ciudad,
  borde de atmósfera, espacio profundo) viven en el mismo archivo y la
  misma función `useFrame`.
- El `SkyDome` se amplió otra vez (500→2500) y el far plane de la
  cámara (900→4200) seleccionados con margen sobre la distancia máxima
  real de los nuevos keyframes de cámara, siguiendo la misma
  verificación que en 4.1 (no solo "un número más grande").
- No se agregó ninguna librería nueva.
## 12. Problemas conocidos

- No se ha verificado visualmente (sin navegador headless en este
  entorno) que la transición espacio profundo (estrellas + Tierra) se
  sienta elegante y no genérica en la práctica — la verificación
  realizada fue numérica (preservación de `buildingLocal`/`ascentLocal`)
  y de compilación, no visual. Recomiendo revisar con `npm run dev`,
  haciendo scroll lento desde el final del ascenso hasta el final del
  track actual, prestando atención especial a: ritmo de aparición de
  estrellas, posición/escala de la Tierra, y si la composición final se
  siente "abierta" (lista para introducir la Luna) en vez de vacía.
- La posición de `EarthGlobe` (offset del origen, no tangente al plano
  del suelo) fue una decisión de composición explicada a Cristian antes
  de implementarla, pero su encaje exacto con los keyframes de cámara
  del espacio profundo no se ha confirmado visualmente — es razonable
  que necesite un ajuste fino de posición/escala tras revisarla.
- El final de la Etapa 4.2 (`p=1`) es hoy también el final absoluto del
  `journey-track` — no hay todavía Fase 5. Esto es intencional (trabajo
  incremental), pero significa que el scroll "se acaba" en una vista de
  espacio profundo con la Tierra visible, sin Luna, hasta que se
  autorice la siguiente fase.
- El bundle de producción supera 500kB (three.js) — se resuelve con
  code-splitting en una fase de optimización posterior.
- `lowDetail` se calcula una sola vez al montar y no reacciona a
  cambios de tamaño de ventana/orientación en vivo — sin cambios desde
  fases anteriores, no afectado por esta etapa (incluye ahora también
  `Stars`/`EarthGlobe`, que heredan la misma limitación).
- El rendimiento en iPad/iPhone reales (no emulados) sigue sin medirse
  en este entorno. El campo de estrellas (2200 vértices, 650 en
  `lowDetail`) y la Tierra (2 esferas, 40×40 y 20×20 segmentos) son
  ligeros en teoría, pero no se ha confirmado en hardware real.
- Los rangos de `JOURNEY_PHASES` en `JourneyContext.jsx` (heredados de
  Fase 0/1) siguen sin usarse activamente — el mapeo real de progreso
  vive por completo en `journeyMap.js`. Sin cambios desde la revisión
  anterior de este documento.

## 13. Próximos pasos

Fase 4 — Etapa 4.2 (Deep Space) está completa. Esperar autorización
explícita de Cristian para continuar con **Fase 5: Moon** — cerrando la
narrativa principal del viaje — siguiendo el mismo patrón arquitectónico
ya usado dos veces (nuevo límite `DEEP_SPACE_END` en `journeyMap.js`,
extensión de `journey-track`, extensión — no duplicación — de
`CameraRig` y de la escena de espacio ya existente).

## 14. Consolidación LAUVO (Fases 1-4.2) — auditoría y estado real

Cristian pidió una consolidación profunda (no repetir literalmente las
fases): comparar el estado real del proyecto contra la dirección de
marca LAUVO (nombre confirmado, ORB.02, identidad visual, sonido,
navegación, servicios, FAQ, contacto) y corregir lo incompleto,
priorizando explícitamente **el edificio** como innegociable en esta
misma ejecución ("HAZLAS AHORA", brief sección 28).

### Auditoría honesta contra el checklist del brief (sección 27/29)

**FASE 1 — FUNDACIÓN**
- ❌ → ✅ (parcial) Nombre: el proyecto no tenía "LAUVO" en ningún lugar
  visible (título de página, meta, marca en pantalla). Corregido en
  esta ejecución (ver más abajo) solo en los puntos seguros
  (título/meta/marca fija) — **no** se reescribió el copy del Hero
  (título "WE BUILD DIGITAL WORLDS.", subtítulo, CTAs), porque eso es
  una decisión de contenido/voz de marca que corresponde decidir
  contigo directamente, no inventarla dentro de una consolidación.
- ⚠️ Identidad de color: la paleta actual (ámbar de grúa, azul técnico,
  gris concreto, arcilla) **ya no es monocromática** — tiene color con
  intención (contraste frío/cálido documentado desde la Fase 2) — pero
  no incorpora todavía la paleta específica de ORB.02 (`#CBC9FF`
  lavanda, etc.) ni una exploración tipográfica del logotipo LA+UVO. No
  tocado en esta pasada — es una decisión de sistema de diseño que
  merece su propia revisión dedicada, no un cambio apresurado.
- ✅ Arquitectura del proyecto: modular, escalable, sin dependencias
  innecesarias — se mantiene igual, sin cambios estructurales grandes.

**FASE 2 — CONSTRUCCIÓN (el edificio)**
- ❌ → ✅ Geometría/composición: el edificio era un volumen único
  extruido sin un elemento que lo "agarrara" al suelo — se añadió un
  **podio** (base más ancha que el cuerpo de la torre), la composición
  clásica "podio + torre" que de inmediato lee como arquitectura
  diseñada, no como una caja extruida.
- ❌ → ✅ Materiales: la fachada de vidrio usaba `MeshStandardMaterial`
  plano — se subió a `MeshPhysicalMaterial` con `clearcoat`, dando un
  reflejo más "vidrio premium" con la misma iluminación existente, sin
  texturas ni assets nuevos.
- ❌ → ✅ **Elementos en wireframe** (las vigas de anillo del esqueleto y
  el cercado perimetral del sitio) — exactamente lo que el brief pide
  evitar explícitamente ("estética de demo de WebGL"). Reemplazados por
  geometría sólida e iluminada: las vigas ahora son un `InstancedMesh`
  de barras sólidas por piso, y el cercado son 4 paneles reales tipo
  valla (perímetro abierto, no una caja cerrada — una caja sólida sin
  wireframe habría tapado toda la construcción interior, un error que
  se detectó y corrigió antes de aplicarlo).
- ❌ → ✅ Profundidad/iluminación: se añadió una luz direccional fría de
  contorno (rim light) en el lado opuesto a la luz cálida de obra, para
  separar la silueta del edificio del cielo oscuro — antes dependía
  solo de la luz cálida del sitio.
- ⚠️ No implementado en esta pasada (ver sección 10 y más abajo):
  refinamiento adicional de proporciones de piso/fachada, mayor detalle
  arquitectónico (cornisas, retranqueos), reflejos de entorno reales
  (requeriría un env-map, que se evaluó y se descartó por depender de
  texturas externas — ver Decisiones técnicas).

**FASE 3 — EXPERIENCIA**
- ✅ Narrativa/transiciones/movimiento: intactas desde Fases 2-4.2, sin
  regresiones (verificado con build + revisión de imports).
- ❌ **ORB.02: no implementado.** Existe la ficha de referencia visual
  completa (aportada por Cristian) pero construir la entidad 3D
  (geometría, material translúcido, expresiones, comportamiento de
  seguimiento de cursor, apariciones en momentos clave) es un
  componente nuevo y sustancial que merece su propia iteración
  dedicada — implementarlo apresuradamente dentro de esta consolidación
  arriesgaría no respetar el diseño original que el propio brief pide
  cuidar explícitamente ("no modificar su forma, proporciones ni
  estilo"). Diferido, documentado como próximo paso.
- ❌ **Sonido: no implementado.** No existe ningún sistema de audio en
  el proyecto. Diferido — requiere decisiones de diseño sonoro
  (ambiente, efectos, control on/off) fuera del alcance de una
  consolidación de lo visual/estructural.

**FASE 4 — PRESENTACIÓN**
- ❌ **Menú: no existe.** No hay navegación a Inicio/Lo que
  hacemos/Cómo lo hacemos/Proyectos/Nosotros/FAQ/Hablemos. Se dejó
  preparado el punto de anclaje visual (`.brand-mark`, marca fija en la
  esquina superior izquierda visible durante todo el scroll) para que
  un menú futuro se integre ahí sin rehacer el layout.
- ❌ **Servicios, "no sé qué necesito", cómo trabajamos, proyectos,
  nosotros, FAQ, contacto: ninguno existe.** Todo esto es contenido
  comercial sustancial (copy, estructura de formulario, enlaces a
  redes) que en fases anteriores se pospuso explícitamente por
  instrucción directa de Cristian ("no agregues contenido comercial") y
  que este brief ahora autoriza — pero construir las 8 secciones
  comerciales completas con calidad real en una sola pasada, sin
  revisión intermedia, no es responsable dado el tamaño de la tarea. Se
  documenta como el trabajo principal de la siguiente autorización.
- ✅ Responsive/rendimiento: `lowDetail` sigue intacto y verificado; no
  se detectaron regresiones.

### Cambios realizados en esta consolidación

- `index.html` — título y meta description ahora dicen "LAUVO — From
  Idea to Beyond" en vez de "Studio — From Earth to the Moon".
- `src/components/layout/Layout.jsx` + `src/styles/global.css` —
  marca "LAUVO" fija (posición superior izquierda, `mix-blend-mode:
  difference` para legibilidad garantizada sobre cualquier fondo),
  visible durante todo el recorrido, no solo en el Hero.
- `src/scenes/skyscraper/Skeleton.jsx` — podio añadido; vigas de anillo
  convertidas de wireframe a `InstancedMesh` sólido; metalness/roughness
  de columnas y núcleo ajustados.
- `src/scenes/skyscraper/ConstructionSite.jsx` — cercado perimetral
  convertido de una caja wireframe a 4 paneles sólidos reales (fence
  abierto, no caja cerrada); luz direccional fría de contorno añadida.
- `src/scenes/skyscraper/Facade.jsx` — material del vidrio actualizado
  a `MeshPhysicalMaterial` con `clearcoat`.
- `PROJECT_STATE.md` — esta auditoría + sección 0 (identidad LAUVO).

### Explícitamente NO hecho en esta pasada (y por qué)

- Reescritura del copy del Hero / mensajes de marca — decisión de voz
  que corresponde a Cristian, no inventarla.
- ORB.02 en 3D — componente nuevo sustancial, merece su propia
  iteración con revisión intermedia.
- Sistema de color ampliado con la paleta de ORB.02 / exploración
  tipográfica LA+UVO — decisión de sistema de diseño, no un ajuste de
  una sola pasada.
- Menú de navegación real, secciones de Servicios/Proyectos/Nosotros/
  FAQ/Contacto, formulario, enlaces sociales, botón de WhatsApp —
  contenido comercial sustancial, ahora autorizado en principio pero
  demasiado grande para una sola ejecución responsable (el propio brief
  pide explícitamente no intentar terminar todo LAUVO de una vez).
- Sonido — sistema completo sin empezar, requiere su propio diseño.
- No se tocó `vite.config.js`, GitHub Pages, ni ninguna configuración
  de despliegue.

Build de producción verificado (`npx vite build`) ✅ sin errores tras
todos los cambios, 61 módulos (sin archivos nuevos — todo fueron
ediciones de componentes existentes). Sin imports rotos. Preview
respondiendo 200 OK.

## 15. Consolidación LAUVO — continuación: corrección de integración e edificios secundarios

Retomó exactamente donde quedó la ejecución anterior (podio, vigas
sólidas, cercado real, material de vidrio, branding). Se verificó
primero que todo eso siguiera guardado — estaba completo — y se procedió
con las prioridades pedidas: revisión técnica de la integración del
edificio y mejora discreta de los edificios secundarios.

### Problema real encontrado y corregido

Al añadir el podio en la ejecución anterior, **su desplazamiento
vertical nunca se propagó** a `Floors.jsx`, `Facade.jsx`, `Windows.jsx`,
`RooftopSystems.jsx`, `GhostOutline.jsx` ni `Crane.jsx` — todos seguían
posicionando el piso 0 en `y=0` mientras las columnas ahora arrancaban
sobre el podio (~y=0.85-1.4). Esto habría producido pisos/ventanas/
fachada flotando o desalineados respecto al esqueleto estructural real
— exactamente el tipo de "efecto añadido sin integrar correctamente"
que se pidió revisar.

**Corrección:** se centralizó `PODIUM_BASE_Y`, `PODIUM_HEIGHT` y un
nuevo `GROUND_OFFSET` (= `PODIUM_BASE_Y + PODIUM_HEIGHT` = 1.4) y
`TOTAL_HEIGHT` en `buildingConfig.js` — única fuente de verdad, sin
duplicar constantes en cada archivo (antes `Skeleton.jsx` tenía sus
propias copias locales). Se propagó `GROUND_OFFSET` a los 7 archivos
que posicionan algo por altura de piso o altura absoluta del edificio.
También se corrigió que la altura visible de columnas/núcleo llegara
exactamente hasta el remate real de los pisos (antes quedaban ~0.55
unidades cortas por el mismo desfase). Verificado con
`npx vite build` tras cada cambio — 61 módulos, sin errores, en ningún
punto del proceso.

### Edificios secundarios (`CityBlocks.jsx`)

Eran cajas con altura/ancho puramente aleatorios uniformes — se
ajustaron dos cosas discretas, sin agregar draw calls ni complejidad:
- Distribución de altura sesgada (`rand()*rand()`) hacia edificios
  bajos/medios con algunos altos como excepción — una silueta de skyline
  más orgánica en vez de aleatoriedad plana.
- La huella (ancho/profundidad) ahora correlaciona levemente con la
  altura, evitando edificios muy altos y absurdamente delgados
  ("palillos") que competirían mal visualmente con la torre principal.
- Metalness/roughness del material compartido ajustados ligeramente
  (0.1→0.18 / 0.85→0.78) para una respuesta especular sutil bajo la luz
  fría de la ciudad.

No se tocaron conteos, radios de campo, ni el sistema de dos capas
(cercana/lejana) — la ciudad sigue siendo tan simple como antes en
términos de costo, solo mejor compuesta.

### Verificación final de esta continuación

- `npx vite build` ✅ sin errores (61 módulos, mismo conteo — solo
  ediciones, ningún archivo nuevo).
- Sin imports rotos (verificado por búsqueda exhaustiva de rutas
  relativas).
- `GROUND_OFFSET` consistente en los 8 archivos que lo necesitan; sin
  constantes duplicadas (única definición en `buildingConfig.js`).
- `lowDetail` verificado intacto en `Facade`, `Windows`, `CityBlocks`.
- Servidor de preview: 200 OK.

### Pendiente

Nada del alcance de esta etapa. Sigue pendiente, sin tocar (correcto,
fuera de alcance de esta pasada): ORB.02 en 3D, menú, servicios, FAQ,
contacto, sistema de color ampliado con la paleta de ORB.02, sonido —
todo documentado en la sección 14 y sin iniciarse.

**Problema para revisar antes de continuar:** no hay verificación
visual directa en este entorno (sin navegador headless). El arreglo de
`GROUND_OFFSET` es matemáticamente correcto y verificado por revisión
de código línea por línea, pero recomiendo confirmarlo visualmente
(`npm run dev`) antes de dar esta etapa por completamente cerrada —
específicamente cómo se ve la unión entre el podio y el primer piso.

## 16. CHECKPOINT LAUVO 4.2 — corrección de identidad

Corrección solicitada por Cristian: la frase "LAUVO — FROM IDEA TO
BEYOND" había quedado documentada como si fuera un tagline aprobado.
No lo es. Se corrigió:

- `index.html` — título cambiado de "LAUVO — From Idea to Beyond" a
  simplemente **"LAUVO"**; meta description cambiada de "LAUVO — from
  idea to beyond. Digital experiences, sites and stores." a **"LAUVO —
  digital experiences, sites and stores."** (sin la frase).
- `PROJECT_STATE.md` — secciones 0 y 1 reescritas para dejar explícito
  que **LAUVO no tiene slogan oficial por ahora**, que "FROM IDEA TO
  BEYOND" no es una decisión de marca aprobada, y que la frase heredada
  "IF YOU CAN IMAGINE IT, WE CAN BUILD IT." (de la etapa "Studio",
  previa al nombre LAUVO) tampoco debe tratarse como tagline
  permanente. "Una buena idea merece una buena ejecución." se conserva
  únicamente como frase narrativa disponible para uso futuro dentro de
  la experiencia, no como slogan.
- Se revisó el resto del proyecto (código y documentación) buscando
  cualquier otra mención de estas frases o de "THE SKY IS NOT THE
  LIMIT" / "THE ONLY LIMIT IS THE IDEA" — no aparecen en ningún otro
  archivo.

**No se hizo ningún otro cambio.** No se tocó el edificio, los
materiales, la iluminación, los edificios secundarios, ORB.02, menú,
servicios, FAQ ni contacto. El estado del proyecto es exactamente el de
la consolidación 1-4.2 documentada en las secciones 14-15, con esta
única corrección de identidad aplicada encima.

Build de producción verificado tras la corrección: `npx vite build` ✅
sin errores.

**Este es el CHECKPOINT LAUVO 4.2** — punto de referencia antes de
sacar el proyecto de este entorno, subirlo a GitHub y hacer la primera
revisión visual real.
