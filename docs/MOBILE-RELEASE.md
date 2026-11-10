# Web y aplicaciones móviles

El mismo código web se empaqueta con Capacitor 7 para `com.tronkstudios.gravityshift`.

## Probar

- Web: `npm ci && npm run dev`.
- Recursos sin conexión: instalar la web desde un navegador compatible y esperar a que Ajustes indique disponibilidad sin conexión.
- Android: descargar el APK de depuración del artefacto `gravity-shift-android-debug` en Actions. Permitir su instalación local. No es una versión firmada para Play Store.
- iOS: el artefacto `gravity-shift-ios-simulator` contiene una aplicación para el simulador de Xcode; no se puede instalar en un iPhone.
- Desarrollo nativo: `npm run build && npx cap sync`, después `npx cap open android` o `npx cap open ios`.

## Publicación pendiente

Faltan las cuentas de Apple Developer, Play Console y AdMob. No se han publicado fichas, firmado versiones comerciales ni activado ingresos. El identificador de paquete debe confirmarse antes de la primera publicación.

1. Registrar cuentas, nombre, soporte y titular de la política de privacidad.
2. Configurar firma en los gestores seguros de cada plataforma; nunca guardar claves o certificados en Git.
3. Crear fichas con capturas de dispositivos reales, clasificación por edades, declaraciones de datos y anuncios.
4. Probar inicio, pausa, gestos, cambio de superficie, suspensión, regreso, audio, consentimiento, anuncios y restauración de progreso en Android e iPhone físicos.
5. Revisar los requisitos vigentes de SDK, privacidad y facturación de cada tienda antes de enviar.

## Anuncios

El SDK nativo solo se inicializa al pulsar la opción de anuncios de prueba. Usa exclusivamente los IDs públicos de ejemplo de Google, incluidos los App IDs de los manifiestos. Los anuncios web siguen desactivados. Para monetizar habrá que integrar los IDs propios y validar el consentimiento en los países objetivo. No sustituir IDs por anuncios reales durante las pruebas.

## Arte y validación

El corredor usa una malla articulada y un clip de animación de Cesium (CC BY 4.0); ver `public/assets/characters/ATTRIBUTION.md`. No se afirma que sea captura de movimiento. La textura de marca original se reemplaza con materiales del juego.

Actions comprueba lógica, carga WebGL, cámara en cuatro superficies, independencia de esqueletos, material deformable, prioridad de derrota, modo offline y compilación nativa. Sus pruebas Pixel 7 son emulación, no mediciones de un teléfono real. Las capturas y los informes de rendimiento se conservan en `browser-qa`.

Las métricas locales son opcionales, se pueden exportar en Ajustes y no se envían a un servidor. Recoger sesiones de personas reales sigue siendo necesario para ajustar la dificultad con datos representativos.
