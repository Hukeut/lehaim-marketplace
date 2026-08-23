# Charte graphique et contexte produit — Lehaim

État au 17 août 2026, tiré du code en production. Les valeurs qui suivent
sont celles de `app/globals.css` : c'est la source de vérité, ce document en
est le reflet lisible.

Ce document sert de brief permanent : donnez-le tel quel avant toute demande
de maquette.

## 0 · Le produit

**Lehaim** est une application web mobile, en français, qui sert à organiser
un Chabbat entre proches. On l'installe sur son téléphone comme une app.

**C'est un produit privé.** Pas de shabbats publics, pas d'annuaire d'hôtes,
pas de communauté, pas de découverte d'inconnus. On y organise le repas
qu'on tient chez soi, avec les gens qu'on invite soi-même. Une version
publique a existé auparavant : elle n'est plus le sujet, et rien ne doit y
faire retour.

**Gratuit, sans publicité, sans abonnement.** Aucune page de tarifs, aucun
témoignage client, aucune promesse de croissance.

### Comment ça marche

Un **hôte** crée un Chabbat : une date, une heure, une adresse, une ville.
Le jour choisi détermine les **moments** — un vendredi, c'est le dîner ; un
samedi, le déjeuner ; s'y ajoutent le couchage sur place et les rendez-vous
à la synagogue, chacun avec son heure.

Il invite ensuite par un **lien WhatsApp** ou par un **code de six
caractères** qui se dicte au téléphone. La conversation, elle, reste sur
WhatsApp : l'app ne cherche pas à la remplacer, elle organise autour.

Le groupe se répartit les **apports** — qui apporte le plat principal, les
hallot, le vin, les chaises, la plata. Chaque apport indique pour combien de
personnes il est prévu. Celui qui en prend un choisit ensuite le plat précis
qu'il apportera, parmi des vignettes illustrées.

Le **couchage** se détaille par chambre : combien de places, mixte, filles
ou garçons, et chacun choisit la sienne.

Un **mode de financement** se choisit : cagnotte commune, partage des
dépenses, l'hôte avance tout, ou sans suivi d'argent.

Un **compte à rebours** motive le groupe, et l'hôte finalise son Chabbat
quand tout est prêt.

### Les rôles, et ce qu'ils voient

**L'hôte** dispose d'un tableau de bord : tableau des besoins, apports,
couchage, matériel, invités, dépenses, messages WhatsApp suggérés,
co-organisation. Il peut nommer un **co-organisateur** par un lien distinct
du lien d'invitation.

**L'invité n'a aucun droit de gestion.** Il voit ce qui le concerne :
l'adresse avec Waze et Maps, ses propres apports, sa chambre, la discussion
du groupe. Ni jauge de préparation, ni compteurs, ni boutons de gestion.
C'est une distinction structurante : onze écrans lui sont fermés.

Les deux rôles coexistent — on organise chez soi et on est invité ailleurs
la même semaine. L'accueil bascule entre les deux plutôt que de les empiler.

### Ce qui existe autour

Un **marketplace** liste des commerces partenaires — boucherie, boulangerie,
cave — chez qui commander en click & collect. Le circuit de paiement n'est
pas branché : les écrans existent, les compteurs affichent zéro.

Un **back-office** de bureau, à part de l'app, sert à administrer les
comptes, les Chabbats, les boutiques et leurs catalogues. Les commerçants
partenaires y accèdent, réduits à leur seule boutique.

### Contraintes techniques qui pèsent sur le dessin

Écran mobile de référence : **390 × 844**. Une seule colonne, tout au pouce.

**Cinq langues** : français (source), anglais, espagnol, hébreu, russe.
L'hébreu s'écrit de droite à gauche — aucune mise en page ne doit supposer
un sens de lecture. Les libellés allemands ou russes sont plus longs que les
français de 20 à 30 % : les boutons et les pastilles doivent respirer.

**Toute chaîne visible est traduite.** Une maquette qui invente un libellé
crée cinq traductions à écrire ; les textes existants sont préférables.

## 1 · Couleurs

### Identité

| Rôle | Hex | Jeton CSS |
|---|---|---|
| Bleu principal — couleur identitaire | `#224FA7` | `--color-teal` |
| Bleu foncé — titres, texte important | `#173A72` | `--color-teal-deep` |
| Bleu nuit — contraste fort, texte courant | `#0F274D` | `--color-ink` |
| Bleu clair — sur fond sombre | `#9DB6E0` | `--color-teal-soft` |

### Surfaces

| Rôle | Hex | Jeton CSS |
|---|---|---|
| Blanc cassé — fond principal | `#FFF9F0` | `--color-cream` |
| Crème — surfaces secondaires, hors cadre | `#F8F1E5` | `--color-sand` |
| Ivoire — variantes de surfaces | `#FDF6EC` | `--color-ivory` |
| Blanc pur — cartes | `#FFFFFF` | — |
| Filet | `#E7DDCD` | `--color-line` |
| Filet doux — fonds de champs inactifs | `#F3EBDD` | `--color-line-soft` |
| Gris bleuté — texte tertiaire | `#5A6B86` | `--color-mist` |

### Accents

| Rôle | Hex | Jeton CSS |
|---|---|---|
| Orange chaleureux — action principale | `#E88A2E` | `--color-coral` |
| Orange profond — texte sur fond clair | `#B0631A` | `--color-coral-deep` |
| Orange lavé — fonds d'alerte | `#FBEEDA` | `--color-coral-wash` |
| Jaune doré — bougies, accents | `#F4B83F` | `--color-gold` |
| Jaune clair — éléments secondaires | `#FFD46A` | `--color-gold-light` |
| Or profond / or encre | `#B8860B` / `#7A5A12` | `--color-gold-deep` / `-ink` |
| Or lavé | `#FDF0D5` | `--color-gold-wash` |
| Rouge vin — accents ponctuels | `#8A2346` | `--color-violet` |
| Rouge vin profond | `#6B1A36` | `--color-violet-deep` |
| Vert olive — plantes, états positifs | `#6B8F42` | `--color-olive` |
| Olive profond / olive encre | `#52702F` / `#3D5622` | `--color-olive-deep` / `-ink` |
| Olive lavé | `#E9EFDF` | `--color-olive-wash` |

**Dette de nommage assumée.** Les jetons gardent les noms de la version
précédente : `teal` porte le bleu, `coral` porte l'orange, `violet` porte le
rouge vin. Renommer toucherait une centaine de fichiers ; ce sera fait d'un
seul coup, une fois les branches réconciliées.

**Couleur hors charte, volontairement :** le vert WhatsApp `#25D366`, qui
appartient au service et non à la marque.

## 2 · Typographie

**Fredoka** (500/600/700) pour le mot-symbole, les titres et les chiffres
mis en avant. **Nunito** (400/600/700/800) pour tout le reste.

Le hébreu bascule sur **Rubik** (titres) et **Assistant** (texte).

| Usage | Taille |
|---|---|
| Mot-symbole, page d'accueil | 50 px |
| Mot-symbole, en-tête d'écran | 34 px centré / 22 px aligné |
| Titre d'écran | 21 px |
| Titre du tunnel de création | 18 px, interlignage serré |
| Titre de carte | 14,5 px |
| Libellé courant | 14 px |
| Texte secondaire | 12,5 – 13,5 px |
| Sur-titre en majuscules | 11 – 12,5 px, graisse 800, interlettrage 0,04em |

Rien ne descend sous 11,5 px : en dessous, le texte devient inconfortable.

## 3 · Formes et élévation

| Rayon | Valeur | Usage |
|---|---|---|
| `--radius-field` | 14 px | Champs de saisie |
| `--radius-card` | 16 px | Cartes |
| `--radius-panel` | 20 px | Panneaux |
| `--radius-hero` | 22 px | Carte principale du tableau de bord |
| `--radius-sheet` | 26 px | Feuilles et barres d'onglets |

Les boutons sont **en pilule**, sans exception.

```
--shadow-card    0 1px 2px rgb(15 39 77 / .04), 0 8px 20px rgb(15 39 77 / .08)
--shadow-card-lg 0 1px 2px rgb(15 39 77 / .04), 0 10px 26px rgb(15 39 77 / .10)
--shadow-float   0 2px 8px rgb(15 39 77 / .08)
--shadow-pill    0 2px 6px rgb(15 39 77 / .06)
--shadow-dock    0 -12px 32px rgb(15 39 77 / .10)
--shadow-coral   inset 0 1px 0 rgb(255 255 255 / .25), 0 8px 18px rgb(232 138 46 / .28)
```

## 4 · Mise en page

Colonne mobile unique, **430 px au maximum**, centrée au-delà, avec des
coins de 36 px et une ombre portée sur grand écran. Une page peut s'en
affranchir en se déclarant `data-fullwidth` : c'est le cas du back-office,
qui est une interface de bureau.

Marges latérales de 20 à 28 px selon l'écran. Barre d'onglets à cinq
entrées, avec un bouton rond central. Pied de page collant pour l'action
principale.

## 5 · Iconographie

**Deux familles, jamais mélangées dans un même rôle.**

**Pictogrammes au trait** (`components/icons.tsx`) : SVG monochromes,
épaisseur 2, hérités de `currentColor`. Pour la navigation, les champs, les
actions secondaires.

**Illustrations de marque** (`public/lehaim`, 44 fichiers PNG 256 px) :
dessins 3D doux, détourés sur fond transparent, palette bleu roi, crème, or,
olive et bois. Pour les apports, les moments, les raccourcis, les cinq temps
de la page d'accueil. Elles ne se recolorent pas.

Poids optique constant : le sujet occupe la même surface d'une illustration
à l'autre. Elles se posent directement sur le fond, sans pastille de couleur
derrière — elles portent déjà la palette.

## 6 · Images

**Illustrations d'ambiance** (`public/illustrations`, 11 fichiers JPEG
1254 px) : tables de Chabbat, enveloppe d'invitation, lit, note de frais.
Composées sur le blanc cassé. En bandeau, elles se fondent dans le fond par
un dégradé long — jamais d'arête nette.

**Vignettes de plats** (`public/plats`, 29 fichiers JPEG 360 px) : un plat
par image, fond uniforme, pour le choix de ce qu'on apporte.

## 7 · Mouvement

Entrées en scène sur la page d'accueil uniquement : le mot-symbole descend,
le titre monte, les cinq temps apparaissent en cascade de 0,15 s, les
boutons arrivent à 1,05 s. Ensuite, deux boucles lentes : respiration des
illustrations (3,6 s) et pulsation du bouton principal (2,6 s).

Ailleurs, aucune animation d'entrée : seulement des transitions d'état
(`active:scale-[0.985]` sur les boutons, changements de couleur).

**Tout se fige sous `prefers-reduced-motion`.**

## 8 · Écriture

Français, vouvoiement. Phrases courtes. Le vocabulaire du produit :

- **apports** — jamais « missions » ni « tâches »
- **Chabbat** — pas « Shabbat »
- **moments** — vendredi soir, samedi midi, couchage, synagogue
- **hôte**, **invité**, **co-organisateur**

Pas de tirets cadratins dans les textes d'interface.

L'app existe en cinq langues : français (source), anglais, espagnol, hébreu
(droite à gauche), russe. Toute chaîne visible passe par `messages/*.json` ;
`npm run i18n:check` vérifie la parité des clés.

## 9 · Comment maquetter pour ce projet

Ces règles viennent des allers-retours précédents. Chacune corrige une
erreur réellement commise.

**Le mot-symbole ne se pose jamais sur une image.** Posé en blanc sur une
illustration lumineuse, il disparaît. Il lui faut un fond uni.

**Utilisez les illustrations existantes, ne les redessinez pas.** Quand une
maquette a manqué de fichiers, elle a inventé une série en 2D plate : deux
langages graphiques sur le même écran, et c'est précisément ce qui fait
« pas professionnel ». La bibliothèque compte 44 illustrations de marque et
11 images d'ambiance ; demandez-les plutôt que d'en créer.

**Pas de rangées « boîte blanche + pastille + un mot ».** C'est le motif le
plus générique de l'app, et il a été refusé deux fois. Un titre en gras, une
ligne fine, de l'air, et l'illustration posée sur le fond suffisent.

**Une vignette sous 40 px n'est pas lisible.** À 56 px, deux illustrations de
table se confondent. Soit l'illustration est grande, soit elle disparaît.

**Hiérarchisez les actions.** Deux boutons de même largeur, même rayon, même
hauteur ne disent pas lequel compte. L'action principale est pleine et
orange ; la secondaire est un contour ou un lien texte.

**Ne centrez pas une colonne entière de texte.** L'alignement à gauche avec
un vrai contraste d'échelle tient mieux.

**Fredoka ne doit pas tout habiller.** Réservez-le au mot-symbole et aux
titres ; le reste en Nunito, avec un contraste de graisse.

**Un écran doit tenir sans défiler** quand c'est possible, et l'indiquer
quand ça défile. Prévoyez le pied de page collant.

**Montrez les états, pas seulement l'écran idéal** : vide (aucun Chabbat,
aucune boutique, aucun apport choisi), rempli, et le cas le plus chargé.
L'état vide est l'état réel au lancement.

**Ce qu'il ne faut jamais proposer** : shabbats publics, annuaire d'hôtes,
fil communautaire, notation des hôtes, tarifs, témoignages, formulaire
d'inscription sur la page d'accueil, refonte de la navigation.
