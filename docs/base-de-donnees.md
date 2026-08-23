# Base de données

Supabase, Postgres 17, région `eu-west-1`. Les migrations sont dans
`supabase/migrations`, numérotées `0001` à `0020`.

## Le piège principal

**Ne jamais lancer `supabase db push`.**

Le suivi de migrations côté serveur (`supabase_migrations.schema_migrations`)
est **vide** : aucune des vingt migrations n'y est enregistrée, parce
qu'elles ont toutes été appliquées à la main. La CLI croirait donc devoir les
rejouer depuis `0001`. Or plusieurs ne sont pas rejouables, et deux fichiers
portent le même numéro `0007` — leur ordre dépendrait du tri de l'outil.

Pour appliquer une migration, une seule commande, fichier par fichier :

```bash
npx supabase db query --linked --file supabase/migrations/00XX_nom.sql
```

Rendre `db push` utilisable demanderait d'abord de réparer l'historique
(`supabase migration repair --status applied` pour chacune des vingt) et de
renuméroter le second `0007`. C'est un chantier en soi.

## Ce que le dépôt ne dit pas

Le schéma réel a divergé des migrations, dans les deux sens. Ces écarts sont
invisibles depuis le code — chacun a été trouvé en interrogeant la base.

**`profiles` est héritée de l'ancienne version publique.** Son trigger de
création de compte ne figure dans aucune migration : il vit en base, écrit par
la v1. La table porte aussi deux politiques que les migrations ignorent,
« Users can read their own profile » et « Users can update their own profile ».
Une migration qui fait `drop policy` ne touche donc que les siennes.

**RLS a été activée hors migration.** `0001_init.sql:144` affirme le
contraire — « On n'active PAS le RLS sur `profiles` ». C'est faux depuis :
`relrowsecurity` vaut `true`, et aucune table publique n'en est dépourvue.

**`0010` n'avait été appliquée qu'à moitié.** `sleeping_rooms` et
`invitations.sleeping_room_id` n'existaient pas, alors que `join_code` et
`delete_my_account` — passes 2 et 3 du même fichier — étaient bien là. Toute
la fonctionnalité couchage était morte en production. Rejouer un fichier
entier pour rattraper une passe manquante est dangereux : la passe 2 de `0010`
recrée `code_preview` et lui réaccorde `anon`, ce que `0016` avait retiré.

**`0013` n'a jamais été appliquée.** La table `messages` existe encore, avec
deux messages réels dedans, alors que la messagerie a disparu de l'app.
À trancher : les exporter, ou jouer la migration.

**`profiles.locale` manquait** alors que le code l'écrivait. `/admin/utilisateurs`
plantait, et le choix de langue ne se sauvegardait jamais. Corrigé par `0018`.

## Le piège des révocations

```sql
revoke all on function public.ma_fonction() from public;  -- insuffisant
revoke execute on function public.ma_fonction() from anon; -- correct
```

La première forme retire la permission du pseudo-rôle `PUBLIC`, mais **pas**
celle que les privilèges par défaut de Supabase accordent directement à `anon`
et `authenticated`. Il faut nommer le rôle. `0012` s'y est trompée et ses RPC
d'administration sont restées ouvertes à `anon` jusqu'à `0017`.

Quinze fonctions `SECURITY DEFINER` restent appelables anonymement. Elles
lèvent toutes une exception sans session, et deux d'entre elles
(`shabbat_preview`, `cohost_preview`) ont de bonnes raisons d'être publiques.
**Avant d'y toucher :** les expressions de politique RLS s'évaluent avec les
privilèges de l'appelant. Retirer `EXECUTE` sur `is_member()` au rôle
`authenticated` ferait échouer toutes les politiques qui l'appellent, donc
l'app entière. On ne révoque qu'à `anon`, une fonction à la fois, avec un test
derrière chacune.

## Les invariants tenus en base

Ce que l'application ne peut pas garantir, et qui vit donc dans Postgres :

| Migration | Ce qu'elle empêche |
|---|---|
| `0014` | qu'on se pose `back_office_role` ou `is_cohost` soi-même |
| `0015` | que la suppression de compte échoue faute de `guest_name` |
| `0016` | qu'un anonyme balaie l'espace des codes d'invitation |
| `0017` | qu'un anonyme appelle les RPC d'administration |
| `0019` | qu'un convive lise les réponses des autres pour les compter |
| `0020` | qu'un apport ou une chambre accueille plus que sa capacité |
| `0024` | qu'un tiers lise le dossier, les pièces d'identité ou le SIRET d'un marchand |
| `0025` | qu'une pièce d'identité déposée se lise par URL devinée |
| `0026` | qu'un commerçant se mette en ligne, se donne 0 % de commission, ou fabrique sa propre commande |
| `0027` | qu'un commerce lise le profil complet de son client |
| `0028` | qu'un commerçant se mette lui-même en tête de vitrine |

`0020` s'appuie sur un `select … for update` de la ligne parente : c'est ce
verrou qui sérialise deux prétendants simultanés. Aucune vérification côté
application ne peut offrir cette garantie. `0026` fait de même sur le créneau
de livraison, à l'intérieur de `place_order`.

### Le cas de `place_order`

Une commande ne s'insère jamais depuis le client : `orders` n'a aucune
politique d'INSERT, et c'est délibéré. Le seul chemin est la fonction
`place_order`, qui dans une seule transaction verrouille le créneau, relit les
prix dans `shop_products`, calcule les totaux et la commission, puis vide le
panier. Rien de ce que le client envoie n'entre dans un montant — le panier ne
porte que des quantités.

Une commande est ensuite un **contrat figé**. Les libellés, les prix
unitaires, le taux de commission, le nom et le téléphone du client y sont
recopiés, pas référencés : un prix qui bouge, un taux renégocié ou un produit
retiré de la carte ne doivent rien changer à une commande déjà passée.
`guard_order_update` refuse toute modification de ces colonnes.

Chaque refus de `place_order` porte un motif lisible dans `hint` —
`slot_full`, `below_minimum`, `cart_empty`. Sans lui, tous retomberaient sur le
même code SQLSTATE, et « ce créneau est complet » ne se distinguerait plus de
« le minimum n'est pas atteint ».

## Tests

```bash
npm run test:rls
```

Trente-neuf vérifications, dans une transaction dont la dernière instruction
lève une exception — Postgres annule donc tout, fixtures comprises. C'est ce
qui permet de les lancer contre la production sans rien y laisser.

Elles couvrent les deux escalades de privilège du produit Chabbat, les
capacités, le mécanisme de suppression de compte, et, côté place de marché :
la confidentialité des dossiers marchands, la privacité du seau de pièces
justificatives, les trois choses qu'un commerçant ne s'accorde pas lui-même
(la mise en ligne, sa commission, sa place en vitrine), l'impossibilité
d'insérer une commande directement, le calcul des montants en base, le verrou
de créneau, et le fait que le client ne ramène pas son total à zéro.

Plusieurs témoins vérifient qu'aucune garde n'est trop large : un invité doit
pouvoir décliner et préciser son plat sur un apport complet, un commerçant
doit pouvoir déposer son dossier, un client doit pouvoir renoncer tant que sa
commande n'est pas acceptée, et le certificat d'une boutique en ligne doit
bien être public.

La suite sait échouer — retirer le trigger `guard_invitation_privileges` fait
passer le test d'escalade co-organisateur au rouge, et le script sort en 1.
Elle a d'ailleurs déjà trouvé un vrai défaut : `shop_of_path` levait une
exception sur un chemin mal formé au lieu de rendre `null`, ce qui aurait fait
répondre 500 à une politique de stockage au lieu de refuser proprement.

## Sauvegarde

Rien n'est en place. Supabase propose des sauvegardes quotidiennes selon
l'offre, et `supabase db dump` permet un export manuel. À décider avant que
les données ne comptent vraiment.
