# Gravity Shift — Evolved

Runner 3D de cuatro superficies, basado en el juego original. Mantiene el hangar, las 16 skins, las semillas y el progreso local V2. Incluye cuenta atrás, avisos de peligro, reto de 250 metros, controles táctiles y correcciones de colisiones y memoria.

## Desarrollo

Node.js 22 o superior:

```sh
npm ci
npm run check
npm run dev
```

La URL local es `http://localhost:4173`. Después de editar fuentes, reconstruye y recarga. `npm run build` genera `dist/`, listo para hosting estático. `npm run package` añade un ZIP de las fuentes a la distribución; este último comando requiere Python 3. CI genera y adjunta la distribución en cada push/PR.

## Organización

```text
src/
  main.js             Arranque y error de inicialización
  app/                Coordinador y ciclo de partida
  game/               Gravedad, jugador, mundo y colisiones
  graphics/           Modelos, cámara y hangar
  ui/                 Presentación, HUD y entradas
  state/              Puntuación, economía y reto
  persistence/        Adaptador de guardado local
  services/           Audio y anuncios recompensados
  config/             Constantes y superficies
  data/               Catálogo de skins
scripts/              Compilación, servidor local y empaquetado
tests/               Pruebas de comportamiento e integración
docs/                Decisiones y límites de arquitectura
```

[Arquitectura y dependencias](docs/architecture.md). Los módulos ES son la fuente de verdad. `index.html`, `game.js` y `dist/` son resultados generados y no se editan ni versionan. Three.js está fijado en 0.128.0 por compatibilidad y se incluye en el bundle.

## Verificación

Diecisiete pruebas cubren guardado, recompensa única, colisiones con fotogramas de 50 ms, liberación de geometrías, tiempo de simulación, controles, pausa, composición de la aplicación y ausencia de ciclos entre módulos. La prueba de composición sustituye el renderer: no certifica el resultado visual de WebGL. Falta una revisión visual en navegador y en dispositivos.

## Datos, anuncios y móvil

Solo se guarda progreso en localStorage. El adaptador conserva la clave `GRAVITY_SHIFT_SAVE_V2` del juego original. No se transfieren partidas automáticamente entre dominios o dispositivos.

La integración publicitaria original se mantiene sin proveedor activo: no hay anuncios reales ni ingresos. Las skins de anuncios requieren callback de recompensa de un proveedor conectado.

Esta entrega es web. No contiene binarios nativos firmados ni publicaciones en App Store o Google Play. Las fuentes e iconos se descargan de sus CDN; el motor se sirve localmente.

## Menú autónomo

El menú incluye una demostración autónoma con cámara fija, lectura anticipada de obstáculos y cambios de superficie. `src/game/menu-director.js` controla solo la demostración, sin modificar puntuación ni energía. Las animaciones del personaje incluyen balanceo de carrera, pose aérea y transiciones suavizadas; los chasis conservan sus identidades con nuevos detalles luminosos.

El menú usa ahora `src/graphics/menu-stage.js`: un diorama 3D separado, con túnel abierto, cámara lateral fija e iluminación propia. No reutiliza el encuadre de la partida.

Los chasis incluyen ahora pivotes reales de codos, rodillas y tobillos, manos y pies. `RigAnimator` anima las articulaciones con flexión de recuperación, contrabalanceo de brazos y compresión de aterrizaje. Las monedas doradas conservan la economía original de energía. El piloto del menú recoge monedas, evita obstáculos y reinicia su partida al chocar; sus contadores son independientes del guardado del jugador.

Las direcciones rápidas se almacenan durante el cambio de superficie, con interpolación quintica y llegada sin salto. Los chasis incorporan cinco familias de siluetas (pesada, sigilo, carreras, celestial y técnica), armadura de hombros y rodillas, paneles pectorales y detalles animados. El piloto prioriza las cadenas de monedas con histéresis para evitar cambios de ruta innecesarios.

La carrera usa ahora una trayectoria de pie con apoyo y recuperación, resuelta mediante cinemática inversa de dos segmentos. Se corrigió el sentido de flexión de rodillas y codos y se redujeron el giro del tronco, la oscilación vertical y el rebote añadido durante los cambios de gravedad. No utiliza captura de movimiento.

La vista de menú vuelve al interior del túnel y a la perspectiva trasera de la partida a pantalla completa; se retira la maqueta lateral. La arquitectura del túnel comparte ahora luces de servicio cálidas, guías frías, ventilaciones y paneles. Los personajes tienen hombreras redondeadas y detalles dorsales para esta perspectiva.
