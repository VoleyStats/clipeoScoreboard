# Publicar Clipeo Scoreboard en las tiendas

Todo lo necesario para App Store y Google Play: textos, capturas, gráficos y respuestas a los cuestionarios, en **español (`es`) e inglés (`en`)**. La app también está en los dos idiomas (sigue el idioma del dispositivo), así que las capturas en inglés muestran la interfaz en inglés.

`<idioma>` es `es` o `en`: sube cada carpeta en la localización correspondiente de la ficha.

| Qué | Dónde |
|---|---|
| Textos de la ficha (ES / EN) | [`listing-es.md`](listing-es.md), [`listing-en.md`](listing-en.md) |
| Capturas iPhone 6,3" (2622×1206) | `screenshots/<idioma>/ios-6.3/01.png` … `06.png` |
| Capturas iPhone 6,9" (2868×1320) | `screenshots/<idioma>/ios-6.9/01.png` … `06.png` |
| Capturas iPad 13" (2752×2064) | `screenshots/<idioma>/ipad-13/01.png` … `06.png` |
| Capturas móvil Android (1920×1080) | `screenshots/<idioma>/android-phone/01.png` … `06.png` |
| Vista previa de cada secuencia | `screenshots/<idioma>/<dispositivo>/panorama.png` (no se sube) |
| Capturas sueltas de la app (material) | `screenshots/raw/<idioma>/<dispositivo>/` |
| App Store: header de la ficha (3840×1646) | `graphics/<idioma>/app-store-header-3840x1646.png` |
| App Store: search result (3840×2560) | `graphics/<idioma>/app-store-search-3840x2560.png` |
| Imagen destacada Google Play (1024×500) | `graphics/<idioma>/play-feature-graphic-1024x500.png` |
| Icono Google Play (512×512) | `graphics/play-icon-512.png` (sin texto, común a los dos idiomas) |
| Política de privacidad | https://scoreboard.clipeostats.com/privacy (`?lang=es` / `?lang=en`; fuente: `public/privacy.html`) |

Las capturas son una **secuencia continua**: seis pantallas que juntas forman una sola imagen (una línea azul las une y baja en zigzag por cada unión). **Súbelas en orden, de `01` a `06`**, para que la secuencia se lea seguida en la tienda:

1. Todo el resultado, a pantalla completa
2. Toca para sumar. Desliza para corregir.
3. Tus propios modos de puntuación
4. Cada gesto hace lo que tú elijas
5. Tus equipos, tus colores
6. Cierre: logo · Gratis · Sin cuentas · Sin anuncios

Se regeneran con `npm run build:web && npm run store:assets` (equipos de ejemplo ficticios; requiere Playwright: `npm i --no-save playwright && npx playwright install chromium`). Los textos de cada idioma están en `LANGS`, dentro de `scripts/store-assets.cjs`.

### Header y search result (App Store, iOS / iPadOS 27)

Recursos creativos opcionales que el App Store muestra arriba de la ficha (header) y en los resultados de búsqueda. Medidas de Apple ([Creative assets specifications](https://developer.apple.com/help/app-store-connect/reference/app-information/creative-assets-specifications/)):

| Recurso | Tamaño | Zona segura | Contenido |
|---|---|---|---|
| Header | 3840×1646 (21:9), exacto | 1646×661 en (1097, 493) | El marcador partido en dos, como el icono, con un toque «+1» |
| Search result | 3840×2560 (3:2) | 2168×1030 en (836, 765) | «Marcador de voleibol / Toca para sumar…» y la app en uso |

- Lo importante va dentro de la zona segura; el resto es fondo, porque Apple recorta según el dispositivo y la orientación.
- PNG sin transparencia. Sin precios, URLs, ©, premios ni logos de otras plataformas ([buenas prácticas](https://developer.apple.com/app-store/asset-best-practices/)).
- Dónde: App Store Connect → la versión → *Product Page Information* → pestaña *Header and Search Results*. Sube la versión de cada idioma en su localización y revísalo con la vista previa de App Store Connect.
- Para comprobar la zona segura: `SAFE_AREA=1 npm run store:assets` la dibuja en rojo (**no subas esas imágenes**; vuelve a generarlas sin la variable).

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
| Nombre / subtítulo / palabras clave / descripción | [`listing-es.md`](listing-es.md) (español) y [`listing-en.md`](listing-en.md) (inglés: añade la localización *English (U.S.)*) |
| Capturas | iPhone: `screenshots/<idioma>/ios-6.3/` (2622×1206) o `ios-6.9/` (2868×1320), según el tamaño que pida App Store Connect; iPad: `screenshots/<idioma>/ipad-13/`. En orden |
| Header y search result | `graphics/<idioma>/app-store-header-3840x1646.png` y `app-store-search-3840x2560.png` |
| Categoría principal | Deportes |
| Categoría secundaria | Utilidades |
| URL de soporte | https://clipeostats.com/contact |
| URL de marketing | https://clipeostats.com |
| URL de política de privacidad | Español: https://scoreboard.clipeostats.com/privacy?lang=es · Inglés: https://scoreboard.clipeostats.com/privacy?lang=en |
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
| Imagen destacada | `graphics/<idioma>/play-feature-graphic-1024x500.png` |
| Capturas de teléfono | `screenshots/<idioma>/android-phone/01.png` … `06.png`, en orden |
| Capturas de tablet (opcional) | `screenshots/<idioma>/ipad-13/01.png` … `06.png` sirven también para tablet de 10" |
| Inglés | Añade la traducción *English (United States)* con [`listing-en.md`](listing-en.md) y los recursos de `en/` |
| Categoría | Deportes |
| Correo de contacto | hola@clipeostats.com |
| Sitio web | https://clipeostats.com |
| Política de privacidad | Español: https://scoreboard.clipeostats.com/privacy?lang=es · Inglés: https://scoreboard.clipeostats.com/privacy?lang=en |

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

- **La política de privacidad tiene que ser pública** en https://scoreboard.clipeostats.com/privacy. Requiere el dominio `scoreboard.clipeostats.com` en el proyecto de Vercel (Project → Settings → Domains) y su registro DNS (CNAME). Comprueba que se abre sin iniciar sesión: la protección de despliegues de Vercel no debe afectar al dominio de producción.
- Revisar las capturas tras probar en móvil real: se generan desde la versión web, que es la misma interfaz, pero sin barra de estado del sistema.
