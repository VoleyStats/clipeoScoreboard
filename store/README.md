# Publicar Clipeo Scoreboard en las tiendas

Todo lo necesario para App Store y Google Play: textos, capturas, gráficos y respuestas a los cuestionarios.

| Qué | Dónde |
|---|---|
| Textos de la ficha (ES / EN) | [`listing-es.md`](listing-es.md), [`listing-en.md`](listing-en.md) |
| Capturas iPhone 6,9" (2868×1320 / 1320×2868) | `screenshots/ios-6.9/` |
| Capturas iPad 13" (2752×2064 / 2064×2752) | `screenshots/ipad-13/` |
| Capturas móvil Android (1920×1080 / 1080×1920) | `screenshots/android-phone/` |
| Imagen destacada Google Play (1024×500) | `graphics/play-feature-graphic-1024x500.png` |
| Icono Google Play (512×512) | `graphics/play-icon-512.png` |
| Política de privacidad | https://clipeo-scoreboard.vercel.app/privacy.html (fuente: `public/privacy.html`) |

Las capturas se regeneran con `npm run build:web && node scripts/store-assets.cjs` (usa equipos de ejemplo ficticios).

---

## 1. Antes de empezar

- [ ] Cuenta de **Expo** (gratis): https://expo.dev/signup
- [ ] **Apple Developer Program** (99 $/año): https://developer.apple.com/programs/
- [ ] **Google Play Console** (25 $ una vez): https://play.google.com/console/signup
- [ ] Confirmar el identificador **`com.voleystats.clipeoscoreboard`** (iOS y Android). No se puede cambiar después de publicar.
- [ ] La URL de la política de privacidad tiene que abrirse **sin iniciar sesión** (ver «Pendiente» al final).

## 2. Vincular el proyecto con Expo (una vez)

```bash
npx eas-cli@latest login
npx eas-cli@latest init        # añade el projectId a app.json; haz commit de ese cambio
```

## 3. Probar en móviles reales (antes de enviar)

```bash
# Android: genera un APK que se instala directamente
npx eas-cli@latest build -p android --profile preview

# iOS: registra tu iPhone y genera una build interna
npx eas-cli@latest device:create
npx eas-cli@latest build -p ios --profile preview
```

Comprobar: tocar / mantener / deslizar, sets, cambio de lado, ajustes, vibración, splash claro y oscuro, horizontal y vertical, y que la pantalla no se apaga.

Para desarrollar con recarga en vivo: `eas build --profile development` y después `npx expo start --dev-client`.

## 4. Builds de producción

```bash
npx eas-cli@latest build --platform all --profile production
```

EAS crea y guarda los certificados de Apple y la clave de firma de Android, y sube el número de build automáticamente.

## 5. Enviar

**iOS**

```bash
npx eas-cli@latest submit -p ios --latest
```

Después, en App Store Connect: completa la ficha (abajo), añade la build y envía a revisión.

**Android**

1. Crea la app en Play Console (nombre, idioma por defecto español, app gratuita).
2. La **primera** subida es manual: descarga el `.aab` de la build de producción desde expo.dev y súbelo a *Pruebas internas*.
3. Las siguientes: `npx eas-cli@latest submit -p android --latest` (necesita una clave de cuenta de servicio de Google; EAS te guía).
4. Si la cuenta de desarrollador es **personal** y nueva: prueba cerrada con al menos 12 testers durante 14 días antes de poder pasar a producción (las cuentas de organización no lo necesitan). Revisa el requisito vigente en Play Console.

---

## 6. App Store Connect: datos de la ficha

| Campo | Valor |
|---|---|
| Nombre / subtítulo / palabras clave / descripción | [`listing-es.md`](listing-es.md) (y [`listing-en.md`](listing-en.md) si añades inglés) |
| Categoría principal | Deportes |
| Categoría secundaria | Utilidades |
| URL de soporte | https://clipeostats.com/contact |
| URL de marketing | https://clipeostats.com |
| URL de política de privacidad | https://clipeo-scoreboard.vercel.app/privacy.html |
| Copyright | 2026 Clipeo |
| Precio | Gratis |
| Cifrado | Ya declarado en `app.json` (`usesNonExemptEncryption: false`): no hay que responder nada |

**Privacidad de la app (App Privacy):** «Datos no recopilados». La app no recoge ningún dato; todo se guarda en el dispositivo.

**Clasificación por edad:** responde «No» / «Ninguno» a todo (sin violencia, contenido sexual, apuestas, compras, chat ni acceso web sin restricciones). Resultado: **4+**.

**Notas para el revisor** (App Review Information → Notes):

```
No login required. The whole screen is the scoreboard:
- Tap a team's half to add a point; swipe down to subtract.
- Tap the circle next to a team name to add a set; swipe down on it to subtract.
- Long press a team's half for a "double point" (configurable).
- Bottom center: the pill selects the scoring mode (e.g. "3 in a row = 1"); the ••• button opens
  the menu (undo, reset points, new match, switch sides, settings).
- Settings: team names and colors, custom scoring modes, configurable gestures,
  automatic set/match end.
All data is stored locally on the device.
```

## 7. Google Play Console: datos de la ficha

| Campo | Valor |
|---|---|
| Título / descripción breve / completa | [`listing-es.md`](listing-es.md) |
| Icono | `graphics/play-icon-512.png` |
| Imagen destacada | `graphics/play-feature-graphic-1024x500.png` |
| Capturas de teléfono | `screenshots/android-phone/` (entre 2 y 8) |
| Capturas de tablet (opcional) | `screenshots/ipad-13/` sirven también para tablet de 10" |
| Categoría | Deportes |
| Correo de contacto | hola@clipeostats.com |
| Sitio web | https://clipeostats.com |
| Política de privacidad | https://clipeo-scoreboard.vercel.app/privacy.html |

**Contenido de la app (App content):**

| Sección | Respuesta |
|---|---|
| Acceso a la app | Toda la funcionalidad está disponible sin restricciones (sin inicio de sesión) |
| Anuncios | No contiene anuncios |
| Clasificación de contenido (IARC) | Categoría «Todas las demás apps» → «No» a todo. Resultado esperado: PEGI 3 / Para todos |
| Público objetivo | 13 años o más (recomendado: incluir menores de 13 obliga a cumplir la política de Familias) |
| Seguridad de los datos | ¿Recopila o comparte datos? **No**. (No hay datos que cifrar ni borrar) |
| App gubernamental / financiera / de salud | No |
| Noticias | No |

**Permisos que declara la app (Android):** solo `INTERNET` y `VIBRATE`. Los permisos de almacenamiento y de superposición que añaden algunas librerías están bloqueados en `app.json`.

---

## Pendiente

- **La política de privacidad tiene que ser pública.** El proyecto de Vercel tiene activada la protección de despliegues (pide iniciar sesión), así que los revisores de Apple y Google no podrían abrir la URL. Opciones: desactivar la protección en Vercel (Project → Settings → Deployment Protection) o publicar el contenido de `public/privacy.html` en clipeostats.com y usar esa URL.
- Revisar las capturas tras probar en móvil real: se generan desde la versión web, que es la misma interfaz, pero sin barra de estado del sistema.
