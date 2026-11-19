import { getLocales } from 'expo-localization';
import { defaultConfig } from './logic';
import { STRINGS, pickLang } from './strings';

/**
 * Idioma de la app: se elige una vez al arrancar según las preferencias del dispositivo
 * (en iOS, al cambiar el idioma de la app en Ajustes el sistema la reinicia).
 */
export const lang = pickLang(getLocales().map((l) => l.languageCode));
export const t = STRINGS[lang];

/** Configuración por defecto con los nombres de equipos y modos en el idioma de la app. */
export const DEFAULTS = defaultConfig(lang);
