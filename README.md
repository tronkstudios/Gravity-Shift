# Gravity Shift — Evolved

Runner 3D de cuatro superficies con partidas rápidas, cambios perfectos y tres sectores. Mantiene el hangar, las 16 skins, las semillas y el progreso local del juego original.

## Jugar

- W / ↑: techo; S / ↓: suelo; A / ←: pared izquierda; D / →: pared derecha. En móvil, desliza o usa el pad.
- Sigue las monedas doradas y evita los obstáculos naranjas. Los avisos identifican la superficie de peligro y su salida segura.
- Cambiar desde una superficie amenazada entre 0,12 y 0,65 segundos antes de un obstáculo, hacia una superficie libre, concede un cambio perfecto: puntos, multiplicador, sonido y estela. Cada obstáculo puede puntuar una sola vez.
- El primer inicio incluye instrucciones y cuenta atrás; reintentar tras perder es inmediato. El resumen explica la colisión.

## Modos y controles

- **Normal:** conserva la economía, hazañas y récord general.
- **Aprender:** seis ejercicios sobre suelo, techo, paredes, desplazamiento lateral y cambio perfecto. Los errores repiten el ejercicio; no se gastan ni añaden monedas, no se desbloquean personajes y no se alteran récords.
- **Reto diario:** fecha y semilla comunes para todos, con cambio de día a las 00:00 de Europe/Madrid. El enlace `?daily=AAAA-MM-DD` permite repetir el mismo reto, también de días anteriores. Se guarda el mejor resultado local de hasta 32 fechas, separado del récord normal. No hay continuaciones ni recompensas de perfil y la duración de cambio se fija en 0,24 s para igualar las reglas.

El gesto móvil responde al superar 24 píxeles de desplazamiento, sin esperar a levantar el dedo, y emite una sola acción por gesto. Los botones Q/E proporcionan el ajuste lateral también en móvil. Al reanudar una pausa hay dos segundos de cuenta atrás durante los que la simulación permanece detenida; se puede cancelar para volver a pausa.

Los enlaces comparten la fecha del reto, no los permisos de acceso al alojamiento. Quien lo abra debe poder acceder al sitio. No hay clasificación online ni verificación remota de resultados.

## Contenido

Seis secuencias de tres pasos (ascenso, contracurva, regreso, zigzag, precisión e inversión) se combinan en un recorrido continuo. La apertura enseña el suelo, las paredes y el techo; cada fila conserva una ruta segura con monedas y separación para reaccionar. El inicio se mantiene reproducible y las secuencias posteriores se eligen con la semilla.

| Sector             | Entrada | Identidad                                                   |
| ------------------ | ------- | ----------------------------------------------------------- |
| Muelle industrial  | 0 m     | Guías cian y una superficie bloqueada por paso              |
| Núcleo del reactor | 250 m   | Luz ámbar, nueva línea musical y dos superficies bloqueadas |
| Sector fracturado  | 650 m   | Tonos violeta, paneles inclinados y bloques móviles         |

Después de cada tres secuencias hay un tramo de descanso sin obstáculos. Las monedas rosas valen ×3 en puntos y energía y se sitúan antes de un obstáculo: puedes asumir el riesgo para recogerlas y cambiar a la ruta segura, o seguir las monedas doradas normales.

Cada sector cambia la iluminación progresivamente y tiene su línea musical. El menú muestra una partida automática independiente desde el interior del túnel. Sus monedas y esquives no afectan al progreso del jugador.

## Personajes y movimiento

Las 16 skins conservan materiales y detalles propios sobre una malla humana articulada. El corredor usa el modelo y clip animado CesiumMan (Cesium, CC BY 4.0), con textura reemplazada, esqueletos independientes y accesorios que siguen sus huesos. Si el recurso falla se usa el rig procedural de reserva. No se afirma que el clip sea captura de movimiento. [Créditos](public/assets/characters/ATTRIBUTION.md).

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

Los módulos de `src/` y `styles.css` son la fuente de verdad. `index.html`, `game.js` y `dist/` se generan y se excluyen de Git. Three.js 0.128.0 y Tailwind se incluyen en la compilación; fuentes, iconos y modelo se incluyen localmente para funcionar sin CDN. [Arquitectura y dependencias](docs/architecture.md).

## Calidad y protección del progreso

En Ajustes puedes elegir **Automática**, **Alta** o **Rendimiento**. Automática reduce gradualmente resolución y partículas cuando la tasa de fotogramas es baja de forma sostenida y recupera calidad cuando vuelve a ser estable. Las opciones manuales se respetan; los perfiles existentes conservan su selección. Obstáculos y monedas usan pools limitados para reutilizar mallas y geometrías entre secuencias.

El estado del guardado se muestra en Ajustes y aparece un aviso si el navegador no puede guardar. **Exportar copia** descarga el progreso y los récords diarios en JSON. **Importar copia** valida formato, tamaño y campos antes de pedir confirmación para sustituir el perfil; cancelar o importar un archivo inválido mantiene el progreso actual. Borrar el progreso también pide confirmación. Si el almacenamiento está bloqueado, se conserva el perfil en memoria y se puede exportar.

## Estabilidad visual

Las recompensas de cambio perfecto se confirman después de resolver colisiones. Morir, pausar, volver al menú o reiniciar limpia sus mensajes, destellos y sonidos pendientes. La cámara usa la orientación actual del personaje, reinicia su pose al reintentar e interpola el giro sin pasar por un vector vertical nulo. Las sacudidas son suaves y amortiguadas.

El escudo inactivo no dibuja ni escribe profundidad. Las partículas no escriben profundidad y actualizan su visibilidad sin depender de límites geométricos obsoletos. Los materiales transparentes de los personajes no ocultan estos efectos. El cuerpo deja de deslizarse al terminar la animación de derrota.

## Verificación y límites

45 pruebas cubren guardado, economía, colisiones a 20 FPS, rutas seguras, cambios perfectos, sectores, hazañas, animaciones, recompensas publicitarias, reintento, continuación y límites de módulos. Los tests de aplicación usan un renderer de prueba: no sustituyen una revisión visual WebGL en navegador ni en dispositivos.

El progreso solo se guarda en localStorage, conservando `GRAVITY_SHIFT_SAVE_V2`. No hay backend, transferencia automática entre dominios ni clasificaciones remotas. La entrega es web; no contiene binarios firmados ni publicaciones en App Store o Google Play.

## Instalación, sonido y diagnóstico

La web incluye manifiesto e instalación PWA. Tras preparar la primera carga, conserva modelo, fuentes, iconos, reto y política de privacidad sin conexión. Las actualizaciones requieren pulsar el botón de Ajustes para recargar.

Hay pasos y aterrizajes sintetizados, vibración opcional y diagnóstico local exportable. El informe distingue tiempo de envío al renderer de latencia de pantalla; no sustituye una prueba en móvil real. No se transmiten las métricas.

[Compilaciones Android/iOS y publicación pendiente](docs/MOBILE-RELEASE.md). Actions genera APK de depuración y aplicación para simulador iOS. Los anuncios nativos usan IDs de prueba y se activan de forma voluntaria desde Ajustes; no producen ingresos.
