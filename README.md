# Gravity Shift — Evolved

Runner 3D de cuatro superficies con partidas rápidas, cambios perfectos y tres sectores. Mantiene el hangar, las 16 skins, las semillas y el progreso local del juego original.

## Jugar

- W / ↑: techo; S / ↓: suelo; A / ←: pared izquierda; D / →: pared derecha. En móvil, desliza o usa el pad.
- Sigue las monedas doradas y evita los obstáculos naranjas. Los avisos identifican la superficie de peligro y su salida segura.
- Cambiar desde una superficie amenazada entre 0,12 y 0,65 segundos antes de un obstáculo, hacia una superficie libre, concede un cambio perfecto: puntos, multiplicador, sonido y estela. Cada obstáculo puede puntuar una sola vez.
- El primer inicio incluye instrucciones y cuenta atrás; reintentar tras perder es inmediato. El resumen explica la colisión.

## Contenido

Tres secuencias de tres pasos (ascenso, contracurva y regreso) se combinan en un recorrido continuo. La apertura enseña el suelo, las paredes y el techo; cada fila conserva una ruta segura con monedas y separación para reaccionar. El inicio se mantiene reproducible y las secuencias posteriores se eligen con la semilla.

| Sector             | Entrada | Identidad                                                   |
| ------------------ | ------- | ----------------------------------------------------------- |
| Muelle industrial  | 0 m     | Guías cian y una superficie bloqueada por paso              |
| Núcleo del reactor | 250 m   | Luz ámbar, nueva línea musical y dos superficies bloqueadas |
| Sector fracturado  | 650 m   | Tonos violeta, paneles inclinados y bloques móviles         |

Cada sector cambia la iluminación progresivamente y tiene su línea musical. El menú muestra una partida automática independiente desde el interior del túnel. Sus monedas y esquives no afectan al progreso del jugador.

## Personajes y movimiento

Las 16 skins mantienen su identidad en cinco familias de siluetas. Los rigs tienen codos, rodillas y tobillos articulados. `human-motion.js` genera clips de carrera y transferencia a partir de una trayectoria de pie con cinemática inversa, los mezcla con AnimationMixer y añade un clip de amortiguación de aterrizaje. Son animaciones procedurales, no captura de movimiento ni clips de un proveedor externo.

Los cambios rápidos se almacenan durante la transición, la gravedad usa interpolación suave y la muerte muestra un tropiezo breve. La preferencia de movimiento reducido desactiva los efectos de pantalla y las sacudidas.

Además de comprar skins con energía, puedes desbloquearlas gratis:

| Hazaña en una partida     | Personaje |
| ------------------------- | --------- |
| Sobrevivir 60 segundos    | PHANTOM   |
| Hacer 5 cambios perfectos | VOLT      |
| Recoger 50 monedas        | FROST     |

Las hazañas se guardan y no descuentan energía. El objetivo de 250 m sigue concediendo +75 de energía una sola vez por partida.

## Continuación y anuncios

Puedes continuar una vez por partida pagando 50 de energía. Si hay un proveedor real conectado, también aparece la alternativa de ver un anuncio recompensado. No se interrumpe la partida con publicidad. La cancelación, indisponibilidad y callbacks repetidos no conceden recompensas; las respuestas antiguas no afectan a una nueva partida.

Esta entrega no lleva unidades publicitarias activas ni genera ingresos. Para activar anuncios hay que registrar el proveedor, configurar las unidades y el consentimiento correspondiente. El botón publicitario permanece oculto mientras no haya proveedor. Los anuncios de skins usan la misma frontera de integración.

## Desarrollo

Requiere Node.js 22 o superior:

```sh
npm ci
npm run check
npm run dev
```

La URL local es `http://localhost:4173`. Reconstruye y recarga después de editar. `npm run build` genera `dist/` para hosting estático. `npm run package` añade el ZIP de fuentes y requiere Python 3. GitHub Actions valida y adjunta la distribución en cada push/PR. Las herramientas de descarga están dentro de Ajustes.

Los módulos de `src/` y `styles.css` son la fuente de verdad. `index.html`, `game.js` y `dist/` se generan y se excluyen de Git. Three.js 0.128.0 y Tailwind se incluyen en la compilación; fuentes e iconos se descargan desde sus CDN. [Arquitectura y dependencias](docs/architecture.md).

## Estabilidad visual

Las recompensas de cambio perfecto se confirman después de resolver colisiones. Morir, pausar, volver al menú o reiniciar limpia sus mensajes, destellos y sonidos pendientes. La cámara usa la orientación actual del personaje, reinicia su pose al reintentar e interpola el giro sin pasar por un vector vertical nulo. Las sacudidas son suaves y amortiguadas.

El escudo inactivo no dibuja ni escribe profundidad. Las partículas no escriben profundidad y actualizan su visibilidad sin depender de límites geométricos obsoletos. Los materiales transparentes de los personajes no ocultan estos efectos. El cuerpo deja de deslizarse al terminar la animación de derrota.

## Verificación y límites

29 pruebas cubren guardado, economía, colisiones a 20 FPS, rutas seguras, cambios perfectos, sectores, hazañas, animaciones, recompensas publicitarias, reintento, continuación y límites de módulos. Los tests de aplicación usan un renderer de prueba: no sustituyen una revisión visual WebGL en navegador ni en dispositivos.

El progreso solo se guarda en localStorage, conservando `GRAVITY_SHIFT_SAVE_V2`. No hay backend, transferencia automática entre dominios ni clasificaciones remotas. La entrega es web; no contiene binarios firmados ni publicaciones en App Store o Google Play.
