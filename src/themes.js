// -----------------------------------------------------------------------------
// Themes: the filter users think in ("a concert", "an exhibition"), mapped
// from the tags of the Paris agenda (`qfap_tags`, about 40 of them). An event
// can have several themes; the first one in THEMES order is its main theme
// (the one a scene filter sees). Tags without a theme (Loisirs, Solidarité…)
// still show when no theme is chosen.
//
// The keys are stored in the configuration and in scene filters: never rename.
// -----------------------------------------------------------------------------

import { normalize } from './text.js';

const TAGS = {
  music: ['Concert', 'Spectacle musical'],
  show: ['Théâtre', 'Danse', 'Cirque', 'Humour'],
  exhibition: ['Expo', 'Art contemporain', 'Peinture', 'Photo', 'Street-art', 'BD'],
  cinema: ['Ecrans'],
  talk: ['Conférence', 'Littérature', 'Histoire', 'Sciences', 'Innovation', 'Numérique'],
  workshop: ['Atelier'],
  outdoor: ['Balade urbaine', 'Nature'],
  sport: ['Sport'],
  festival: ['Festival', 'Nuit', 'Salon', 'Brocante', 'Gourmand'],
};

export const THEMES = Object.keys(TAGS);

const THEME_OF_TAG = new Map(
  Object.entries(TAGS).flatMap(([theme, tags]) => tags.map((tag) => [normalize(tag), theme])),
);

/** The themes of a list of tags, in THEMES order. */
export function themesOf(tags) {
  const found = new Set(tags.map((tag) => THEME_OF_TAG.get(normalize(tag))).filter(Boolean));
  return THEMES.filter((theme) => found.has(theme));
}
