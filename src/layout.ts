/**
 * Colocación del marcador según el espacio disponible.
 *
 * Todo se calcula a partir del tamaño de la ventana, la orientación y las zonas seguras
 * (muesca, Dynamic Island, barra de inicio), con una escala relativa a un iPhone estándar:
 *  - los controles (modo y menú) crecen en tablet y respetan la barra de inicio;
 *  - cada mitad reserva arriba su cabecera (nombre y sets) y abajo los controles o los puntos
 *    de progreso, y el número se centra en el espacio libre que queda;
 *  - los dos números tienen siempre el mismo tamaño.
 */
export interface Insets { top: number; bottom: number; left: number; right: number }

export interface ControlsLayout {
  height: number;
  bottom: number;
  gap: number;
  fontSize: number;
  gearWidth: number;
  iconSize: number;
  pillPadding: number;
}

export interface PanelLayout {
  width: number;
  height: number;
  /** Tamaño de las etiquetas (nombre) y base del círculo de sets */
  small: number;
  header: { top: number; left: number; right: number; height: number };
  /** Distancia desde abajo de la fila de puntos de progreso */
  dotsBottom: number;
  /** Espacio libre para el número (desde arriba del panel) */
  area: { top: number; height: number; left: number; width: number };
  /** Tamaño máximo de número que cabe en este panel */
  maxFont: number;
}

export interface ScoreboardLayout {
  landscape: boolean;
  scale: number;
  controls: ControlsLayout;
  /** Por posición en pantalla: 0 = izquierda / arriba, 1 = derecha / abajo */
  panels: [PanelLayout, PanelLayout];
  /** Tamaño común de los números */
  fontSize: number;
  lineHeight: number;
}

export const LINE_HEIGHT = 1.05;
const DIGIT_WIDTH = 0.62; // ancho de un dígito tabular de Space Grotesk, en em
/**
 * Alto visible de las cifras de Space Grotesk, en em (medido: 0,725). La línea de texto es más
 * alta (1,05 em) pero el espacio extra está vacío y repartido arriba y abajo, así que el número
 * se ajusta por el alto de la cifra, con un pequeño margen.
 */
export const GLYPH_HEIGHT = 0.725;
const GLYPH_FIT = 0.8;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function scoreboardLayout(opts: {
  width: number;
  height: number;
  insets?: Insets;
  showHeader: boolean;
  /** Dígitos del número más largo en pantalla (mínimo 2, el signo − cuenta como uno) */
  digits: number;
}): ScoreboardLayout {
  const { width, height, showHeader } = opts;
  const insets = opts.insets ?? { top: 0, bottom: 0, left: 0, right: 0 };
  const landscape = width >= height;
  const scale = clamp(Math.min(width, height) / 390, 0.85, 2);
  // Los controles crecen menos que el resto: en tablet bastan algo más grandes que en el móvil
  const cs = clamp(Math.min(width, height) / 390, 0.9, 1.4);

  const controls: ControlsLayout = {
    height: Math.round(32 * cs),
    bottom: Math.round(12 * cs + insets.bottom),
    gap: Math.round(10 * cs),
    fontSize: Math.round(13 * cs),
    gearWidth: Math.round(48 * cs),
    iconSize: Math.round(18 * cs),
    pillPadding: Math.round(14 * cs),
  };
  const controlsReserve = controls.bottom + controls.height + 10 * cs;

  const panelW = landscape ? width / 2 : width;
  const panelH = landscape ? height : height / 2;
  const small = Math.round(clamp(Math.min(panelW, panelH) * 0.06, 14, 30));
  const dotSize = small * 0.7;

  const panel = (slot: 0 | 1): PanelLayout => {
    // Qué bordes de la pantalla toca este panel (para las zonas seguras)
    const edge = {
      top: landscape || slot === 0 ? insets.top : 0,
      bottom: landscape || slot === 1 ? insets.bottom : 0,
      left: !landscape || slot === 0 ? insets.left : 0,
      right: !landscape || slot === 1 ? insets.right : 0,
    };
    const controlsBelow = landscape || slot === 1;

    const headerTop = edge.top + 12 * scale;
    const headerH = showHeader ? small * 2.4 : 0;
    const areaTop = headerTop + headerH + 8 * scale;

    // Puntos de progreso: en horizontal comparten franja con los controles (ellos van en el centro
    // de la pantalla y los puntos en el centro de cada mitad); en vertical van encima de ellos.
    let dotsBottom: number, areaBottom: number;
    if (landscape) {
      dotsBottom = controls.bottom + (controls.height - dotSize) / 2;
      areaBottom = controlsReserve;
    } else {
      dotsBottom = controlsBelow ? controlsReserve : edge.bottom + 14 * scale;
      areaBottom = dotsBottom + dotSize + 10 * scale;
    }

    const areaLeft = edge.left;
    const areaWidth = panelW - edge.left - edge.right;
    const areaHeight = Math.max(0, panelH - areaTop - areaBottom);

    const byHeight = areaHeight / GLYPH_FIT;
    const byWidth = (areaWidth * 0.88) / (Math.max(2, opts.digits) * DIGIT_WIDTH);

    return {
      width: panelW,
      height: panelH,
      small,
      header: { top: headerTop, left: edge.left + 16 * scale, right: edge.right + 16 * scale, height: headerH },
      dotsBottom,
      area: { top: areaTop, height: areaHeight, left: areaLeft, width: areaWidth },
      maxFont: Math.max(0, Math.min(byHeight, byWidth)),
    };
  };

  const panels: [PanelLayout, PanelLayout] = [panel(0), panel(1)];
  const fontSize = Math.floor(Math.min(panels[0].maxFont, panels[1].maxFont));
  return { landscape, scale, controls, panels, fontSize, lineHeight: fontSize * LINE_HEIGHT };
}

/** Dígitos que ocupa un marcador en pantalla (el signo menos cuenta como uno). */
export const digitsOf = (n: number) => String(Math.abs(n)).length + (n < 0 ? 1 : 0);
