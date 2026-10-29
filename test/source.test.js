// -----------------------------------------------------------------------------
// The agenda as read from the real export of the Paris open data portal:
// dates read as Paris wall-clock times (the offsets of the dataset are
// wrong), places, prices, audiences, long runs, and the download errors.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { arrondissementOf, exportUrl, readAgenda, toEvent, wallClock } from '../src/source.js';
import { FIXTURE_TIME, createFetch, fixture } from './helpers/world.js';

const byId = (id) => toEvent(fixture().find((record) => record.id === id));

test('dates are Paris wall-clock times, whatever offset the dataset writes', () => {
  // 18:00 in Paris on 8 November (winter time, UTC+1) is 17:00 UTC.
  assert.equal(
    new Date(wallClock('2026-11-08T18:00:00+02:00')).toISOString(),
    '2026-11-08T17:00:00.000Z',
  );
  assert.equal(
    new Date(wallClock('2026-11-08T18:00:00+00:00')).toISOString(),
    '2026-11-08T17:00:00.000Z',
  );
  // Summer time, UTC+2.
  assert.equal(
    new Date(wallClock('2026-06-21T20:30:00+00:00')).toISOString(),
    '2026-06-21T18:30:00.000Z',
  );
  assert.ok(Number.isNaN(wallClock(null)));
  assert.ok(Number.isNaN(wallClock('soon')));
});

test('an event with several dates: its occurrences, sorted; place, price, theme, audience', () => {
  const event = byId('34541');
  assert.equal(event.title, 'Un parfum de Violette : votre café littéraire !');
  assert.equal(event.occurrences.length, 2);
  assert.equal(new Date(event.occurrences[0][0]).toISOString(), '2026-11-14T09:00:00.000Z');
  assert.equal(event.arrondissement, 11);
  assert.equal(event.free, true);
  assert.equal(event.conditional, false);
  assert.deepEqual(event.themes, ['talk']);
  assert.equal(event.kids, false);
  assert.equal(event.longRun, false);
  assert.match(event.url, /^https:\/\/www\.paris\.fr\/evenements\//);
});

test('a weekly class over months is a long run', () => {
  assert.equal(byId('81399').longRun, true);
});

test('every record of the real export becomes an event, the place sometimes unknown', () => {
  const events = fixture().map(toEvent);
  assert.equal(events.filter(Boolean).length, 212);
  assert.ok(events.every((event) => event === null || event.occurrences.length > 0));
  const unlocated = byId('125695');
  assert.equal(unlocated.lat, null);
  assert.equal(unlocated.arrondissement, null);
  assert.equal(byId('124395').arrondissement, 16);
  assert.ok(events.some((event) => event.kids));
  assert.ok(events.some((event) => event.conditional));
});

test('a date ending "before" it starts ends at midnight (seen in the dataset)', () => {
  const [[start, end]] = byId('125377').occurrences;
  assert.equal(new Date(start).toISOString(), '2026-11-07T12:30:00.000Z');
  assert.equal(new Date(end).toISOString(), '2026-11-07T23:00:00.000Z');
});

test('unusable records are dropped: no id, no title, no valid date', () => {
  const [record] = fixture();
  assert.equal(toEvent({ ...record, id: null }), null);
  assert.equal(toEvent({ ...record, title: ' ' }), null);
  assert.equal(toEvent({ ...record, occurrences: null, date_start: null, date_end: null }), null);
  assert.equal(toEvent({ ...record, occurrences: 'x_y', date_start: 'never' }), null);
  assert.equal(toEvent(null), null);
});

test('arrondissements from the postcode', () => {
  assert.equal(arrondissementOf('75001'), 1);
  assert.equal(arrondissementOf('75020'), 20);
  assert.equal(arrondissementOf('75116'), 16);
  assert.equal(arrondissementOf('75021'), null);
  assert.equal(arrondissementOf('92100'), null);
  assert.equal(arrondissementOf(null), null);
});

test('the export asks for the events not over by today, with a date, and the fields used', () => {
  const url = new URL(exportUrl('2026-10-29'));
  assert.equal(url.host, 'opendata.paris.fr');
  assert.equal(
    url.searchParams.get('where'),
    "date_end >= date'2026-10-29' and date_start is not null",
  );
  assert.match(url.searchParams.get('select'), /^id,title,lead_text,date_start/);
});

test('download errors say what happened, never more than the host', async () => {
  const network = createFetch();
  network.status = 503;
  await assert.rejects(
    readAgenda(network.fetch, FIXTURE_TIME),
    /^Error: opendata\.paris\.fr: HTTP 503$/,
  );
  network.status = null;
  network.down = true;
  await assert.rejects(
    readAgenda(network.fetch, FIXTURE_TIME),
    /opendata\.paris\.fr: fetch failed/,
  );
  const garbage = async () => new Response('<html>', { status: 200 });
  await assert.rejects(readAgenda(garbage, FIXTURE_TIME), /invalid JSON/);
  const object = async () => new Response('{"error":1}', { status: 200 });
  await assert.rejects(readAgenda(object, FIXTURE_TIME), /unexpected answer/);
});
