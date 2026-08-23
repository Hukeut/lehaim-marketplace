Contexte : **Lehaim**, app web mobile en français pour organiser un Chabbat
entre proches. Usage privé : pas de shabbats publics, pas d'annuaire d'hôtes,
pas de communauté. Un organisateur crée un Chabbat, invite par lien WhatsApp
ou par un code à six caractères, et le groupe se répartit des « apports »
(qui apporte quoi, qui amène des chaises, qui dort où). Un « marketplace »
liste des commerces partenaires (boucherie, boulangerie, caviste) chez qui
commander.

**Ce qu'il faut maquetter : le back-office**, qui n'existe pas encore. Ce
n'est pas l'app : c'est l'outil d'administration, à part.

## Format et principe

**Écran de bureau, 1440 × 900**, pas mobile. On y gère des boutiques, des
catalogues et des chiffres : c'est un travail de clavier. Navigation
latérale à gauche, contenu à droite.

Deux niveaux d'accès, **une seule interface** :

- **Administrateur** (moi) : tout voit, tout gère.
- **Commerçant partenaire** : la même coquille, réduite à sa boutique. Il
  voit sa fiche, son catalogue, ses commandes et ses statistiques à lui.
  Rien sur les autres commerçants, rien sur les utilisateurs de l'app, rien
  sur les Chabbats.

Montrez donc **chaque écran une fois en vue administrateur**, puis
**la navigation latérale telle que la voit un commerçant** pour qu'on
comprenne ce qui disparaît.

## Ce que contient l'admin

### 1. Tableau de bord

Vue d'ensemble à l'ouverture. Les chiffres qui comptent : comptes créés,
comptes actifs sur 30 jours, Chabbats créés, Chabbats effectivement tenus,
invitations envoyées et taux d'acceptation, apports pris sur apports
proposés. Une courbe d'évolution, quelques comparaisons à la période
précédente.

Côté commerçant, le même écran ne montre que sa boutique : vues de sa fiche,
clics sur ses produits, commandes.

### 2. Utilisateurs

Tableau des comptes : nom, e-mail, date d'inscription, dernière activité,
nombre de Chabbats organisés et rejoints, langue. Recherche, tri, filtres.
Une fiche par personne quand on clique : son historique, ses Chabbats, la
possibilité de suspendre ou supprimer le compte.

**Invisible pour un commerçant.**

### 3. Chabbats

Tableau des Chabbats : titre, hôte, date, nombre d'invités, taux de
remplissage des apports, statut (en préparation, passé, annulé). Une fiche
par Chabbat : ses apports, ses invités, son couchage. En lecture, avec la
possibilité de supprimer un Chabbat problématique.

**Invisible pour un commerçant.**

### 4. Boutiques du marketplace — la partie la plus importante

Aujourd'hui les commerces sont écrits en dur dans le code : il n'y a aucun
moyen d'en créer un. C'est ce que cet écran doit permettre.

**Liste des boutiques** : nom, catégorie, ville, statut (brouillon, en
ligne, suspendue), nombre de produits, date d'ajout.

**Création et édition d'une boutique** : nom, catégorie (boucherie,
boulangerie, cave, épicerie, traiteur), adresse, ville, téléphone, horaires
d'ouverture jour par jour, photo ou logo, description courte, et une
couleur d'accent parmi la palette de l'app.

**Catalogue de produits** d'une boutique : chaque produit a un nom, une
courte précision (« pour 8 personnes », « sortie du four à 16 h »), un prix,
une catégorie, une photo carrée, et un interrupteur disponible / épuisé.
L'ajout doit être rapide : on saisit vingt produits d'affilée, pas un.

**Accès du commerçant** : comment je crée le compte d'un partenaire et le
rattache à sa boutique. Montrez l'écran d'invitation d'un commerçant.

Pour un commerçant, cette section se réduit à **sa** boutique : sa fiche et
son catalogue, sans la liste des autres.

### 5. Commandes

Aujourd'hui le bouton de commande est désactivé, faute de partenaire
branché. Prévoyez l'écran quand même : liste des commandes, avec le client,
la boutique, les produits, le montant, le statut (reçue, préparée, retirée,
annulée), et le détail d'une commande.

Le commerçant ne voit que les siennes.

### 6. Suivi et statistiques

Un écran d'analyse, plus fouillé que le tableau de bord : évolution des
inscriptions, rétention, répartition des langues, jours et heures de
création des Chabbats, apports les plus choisis, plats les plus populaires,
boutiques les plus consultées. Sélecteur de période, export CSV.

Le commerçant y voit ses propres chiffres, sur les mêmes formes.

## Système de design à respecter

C'est le back-office de la même marque : même palette, même chaleur, mais
plus dense et plus sobre qu'une app grand public.

Polices : **Fredoka** pour les titres, **Nunito** pour tout le reste.

Couleurs : fond crème #f4f0e6, surfaces blanches, texte #0d2b3e, texte
secondaire à 55 % d'opacité, accent teal #2aa7a1, corail #ff7a59 pour
l'action principale et les alertes, or #ffd166, violet #686bd6, olive
#7fa35a pour le positif, filets #e6e1da.

Formes : cartes rayon 16 px, champs 14 px, boutons en pilule, ombre douce
(0 8px 20px rgba(13,43,62,0.08)).

Tailles, plus serrées que dans l'app parce qu'on affiche des tableaux :
titre d'écran 22 px, titre de section 16 px, en-tête de tableau 12 px en
majuscules, ligne de tableau 13,5 px.

Les illustrations de la marque sont des dessins 3D doux détourés (plats,
lit, synagogue, poignée de main, panier). Utilisez-les avec parcimonie : en
en-tête de section ou dans les états vides, jamais dans les tableaux.

## Ce dont j'ai besoin en plus des écrans

- **L'état vide** de chaque écran : aucune boutique, aucune commande. C'est
  l'état réel au lancement.
- **Le tableau lui-même** : montrez comment se lisent une ligne, un tri, une
  sélection multiple, une action de masse.
- **Les formulaires longs** (créer une boutique, ajouter un produit) :
  comment ils se découpent sans devenir un mur de champs.

## Ce dont je n'ai pas besoin

Pas de nouvelle charte, pas d'écran de l'app mobile, pas de page marketing.
Uniquement le back-office, dans le style existant.
