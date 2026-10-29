// -----------------------------------------------------------------------------
// A complete test world: the SDK's fake Gladys, a fake `fetch` serving a real
// answer of the Paris open data portal (212 events of the export captured on
// 2026-10-29 at 21:23 in Paris, see test/fixtures/que-faire-a-paris.json), a
// manual clock, a temporary /data, and the integration wired on top through
// registerHandlers. Nothing touches the network.
// -----------------------------------------------------------------------------

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import { registerHandlers } from '../../src/app.js';

process.env.LOG_LEVEL ??= 'silent';

export const fixture = () =>
  JSON.parse(readFileSync(new URL('../fixtures/que-faire-a-paris.json', import.meta.url), 'utf8'));

// 2026-10-29 20:23:30 UTC (21:23 in Paris, a Thursday), the time of the capture.
export const FIXTURE_TIME = 1793305410123;
export const HOUR = 3600 * 1000;

// A house near the Bastille, not a real address.
export const HOUSE = {
  id: 'h1',
  name: 'Maison',
  selector: 'maison',
  latitude: 48.8566,
  longitude: 2.3717,
};

/**
 * A fake `fetch`. `data` is the answer served (editable by the tests); `down`
 * makes it fail, `status` answers an HTTP error. Every call is recorded.
 */
export function createFetch() {
  const network = { data: fixture(), calls: [], down: false, status: null };
  network.fetch = async (url, init = {}) => {
    network.calls.push({ url, headers: init.headers ?? {} });
    if (new URL(url).host !== 'opendata.paris.fr') {
      return new Response('not found', { status: 404 });
    }
    if (network.down) {
      throw new TypeError('fetch failed');
    }
    if (network.status) {
      return new Response('error', { status: network.status });
    }
    return new Response(JSON.stringify(network.data), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
  return network;
}

/** A manual clock. */
export function createClock(start = FIXTURE_TIME) {
  const clock = {
    time: start,
    now: () => clock.time,
    advance(ms) {
      clock.time += ms;
    },
  };
  return clock;
}

/** A temporary /data, removed after the test. */
export function tempData(t) {
  const dir = mkdtempSync(join(tmpdir(), 'qfap-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/**
 * @param {object} [options]
 * @param {object} [options.config] raw integration config
 * @param {object} [options.network] from createFetch
 * @param {Array} [options.devices] devices already created in Gladys
 * @param {Array} [options.houses] houses of Gladys
 * @param {string} [options.dataDir] the /data of the integration
 * @param {boolean} [options.connect]
 */
export async function createWorld({
  config = { zones: ['home', '75011'] },
  network = createFetch(),
  devices = [],
  houses = [HOUSE],
  dataDir,
  connect = true,
  clock = createClock(),
} = {}) {
  const gladys = createFakeGladys({ config, devices, houses });
  const app = registerHandlers(gladys, {
    fetch: network.fetch,
    timers: false,
    now: clock.now,
    dataDir: dataDir ?? mkdtempSync(join(tmpdir(), 'qfap-')),
  });
  const world = {
    gladys,
    fake: gladys.fake,
    app,
    service: app.service,
    network,
    clock,
    async widget(settings = {}, language = 'fr') {
      const ack = await gladys.fake.widgetGet('upcoming_events', {
        settings,
        language,
        units: 'metric',
      });
      if (!ack.success) {
        throw new Error(ack.error);
      }
      return ack.data.content;
    },
    async summary(fields = {}) {
      return gladys.fake.sceneAction('outings_summary', fields);
    },
  };
  if (connect) {
    await gladys.connect();
    await app.ready;
    await app.service.loading;
  }
  return world;
}

/** The device published for a name part, from the last discovery list. */
export const discovered = (world, part) =>
  world.fake.discoveredDevices.find((d) => d.name.includes(part));

/** Create a discovered device in Gladys, as the user would. */
export async function create(world, part) {
  const device = discovered(world, part);
  if (!device) {
    throw new Error(`${part} is not in the discovered devices`);
  }
  await world.fake.deviceCreated(device);
  return device;
}

/** External id of one feature of a device. */
export const featureId = (device, key) =>
  device.features.find((feature) => feature.external_id.endsWith(`:${key}`))?.external_id;

/** One pass of the timer, `hours` later. */
export async function tick(world, hours = 1) {
  world.clock.advance(hours * HOUR);
  await world.service.refresh();
}

/** Captures what the integration logs, at a level. */
export function captureLogs(t, level = 'info') {
  const previous = process.env.LOG_LEVEL;
  process.env.LOG_LEVEL = level;
  const lines = [];
  const record = (...args) => {
    const text = args.map((arg) => (arg instanceof Error ? arg.message : String(arg))).join(' ');
    const match = /^\[[^\]]+\] \[(\w+)\]/.exec(text);
    lines.push({ level: match ? match[1].toLowerCase() : 'raw', text });
  };
  t.mock.method(console, 'log', record);
  t.mock.method(console, 'error', record);
  t.after(() => {
    process.env.LOG_LEVEL = previous;
  });
  return lines;
}
