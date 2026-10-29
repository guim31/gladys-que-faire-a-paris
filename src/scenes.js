// -----------------------------------------------------------------------------
// Scene actions (manifest `scene_actions`, Gladys 5.1+).
//
// - outings_summary: what to do in a period (this weekend by default) in one
//   sentence ready for a message or a speaker ("Ce week-end : 34 événements,
//   dont Concert X (sam. 1 nov., 20:00, Le Trianon), Y (…) et 32 autres."),
//   with the number of events for a "Continue only if" step.
//
// A scene action does not receive the user's language: the sentence follows
// the `language` of the configuration. Outputs are numbers or strings, never
// booleans: the core's "Continue only if" compares with ===.
// -----------------------------------------------------------------------------

import { PERIODS, periodWindow, selectEvents } from './filters.js';
import { PERIOD_LABELS, TEXT, formatWhen, pick } from './messages.js';
import { truncate } from './text.js';

export class SceneError extends Error {}

export const SUMMARY_DEFAULTS = Object.freeze({ period: 'weekend', max_items: 3 });
export const SUMMARY_MAX_ITEMS = 10;
const MAX_SENTENCE = 1000;

const chosenIds = (value) =>
  (Array.isArray(value) ? value : value ? [value] : []).map(String).filter(Boolean);

function maxItems(value) {
  const number = Math.round(Number(value));
  if (value === '' || value === null || value === undefined || !Number.isFinite(number)) {
    return SUMMARY_DEFAULTS.max_items;
  }
  return Math.min(SUMMARY_MAX_ITEMS, Math.max(1, number));
}

/** "Title (sam. 1 nov., 20:00, Le Trianon)". */
function mention(selected, language, now) {
  const details = [formatWhen(selected, language, now), selected.event.venue]
    .filter(Boolean)
    .map((part) => truncate(part, 60));
  return `${truncate(selected.event.title, 90)} (${details.join(', ')})`;
}

export const SCENE_ACTIONS = {
  async outings_summary(service, { fields = {} }) {
    const language = service.config.language;
    const text = pick(TEXT, language);
    await service.firstReading();
    const watched = service.watched();
    if (watched.length === 0) {
      throw new SceneError(text.pickZone);
    }
    const asked = chosenIds(fields.zones);
    const chosen = asked.length > 0 ? watched.filter((e) => asked.includes(e.deviceId)) : watched;
    if (chosen.length === 0) {
      throw new SceneError(text.gone);
    }
    if (service.events === null) {
      throw new SceneError(text.noData);
    }
    const now = service.now();
    const period = PERIODS.includes(fields.period) ? fields.period : SUMMARY_DEFAULTS.period;
    const label = pick(PERIOD_LABELS, language)[period];
    const selected = selectEvents(
      service.eventsOf(chosen.map((entry) => entry.zone)),
      periodWindow(period, now),
    );
    if (selected.length === 0) {
      return { summary: text.summaryNone(label), count: 0, first_title: '', first_url: '' };
    }
    const shown = selected.slice(0, maxItems(fields.max_items));
    const parts = shown.map((entry) => mention(entry, language, now));
    const rest = selected.length - shown.length;
    if (rest > 0) {
      parts.push(text.others(rest));
    }
    const list =
      parts.length > 1 ? `${parts.slice(0, -1).join(', ')} ${text.and} ${parts.at(-1)}` : parts[0];
    return {
      summary: truncate(text.summarySome(label, selected.length, list), MAX_SENTENCE),
      count: selected.length,
      first_title: selected[0].event.title,
      first_url: selected[0].event.url ?? '',
    };
  },
};
