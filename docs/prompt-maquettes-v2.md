# Prompt pour Claude Design — deux écrans de Lehaim

Contexte : app web mobile **Lehaim**, en français, qui sert à organiser un Chabbat
entre proches. Usage **privé** : pas de shabbats publics, pas d'annuaire d'hôtes,
pas de communauté. Un organisateur crée un Chabbat, invite par lien WhatsApp, et
le groupe se répartit des « missions » (qui apporte quoi, qui amène des chaises…).

Format cible : écran mobile 390 × 844, une seule colonne, tout au pouce.

## Système de design déjà en place — à respecter exactement

Polices : **Fredoka** pour les titres (`font-display`, semi-bold), **Nunito**
pour le reste (bold pour les libellés, regular pour les textes secondaires).

Couleurs :
- fond d'écran `#f4f0e6` (crème), cartes en blanc pur
- texte principal `#0d2b3e` (encre), texte secondaire à 50-55 % d'opacité
- accent principal **teal** `#2aa7a1` (interrupteurs actifs, validations, liens)
- accent secondaire **corail** `#ff7a59` (bouton d'action principal, alertes)
- **or** `#ffd166` et **violet** `#686bd6` en pastilles d'illustration
- filets `#e6e1da`

Formes : cartes en rayon 16 px, champs 14 px, pastilles rondes, ombre très
douce (`0 8px 20px rgba(13,43,62,0.08)`). Boutons pleins en pilule.

Tailles de texte réelles de l'app : titre d'écran 19 px, titre de carte 13 px,
libellé 12,5 px, texte secondaire 10,5-11 px. **C'est une interface dense et
calme, pas une interface aérée.**

## Écran 1 — « Que proposez-vous ? » (les moments du Chabbat)

L'organisateur active les moments qui concernent ce Chabbat, puis en précise le
détail. Cinq moments possibles, chacun avec une pastille d'illustration et un
interrupteur :

| Moment | Sous-titre | Pastille |
|---|---|---|
| Vendredi soir | Dîner | bougie, fond or |
| Samedi midi | Déjeuner | plat, fond corail clair |
| Couchage sur place | Matelas ou canapé | lit, fond violet clair |
| Synagogue le soir | Accueil du Chabbat | synagogue, fond or |
| Synagogue le matin | Départ groupé | synagogue, fond or |

Quand un moment est **activé**, on doit pouvoir saisir son détail :
- pour les quatre repas / offices : **une heure de rendez-vous** (ex. 19h30)
- pour le couchage uniquement, trois informations de plus : **heure d'arrivée**,
  **nombre de places de couchage** (un entier), et **pour qui** parmi trois
  choix exclusifs : mixte / filles / garçons.

**Le problème à résoudre.** Ma version actuelle met chaque détail dans un second
bloc sous la carte du moment, avec un champ d'heure large et un bouton
« Enregistrer » par moment. Résultat : c'est deux fois trop haut, les champs
sont trop gros pour ce qu'ils contiennent (une heure), et la page devient une
colonne de gros blocs. Je cherche l'inverse : **l'heure doit se lire comme une
valeur discrète sur la ligne du moment**, pas comme un formulaire.

Proposez la mise en page. Pistes à explorer, pas des contraintes : l'heure
affichée en petit à droite du titre du moment et modifiable au tap ; le détail
qui se déplie seulement quand on le demande ; une sauvegarde implicite sans
bouton. Montrez les deux états d'une carte (moment éteint / moment allumé avec
son heure) et le cas du couchage, qui est le plus chargé.

## Écran 2 — Suggestions de plats pour une mission

Quand quelqu'un prend une mission de cuisine (« Plat principal », « Entrées »,
« Dessert », « Salades »…), on veut lui proposer des idées de plats **avec des
photos**, pour qu'il choisisse ce qu'il apportera plutôt que de partir d'une
page blanche.

J'ai 29 illustrations de plats, toutes au même format : plat vu en légère
plongée dans un plat de service crème, sur fond neutre, style illustration 3D
douce. Elles sont carrées et détourables.

Contenu d'une suggestion : la photo, le nom du plat (ex. « Boulettes sauce
tomate », « Escalopes panées », « Taboulé », « Bourekas »), et rien d'autre
d'obligatoire.

Ce que la maquette doit trancher :
1. **Carrousel horizontal ou grille à deux colonnes ?** Le carrousel préserve la
   hauteur de page mais cache une partie du choix ; la grille montre tout mais
   pousse le reste de l'écran vers le bas.
2. **À quel moment apparaissent les suggestions ?** Deux options : sur la fiche
   de la mission avant de la prendre (elles donnent envie), ou après l'avoir
   prise (elles aident à décider). Montrez celle qui vous paraît juste.
3. **L'état sélectionné** : à quoi ressemble une suggestion choisie, et où on lit
   le choix ensuite (« Sarah apporte : boulettes sauce tomate »).
4. Prévoyez le cas « aucune de ces idées » : on doit pouvoir saisir un plat libre.

Montrez aussi la vignette seule, en grand, pour que je cale le cadrage et le
rayon des coins.

## Ce dont je n'ai pas besoin

Pas de nouvelle charte, pas de refonte de la navigation, pas d'écran d'accueil.
Uniquement ces deux morceaux, dans le style existant.
