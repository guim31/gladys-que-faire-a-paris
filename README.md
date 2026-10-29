# Que faire à Paris for Gladys Assistant

A [Gladys Assistant](https://gladysassistant.com) integration for the outings of **"Que faire à
Paris ?"**, the official agenda of the City of Paris, read from its open data portal: concerts,
shows, exhibitions, talks, workshops, walks. **No account, no key.**

Built on the model of
[Toulouse Agenda](https://github.com/guim31/gladys-toulouse-agenda) (same filters, triggers and
widget), with one device per zone.

## Features

- **One device per zone**: around the house located in Gladys (500 m to 5 km), the whole agenda, or
  any of the 20 arrondissements.
- For each zone: the number of events **today**, **this weekend** and **in the next 7 days**, and
  the **next event** (title, place, date).
- **Filters** for everything: themes, keywords, free events only, events for children, exhibitions
  and long runs included or not.
- **Widget** "Outings in Paris": the next events of your zones, with date, place, "Free" badge and a
  link to paris.fr.
- **Scene triggers**: "New event announced", "Event starting today" (every morning around 8).
- **Scene action** "What to do in Paris": this weekend (or tonight, tomorrow…) in one sentence,
  ready to send or to say.
- Texts in English, French, German and Spanish.

## Requirements

- Gladys Assistant **5.3.0** or later.
- Internet access from Gladys (opendata.paris.fr).
- For the "Around the house" zone: the house located in Gladys.

## Installation

In Gladys, **Integrations → Install from GitHub**, then enter
`https://github.com/guim31/gladys-que-faire-a-paris`. Choose your zones and filters, save, then add
the zones from the **Discover** tab. Full guide: [English](docs/en.md), [français](docs/fr.md),
[Deutsch](docs/de.md), [español](docs/es.md).

## How it works

- The agenda (about 3,300 events still to come) is downloaded from the
  [Opendatasoft API](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/) of the City of
  Paris **every 8 hours**: one export of the events not over yet, with only the fields used (about
  1.2 MB compressed). The API is free and needs no key; three requests a day stay far below its
  limits.
- Zones and filters are applied in the container, so one download serves every zone. The counts
  are computed again every 10 minutes, and only changes are sent to Gladys.
- The dates of the dataset are Paris wall-clock times carrying a wrong offset (`+02:00` in winter,
  `+00:00` on `date_start`): the integration reads them as Paris times.
- The ids already announced and the day of the last "Event starting today" are kept in
  `/data/state.json`, so a restart announces nothing twice.

## Limitations

- Only the events published in "Que faire à Paris ?"; a few are in the suburbs ("All of Paris"
  includes them).
- Events without coordinates are not counted around the house; events without a Paris postcode are
  in no arrondissement.
- Titles, places and descriptions stay in French. The widget shows 8 events at most (Gladys limit).

## Development

Node.js 22+, ESM, no build step, one runtime dependency:
[`@gladysassistant/integration-sdk`](https://github.com/GladysAssistant/integration-sdk-js).

```bash
npm install
npm test              # node --test, against the SDK's fake Gladys; no network
npm run lint
npm run format:check
npx -y github:GladysAssistant/integration-store --skip-image-check .   # store validator
```

```
index.js            SDK wiring (src/app.js registers the handlers)
src/app.js          every SDK handler, wired to the service
src/service.js      download cadence, zones, states, scene triggers
src/source.js       the export of the Paris open data portal -> events
src/filters.js      periods (tonight, weekend…), zones and filters
src/devices.js      zone devices and their states
src/themes.js       themes from the tags of the agenda
src/widgets.js      "Outings in Paris" widget
src/scenes.js       "What to do in Paris" scene action
src/messages.js     every text of the code, in four languages; src/time.js: Paris time
src/config.js       DEFAULT_CONFIG (mirrors the manifest) + normalization
src/store.js        /data/state.json
test/fixtures/      212 real events of the export, downloaded on 2026-10-29
```

To run it outside Gladys:

```bash
GLADYS_HOST_API_URL="http://localhost:1443" \
GLADYS_INTEGRATION_TOKEN="<token>" \
GLADYS_INTEGRATION_SELECTOR="que-faire-a-paris" \
DATA_DIR=./data \
npm start
```

Releases are made by the **Release** workflow (Actions → Release); never edit the versions by hand.
See [`CLAUDE.md`](CLAUDE.md) for the project rules.

## Credits

- Event data: City of Paris, "Que faire à Paris ?", under the
  [Open Database License (ODbL)](https://opendatacommons.org/licenses/odbl/). The test fixtures are
  an extract of this database and stay under the ODbL.
- Cover: the logo of the City of Paris, from
  [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Ville_de_Paris_logo.svg) (public domain,
  trademark of the City of Paris), drawn in white.
- There is no Home Assistant equivalent of this integration.

## Disclaimer

This project is not affiliated with, endorsed or sponsored by the City of Paris.

## License

Code under the [Apache License 2.0](LICENSE).
