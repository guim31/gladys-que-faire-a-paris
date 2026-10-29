// -----------------------------------------------------------------------------
// Every text the code produces, in the four languages of the Gladys interface.
// German says "du", Spanish "usted". The widget follows the language of the
// person looking at it; feature names, scene texts and the action report
// follow the `language` setting (Gladys does not tell them who reads). Event
// titles and places stay as the City of Paris wrote them, in French.
// -----------------------------------------------------------------------------

import { EVENT_TIME_ZONE, addDays, localParts } from './time.js';

export const LOCALES = { en: 'en-GB', fr: 'fr-FR', de: 'de-DE', es: 'es-ES' };

/** The language of a table, English when unknown. */
export function pick(table, language) {
  return table[language] ?? table.en;
}

/** The four languages of a text, for a multi-language message. */
export function allLanguages(render) {
  return Object.fromEntries(Object.keys(LOCALES).map((language) => [language, render(language)]));
}

/** Device and feature names (fixed when a device is added to Gladys). */
export const NAMES = {
  en: {
    device: 'Que faire à Paris',
    home: 'Around the house',
    paris: 'All of Paris',
    arrondissement: (n) => `Paris ${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`,
    today: 'Events today',
    weekend: 'Events this weekend',
    week: 'Events in the next 7 days',
    next_title: 'Next event',
    next_place: 'Place of the next event',
    next_when: 'Date of the next event',
  },
  fr: {
    device: 'Que faire à Paris',
    home: 'Autour de la maison',
    paris: 'Tout Paris',
    arrondissement: (n) => `Paris ${n}${n === 1 ? 'er' : 'e'}`,
    today: "Événements aujourd'hui",
    weekend: 'Événements ce week-end',
    week: 'Événements sur 7 jours',
    next_title: 'Prochain événement',
    next_place: 'Lieu du prochain événement',
    next_when: 'Date du prochain événement',
  },
  de: {
    device: 'Que faire à Paris',
    home: 'Rund ums Haus',
    paris: 'Ganz Paris',
    arrondissement: (n) => `Paris ${n}. Arr.`,
    today: 'Veranstaltungen heute',
    weekend: 'Veranstaltungen am Wochenende',
    week: 'Veranstaltungen in 7 Tagen',
    next_title: 'Nächste Veranstaltung',
    next_place: 'Ort der nächsten Veranstaltung',
    next_when: 'Datum der nächsten Veranstaltung',
  },
  es: {
    device: 'Que faire à Paris',
    home: 'Alrededor de la casa',
    paris: 'Todo París',
    arrondissement: (n) => `París distrito ${n}`,
    today: 'Eventos hoy',
    weekend: 'Eventos este fin de semana',
    week: 'Eventos en 7 días',
    next_title: 'Próximo evento',
    next_place: 'Lugar del próximo evento',
    next_when: 'Fecha del próximo evento',
  },
};

export const THEME_LABELS = {
  en: {
    music: 'Music',
    show: 'Show',
    exhibition: 'Exhibition',
    cinema: 'Cinema',
    talk: 'Talk',
    workshop: 'Workshop',
    outdoor: 'Outdoor walk',
    sport: 'Sport',
    festival: 'Festival',
  },
  fr: {
    music: 'Musique',
    show: 'Spectacle',
    exhibition: 'Exposition',
    cinema: 'Cinéma',
    talk: 'Conférence',
    workshop: 'Atelier',
    outdoor: 'Balade',
    sport: 'Sport',
    festival: 'Festival',
  },
  de: {
    music: 'Musik',
    show: 'Bühne',
    exhibition: 'Ausstellung',
    cinema: 'Kino',
    talk: 'Vortrag',
    workshop: 'Workshop',
    outdoor: 'Spaziergang',
    sport: 'Sport',
    festival: 'Festival',
  },
  es: {
    music: 'Música',
    show: 'Espectáculo',
    exhibition: 'Exposición',
    cinema: 'Cine',
    talk: 'Conferencia',
    workshop: 'Taller',
    outdoor: 'Paseo',
    sport: 'Deporte',
    festival: 'Festival',
  },
};

export const PERIOD_LABELS = {
  en: {
    today: 'Today',
    tonight: 'Tonight',
    tomorrow: 'Tomorrow',
    weekend: 'This weekend',
    week: 'Next 7 days',
    month: 'Next 30 days',
  },
  fr: {
    today: "Aujourd'hui",
    tonight: 'Ce soir',
    tomorrow: 'Demain',
    weekend: 'Ce week-end',
    week: '7 prochains jours',
    month: '30 prochains jours',
  },
  de: {
    today: 'Heute',
    tonight: 'Heute Abend',
    tomorrow: 'Morgen',
    weekend: 'Dieses Wochenende',
    week: 'Nächste 7 Tage',
    month: 'Nächste 30 Tage',
  },
  es: {
    today: 'Hoy',
    tonight: 'Esta noche',
    tomorrow: 'Mañana',
    weekend: 'Este fin de semana',
    week: 'Próximos 7 días',
    month: 'Próximos 30 días',
  },
};

export const TEXT = {
  en: {
    none: 'None',
    today: 'today',
    tomorrow: 'tomorrow',
    until: (date) => `until ${date}`,
    free: 'Free',
    conditional: 'Free (conditions)',
    paid: 'Paid',
    more: (n) => `+${n} date${n > 1 ? 's' : ''}`,
    count: (n) => `${n} event${n === 1 ? '' : 's'}`,
    loading: 'The agenda is being downloaded, back in a minute.',
    nothing: 'Nothing matches your filters in this period.',
    unavailable: 'The agenda cannot be downloaded right now: the last known events are shown.',
    noData: 'The agenda has not been downloaded yet.',
    pickZone: 'Add a zone to Gladys first (Devices tab of the integration).',
    gone: 'The zones chosen are no longer in Gladys.',
    eventPage: 'Event page',
    dates: (when) => `When: ${when}`,
    place: (place) => `Where: ${place}`,
    summaryNone: (period) => `${period}: nothing matches your filters.`,
    summarySome: (period, count, list) =>
      `${period}: ${count} event${count === 1 ? '' : 's'}${list ? `, including ${list}` : ''}.`,
    and: 'and',
    others: (n) => `${n} more`,
  },
  fr: {
    none: 'Aucun',
    today: "aujourd'hui",
    tomorrow: 'demain',
    until: (date) => `jusqu'au ${date}`,
    free: 'Gratuit',
    conditional: 'Gratuit sous condition',
    paid: 'Payant',
    more: (n) => `+${n} date${n > 1 ? 's' : ''}`,
    count: (n) => `${n} événement${n > 1 ? 's' : ''}`,
    loading: "L'agenda est en cours de téléchargement, retour dans une minute.",
    nothing: 'Rien ne correspond à tes filtres sur cette période.',
    unavailable:
      "L'agenda ne peut pas être téléchargé pour l'instant : les derniers événements connus sont affichés.",
    noData: "L'agenda n'a pas encore été téléchargé.",
    pickZone: "Ajoute d'abord une zone à Gladys (onglet Appareils de l'intégration).",
    gone: 'Les zones choisies ne sont plus dans Gladys.',
    eventPage: "Page de l'événement",
    dates: (when) => `Quand : ${when}`,
    place: (place) => `Où : ${place}`,
    summaryNone: (period) => `${period} : rien ne correspond à tes filtres.`,
    summarySome: (period, count, list) =>
      `${period} : ${count} événement${count > 1 ? 's' : ''}${list ? `, dont ${list}` : ''}.`,
    and: 'et',
    others: (n) => `${n} autre${n > 1 ? 's' : ''}`,
  },
  de: {
    none: 'Keine',
    today: 'heute',
    tomorrow: 'morgen',
    until: (date) => `bis ${date}`,
    free: 'Kostenlos',
    conditional: 'Kostenlos (Bedingungen)',
    paid: 'Kostenpflichtig',
    more: (n) => `+${n} Termin${n > 1 ? 'e' : ''}`,
    count: (n) => `${n} Veranstaltung${n === 1 ? '' : 'en'}`,
    loading: 'Die Agenda wird heruntergeladen, gleich geht es weiter.',
    nothing: 'In diesem Zeitraum passt nichts zu deinen Filtern.',
    unavailable:
      'Die Agenda kann gerade nicht heruntergeladen werden: die zuletzt bekannten Veranstaltungen werden gezeigt.',
    noData: 'Die Agenda wurde noch nicht heruntergeladen.',
    pickZone: 'Füge zuerst eine Zone zu Gladys hinzu (Reiter Geräte der Integration).',
    gone: 'Die gewählten Zonen sind nicht mehr in Gladys.',
    eventPage: 'Seite der Veranstaltung',
    dates: (when) => `Wann: ${when}`,
    place: (place) => `Wo: ${place}`,
    summaryNone: (period) => `${period}: nichts passt zu deinen Filtern.`,
    summarySome: (period, count, list) =>
      `${period}: ${count} Veranstaltung${count === 1 ? '' : 'en'}${list ? `, darunter ${list}` : ''}.`,
    and: 'und',
    others: (n) => `${n} weitere`,
  },
  es: {
    none: 'Ninguno',
    today: 'hoy',
    tomorrow: 'mañana',
    until: (date) => `hasta el ${date}`,
    free: 'Gratis',
    conditional: 'Gratis con condiciones',
    paid: 'De pago',
    more: (n) => `+${n} fecha${n > 1 ? 's' : ''}`,
    count: (n) => `${n} evento${n === 1 ? '' : 's'}`,
    loading: 'La agenda se está descargando, vuelva en un minuto.',
    nothing: 'Nada corresponde a sus filtros en este periodo.',
    unavailable:
      'La agenda no se puede descargar por ahora: se muestran los últimos eventos conocidos.',
    noData: 'La agenda aún no se ha descargado.',
    pickZone: 'Añada primero una zona a Gladys (pestaña Dispositivos de la integración).',
    gone: 'Las zonas elegidas ya no están en Gladys.',
    eventPage: 'Página del evento',
    dates: (when) => `Cuándo: ${when}`,
    place: (place) => `Dónde: ${place}`,
    summaryNone: (period) => `${period}: nada corresponde a sus filtros.`,
    summarySome: (period, count, list) =>
      `${period}: ${count} evento${count === 1 ? '' : 's'}${list ? `, entre ellos ${list}` : ''}.`,
    and: 'y',
    others: (n) => `${n} más`,
  },
};

/** The report of the "Check" configuration action. */
export const REPORTS = {
  en: {
    read: (count, hours) => `${count} upcoming events in the agenda, downloaded ${hours} h ago.`,
    waiting: 'The agenda has not been downloaded yet.',
    error: (error) => `Last download failed: ${error}.`,
    noHouse: 'The house is not located in Gladys: the "Around the house" zone is not offered.',
    zones: (offered, added) => `${offered} zone(s) offered in the Discover tab, ${added} added.`,
    zone: (name, today, week) => `${name}: ${today} today, ${week} in 7 days.`,
  },
  fr: {
    read: (count, hours) =>
      `${count} événements à venir dans l'agenda, téléchargé il y a ${hours} h.`,
    waiting: "L'agenda n'a pas encore été téléchargé.",
    error: (error) => `Échec du dernier téléchargement : ${error}.`,
    noHouse:
      "La maison n'est pas localisée dans Gladys : la zone « Autour de la maison » n'est pas proposée.",
    zones: (offered, added) =>
      `${offered} zone(s) proposée(s) dans l'onglet Découverte, ${added} ajoutée(s).`,
    zone: (name, today, week) => `${name} : ${today} aujourd'hui, ${week} sur 7 jours.`,
  },
  de: {
    read: (count, hours) =>
      `${count} kommende Veranstaltungen in der Agenda, vor ${hours} h heruntergeladen.`,
    waiting: 'Die Agenda wurde noch nicht heruntergeladen.',
    error: (error) => `Letzter Download fehlgeschlagen: ${error}.`,
    noHouse:
      'Das Haus ist in Gladys nicht verortet: die Zone „Rund ums Haus“ wird nicht angeboten.',
    zones: (offered, added) =>
      `${offered} Zone(n) im Reiter Entdecken angeboten, ${added} hinzugefügt.`,
    zone: (name, today, week) => `${name}: ${today} heute, ${week} in 7 Tagen.`,
  },
  es: {
    read: (count, hours) => `${count} eventos próximos en la agenda, descargada hace ${hours} h.`,
    waiting: 'La agenda aún no se ha descargado.',
    error: (error) => `Falló la última descarga: ${error}.`,
    noHouse: 'La casa no está ubicada en Gladys: no se ofrece la zona «Alrededor de la casa».',
    zones: (offered, added) =>
      `${offered} zona(s) ofrecida(s) en la pestaña Descubrir, ${added} añadida(s).`,
    zone: (name, today, week) => `${name}: ${today} hoy, ${week} en 7 días.`,
  },
};

export const INIT_FAILED = {
  en: 'The integration could not start: see its logs.',
  fr: "L'intégration n'a pas pu démarrer : voir ses journaux.",
  de: 'Die Integration konnte nicht starten: siehe ihre Protokolle.',
  es: 'La integración no pudo iniciarse: consulte sus registros.',
};

const formatters = new Map();

function formatter(language, options) {
  const key = `${language}:${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(LOCALES[language] ?? LOCALES.en, {
      timeZone: EVENT_TIME_ZONE,
      ...options,
    });
    formatters.set(key, cached);
  }
  return cached;
}

/** "18:00" (24-hour clock everywhere: the Gladys languages all use it). */
export function formatTime(instant, language) {
  return formatter(language, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    instant,
  );
}

/** "sam. 18 oct." */
export function formatDay(instant, language) {
  return formatter(language, { weekday: 'short', day: 'numeric', month: 'short' }).format(instant);
}

/**
 * When an event happens, as short as possible, read in Paris:
 * "aujourd'hui, 20:00", "demain, 18:30", "sam. 18 oct., 20:00", a day without
 * hour when the date starts at midnight, "jusqu'au 12 nov." for one already
 * running over several days, "sam. 1 nov. → dim. 2 nov." for one to come.
 */
export function formatWhen({ start, end }, language, now) {
  const text = pick(TEXT, language);
  const today = localParts(now).date;
  const startParts = localParts(start);
  const startDay = startParts.date;
  const lastDay = localParts(end).date;
  const allDay = startParts.hour === 0 && startParts.minute === 0;
  if (lastDay > startDay && (allDay || end - start > 20 * 60 * 60 * 1000)) {
    const endLabel = formatDay(end, language);
    return start <= now ? text.until(endLabel) : `${formatDay(start, language)} → ${endLabel}`;
  }
  let day;
  if (startDay === today) {
    day = text.today;
  } else if (startDay === addDays(today, 1)) {
    day = text.tomorrow;
  } else {
    day = formatDay(start, language);
  }
  return allDay ? day : `${day}, ${formatTime(start, language)}`;
}

/** The price of an event, in words; null when the agenda does not say. */
export function priceText(event, language) {
  const text = pick(TEXT, language);
  if (event.conditional) {
    return text.conditional;
  }
  return event.free ? text.free : event.paid ? text.paid : null;
}
