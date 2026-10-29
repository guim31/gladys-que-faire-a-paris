// -----------------------------------------------------------------------------
// The "Outings in Paris" widget (core vocabulary and budget, settings) and
// the "What to do in Paris" scene action (one sentence, outputs, errors).
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateWidgetContent } from '@gladysassistant/integration-sdk';
import { PERIODS } from '../src/filters.js';
import { MAX_ROWS } from '../src/widgets.js';
import { create, createFetch, createWorld } from './helpers/world.js';

test('every period, in the four languages, fits the core vocabulary and budget', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  await create(world, 'Paris 11e');
  await create(world, 'maison');
  for (const language of ['en', 'fr', 'de', 'es']) {
    for (const period of PERIODS) {
      const content = await world.widget({ period }, language);
      assert.deepEqual(validateWidgetContent(content), [], `${language} ${period}`);
      assert.ok(content.components.length <= 8);
      assert.ok(content.components.filter((c) => c.type === 'text').length <= 2);
      const list = content.components.find((c) => c.type === 'card-list');
      assert.ok(!list || list.items.length <= MAX_ROWS);
    }
  }
});

test('the rows: title, date and place, the "Free" badge, the link; settings hide blocks', async (t) => {
  const world = await createWorld({ config: { zones: ['75011'], free_only: true } });
  t.after(() => world.app.stop());
  const device = await create(world, 'Paris 11e');
  const content = await world.widget({ period: 'week', zones: [device.external_id] }, 'fr');
  const [caption, list] = content.components;
  assert.match(caption.text, /^7 prochains jours · \d+ événements?$/);
  for (const item of list.items) {
    assert.match(item.badge.text, /^Gratuit/);
    assert.match(item.links[0].url, /^https:\/\/www\.paris\.fr\//);
    assert.match(item.description, /Quand : /);
  }
  const bare = await world.widget({ show_count: false, show_price: false }, 'fr');
  assert.equal(bare.components[0].type, 'card-list');
  assert.ok(bare.components[0].items.every((item) => item.badge === undefined));
});

test('the widget explains itself: no zone, zone deleted, nothing found, agenda never read', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  assert.match((await world.widget({}, 'en')).components[0].text, /Add a zone/);
  const device = await create(world, 'Paris 11e');
  await world.fake.deviceDeleted(device);
  const gone = await world.widget({ zones: [device.external_id] }, 'en');
  assert.match(gone.components[0].text, /no longer in Gladys/);
  const network = createFetch();
  network.down = true;
  const down = await createWorld({ network, devices: [device] });
  t.after(() => down.app.stop());
  assert.match((await down.widget({}, 'en')).components[0].text, /cannot be downloaded/);
});

test('the summary: one sentence, the events counted, the outputs typed', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  await create(world, 'Paris 11e');
  const ack = await world.summary({ period: 'weekend', max_items: 2 });
  assert.equal(ack.success, true);
  const { summary, count, first_title, first_url } = ack.data.outputs;
  assert.equal(count, 8);
  assert.match(summary, /^Ce week-end : 8 événements, dont .+ et 6 autres\.$/);
  assert.equal(summary.split('\n').length, 1);
  assert.ok(first_title.length > 0);
  assert.match(first_url, /^https:\/\//);
  // No field at all: this weekend, three events named.
  const defaults = await world.summary({});
  assert.match(defaults.data.outputs.summary, /et 5 autres\.$/);
});

test('the summary fails clearly without a zone', async (t) => {
  const world = await createWorld();
  t.after(() => world.app.stop());
  const ack = await world.summary({});
  assert.equal(ack.success, false);
  assert.match(ack.error, /Ajoute d'abord une zone/);
});
