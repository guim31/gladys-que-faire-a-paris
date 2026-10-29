# Que faire à Paris

Les **sorties de l'agenda officiel de la Ville de Paris**, « Que faire à Paris ? » : concerts,
spectacles, expositions, conférences, ateliers, balades, pour les enfants ou non, gratuites ou non.
Autour de ta maison, dans les arrondissements de ton choix ou dans tout Paris : combien d'événements
aujourd'hui, ce week-end et sur 7 jours, et le prochain à venir. **Sans compte, sans clé.**

Intégration non officielle, sans lien avec la Ville de Paris. Construite sur le modèle de
l'intégration Toulouse Agenda.

## Ce que tu obtiens

- Un **appareil par zone** : autour de la maison localisée dans Gladys (de 500 m à 5 km), tout
  l'agenda, ou n'importe lequel des 20 arrondissements.
- Pour chaque zone : le nombre d'événements **aujourd'hui**, **ce week-end** et **sur 7 jours**, et
  le **prochain événement** (titre, lieu, date).
- Tes **filtres** s'appliquent partout : thèmes, mots-clés, gratuit seulement, pour les enfants,
  expositions et événements longs inclus ou non.
- Un **widget** « Sorties à Paris » : les prochains événements de tes zones, avec la date, le lieu
  et un badge « Gratuit » ; un appui affiche la description et le lien vers paris.fr.
- Deux **déclencheurs de scène** : un nouvel événement est annoncé, un événement commence
  aujourd'hui.
- Une **action de scène** : que faire ce week-end (ou ce soir, demain…) en une phrase, prête à
  envoyer ou à dire.

## Prérequis

- Gladys Assistant 5.3.0 ou plus récent.
- Un accès à Internet depuis Gladys (l'agenda est lu sur opendata.paris.fr).
- Pour la zone « Autour de la maison » : la maison localisée dans Gladys (Paramètres → Maisons).

## Installation

Dans Gladys, **Intégrations → Installer depuis GitHub**, puis saisis l'adresse du dépôt :
`https://github.com/guim31/gladys-que-faire-a-paris`.

## Configuration

### Réglages

- **Zones** : coche « Autour de la maison », « Tout Paris » et/ou des arrondissements. Chaque zone
  devient un appareil proposé dans l'onglet Découverte.
- **Autour de la maison** : le rayon autour de la maison (500 m, 1 km, 2 km, 5 km).
- **Thèmes** : musique, spectacle, exposition, cinéma, conférence, atelier, balade, sport, festival.
  Rien de coché : tous les thèmes. Ils viennent des tags de l'agenda.
- **Mots-clés** : séparés par des virgules ; un événement correspond quand son titre, son lieu, sa
  rue ou ses tags contiennent l'un d'eux (mots entiers, sans tenir compte des accents ni des
  majuscules).
- **Événements gratuits seulement** : « gratuit sous condition » compris.
- **Public** : tout public, ou événements pour les enfants (tag « Enfants » ou public enfants).
- **Inclure les expositions et événements longs** : événements de plus de 7 dates ou dont une date
  dure plus de 14 jours (une exposition permanente, un cours hebdomadaire). Désactivé par défaut,
  pour que les compteurs gardent un sens.
- **Langue des noms et des messages** : noms des fonctionnalités, textes des déclencheurs et phrase
  de l'action de scène. Le widget suit la langue de chaque utilisateur.

### Ajouter des zones

Enregistre, ouvre l'onglet **Découverte** de l'intégration et ajoute les zones voulues. Changer les
filtres ensuite met à jour les compteurs des zones déjà ajoutées : inutile de les ajouter de
nouveau.

### Vérifier

Le bouton **Vérifier** affiche le dernier téléchargement de l'agenda, les zones proposées et
ajoutées, et les compteurs de chaque zone.

## Appareils

Chaque zone a six fonctionnalités, toutes en lecture seule :

| Fonctionnalité             | Type     | Contenu                                      |
| -------------------------- | -------- | -------------------------------------------- |
| Événements aujourd'hui     | compteur | dates encore à venir ou en cours aujourd'hui |
| Événements ce week-end     | compteur | du vendredi 18 h au dimanche minuit          |
| Événements sur 7 jours     | compteur | de maintenant à la fin du 7e jour            |
| Prochain événement         | texte    | le titre de la prochaine date à commencer    |
| Lieu du prochain événement | texte    | son lieu et son adresse                      |
| Date du prochain événement | texte    | « demain, 18:30 », « sam. 31 oct., 20:00 »   |

## Widget du tableau de bord

**Sorties à Paris** liste les prochains événements de tes zones (toutes, ou celles que tu choisis),
8 au plus, les plus proches d'abord : titre, date et lieu, badge « Gratuit ». Réglages : la période
(aujourd'hui, ce soir, demain, ce week-end, 7 prochains jours, 30 prochains jours), afficher ou
masquer la ligne période et nombre, afficher ou masquer le badge « Gratuit ».

## Déclencheurs de scène

- **Nouvel événement annoncé** : un événement jamais vu, qui correspond à tes filtres, apparaît dans
  une zone suivie (vérifié à chaque téléchargement).
- **Événement qui commence aujourd'hui** : chaque matin vers 8 h (avant 8 h 10), pour chaque événement
  d'une zone suivie qui a une date commençant ce jour-là.

Les deux se filtrent par zone, thème principal et prix, et donnent en variables la zone, le titre,
la date, le lieu, le thème, le prix, la description, le lien et l'heure de début.

## Action de scène

**Que faire à Paris** renvoie une phrase, par exemple « Ce week-end : 34 événements, dont X
(sam. 31 oct., 20:00, Le Trianon), Y (…) et 31 autres. », le nombre d'événements, et le titre et le
lien du premier. Champs : zones, période (ce week-end par défaut), nombre d'événements cités
(1 à 10).

## Exemples de scènes

- Chaque vendredi à 18 h, envoyer la phrase de « Que faire à Paris » (ce week-end, gratuit) sur
  Telegram.
- Quand un événement commence aujourd'hui autour de la maison et que son thème est « Musique »,
  envoyer une notification avec son titre et son lien.
- Continuer seulement si le nombre d'événements du week-end est supérieur à 0.

## Données et rafraîchissement

- Source : le jeu de données
  [Que faire à Paris ?](https://opendata.paris.fr/explore/dataset/que-faire-a-paris-/) de la Ville
  de Paris, Open Database License (ODbL), environ 3 300 événements, mis à jour chaque jour.
- L'agenda est téléchargé **toutes les 8 heures** (trois fois par jour au plus, environ 1,2 Mo
  compressé), et les compteurs sont recalculés toutes les 10 minutes sans téléchargement. Un téléchargement
  raté est retenté une heure plus tard ; les derniers événements connus sont gardés en attendant.
- Les dates du jeu de données portent un mauvais décalage horaire : l'intégration les lit comme des
  heures de Paris.
- 50 événements de scène par passage au plus (Gladys en accepte 300 par minute) : la maison
  d'abord, puis les arrondissements, puis tout Paris, les plus proches d'abord dans chaque zone.
- Ce qui a déjà été annoncé est gardé dans `/data` : un redémarrage n'annonce rien deux fois.

## Dépannage

- **Pas de zone « Autour de la maison » dans l'onglet Découverte** : localise la maison dans Gladys,
  puis enregistre de nouveau la configuration. Le bouton Vérifier le signale.
- **Tous les compteurs à 0** : tes filtres sont peut-être trop étroits (un mot-clé, gratuit
  seulement, enfants), ou l'agenda n'a pas encore pu être téléchargé : vois Vérifier et les
  journaux.
- **« Pas de valeur récente »** : Gladys n'a pas reçu d'état depuis 48 heures : l'intégration est
  arrêtée ou ne joint plus Gladys.
- Plus de détails dans les journaux avec `LOG_LEVEL=debug`.

## Limites

- Seuls les événements publiés dans « Que faire à Paris ? » : tous les lieux de Paris n'y publient
  pas. Quelques événements sont en banlieue ; « Tout Paris » les inclut.
- Les événements sans coordonnées ne sont pas comptés autour de la maison ; ceux sans code postal
  parisien ne sont dans aucun arrondissement.
- Les titres, lieux et descriptions restent en français, comme publiés.
- Le widget affiche 8 événements au plus (limite de Gladys).

## Crédits

- Données : Ville de Paris, « Que faire à Paris ? », Open Database License (ODbL).
- Structure et filtres repris de l'intégration Toulouse Agenda (guim31/gladys-toulouse-agenda).
