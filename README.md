# Gravity Shift — Evolved

Runner 3D de cuatro superficies basado en los archivos originales del proyecto. Conserva el cambio de gravedad, los personajes 3D, las 16 skins, el hangar interactivo, las semillas, el sonido, los ajustes y el guardado local V2.

## Mejoras

- Menú con jerarquía más clara y adaptación a móvil, orientación horizontal y zonas seguras.
- Cuenta atrás cancelable de tres segundos con instrucciones antes de cada partida.
- Avisos de peligro al aproximarse un obstáculo a la superficie seleccionada e indicador del control activo.
- Reto por partida: alcanzar 250 metros otorga 75 de energía una sola vez, también si se revive. Combos con feedback visual.
- Simulación con pasos de 1/120 s para detectar obstáculos finos a máxima velocidad incluso con fotogramas de 50 ms.
- Pausa automática al perder el foco o cambiar de pestaña; el tiempo pausado no mueve los obstáculos.
- Liberación de geometrías al reciclar obstáculos y de geometrías/materiales al cambiar de chasis. Geometría compartida para orbes.
- Validación de valores y personajes del guardado local. Conserva la clave original `GRAVITY_SHIFT_SAVE_V2` en el mismo origen.
- Exportación limpia: elimina canvases generados y devuelve la interfaz al menú antes de descargar el código.
- Foco de teclado visible, avisos accesibles y respeto a la preferencia de movimiento reducido en flashes y sacudidas.

## Ejecutar y editar

Requiere Node.js 22 o superior para compilar y ejecutar pruebas. El juego no necesita instalación de paquetes.

```sh
npm run check
```

Abre `index.html` o sirve la carpeta con un servidor estático. Para alojamiento publica `dist/`. Three.js r128 está incluido en `vendor/` bajo licencia MIT; Tailwind, Font Awesome y Google Fonts requieren conexión a sus CDN. El archivo descargado mediante la opción de exportación usa Three.js desde CDN.

Fuentes editables:

- `game.js`: motor, mundo, personajes e interacción.
- `styles.css`: estilos originales y mejoras visuales.
- `src/index.template.html`: interfaz de origen.
- `scripts/build.mjs`: genera `index.html` y `dist/` desde las fuentes, sin duplicación manual.
- `tests/game.test.cjs`: siete comprobaciones sobre guardado, recompensa, colisión a baja tasa de fotogramas, liberación de geometría, simulación, controles y pausa.

Después de editar, ejecuta `npm run build`. El botón de exportación del juego sigue ofreciendo HTML, CSS y JavaScript.

## Verificación y límites

Las pruebas ejercitan las clases reales del juego con las matemáticas de Three.js; no sustituyen una prueba WebGL en dispositivos. La comprobación visual de navegador no está disponible en este entorno. No se han compilado aplicaciones nativas ni publicado versiones en App Store o Google Play.

La integración de anuncios original se conserva: no se muestran anuncios reales sin un proveedor conectado. No se simulan ingresos ni se conceden skins de publicidad sin callback de recompensa.

El progreso se guarda únicamente en el navegador. Al probar en un dominio distinto no se transfiere automáticamente el guardado del dominio anterior.
