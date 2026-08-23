# Prompt pour Claude Design — l'écran d'assignation de rôle

> Écran déjà construit et en ligne. Le but de la maquette est de **le pousser
> plus loin**, pas de le décrire : c'est le seul moment gratifiant du produit,
> et il mérite mieux que ce qu'on a su en faire.

---

## Le contexte

App web mobile **Lehaim**, en français, qui sert à organiser un Chabbat entre
proches. Usage **privé** : pas de chabbats publics, pas d'annuaire d'hôtes, pas
de communauté. Un organisateur crée un Chabbat, invite par lien WhatsApp, et le
groupe se répartit des « apports » — qui apporte le plat principal, qui les
hallot, qui les chaises.

Format cible : écran mobile **390 × 844**, une seule colonne, tout au pouce.

## Le moment précis

Quelqu'un vient d'appuyer sur « Je prends cet apport ». Il choisit « Plat
principal », et l'app lui répond : **« Vous êtes le chef du chaud. Le plat
qu'on attend tous, c'est le tien. »**

C'est le seul écran de récompense du produit. Il doit donner envie d'en
reprendre un second — c'est sa vraie fonction, pas de confirmer.

Ce qu'il ne doit surtout pas faire : ressembler à une confirmation
administrative. Pas de « votre choix a bien été enregistré ».

## Le système de design en place — à respecter exactement

Polices : **Fredoka** pour les titres (`font-display`, semi-bold 600),
**Nunito** pour le reste (extra-bold 800 pour les libellés, regular pour les
textes secondaires).

Couleurs, telles quelles :

| Rôle | Valeur |
|---|---|
| fond d'écran (crème) | `#fff9f0` |
| fond sourd (sable) | `#f8f1e5` |
| cartes | blanc pur |
| encre (texte) | `#0f274d` |
| texte secondaire | encre à 45–65 % |
| filets | `#e7ddcd` / `#f3ebdd` |
| **teal** — liens, validations | `#224fa7`, profond `#173a72` |
| **corail** — bouton principal | `#e88a2e`, profond `#b0631a`, lavis `#fbeeda` |
| **or** — célébration | `#f4b83f`, clair `#ffd46a`, encre `#7a5a12`, lavis `#fdf0d5` |
| **olive** — ce qui va bien | `#6b8f42`, lavis `#e9efdf` |
| **grenat** — ce qui alerte | `#8a2346`, lavis `#f6e7ec` |

Formes : cartes 16 px, panneaux 20 px, champs 14 px, feuilles 26 px. Boutons
pleins en pilule. Ombre douce :
`0 1px 2px rgba(15,39,77,0.04), 0 8px 20px rgba(15,39,77,0.08)`.

Tailles réelles : titre d'écran 19 px, gros titre de célébration 27 px, titre
de carte 15 px, libellé 12,5 px, secondaire 11–13 px. **C'est une interface
dense et calme, pas une interface aérée** — sauf sur cet écran-là, qui est
justement le moment où elle a le droit de respirer.

Animation existante : `pop`, un rebond
`cubic-bezier(0.34, 1.56, 0.64, 1)` sur 0,5 s.

## Ce que l'écran contient aujourd'hui

De haut en bas, centré :

1. Un halo doré radial derrière une pastille ronde de 104 px, fond
   `#fdf0d5`, contenant l'illustration de l'apport (~58 px). Deux petites
   étoiles pleines dorées débordent en haut à gauche et en bas à droite.
   L'ensemble arrive avec le rebond `pop`.
2. Une sur-titre en capitales espacées, 13 px, encre à 45 % : **VOTRE RÔLE**
3. Le nom du rôle en Fredoka 27 px, sur deux lignes maximum : **Le chef du chaud**
4. L'accroche en 15 px, encre à 65 % : *Le plat qu'on attend tous, c'est le tien*
5. Une pastille blanche avec l'émoji et le titre de l'apport : **🍲 Plat principal**
6. Trois actions collées en bas :
   - corail plein — « Voir ce que j'apporte »
   - contour — « Il reste 4 apports à prendre » (masqué s'il n'en reste aucun)
   - fantôme — « Revenir à l'accueil »

## Les treize rôles

Chaque apport donne un rôle. Le nom et l'accroche sont fixes.

| Clé | Nom | Accroche |
|---|---|---|
| `main` | Le chef du chaud | Le plat qu'on attend tous, c'est le tien |
| `bread` | Le gardien des hallot | Pas de Chabbat sans tes hallot |
| `pastry` | Le pâtissier du week-end | Tu deviendras le pâtissier du week-end |
| `wine` | Le caviste | Le Kiddoush du vendredi, c'est un peu grâce à toi |
| `salad` | Le chef des salades | La fraîcheur de la table repose sur toi |
| `starter` | L'ouvreur de bal | Tu donnes le ton du repas |
| `cold` | Le maître du frais | Personne n'aura soif grâce à toi |
| `table` | Le boss de la table | La table sera impeccable |
| `seats` | Le sauveur des assises | Quatre convives te devront leur place assise |
| `bedding` | Le maître des matelas | Ceux qui dorment sur place te remercieront |
| `candles` | Le gardien de la flamme | C'est toi qui fais entrer Chabbat |
| `decor` | Le décorateur | La table aura de l'allure |
| `support` | Le renfort | Un coup de main qui compte |

## Ce que j'attends de la maquette

**Trois ou quatre propositions distinctes** du même écran, pas des variantes
d'espacement. Explorez des partis pris qui s'opposent — par exemple :

- une **carte de rôle** qu'on aurait envie de montrer : format vertical,
  bordure, texture, presque une carte à collectionner ;
- une version **pleine page colorée**, où la teinte vient du rôle lui-même
  (le caviste en grenat, le gardien de la flamme en or) plutôt que du même
  or pour tous les treize ;
- une version **sobre et typographique**, où le nom du rôle occupe presque
  tout l'écran et où l'illustration disparaît ;
- une version qui **montre les autres** : « Sarah est le gardien des hallot,
  David le caviste — il manque encore le dessert », pour que le rôle se
  situe dans un groupe plutôt que seul.

Pour chaque proposition, montrez au moins **deux rôles différents** (un
alimentaire, un logistique) afin qu'on voie comment elle tient quand le nom est
court ou long, et **l'état où il ne reste aucun apport à prendre** — le
deuxième bouton disparaît alors et l'écran doit rester équilibré.

## Contraintes à ne pas oublier

- **Cinq langues** : français, anglais, espagnol, hébreu, russe. L'hébreu se
  lit de droite à gauche et l'écran doit se retourner proprement. Les noms de
  rôles sont plus longs en russe : « Спаситель посадочных мест » pour
  « Le sauveur des assises ». Prévoyez de la place, ou une taille qui s'adapte.
- **Pas de photo de personnes.** L'app n'a que des illustrations d'objets — un
  plat, une hallah, des bougies, un matelas — en style 3D doux, posées sur fond
  transparent.
- **Le tutoiement** est celui de l'app dans les accroches, le vouvoiement dans
  les libellés d'interface. C'est volontaire : l'accroche est une voix, pas une
  étiquette.
- L'écran arrive **après une action réussie**, jamais au chargement d'un
  parcours. On peut compter sur une seconde d'attention pleine.
