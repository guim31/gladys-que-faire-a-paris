// -----------------------------------------------------------------------------
// The integration at runtime: the agenda, the zones offered in the Discover
// tab, the states of the zones added to Gladys, and the scene triggers.
//
// Data flow: the agenda is downloaded every 8 hours (three times a day at
// most; the City updates it once a day). Every hour, without reading
// anything, the counts are computed again against the clock and published
// when they change. A download bringing events never seen before fires
// `new_event`; the first pass after 08:00 (Paris) fires `event_today` for the
// events with a date starting that day. What was already announced is kept
// in /data, so a restart announces nothing twice.
// -----------------------------------------------------------------------------

import { createLogger } from '@gladysassistant/integration-sdk';
import { DEFAULT_CONFIG, HOME, ZONES, normalizeConfig } from './config.js';
import { ZONE_TYPE, buildZoneDevice, placeText, zoneStates } from './devices.js';
import { inZone, matches } from './filters.js';
import { REPORTS, THEME_LABELS, allLanguages, formatWhen, pick, priceText } from './messages.js';
import { readAgenda } from './source.js';
import { createStore } from './store.js';
import { truncate } from './text.js';
import { addDays, localParts, zonedInstant } from './time.js';

const logger = createLogger({ name: 'que-faire-a-paris' });

// The City updates the agenda once a day: three readings a day at most.
export const READ_EVERY_MS = 8 * 3600 * 1000;
// An hourly pass a little early still reads at the 8th hour.
const READ_MARGIN_MS = 5 * 60 * 1000;
// A failed reading is tried again after this, the known events kept.
export const RETRY_MS = 3600 * 1000;
// The agenda never read: tried again after this.
export const FIRST_RETRY_MS = 10 * 60 * 1000;
// The counts are computed again against the clock this often.
export const TICK_MS = 3600 * 1000;
// Unchanged states are sent again this often, or the dashboard shows "no
// recent value" after 48 hours.
export const HEARTBEAT_MS = 6 * 3600 * 1000;
// `event_today` fires at the first pass from this hour on (Paris).
export const TODAY_HOUR = 8;
// Trigger events fired in one pass, at most (the core takes 300 a minute).
export const MAX_EVENTS = 50;

export const TRIGGERS = { NEW_EVENT: 'new_event', EVENT_TODAY: 'event_today' };
export const WIDGET_KEY = 'upcoming_events';

export class Agenda {
  /**
   * @param {object} options
   * @param {object} options.gladys GladysIntegration (or the SDK's fake)
   * @param {typeof fetch} [options.fetch]
   * @param {() => number} [options.now]
   * @param {boolean} [options.timers] false in the tests: they call refresh()
   * @param {string} [options.dataDir] where the state is kept (/data)
   */
  constructor({ gladys, fetch = globalThis.fetch, now = Date.now, timers = true, dataDir }) {
    this.gladys = gladys;
    this.fetch = fetch;
    this.now = now;
    this.useTimers = timers;
    this.store = createStore(dataDir);
    this.config = normalizeConfig(DEFAULT_CONFIG);
    this.house = null; // { lat, lon } of the first located house
    this.houseError = false;
    this.events = null; // array, null before the first reading
    this.readAt = null;
    this.retryAt = null;
    this.error = null;
    this.discoveredSignature = null;
    this.publishFailed = false;
    this.discoveryFailed = false;
    this.fireFailed = false;
    this.timer = null;
    this.stopped = false;
    this.refreshing = null;
    this.loading = Promise.resolve();
  }

  // --- lifecycle --------------------------------------------------------------

  async start(config) {
    this.config = config;
    await this.store.load();
    await this.locate();
    this.schedule();
    logger.info(
      `Started: ${config.zones.length} zone(s) chosen, ${this.watched().length} zone(s) added`,
    );
    // The first reading in the background: the widget and the scene action
    // wait for it.
    this.loading = this.refresh({ discover: true });
  }

  /** Gladys restarted: everything again, the house and the states included. */
  async resync(config) {
    this.config = config;
    await this.locate();
    this.gladys.forgetPublishedStates?.();
    await this.refresh({ discover: true });
  }

  async reconfigure(config) {
    await this.refreshing;
    this.config = config;
    await this.locate();
    await this.refresh({ discover: true });
    this.refreshWidget();
  }

  async stop() {
    this.stopped = true;
    clearInterval(this.timer);
    await this.refreshing;
  }

  schedule() {
    if (!this.useTimers || this.stopped) {
      return;
    }
    clearInterval(this.timer);
    this.timer = setInterval(() => this.refresh(), TICK_MS);
    this.timer.unref?.();
  }

  /** The position of the house, for the "around the house" zone. */
  async locate() {
    if (!this.config.zones.includes(HOME) && !this.watched().some((e) => e.zone === HOME)) {
      this.house = null;
      return;
    }
    try {
      const houses = await this.gladys.getHouses();
      const located = (houses ?? []).find(
        (h) => Number.isFinite(h?.latitude) && Number.isFinite(h?.longitude),
      );
      this.house = located ? { lat: located.latitude, lon: located.longitude } : null;
      this.houseError = false;
    } catch (err) {
      if (!this.houseError) {
        logger.warn(`Cannot read the location of the house: ${err.message}`);
      }
      this.houseError = true;
    }
  }

  // --- zones ------------------------------------------------------------------

  /** The zones the configuration offers (the house only when located). */
  offeredZones() {
    return this.config.zones.filter((zone) => zone !== HOME || this.house);
  }

  /** The zone of a device created in Gladys, from its params. */
  zoneOfDevice(device) {
    const zone = device?.params?.find?.((p) => p.name === 'zone')?.value;
    return ZONES.includes(zone) ? zone : null;
  }

  /** The zones added to Gladys: `{ deviceId, name, zone }[]`. */
  watched() {
    return (this.gladys.devices ?? [])
      .map((device) => ({
        deviceId: device.external_id,
        name: device.name,
        zone: this.zoneOfDevice(device),
      }))
      .filter((entry) => entry.zone);
  }

  /** The events of a zone passing the filters; null before the first reading or when unknown. */
  zoneEvents(zone) {
    if (this.events === null || (zone === HOME && !this.house)) {
      return null;
    }
    const where = { house: this.house, radius: this.config.homeRadius };
    return this.events.filter((event) => inZone(event, zone, where) && matches(event, this.config));
  }

  /** The events of several zones, each once. */
  eventsOf(zones) {
    const seen = new Set();
    const events = [];
    for (const zone of zones) {
      for (const event of this.zoneEvents(zone) ?? []) {
        if (!seen.has(event.id)) {
          seen.add(event.id);
          events.push(event);
        }
      }
    }
    return events;
  }

  /** Waits for the first reading (at most `ms`), for a widget or a scene action asked at start. */
  async firstReading(ms = 10000) {
    let timer;
    await Promise.race([
      this.loading,
      new Promise((resolve) => {
        timer = setTimeout(resolve, ms);
      }),
    ]);
    clearTimeout(timer);
  }

  async publishDiscovered({ force = false } = {}) {
    const zones = new Set(this.offeredZones());
    // The zones already added stay listed, whatever the configuration.
    this.watched().forEach((entry) => zones.add(entry.zone));
    const list = ZONES.filter((zone) => zones.has(zone)).map((zone) =>
      buildZoneDevice(this.gladys, zone, this.config.language),
    );
    const signature = JSON.stringify(list.map((d) => [d.external_id, d.name, d.features]));
    if (!force && signature === this.discoveredSignature) {
      return;
    }
    try {
      await this.gladys.publishDiscoveredDevices(list);
      this.discoveredSignature = signature;
      if (this.discoveryFailed) {
        this.discoveryFailed = false;
        logger.info('Discovered zones published again');
      }
    } catch (err) {
      if (!this.discoveryFailed) {
        logger.warn(`Cannot publish the discovered zones: ${err.message}`);
      }
      this.discoveryFailed = true;
    }
  }

  async publish(states) {
    if (states.length === 0) {
      return;
    }
    try {
      await this.gladys.publishChangedStates(states, { heartbeat: HEARTBEAT_MS });
      if (this.publishFailed) {
        this.publishFailed = false;
        logger.info('States published again');
      }
    } catch (err) {
      if (!this.publishFailed) {
        logger.warn(`Cannot publish ${states.length} state(s): ${err.message}`);
      }
      this.publishFailed = true;
    }
  }

  /** A device was just added in Gladys: its states, all of them, now. */
  async onDeviceCreated(device) {
    const zone = this.zoneOfDevice(device);
    if (!zone) {
      return;
    }
    if (zone === HOME && !this.house) {
      await this.locate();
    }
    await this.refresh();
    const events = this.zoneEvents(zone);
    if (events) {
      // The SDK forgot what was published before the creation (dropped by Gladys).
      await this.publish(zoneStates(this.gladys, zone, events, this.config.language, this.now()));
    }
    this.refreshWidget();
  }

  refreshWidget() {
    this.gladys.requestWidgetRefresh?.(WIDGET_KEY)?.catch?.(() => {});
  }

  // --- refresh ------------------------------------------------------------------

  /** One pass: the reading when due, then the zones; concurrent calls share it. */
  refresh({ discover = false } = {}) {
    if (!this.refreshing) {
      this.refreshing = this.refreshAll(discover)
        .catch((err) => logger.warn(`Refresh failed: ${err.message}`))
        .finally(() => {
          this.refreshing = null;
        });
      return this.refreshing;
    }
    return discover ? this.refreshing.then(() => this.refresh({ discover })) : this.refreshing;
  }

  async refreshAll(forceDiscovery) {
    if (this.stopped) {
      return;
    }
    const fresh = await this.read();
    await this.publishDiscovered({ force: forceDiscovery });
    if (this.events === null) {
      return;
    }
    const now = this.now();
    const watched = this.watched();
    const states = [];
    for (const entry of watched) {
      const events = this.zoneEvents(entry.zone);
      if (events) {
        states.push(...zoneStates(this.gladys, entry.zone, events, this.config.language, now));
      }
    }
    await this.publish(states);
    const triggers = [...(fresh ? this.newEvents(watched) : []), ...this.todayEvents(watched)];
    if (triggers.length > MAX_EVENTS) {
      logger.debug(`${triggers.length} trigger events, only the first ${MAX_EVENTS} fired`);
    }
    for (const { key, data } of triggers.slice(0, MAX_EVENTS)) {
      await this.fire(key, data);
    }
    if (fresh) {
      this.refreshWidget();
    }
    await this.store.save();
  }

  /** Downloads the agenda when due; true when a new list was read. A failure keeps the known one. */
  async read() {
    const now = this.now();
    if (this.events && now - this.readAt < READ_EVERY_MS - READ_MARGIN_MS) {
      return false;
    }
    if (this.retryAt !== null && now < this.retryAt) {
      return false;
    }
    try {
      const events = await readAgenda(this.fetch, now);
      // An empty agenda (a renamed field, a dataset being reloaded) is a
      // failure, not a city without outings.
      if (events.length === 0) {
        throw new Error('empty agenda');
      }
      this.events = events;
      this.readAt = now;
      this.retryAt = null;
      logger.debug(`${events.length} events read`);
      if (this.error) {
        logger.info('Agenda back');
      }
      this.error = null;
      return true;
    } catch (err) {
      this.retryAt = now + (this.events ? RETRY_MS : FIRST_RETRY_MS);
      if (!this.error) {
        logger.warn(`Agenda unavailable: ${err.message}`);
      }
      this.error = err.message;
      return false;
    }
  }

  /** `new_event`: the events never seen before, per zone; the first reading ever is the reference. */
  newEvents(watched) {
    const known = this.store.get('seen');
    const ids = this.events.map((event) => event.id);
    this.store.set('seen', ids);
    if (!Array.isArray(known)) {
      return [];
    }
    const before = new Set(known);
    const fresh = new Set(ids.filter((id) => !before.has(id)));
    if (fresh.size === 0) {
      return [];
    }
    const now = this.now();
    const triggers = [];
    for (const entry of watched) {
      for (const event of this.zoneEvents(entry.zone) ?? []) {
        const slot = event.occurrences.find(([, end]) => end > now);
        if (fresh.has(event.id) && slot) {
          triggers.push({ key: TRIGGERS.NEW_EVENT, data: this.eventData(entry, event, slot) });
        }
      }
    }
    return triggers;
  }

  /** `event_today`: once a day from 08:00, the events with a date starting today. */
  todayEvents(watched) {
    const now = this.now();
    const { date: today, hour } = localParts(now);
    // Not consumed before a zone is added: added at 08:30, it still gets today's.
    if (hour < TODAY_HOUR || this.store.get('today') === today || watched.length === 0) {
      return [];
    }
    this.store.set('today', today);
    const from = zonedInstant(today);
    const to = zonedInstant(addDays(today, 1));
    const triggers = [];
    for (const entry of watched) {
      for (const event of this.zoneEvents(entry.zone) ?? []) {
        const slot = event.occurrences.find(
          ([start, end]) => start >= from && start < to && end > now,
        );
        // A long run (when shown at all) is news on its first day only.
        if (slot && (!event.longRun || event.occurrences[0][0] >= from)) {
          triggers.push({ key: TRIGGERS.EVENT_TODAY, data: this.eventData(entry, event, slot) });
        }
      }
    }
    return triggers;
  }

  /** The data of a scene event: the filter values, then the variables (strings). */
  eventData(entry, event, [start, end]) {
    const language = this.config.language;
    const theme = event.themes[0] ?? null;
    return {
      zone: entry.deviceId,
      theme,
      free: event.free ? 'yes' : 'no',
      zone_name: entry.name ?? '',
      title: event.title,
      date: formatWhen({ start, end }, language, this.now()),
      start: new Date(start).toISOString(),
      place: truncate(placeText(event) ?? '', 300),
      theme_label: theme ? pick(THEME_LABELS, language)[theme] : '',
      price: priceText(event, language) ?? '',
      summary: event.summary,
      // A scene event string holds 1000 characters at most.
      url: event.url && event.url.length <= 1000 ? event.url : '',
    };
  }

  async fire(key, data) {
    try {
      await this.gladys.publishSceneEvent(key, data);
      if (this.fireFailed) {
        this.fireFailed = false;
        logger.info('Scene triggers fired again');
      }
    } catch (err) {
      if (!this.fireFailed) {
        logger.warn(`Cannot fire the ${key} trigger: ${err.message}`);
      }
      this.fireFailed = true;
    }
  }

  // --- configuration action -----------------------------------------------------

  /** The "Check" action: the reading, the house, the zones, as one message. */
  async status() {
    await this.firstReading();
    const now = this.now();
    return allLanguages((language) => {
      const report = pick(REPORTS, language);
      const lines = [];
      lines.push(
        this.events === null
          ? report.waiting
          : report.read(this.events.length, Math.round((now - this.readAt) / 3600000)),
      );
      if (this.error) {
        lines.push(report.error(this.error));
      }
      if (this.config.zones.includes(HOME) && !this.house) {
        lines.push(report.noHouse);
      }
      const watched = this.watched();
      lines.push(report.zones(this.offeredZones().length, watched.length));
      for (const entry of watched.slice(0, 5)) {
        const states = zoneStates(
          this.gladys,
          entry.zone,
          this.zoneEvents(entry.zone) ?? [],
          language,
          now,
        );
        lines.push(report.zone(entry.name, states[0].state, states[2].state));
      }
      return lines.join('\n');
    });
  }
}

export { ZONE_TYPE };
