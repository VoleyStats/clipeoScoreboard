# Clipeo Scoreboard

Marcador de voleibol minimalista y multiplataforma (iOS, Android y Web) hecho con Expo / React Native.

La pantalla principal son solo los números, a pantalla completa. En horizontal los equipos se ven lado a lado; en vertical, uno encima de otro.

## Gestos

Cada gesto sobre el marcador de un equipo tiene una acción configurable (Ajustes → Gestos):

| Gesto | Por defecto | Acciones posibles |
|---|---|---|
| Tocar | Sumar (modo activo) | Sumar · cualquier modo de 1 jugada · Restar 1 · Deshacer · Nada |
| Mantener pulsado | Punto doble (+2) | ídem |
| Deslizar hacia abajo | Restar 1 | ídem |
| Deslizar hacia arriba | Nada | ídem |

- **Modo de 1 jugada** (p. ej. «Punto doble»): se aplica una vez sin cambiar el modo activo. Cuenta como una sola jugada: con modos de progreso («3 seguidas = 1») no suma progreso y sí rompe la racha del rival.
- **Deshacer**: revierte el último cambio, sea cual sea (punto, set, cambio de lado…). También está en el menú •••.
- El círculo de sets siempre suma al tocar y resta al deslizar hacia abajo.

Por qué gestos → acciones y no gestos dentro de cada modo: un modo define cuánto vale una jugada y un gesto cómo se marca; así restar y deshacer también son configurables, dos modos no compiten por el mismo gesto y todo se ajusta en un solo sitio. El doble toque se descartó porque obligaría a retrasar cada toque normal para distinguirlo.

Abajo en el centro:
- **Píldora de modo**: elige el modo de puntuación activo o crea uno nuevo (**+ Nuevo modo**).
- **•••**: fila de iconos:
  - ↶ **Deshacer** el último cambio.
  - ↻ **Reiniciar puntos**: suma 1 set al equipo que va ganando y pone los puntos a 0 (si hay empate, solo reinicia).
  - 🗑 **Nuevo partido**: puntos y sets a 0 (segundo toque para confirmar).
  - ⇄ **Cambiar lados**.
  - ⚙ **Ajustes** (popup).

## Modos de puntuación

Cada modo se define como «ganar **N** jugadas → sumar **M** puntos», con dos opciones:

- **Seguidas**: si el rival gana una jugada, se pierde el progreso.
- **Solo una vez**: tras sumar, vuelve a la jugada por defecto (útil para «este punto vale doble»).

Ejemplos incluidos (todos editables):

| Modo | N | M | Seguidas | Una vez |
|---|---|---|---|---|
| Normal (por defecto) | 1 | 1 | – | – |
| Punto doble | 1 | 2 | – | sí |
| 3 seguidas = 1 | 3 | 1 | sí | no |

Cuando N > 1, bajo el número aparecen puntos que muestran el progreso de cada equipo.

## Ajustes

- Nombre, color de fondo y color de texto de cada equipo: cualquier color (selector de tono / saturación / luz, código hex o colores rápidos).
- Modos de puntuación: editar, añadir y borrar.
- Mostrar/ocultar nombres y sets, vibración.
- **Final de set** (desactivado por defecto): al activarlo, el set se suma solo al llegar a los puntos elegidos (15 / 21 / 25 o cualquier otro) y, opcionalmente, con 2 de diferencia.
- **Final de partido** (desactivado por defecto): al activarlo se eligen los sets para ganar (al mejor de N), se marca el ganador con 🏆 y, si el final de set es automático, los puntos del set decisivo.

Todo se guarda en el dispositivo; la pantalla no se apaga mientras el marcador está abierto.

## Animaciones

Con [Reanimated](https://docs.swmansion.com/react-native-reanimated/) (iOS, Android y web con el mismo código; las animaciones corren en el hilo de UI y respetan el ajuste de «reducir movimiento» del sistema). Tokens en `src/motion.ts`.

- **Número**: rueda hacia arriba al sumar y hacia abajo al restar (`src/components/AnimatedNumber.tsx`).
- **Toque**: destello breve sobre la mitad del equipo.
- **Sets**: el círculo late al cambiar; los puntos de progreso se rellenan con un rebote.
- **Colores**: transición suave del color de fondo.
- **Cambio de lados**: las dos mitades se encogen como tarjetas y se cruzan en sentidos opuestos, una por encima de la otra.
- **Jugada especial**: «+2» flotante y destello más intenso al mantener pulsado.
- **Menús y ventanas**: entrada con un leve escalado; los iconos del menú, escalonados.

## Identidad visual

Colores y tipografías de [clipeostats.com](https://clipeostats.com) (`src/theme.ts`):

| Token | Color | Uso |
|---|---|---|
| ink-950 | `#070A12` | Fondo de menús y popups |
| card | `#0F1524` | Tarjetas |
| brand-500 | `#3D6BFF` | Botones primarios |
| brand-400 | `#6E93FF` | Enlaces / acciones secundarias |
| volt-400 | `#CBFB45` | Modo especial activo, selección |
| slate-200 / 400 | `#E2E8F0` / `#94A3B8` | Texto / texto secundario |

La paleta se aplica a la interfaz (menús, popups, botones); los colores de los equipos son libres.

Tipografías: **Space Grotesk** (números y títulos) e **Inter** (interfaz).

### Icono

El marcador partido en dos con la mitad del equipo que puntúa en azul. Fuentes SVG en `assets/brand/`.

| Recurso | Claro | Oscuro |
|---|---|---|
| Icono iOS (`ios.icon`) | `icon.png` | `icon-dark.png` (+ `icon-tinted.png`) |
| Icono Android adaptativo | `android-icon-foreground.png` sobre `#E1E1E1` | `android-icon-monochrome.png` (iconos temáticos) |
| Splash (`expo-splash-screen`) | `splash-icon.png` sobre `#E1E1E1` | `splash-icon-dark.png` sobre `#111919` |
| Web | `favicon.png` y logo en la pantalla de carga | logo oscuro si el sistema está en modo oscuro |

## Desarrollo

```bash
npm install
npm start          # Expo: abre en Expo Go (iOS/Android) o pulsa "w" para web
npm run web        # directamente en el navegador
npm test           # tests de la lógica del marcador
npm run typecheck
npm run build:web  # exporta la web estática a dist/ (y mueve las fuentes fuera de node_modules,
                   # que Vercel no sube)
```

Builds nativos para tiendas: `npx eas-cli@latest build -p ios|android`.

## Publicar en las tiendas

Guía paso a paso, textos de las fichas (ES/EN), capturas, gráficos y respuestas a los cuestionarios en [`store/README.md`](store/README.md).

- Builds y envío con EAS (`eas.json`): perfiles `development`, `preview` (APK / build interna) y `production`.
- Política de privacidad: `public/privacy.html`, publicada en `/privacy.html` junto a la web.
- Capturas: `npm run build:web && npm run store:assets` (requiere Playwright).

## Estructura

```
App.tsx                      pantalla principal
src/logic.ts                 reglas del marcador (funciones puras, testeadas)
src/types.ts                 tipos
src/storage.ts               persistencia (AsyncStorage)
src/useTapSwipe.ts           gesto tap / deslizar hacia abajo
src/components/TeamPanel.tsx mitad de pantalla de cada equipo
src/components/MainMenu.tsx   menú de iconos •••
src/theme.ts                 paleta y tipografías de Clipeo
src/components/RulePicker.tsx selector de modo
src/components/NewRuleModal.tsx popup para crear un modo
src/components/RuleEditor.tsx campos de un modo
src/components/SettingsModal.tsx popup de ajustes
src/components/Popup.tsx     ventana emergente reutilizable
tests/logic.test.ts          tests
```
