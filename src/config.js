// -----------------------------------------------------------------------------
// Integration configuration: defaults (they mirror the `default` values of the
// manifest `config_schema`, see test/manifest.test.js) and normalization, so
// the rest of the code never deals with strings, blanks or `undefined`.
// -----------------------------------------------------------------------------

import { THEMES } from './themes.js';
import { parseList } from './text.js';

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

/** The zone keys: around the house, the whole agenda, the 20 arrondissements. Never rename. */
export const HOME = 'home';
export const ALL_PARIS = 'paris';
export const ARRONDISSEMENTS = Array.from(
  { length: 20 },
  (_, index) => `750${String(index + 1).padStart(2, '0')}`,
);
export const ZONES = [HOME, ALL_PARIS, ...ARRONDISSEMENTS];

/** Radius of the "around the house" zone, in metres. */
export const HOME_RADII = ['500', '1000', '2000', '5000'];

/** Who the events are for: anyone, or children (tag "Enfants" or a children audience). */
export const AUDIENCES = ['all', 'kids'];

export const DEFAULT_CONFIG = {
  zones: [HOME],
  home_radius: '2000',
  themes: [],
  keywords: '',
  free_only: false,
  audience: 'all',
  ongoing: false,
  language: 'fr',
};

/** A multi_select value: an array from the form, tolerating a JSON or comma-separated string. */
export function listOf(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim());
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim());
      }
    } catch {
      // a comma-separated list
    }
    return value.split(',').map((item) => item.trim());
  }
  return [];
}

const bool = (value) => value === true || value === 'true';

/**
 * @param {Record<string, unknown>} raw the configuration returned by the SDK
 */
export function normalizeConfig(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const zones = source.zones === undefined ? DEFAULT_CONFIG.zones : listOf(source.zones);
  const themes = listOf(source.themes);
  const radius = HOME_RADII.includes(String(source.home_radius))
    ? String(source.home_radius)
    : DEFAULT_CONFIG.home_radius;
  return {
    zones: ZONES.filter((zone) => zones.includes(zone)),
    homeRadius: Number(radius),
    themes: THEMES.filter((theme) => themes.includes(theme)),
    keywords: parseList(source.keywords).slice(0, 20),
    freeOnly: bool(source.free_only),
    audience: AUDIENCES.includes(source.audience) ? source.audience : DEFAULT_CONFIG.audience,
    ongoing: bool(source.ongoing),
    language: LANGUAGES.includes(source.language) ? source.language : DEFAULT_CONFIG.language,
  };
}
