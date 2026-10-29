// -----------------------------------------------------------------------------
// Which events a zone shows: those of its place (around the house, an
// arrondissement, the whole agenda) that pass the filters of the
// configuration, and the windows of time the sensors, the widget and the
// scene action count in.
// -----------------------------------------------------------------------------

import { ALL_PARIS, HOME } from './config.js';
import { containsWords } from './text.js';
import { addDays, localParts, zonedInstant } from './time.js';

/** Period keys, stored in widget settings and scene actions: never rename. */
export const PERIODS = ['today', 'tonight', 'tomorrow', 'weekend', 'week', 'month'];

/** "Tonight" starts at 18:00 and ends at 05:00. */
const EVENING_HOUR = 18;
const NIGHT_END_HOUR = 5;

/**
 * The window of a period, read in Paris.
 * - today: from now to midnight;
 * - tonight: from 18:00 (or now, later) to 05:00 the next morning; after
 *   midnight, from now to 05:00;
 * - tomorrow: the whole next day;
 * - weekend: Friday 18:00 to Sunday midnight — the coming one from Monday to
 *   Thursday, the current one (from now) from Friday evening to Sunday;
 * - week: now and the next 6 days; month: now and the next 29 days.
 * @returns {{ from: number, to: number }}
 */
export function periodWindow(period, now) {
  const { date: today, weekday } = localParts(now);
  switch (period) {
    case 'today':
      return { from: now, to: zonedInstant(addDays(today, 1)) };
    case 'tonight':
      // After midnight, the night still running.
      if (localParts(now).hour < NIGHT_END_HOUR) {
        return { from: now, to: zonedInstant(today, NIGHT_END_HOUR) };
      }
      return {
        from: Math.max(now, zonedInstant(today, EVENING_HOUR)),
        to: zonedInstant(addDays(today, 1), NIGHT_END_HOUR),
      };
    case 'tomorrow':
      return { from: zonedInstant(addDays(today, 1)), to: zonedInstant(addDays(today, 2)) };
    case 'weekend': {
      const sunday = addDays(today, 7 - weekday);
      const friday = addDays(sunday, -2);
      return {
        from: Math.max(now, zonedInstant(friday, EVENING_HOUR)),
        to: zonedInstant(addDays(sunday, 1)),
      };
    }
    case 'month':
      return { from: now, to: zonedInstant(addDays(today, 30)) };
    case 'week':
    default:
      return { from: now, to: zonedInstant(addDays(today, 7)) };
  }
}

/** Distance in metres between two points (equirectangular: a few km at most). */
export function distance(lat1, lon1, lat2, lon2) {
  const rad = Math.PI / 180;
  const x = (lon2 - lon1) * rad * Math.cos(((lat1 + lat2) / 2) * rad);
  const y = (lat2 - lat1) * rad;
  return 6371000 * Math.hypot(x, y);
}

/**
 * True when an event is in a zone. `house`: { lat, lon } or null.
 * @param {string} zone a key of ZONES
 */
export function inZone(event, zone, { house, radius }) {
  if (zone === ALL_PARIS) {
    return true;
  }
  if (zone === HOME) {
    return (
      house !== null &&
      event.lat !== null &&
      distance(house.lat, house.lon, event.lat, event.lon) <= radius
    );
  }
  return event.arrondissement === Number(zone.slice(3));
}

/** True when an event passes the filters of the configuration (place and time aside). */
export function matches(event, config) {
  if (config.freeOnly && !event.free) {
    return false;
  }
  if (!config.ongoing && event.longRun) {
    return false;
  }
  if (config.audience === 'kids' && !event.kids) {
    return false;
  }
  if (config.themes.length > 0 && !config.themes.some((theme) => event.themes.includes(theme))) {
    return false;
  }
  if (
    config.keywords.length > 0 &&
    !config.keywords.some((keyword) => containsWords(event.search, keyword))
  ) {
    return false;
  }
  return true;
}

/** The dates of an event in a window: started before its end, not over at its start. */
export function datesIn(event, window) {
  return event.occurrences.filter(
    ([start, end]) => start < window.to && (end > window.from || start >= window.from),
  );
}

/**
 * The events of a window, each with its first date there and how many it
 * has there; soonest first, the dates already running at the start of the
 * window after those starting in it, the long runs last.
 * @param {object[]} events already matched to a zone
 * @returns {{ event: object, start: number, end: number, dates: number }[]}
 */
export function selectEvents(events, window) {
  const selected = [];
  for (const event of events) {
    const dates = datesIn(event, window);
    if (dates.length > 0) {
      const [start, end] = dates[0];
      selected.push({ event, start, end, dates: dates.length });
    }
  }
  return selected.sort(
    (a, b) =>
      Number(a.event.longRun) - Number(b.event.longRun) ||
      Number(a.start < window.from) - Number(b.start < window.from) ||
      Math.max(a.start, window.from) - Math.max(b.start, window.from) ||
      a.event.title.localeCompare(b.event.title, 'fr'),
  );
}

/** The next date to start (at `now` or later) among events: { event, start, end } or null. */
export function nextEvent(events, now) {
  let best = null;
  for (const event of events) {
    const slot = event.occurrences.find(([start]) => start >= now);
    if (
      slot &&
      (best === null ||
        slot[0] < best.start ||
        (slot[0] === best.start && event.title.localeCompare(best.event.title, 'fr') < 0))
    ) {
      best = { event, start: slot[0], end: slot[1] };
    }
  }
  return best;
}
