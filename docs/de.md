# Que faire à Paris

Die **Ausgehtipps der offiziellen Agenda der Stadt Paris**, „Que faire à Paris ?“: Konzerte, Shows,
Ausstellungen, Vorträge, Workshops, Spaziergänge, für Kinder oder nicht, kostenlos oder nicht. Rund
um dein Haus, in den Arrondissements deiner Wahl oder in ganz Paris: wie viele Veranstaltungen
heute, am Wochenende und in den nächsten 7 Tagen, und die nächste. **Ohne Konto, ohne Schlüssel.**

Inoffizielle Integration, nicht mit der Stadt Paris verbunden. Nach dem Vorbild der Integration
Toulouse Agenda gebaut.

## Was du bekommst

- Ein **Gerät pro Zone**: rund um das in Gladys verortete Haus (500 m bis 5 km), die ganze Agenda
  oder jedes der 20 Arrondissements.
- Für jede Zone: die Zahl der Veranstaltungen **heute**, **am Wochenende** und **in den nächsten 7
  Tagen**, und die **nächste Veranstaltung** (Titel, Ort, Datum).
- Deine **Filter** gelten überall: Themen, Stichwörter, nur kostenlos, für Kinder, Ausstellungen und
  lange Laufzeiten einbezogen oder nicht.
- Ein **Widget** „Ausgehen in Paris“: die nächsten Veranstaltungen deiner Zonen, mit Datum, Ort und
  einem Abzeichen „Kostenlos“; ein Tippen zeigt die Beschreibung und den Link zu paris.fr.
- Zwei **Szenen-Auslöser**: eine neue Veranstaltung wird angekündigt, eine Veranstaltung beginnt
  heute.
- Eine **Szenen-Aktion**: was tun an diesem Wochenende (oder heute Abend, morgen…) in einem Satz,
  zum Senden oder Sagen.

## Voraussetzungen

- Gladys Assistant 5.3.0 oder neuer.
- Internetzugang von Gladys aus (die Agenda wird von opendata.paris.fr gelesen).
- Für die Zone „Rund ums Haus“: das Haus in Gladys verortet (Einstellungen → Häuser).

## Installation

In Gladys **Integrationen → Von GitHub installieren** und die Adresse des Repositorys eingeben:
`https://github.com/guim31/gladys-que-faire-a-paris`.

## Konfiguration

### Einstellungen

- **Zonen**: „Rund ums Haus“, „Ganz Paris“ und/oder Arrondissements anhaken. Jede Zone wird ein
  Gerät, das im Reiter Entdecken angeboten wird.
- **Rund ums Haus**: der Radius um das Haus (500 m, 1 km, 2 km, 5 km).
- **Themen**: Musik, Bühne, Ausstellung, Kino, Vortrag, Workshop, Spaziergang, Sport, Festival.
  Nichts angehakt: alle Themen. Die Themen stammen aus den Tags der Agenda.
- **Stichwörter**: durch Kommas getrennt; eine Veranstaltung passt, wenn ihr Titel, Ort, ihre
  Straße oder Tags eines davon enthalten (ganze Wörter, Akzente und Groß-/Kleinschreibung egal).
- **Nur kostenlose Veranstaltungen**: „kostenlos unter Bedingungen“ inbegriffen.
- **Publikum**: alle, oder Veranstaltungen für Kinder (Tag „Enfants“ oder Kinderpublikum).
- **Ausstellungen und lange Laufzeiten einbeziehen**: Veranstaltungen mit mehr als 7 Terminen oder
  einem Termin über mehr als 14 Tage (eine Dauerausstellung, ein wöchentlicher Kurs). Standardmäßig
  aus, damit die Zähler aussagekräftig bleiben.
- **Sprache der Namen und Meldungen**: Funktionsnamen, Texte der Auslöser und der Satz der
  Szenen-Aktion. Das Widget folgt der Sprache jedes Benutzers.

### Zonen hinzufügen

Speichere, öffne den Reiter **Entdecken** der Integration und füge die gewünschten Zonen hinzu.
Spätere Filteränderungen aktualisieren die Zähler der bereits hinzugefügten Zonen; du musst sie
nicht erneut hinzufügen.

### Prüfen

Der Knopf **Prüfen** zeigt den letzten Download der Agenda, die angebotenen und hinzugefügten Zonen
und die Zähler jeder Zone.

## Geräte

Jede Zone hat sechs Funktionen, alle schreibgeschützt:

| Funktion                         | Typ    | Inhalt                                     |
| -------------------------------- | ------ | ------------------------------------------ |
| Veranstaltungen heute            | Zähler | heute noch kommende oder laufende Termine  |
| Veranstaltungen am Wochenende    | Zähler | von Freitag 18 Uhr bis Sonntag Mitternacht |
| Veranstaltungen in 7 Tagen       | Zähler | von jetzt bis zum Ende des 7. Tages        |
| Nächste Veranstaltung            | Text   | der Titel des nächsten beginnenden Termins |
| Ort der nächsten Veranstaltung   | Text   | Ort und Adresse                            |
| Datum der nächsten Veranstaltung | Text   | „morgen, 18:30“, „Sa., 31. Okt., 20:00“    |

## Dashboard-Widget

**Ausgehen in Paris** listet die nächsten Veranstaltungen deiner Zonen (alle oder die gewählten),
höchstens 8, die nächsten zuerst: Titel, Datum und Ort, Abzeichen „Kostenlos“. Einstellungen: der
Zeitraum (heute, heute Abend, morgen, dieses Wochenende, nächste 7 Tage, nächste 30 Tage), Zeile mit
Zeitraum und Anzahl zeigen oder ausblenden, Abzeichen „Kostenlos“ zeigen oder ausblenden.

## Szenen-Auslöser

- **Neue Veranstaltung angekündigt**: eine nie gesehene, zu deinen Filtern passende Veranstaltung
  erscheint in einer verfolgten Zone (bei jedem Download geprüft).
- **Veranstaltung beginnt heute**: jeden Morgen zwischen 8 und 9 Uhr, für jede Veranstaltung einer
  verfolgten Zone mit einem Termin, der an diesem Tag beginnt.

Beide lassen sich nach Zone, Hauptthema und Preis filtern und liefern als Variablen Zone, Titel,
Datum, Ort, Thema, Preis, Beschreibung, Link und Beginn.

## Szenen-Aktion

**Was tun in Paris** liefert einen Satz, zum Beispiel „Dieses Wochenende: 34 Veranstaltungen,
darunter X (Sa., 31. Okt., 20:00, Le Trianon), Y (…) und 31 weitere.“, die Zahl der
Veranstaltungen sowie Titel und Link der ersten. Felder: Zonen, Zeitraum (standardmäßig dieses
Wochenende), Zahl der genannten Veranstaltungen (1 bis 10).

## Szenen-Beispiele

- Jeden Freitag um 18 Uhr den Satz von „Was tun in Paris“ (dieses Wochenende, kostenlos) per
  Telegram senden.
- Wenn heute rund ums Haus eine Veranstaltung mit dem Thema „Musik“ beginnt, eine Benachrichtigung
  mit Titel und Link senden.
- Nur fortfahren, wenn die Zahl der Veranstaltungen am Wochenende größer als 0 ist.

## Daten und Aktualisierung

- Quelle: der Datensatz
  [Que faire à Paris ?](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/) der Stadt
  Paris, Open Database License (ODbL), etwa 3.300 Veranstaltungen, täglich aktualisiert.
- Die Agenda wird **alle 8 Stunden** heruntergeladen (höchstens dreimal am Tag, etwa 1,2 MB
  komprimiert), die Zähler werden jede Stunde ohne Download neu berechnet. Ein fehlgeschlagener
  Download wird eine Stunde später wiederholt; die zuletzt bekannten Veranstaltungen bleiben solange
  erhalten.
- Die Daten des Datensatzes tragen einen falschen Zeitversatz: die Integration liest sie als Pariser
  Uhrzeiten.
- Bereits Angekündigtes wird in `/data` gespeichert: ein Neustart kündigt nichts doppelt an.

## Fehlerbehebung

- **Keine Zone „Rund ums Haus“ im Reiter Entdecken**: verorte das Haus in Gladys und speichere die
  Konfiguration erneut. Der Knopf Prüfen meldet es.
- **Alle Zähler auf 0**: deine Filter sind vielleicht zu eng (ein Stichwort, nur kostenlos, Kinder),
  oder die Agenda konnte noch nicht heruntergeladen werden: siehe Prüfen und die Protokolle.
- **„Kein aktueller Wert“**: Gladys hat seit 48 Stunden keine Zustände erhalten: die Integration ist
  gestoppt oder erreicht Gladys nicht.
- Mehr Details in den Protokollen mit `LOG_LEVEL=debug`.

## Einschränkungen

- Nur die in „Que faire à Paris ?“ veröffentlichten Veranstaltungen: nicht jeder Pariser Ort
  veröffentlicht dort. Einige Veranstaltungen liegen in den Vororten; „Ganz Paris“ schließt sie ein.
- Veranstaltungen ohne Koordinaten zählen nicht rund ums Haus; solche ohne Pariser Postleitzahl
  gehören zu keinem Arrondissement.
- Titel, Orte und Beschreibungen bleiben auf Französisch, wie veröffentlicht.
- Das Widget zeigt höchstens 8 Veranstaltungen (Grenze von Gladys).

## Danksagung

- Daten: Stadt Paris, „Que faire à Paris ?“, Open Database License (ODbL).
- Aufbau und Filter von der Integration Toulouse Agenda übernommen (guim31/gladys-toulouse-agenda).
