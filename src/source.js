// -----------------------------------------------------------------------------
// The "Que faire à Paris ?" agenda of the City of Paris, from its open data
// portal (Opendatasoft API v2.1, no key, Open Database License): one export
// of the events still to come, with the fields the integration uses (about
// 3,300 events, 1.2 MB compressed), read three times a day at most.
//
// Pitfall of the dataset: the dates are Paris wall-clock times carrying a
// wrong offset ("+00:00" on date_start/date_end, "+02:00" in the occurrences,
// even in winter): "2026-11-08T18:00:00+02:00" is 18:00 in Paris. The offset
// is ignored, the wall-clock time read in Europe/Paris.
//
// `fetch` is injectable: the tests never touch the network.
// -----------------------------------------------------------------------------

import { themesOf } from './themes.js';
import { normalize, plainText, truncate } from './text.js';
import { localParts, zonedInstant } from './time.js';

export const DATASET_URL =
  'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/que-faire-a-paris-';
export const PAGE_URL = 'https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/';
export const USER_AGENT =
  'gladys-que-faire-a-paris (+https://github.com/guim31/gladys-que-faire-a-paris)';

const FIELDS = [
  'id',
  'title',
  'lead_text',
  'date_start',
  'date_end',
  'occurrences',
  'address_name',
  'address_street',
  'address_zipcode',
  'address_city',
  'lat_lon',
  'price_type',
  'qfap_tags',
  'audience',
  'url',
];

// The sandbox has 256 MB: the export is about 5 MB uncompressed.
const MAX_BYTES = 40e6;
const TIMEOUT_MS = 60000;

// An event with a date spanning more than this, or with more dates, is a
// "long run" (exhibition, weekly class): hidden unless the configuration includes them.
const LONG_RUN_DAYS = 14;
const LONG_RUN_DATES = 7;

/** The export URL: the events not over by `today` (a Paris date), with a date. */
export function exportUrl(today) {
  const params = new URLSearchParams({
    select: FIELDS.join(','),
    where: `date_end >= date'${today}' and date_start is not null`,
  });
  return `${DATASET_URL}/exports/json?${params}`;
}

/** "2026-11-08T18:00:00+02:00" → the instant of 18:00 in Paris that day; NaN when invalid. */
export function wallClock(value) {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value ?? '');
  if (!match) {
    return Number.NaN;
  }
  const [, date, hour, minute, second] = match;
  return zonedInstant(date, Number(hour), Number(minute)) + Number(second ?? 0) * 1000;
}

/**
 * One date: [start, end], or null when invalid. An end before the start is a
 * night ending at midnight written as the same day ("13:30 → 00:00", seen in
 * the dataset): the end moves to the next day, or to the start.
 */
function slotOf(startText, endText) {
  const start = wallClock(startText);
  let end = wallClock(endText);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }
  if (end < start) {
    end = end + 86400000 >= start ? end + 86400000 : start;
  }
  return [start, end];
}

/** "2026-11-08T18:00…_2026-11-08T20:00…;…" → [[start, end], …], sorted, valid ones only. */
function occurrencesOf(record) {
  const text = typeof record.occurrences === 'string' ? record.occurrences : '';
  const slots = text
    .split(';')
    .map((part) => slotOf(...part.split('_')))
    .filter(Boolean);
  if (slots.length === 0) {
    const slot = slotOf(record.date_start, record.date_end);
    if (slot) {
      slots.push(slot);
    }
  }
  return slots.sort((a, b) => a[0] - b[0]);
}

/** "75011" → 11, "75116" → 16; null outside Paris. */
export function arrondissementOf(zipcode) {
  const match = /^75(0\d\d|116)$/.exec(String(zipcode ?? '').trim());
  if (!match) {
    return null;
  }
  const number = match[1] === '116' ? 16 : Number(match[1]);
  return number >= 1 && number <= 20 ? number : null;
}

const KIDS = /enfant|tout-petit|tout petit/i;

/**
 * One record of the dataset as the integration sees it; null when unusable
 * (no id, no title, no valid date).
 */
export function toEvent(record) {
  const id = record?.id === undefined || record.id === null ? '' : String(record.id);
  const title = plainText(record?.title);
  const occurrences = occurrencesOf(record ?? {});
  if (!id || !title || occurrences.length === 0) {
    return null;
  }
  const tags = String(record.qfap_tags ?? '')
    .split(';')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const lat = Number(record.lat_lon?.lat);
  const lon = Number(record.lat_lon?.lon);
  const price = String(record.price_type ?? '').toLowerCase();
  const venue = plainText(record.address_name);
  const street = plainText(record.address_street);
  const zipcode = String(record.address_zipcode ?? '').trim();
  const city = plainText(record.address_city);
  const summary = truncate(plainText(record.lead_text), 500);
  return {
    id,
    title: truncate(title, 200),
    summary,
    venue,
    address: [street, [zipcode, city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    arrondissement: arrondissementOf(zipcode),
    lat: Number.isFinite(lat) && Number.isFinite(lon) ? lat : null,
    lon: Number.isFinite(lat) && Number.isFinite(lon) ? lon : null,
    free: price.startsWith('gratuit'),
    conditional: price === 'gratuit sous condition',
    paid: price === 'payant',
    tags,
    themes: themesOf(tags),
    kids: tags.includes('Enfants') || KIDS.test(String(record.audience ?? '')),
    url: /^https:\/\//.test(record.url ?? '') ? record.url : null,
    occurrences,
    longRun:
      occurrences.length > LONG_RUN_DATES ||
      occurrences.some(([start, end]) => end - start > LONG_RUN_DAYS * 86400000),
    // Title, venue, street and tags, normalized once: what keywords search.
    search: normalize([title, venue, street, ...tags].join(' ')),
  };
}

/** Reads a body within `maxBytes`. */
async function readCapped(response, maxBytes) {
  if (!response.body?.getReader) {
    return Buffer.from(await response.arrayBuffer());
  }
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.length;
    if (size > maxBytes) {
      await reader.cancel().catch(() => {});
      throw new Error('opendata.paris.fr: response too large');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

/**
 * Downloads the events still to come.
 * @param {typeof fetch} fetchImpl
 * @param {number} now
 * @returns {Promise<object[]>} the events (see toEvent), unusable records dropped
 */
export async function readAgenda(fetchImpl, now) {
  let response;
  try {
    response = await fetchImpl(exportUrl(localParts(now).date), {
      headers: { 'user-agent': USER_AGENT, accept: 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err?.name === 'TimeoutError' ? 'timeout' : (err?.cause?.code ?? err?.message);
    throw new Error(`opendata.paris.fr: ${reason}`, { cause: err });
  }
  if (!response.ok) {
    await response.body?.cancel?.().catch(() => {});
    throw new Error(`opendata.paris.fr: HTTP ${response.status}`);
  }
  let records;
  try {
    records = JSON.parse((await readCapped(response, MAX_BYTES)).toString('utf8'));
  } catch (err) {
    throw new Error(
      err.message.startsWith('opendata') ? err.message : 'opendata.paris.fr: invalid JSON',
      { cause: err },
    );
  }
  if (!Array.isArray(records)) {
    throw new Error('opendata.paris.fr: unexpected answer');
  }
  return records.map(toEvent).filter(Boolean);
}
