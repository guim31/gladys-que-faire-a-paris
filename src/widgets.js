// -----------------------------------------------------------------------------
// The "Upcoming events" widget: the next events of the followed zones (all of
// them, or the ones picked) in a period, soonest first: title, date and
// place, a "Free" badge (setting `show_price`); a tap opens the summary and
// the link to paris.fr.
//
// Budget of the core: an optional caption (setting `show_count`), one
// card-list of 8 rows at most (the core's cap for a list), and one body text
// only when there is something to explain.
// -----------------------------------------------------------------------------

import { WIDGET_COLORS } from '@gladysassistant/integration-sdk';
import { placeText } from './devices.js';
import { PERIODS, periodWindow, selectEvents } from './filters.js';
import { PERIOD_LABELS, TEXT, formatWhen, pick, priceText } from './messages.js';
import { WIDGET_KEY } from './service.js';
import { truncate } from './text.js';

export const DEFAULT_PERIOD = 'week';
/** Rows of a `list` card-list: the core's cap. */
export const MAX_ROWS = 8;
/** The dates are relative ("tomorrow"): re-pulled every quarter of an hour. */
const TTL_SECONDS = 900;

const chosenIds = (value) =>
  (Array.isArray(value) ? value : value ? [value] : []).map(String).filter(Boolean);

function row(selected, language, now, showPrice) {
  const text = pick(TEXT, language);
  const { event, dates } = selected;
  const when = formatWhen(selected, language, now);
  const more = dates > 1 ? ` (${text.more(dates - 1)})` : '';
  const place = placeText(event);
  const price = priceText(event, language);
  const item = {
    title: truncate(event.title, 60),
    subtitle: truncate([`${when}${more}`, event.venue].filter(Boolean).join(' · '), 60),
    description: truncate(
      [event.summary, text.dates(when), place && text.place(place), price]
        .filter(Boolean)
        .join('\n'),
      2000,
    ),
  };
  if (showPrice && event.free) {
    item.badge = {
      text: event.conditional ? text.conditional : text.free,
      color: WIDGET_COLORS.SUCCESS,
    };
  }
  if (event.url) {
    item.links = [{ url: event.url, label: text.eventPage }];
  }
  return item;
}

async function upcomingContent(service, { settings = {}, language = 'en' }) {
  await service.firstReading();
  const text = pick(TEXT, language);
  const message = (key, ttl = TTL_SECONDS) => ({
    version: 1,
    ttl_seconds: ttl,
    components: [{ type: 'text', variant: 'body', text: text[key] }],
  });
  const watched = service.watched();
  const chosen = chosenIds(settings.zones);
  const entries =
    chosen.length > 0 ? watched.filter((entry) => chosen.includes(entry.deviceId)) : watched;
  if (entries.length === 0) {
    return message(chosen.length > 0 ? 'gone' : 'pickZone');
  }
  if (service.events === null) {
    return message(service.error ? 'unavailable' : 'loading', 60);
  }
  const now = service.now();
  const period = PERIODS.includes(settings.period) ? settings.period : DEFAULT_PERIOD;
  const selected = selectEvents(
    service.eventsOf(entries.map((entry) => entry.zone)),
    periodWindow(period, now),
  );
  const components = [];
  if (settings.show_count !== false) {
    components.push({
      type: 'text',
      variant: 'caption',
      text: truncate(
        `${pick(PERIOD_LABELS, language)[period]} · ${text.count(selected.length)}`,
        80,
      ),
    });
  }
  if (selected.length > 0) {
    components.push({
      type: 'card-list',
      display: 'list',
      items: selected
        .slice(0, MAX_ROWS)
        .map((entry) => row(entry, language, now, settings.show_price !== false)),
    });
  } else {
    components.push({ type: 'text', variant: 'body', text: text.nothing });
  }
  if (service.error && selected.length > 0) {
    components.push({ type: 'text', variant: 'body', text: text.unavailable });
  }
  return { version: 1, ttl_seconds: TTL_SECONDS, components };
}

export const WIDGETS = {
  [WIDGET_KEY]: { get: upcomingContent },
};
