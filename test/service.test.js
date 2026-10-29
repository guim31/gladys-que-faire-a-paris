// -----------------------------------------------------------------------------
// The integration at runtime, against the SDK's fake Gladys and the real
// export: the zones offered, the states (all of them when a zone is added),
// the reading cadence, the scene triggers, what /data keeps across restarts,
// and quiet logs.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { READ_EVERY_MS, TRIGGERS } from '../src/service.js';
import {
  FIXTURE_TIME,
  HOUR,
  captureLogs,
  create,
  createClock,
  createFetch,
  createWorld,
  featureId,
  tempData,
  tick,
} from './helpers/world.js';

const strip = (line) => line.text.replace(/^\[[^\]]+\] /, '');

/** A new event in the export: a copy of a real one, with a new id and a date to come. */
function announce(network, { id = '999001', zipcode = '75011', day = '2026-11-03' } = {}) {
  const sample = network.data.find((record) => record.address_zipcode === '75011');
  network.data.push({
    ...structuredClone(sample),
    id,
    title: `Nouveau concert ${id}`,
    address_zipcode: zipcode,
    qfap_tags: 'Concert',
    price_type: 'gratuit',
    occurrences: `${day}T20:00:00+02:00_${day}T22:00:00+02:00`,
    date_start: `${day}T20:00:00+00:00`,
    date_end: `${day}T22:00:00+00:00`,
  });
}

test('the zones chosen are offered, the house only when located', async (t) => {
  const world = await createWorld({ config: { zones: ['home', 'paris', '75004'] } });
  t.after(() => world.app.stop());
  assert.deepEqual(
    world.fake.discoveredDevices.map((d) => d.name),
    [
      'Que faire à Paris · Autour de la maison',
      'Que faire à Paris · Tout Paris',
      'Que faire à Paris · Paris 4e',
    ],
  );
  const unlocated = await createWorld({
    config: { zones: ['home', '75011'] },
    houses: [{ id: 'h', name: 'Maison', selector: 'maison', latitude: null, longitude: null }],
  });
  t.after(() => unlocated.app.stop());
  assert.deepEqual(
    unlocated.fake.discoveredDevices.map((d) => d.name),
    ['Que faire à Paris · Paris 11e'],
  );
  const report = (await unlocated.fake.action('status', {})).data.message;
  assert.match(report.fr, /maison n'est pas localisée/);
});

test('a zone added gets all its states at once, then only changes', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, 'Paris 11e');
  const state = (key) => world.fake.lastState(featureId(device, key));
  assert.equal(state('today'), 1);
  assert.equal(state('weekend'), 8);
  assert.equal(state('week'), 13);
  assert.equal(state('next_title'), 'Moïzo × Brinkert × Feather Aid @ La Mécanique Ondulatoire');
  assert.equal(state('next_place'), 'La Mécanique Ondulatoire, 8 Passage Thiéré, 75011 Paris');
  assert.equal(state('next_when'), 'demain, 18:30');
  assert.ok(device.should_poll === false && device.poll_frequency === undefined);
  // Filters change the counts, not the devices.
  await world.fake.configUpdated({ zones: ['home', '75011'], free_only: true });
  assert.ok(state('week') < 13);
});

test('the agenda is read three times a day, the counts move every hour without reading', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, 'Paris 11e');
  assert.equal(world.network.calls.length, 1);
  for (let i = 0; i < 24; i += 1) {
    await tick(world);
  }
  assert.equal(world.network.calls.length, 4, 'one reading every 8 hours');
  // A day later, "demain" became "aujourd'hui".
  assert.match(
    world.fake.lastState(featureId(device, 'next_when')),
    /^aujourd'hui|^demain|^\p{L}{3}\. /u,
  );
  assert.match(world.network.calls[0].headers['user-agent'], /gladys-que-faire-a-paris/);
});

test('new_event: a new event of a followed zone, with its filters and variables; none at first', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, 'Paris 11e');
  assert.deepEqual(world.fake.sceneEvents, [], 'the first reading is the reference');
  announce(world.network);
  announce(world.network, { id: '999002', zipcode: '75020' });
  await tick(world, READ_EVERY_MS / HOUR);
  const events = world.fake.sceneEvents.filter((e) => e.key === TRIGGERS.NEW_EVENT);
  assert.equal(events.length, 1, 'the 20th is not followed');
  assert.deepEqual(events[0].data, {
    ...events[0].data,
    zone: device.external_id,
    theme: 'music',
    free: 'yes',
    title: 'Nouveau concert 999001',
    date: 'mar. 3 nov., 20:00',
    start: '2026-11-03T19:00:00.000Z',
    zone_name: 'Que faire à Paris · Paris 11e',
    theme_label: 'Musique',
    price: 'Gratuit',
  });
});

test('event_today: once a day from 08:00, only events with a date starting that day', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  await create(world, 'Paris 11e');
  // Thursday 21:23: too late for today, too early for tomorrow.
  assert.equal(world.fake.sceneEvents.length, 0);
  for (let i = 0; i < 10; i += 1) {
    await tick(world);
  }
  assert.equal(world.fake.sceneEvents.length, 0, 'not at 07:23');
  // Friday 08:23: the first pass from 08:00 fires.
  await tick(world);
  const today = world.fake.sceneEvents.filter((e) => e.key === TRIGGERS.EVENT_TODAY);
  assert.ok(today.length > 0);
  for (const event of today) {
    assert.match(event.data.date, /^aujourd'hui/);
  }
  const fired = world.fake.sceneEvents.length;
  for (let i = 0; i < 10; i += 1) {
    await tick(world);
  }
  assert.equal(world.fake.sceneEvents.length, fired, 'once a day');
});

test('a restart announces nothing twice: /data keeps what was seen and fired', async (t) => {
  const dataDir = tempData(t);
  const network = createFetch();
  const clock = createClock(FIXTURE_TIME + 11 * HOUR); // Friday 08:23
  const device = {
    name: 'Paris 11e',
    external_id: null,
    params: [{ name: 'zone', value: '75011' }],
  };
  const first = await createWorld({ dataDir, network, clock });
  device.external_id = first.fake.discoveredDevices.find((d) => d.name.includes('11e')).external_id;
  await first.fake.deviceCreated(first.fake.discoveredDevices.find((d) => d.name.includes('11e')));
  await tick(first, 0);
  const today = first.fake.sceneEvents.filter((e) => e.key === TRIGGERS.EVENT_TODAY).length;
  assert.ok(today > 0);
  await first.app.stop();
  announce(network);
  const second = await createWorld({ dataDir, network, clock, devices: [device] });
  t.after(() => second.app.stop());
  const keys = second.fake.sceneEvents.map((e) => e.key);
  assert.deepEqual(keys, [TRIGGERS.NEW_EVENT], 'the new one only, today already done');
});

test('the agenda down: the known events kept, one warning, one line when back', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, 'Paris 11e');
  const lines = captureLogs(t, 'info');
  world.network.down = true;
  for (let i = 0; i < 12; i += 1) {
    await tick(world);
  }
  assert.ok(world.fake.lastState(featureId(device, 'week')) > 0);
  world.network.down = false;
  await tick(world);
  assert.deepEqual(lines.map(strip), [
    '[WARN] [que-faire-a-paris] Agenda unavailable: opendata.paris.fr: fetch failed',
    '[INFO] [que-faire-a-paris] Agenda back',
  ]);
});

test('a normal day writes nothing at info; the start is one line', async (t) => {
  const start = captureLogs(t, 'info');
  const world = await createWorld();
  t.after(() => world.app.stop());
  assert.deepEqual(start.map(strip), [
    '[INFO] [que-faire-a-paris] Started: 2 zone(s) chosen, 0 zone(s) added',
  ]);
  await create(world, 'Paris 11e');
  const lines = captureLogs(t, 'info');
  for (let i = 0; i < 24; i += 1) {
    await tick(world);
  }
  assert.deepEqual(lines, []);
});

test('an empty export is a failure, not an agenda without events', async (t) => {
  const network = createFetch();
  network.data = [];
  const world = await createWorld({ network });
  t.after(() => world.app.stop());
  assert.equal(world.service.events, null);
  assert.equal(world.service.error, 'empty agenda');
});

test('an event missing from one export is not announced again when it comes back', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  await create(world, 'Paris 11e');
  const index = world.network.data.findIndex((record) => record.id === '34541');
  const [record] = world.network.data.splice(index, 1);
  await tick(world, READ_EVERY_MS / HOUR);
  world.network.data.push(record);
  await tick(world, READ_EVERY_MS / HOUR);
  const announced = world.fake.sceneEvents.filter((e) => e.key === TRIGGERS.NEW_EVENT);
  assert.deepEqual(announced, []);
});

test('around a house no longer located: zero and "none", not stale values', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const device = await create(world, 'maison');
  assert.ok(world.fake.lastState(featureId(device, 'week')) > 0);
  world.service.house = null;
  await tick(world);
  assert.equal(world.fake.lastState(featureId(device, 'week')), 0);
  assert.equal(world.fake.lastState(featureId(device, 'next_title')), 'Aucun');
});
