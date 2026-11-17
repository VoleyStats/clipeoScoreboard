# Clipeo Scoreboard

Marcador de voleibol minimalista y multiplataforma (iOS, Android y Web) hecho con Expo / React Native.

La pantalla principal son solo los números, a pantalla completa. En horizontal los equipos se ven lado a lado; en vertical, uno encima de otro.

## Gestos

| Dónde | Tap | Deslizar hacia abajo |
|---|---|---|
| Marcador de un equipo | Suma (según la jugada activa) | Resta 1 punto (o deshace progreso pendiente) |
| Círculo de sets | Suma 1 set (y reinicia los puntos, configurable) | Resta 1 set |

Abajo en el centro:
- **Píldora de modo**: elige el modo de puntuación activo o crea uno nuevo (**+ Nuevo modo**).
- **•••**: menú rápido:
  - **Reiniciar puntos**: suma 1 set al equipo que va ganando y pone los puntos a 0 (si hay empate, solo reinicia).
  - **Nuevo partido**: puntos y sets a 0 (pide confirmación).
  - **Cambiar lados**.
  - **Ajustes** (popup).

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

- Nombre, color de fondo y color de texto de cada equipo (paleta o código hex).
- Modos de puntuación: editar, añadir y borrar.
- Mostrar/ocultar nombres y sets, vibración.
- Fin de set automático (puntos por set, set decisivo, ganar por 2) y sets para ganar el partido.

Todo se guarda en el dispositivo; la pantalla no se apaga mientras el marcador está abierto.

## Desarrollo

```bash
npm install
npm start          # Expo: abre en Expo Go (iOS/Android) o pulsa "w" para web
npm run web        # directamente en el navegador
npm test           # tests de la lógica del marcador
npm run typecheck
npm run build:web  # exporta la web estática a dist/
```

Builds nativos para tiendas: `npx eas-cli@latest build -p ios|android`.

## Estructura

```
App.tsx                      pantalla principal
src/logic.ts                 reglas del marcador (funciones puras, testeadas)
src/types.ts                 tipos
src/storage.ts               persistencia (AsyncStorage)
src/useTapSwipe.ts           gesto tap / deslizar hacia abajo
src/components/TeamPanel.tsx mitad de pantalla de cada equipo
src/components/MainMenu.tsx   menú rápido •••
src/components/RulePicker.tsx selector de modo
src/components/NewRuleModal.tsx popup para crear un modo
src/components/RuleEditor.tsx campos de un modo
src/components/SettingsModal.tsx popup de ajustes
src/components/Popup.tsx     ventana emergente reutilizable
tests/logic.test.ts          tests
```
