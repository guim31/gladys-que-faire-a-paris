// -----------------------------------------------------------------------------
// Periods (read in Paris), zones and the filters of the configuration.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeConfig } from '../src/config.js';
import { inZone, matches, nextEvent, periodWindow, selectEvents } from '../src/filters.js';
import { toEvent } from '../src/source.js';
import { FIXTURE_TIME, HOUSE, fixture } from './helpers/world.js';

const iso = (instant) => new Date(instant).toISOString();
const events = fixture().map(toEvent).filter(Boolean);
const config = (raw = {}) => normalizeConfig(raw);

test('a Thursday evening: the coming weekend, the 7 days, tonight', () => {
  // FIXTURE_TIME is Thursday 29 October 2026, 21:23 in Paris.
  const weekend = periodWindow('weekend', FIXTURE_TIME);
  assert.equal(iso(weekend.from), '2026-10-30T17:00:00.000Z'); // Friday 18:00
  // Sunday midnight, after the switch to winter time on Sunday morning.
  assert.equal(iso(weekend.to), '2026-11-01T23:00:00.000Z');
  const week = periodWindow('week', FIXTURE_TIME);
  assert.equal(week.from, FIXTURE_TIME);
  assert.equal(iso(week.to), '2026-11-04T23:00:00.000Z');
  const tonight = periodWindow('tonight', FIXTURE_TIME);
  assert.equal(tonight.from, FIXTURE_TIME);
  assert.equal(iso(tonight.to), '2026-10-30T04:00:00.000Z');
  assert.deepEqual(periodWindow('unknown', FIXTURE_TIME), week);
});

test('zones: around the house within the radius, an arrondissement, the whole agenda', () => {
  const house = { lat: HOUSE.latitude, lon: HOUSE.longitude };
  const near = events.filter((e) => inZone(e, 'home', { house, radius: 500 }));
  const far = events.filter((e) => inZone(e, 'home', { house, radius: 5000 }));
  assert.ok(near.length > 0 && far.length > near.length);
  assert.equal(events.filter((e) => inZone(e, 'home', { house: null, radius: 5000 })).length, 0);
  const eleventh = events.filter((e) => inZone(e, '75011', {}));
  assert.ok(eleventh.length > 100 && eleventh.every((e) => e.arrondissement === 11));
  assert.equal(events.filter((e) => inZone(e, 'paris', {})).length, events.length);
});

test('filters: free only, children, themes, keywords, long runs', () => {
  const count = (raw) => events.filter((e) => matches(e, config(raw))).length;
  const all = count({ ongoing: true });
  assert.ok(count({}) < all, 'long runs hidden by default');
  assert.ok(count({ ongoing: true, free_only: true }) < all);
  assert.ok(events.filter((e) => matches(e, config({ audience: 'kids' }))).every((e) => e.kids));
  const music = events.filter((e) => matches(e, config({ themes: ['music'] })));
  assert.ok(music.length > 0 && music.every((e) => e.themes.includes('music')));
  const jazz = events.filter((e) =>
    matches(e, config({ keywords: 'JAZZ, Bataclan', ongoing: true })),
  );
  assert.ok(jazz.length > 0 && jazz.every((e) => /jazz|bataclan/i.test(e.search)));
});

test('the events of a window start in it first, then those already running', () => {
  const window = periodWindow('week', FIXTURE_TIME);
  const selected = selectEvents(events, window);
  const running = selected.findIndex((entry) => entry.start < window.from);
  assert.ok(running > 0);
  for (const entry of selected.slice(running)) {
    assert.ok(entry.start < window.from || entry.event.longRun);
  }
  const starts = selected.slice(0, running).map((entry) => entry.start);
  assert.deepEqual(
    starts,
    [...starts].sort((a, b) => a - b),
  );
});

test('the next event is the next date to start, never one already running', () => {
  const next = nextEvent(events, FIXTURE_TIME);
  assert.ok(next.start >= FIXTURE_TIME);
  for (const event of events) {
    assert.ok(!event.occurrences.some(([start]) => start >= FIXTURE_TIME && start < next.start));
  }
  assert.equal(nextEvent([], FIXTURE_TIME), null);
});

test('the configuration tolerates strings, junk and missing values', () => {
  assert.deepEqual(config({ zones: '["75011","nowhere","home"]' }).zones, ['home', '75011']);
  assert.deepEqual(config({ zones: '75004,75001' }).zones, ['75001', '75004']);
  assert.deepEqual(config({}).zones, ['home']);
  assert.deepEqual(config({ zones: [] }).zones, []);
  assert.equal(config({ home_radius: '42' }).homeRadius, 2000);
  assert.equal(config({ free_only: 'true' }).freeOnly, true);
  assert.equal(config({ audience: 'cats' }).audience, 'all');
  assert.equal(config({ language: 'it' }).language, 'fr');
  assert.deepEqual(config({ themes: ['music', 'opera'] }).themes, ['music']);
  assert.deepEqual(config({ keywords: ' jazz ;; rock,jazz' }).keywords, ['jazz', 'rock']);
  assert.deepEqual(normalizeConfig(null).zones, ['home']);
});
