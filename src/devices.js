// -----------------------------------------------------------------------------
// The Gladys device of a zone (around the house, the whole agenda, or an
// arrondissement) and its states, for the events passing the filters of the
// configuration:
//   today       counter-sensor/integer   events still to come or running today
//   weekend     counter-sensor/integer   events of the weekend (Fri 18:00 → Sun)
//   week        counter-sensor/integer   events of the next 7 days
//   next_title  text/text                the next event to start
//   next_place  text/text                its place
//   next_when   text/text                its date ("sam. 1 nov., 20:00")
//
// Read-only, no polling: the integration reads the agenda on its own timer
// (src/service.js), Gladys never polls (`should_poll: false`).
// -----------------------------------------------------------------------------

import {
  DEVICE_FEATURE_CATEGORIES as C,
  DEVICE_FEATURE_TYPES as T,
} from '@gladysassistant/integration-sdk';
import { ALL_PARIS, HOME } from './config.js';
import { nextEvent, periodWindow, selectEvents } from './filters.js';
import { NAMES, TEXT, formatWhen, pick } from './messages.js';
import { truncate } from './text.js';

export const ZONE_TYPE = 'zone';
export const MAX_COUNT = 10000;
const MAX_TEXT = 200;

export const FEATURE_KEYS = ['today', 'weekend', 'week', 'next_title', 'next_place', 'next_when'];
const COUNTERS = ['today', 'weekend', 'week'];

/** The label of a zone: "Autour de la maison", "Tout Paris", "Paris 11e". */
export function zoneLabel(zone, language) {
  const names = pick(NAMES, language);
  if (zone === HOME || zone === ALL_PARIS) {
    return names[zone];
  }
  return names.arrondissement(Number(zone.slice(3)));
}

/** The name of a zone device: "Que faire à Paris · Paris 11e". */
export const zoneName = (zone, language) =>
  `${pick(NAMES, language).device} · ${zoneLabel(zone, language)}`;

/** The device of a zone. */
export function buildZoneDevice(gladys, zone, language) {
  const ids = gladys.externalIds(ZONE_TYPE, zone);
  const names = pick(NAMES, language);
  return {
    name: zoneName(zone, language),
    external_id: ids.device,
    should_poll: false,
    params: [{ name: 'zone', value: zone }],
    features: FEATURE_KEYS.map((key) => ({
      name: names[key],
      external_id: ids.feature(key),
      ...(COUNTERS.includes(key)
        ? { category: C.COUNTER_SENSOR, type: T.SENSOR.INTEGER, min: 0, max: MAX_COUNT }
        : { category: C.TEXT, type: T.TEXT.TEXT, min: 0, max: 0 }),
      read_only: true,
      has_feedback: false,
    })),
  };
}

/** The place of an event in one line: "Le Bataclan, 50 boulevard Voltaire, 75011 Paris". */
export const placeText = (event) => [event.venue, event.address].filter(Boolean).join(', ') || null;

/**
 * The states of a zone device.
 * @param {object[]} events the events of the zone (filters applied)
 */
export function zoneStates(gladys, zone, events, language, now) {
  const ids = gladys.externalIds(ZONE_TYPE, zone);
  const none = pick(TEXT, language).none;
  const count = (period) =>
    Math.min(MAX_COUNT, selectEvents(events, periodWindow(period, now)).length);
  const next = nextEvent(events, now);
  const values = {
    today: count('today'),
    weekend: count('weekend'),
    week: count('week'),
    next_title: next ? truncate(next.event.title, MAX_TEXT) : none,
    next_place: next ? truncate(placeText(next.event) ?? none, MAX_TEXT) : none,
    next_when: next ? formatWhen(next, language, now) : none,
  };
  return FEATURE_KEYS.map((key) =>
    typeof values[key] === 'string'
      ? { device_feature_external_id: ids.feature(key), text: values[key] }
      : { device_feature_external_id: ids.feature(key), state: values[key] },
  );
}
