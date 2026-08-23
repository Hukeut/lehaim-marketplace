# Gamification lehaim — proposition d'architecture backend

Document de conception, avant implémentation. Rien de ce qui suit n'est encore codé — les composants "Traiteur du mois / Mon score / badges" livrés juste avant ce document sont un prototype à hardcoded-rules à considérer comme *superseded* par ce moteur, pas comme sa fondation.

## 1. État réel du repository (inspecté, rien de supposé)

- **Stack** : Next.js `^16.3.0` (App Router, server actions), React 19.2, TypeScript 5, Tailwind v4. Aucun framework additionnel (pas de state manager, pas de queue, pas de cron).
- **Pas d'ORM** : accès DB via `@supabase/supabase-js` / `@supabase/ssr` directement dans `lib/*.ts` (couche data-access marquée `"server-only"`) et dans les server actions (`app/**/actions.ts`).
- **Base de données** : Supabase Postgres. Schéma géré par des fichiers SQL idempotents dans `supabase/migrations/` (0000 → 0017), appliqués manuellement par toi dans le SQL Editor Supabase — il n'y a pas de runner de migration automatisé dans le déploiement.
- **Auth** : Supabase Auth (`auth.users`), miroir automatique dans `public.profiles` via trigger `handle_new_user`. `profiles.role` (`participant`/`organizer`) est un champ historique du module Shabbat, distinct des rôles marketplace (traiteur = table `traiteurs` séparée, propriétaire = `profiles.id`).
- **Autorisation** : uniquement de la Row Level Security Postgres, aucune couche de permissions côté app. L'admin marketplace est une liste blanche (`marketplace_admins`) lue via une fonction `security definer` (`is_marketplace_admin()`), appelable en RPC et dans les policies.
- **Déploiement** : Vercel, déploiement auto sur push vers `main` (GitHub `Hukeut/lehaim-marketplace`). Pas de `vercel.json`, pas de Vercel Cron configuré, aucune infra de jobs/queue (pas d'Inngest, QStash, etc.).
- **Notifications** : `app/notifications/page.tsx` est un écran statique d'onboarding ("activer les notifications"), pas un flux réel. Le "temps réel" existant = `revalidatePath` + polling client (`components/AutoRefresh.tsx`, `router.refresh()` toutes les 8s) + liens `wa.me` pré-remplis (`lib/whatsapp.ts`). Pas de push, pas d'email.
- **Tests** : aucun test automatisé trouvé. La seule vérification de correction utilisée dans ce projet jusqu'ici est `npx tsc --noEmit`.

## 2. Modèles de données pertinents

| Table | Rôle | Champs clés pour la gamification |
|---|---|---|
| `profiles` | Utilisateur (traiteur *owner* ou organisateur/client) | `id`, `created_at` |
| `traiteurs` | Fiche traiteur | `owner_id`, `status`, `created_at` |
| `traiteur_products`, `traiteur_slots` | Catalogue / créneaux | peu pertinents directement |
| `marketplace_orders` | **Table pivot de tout le système** | `traiteur_id`, `user_id`, `status`, `cancelled_by`, `responded_at`, `created_at`, `total_amount`, `fulfillment` |
| `marketplace_order_items` | Lignes de commande | volumétrie panier |
| `marketplace_order_messages` | Chat commande | activité/communication |
| `shabbats` | Module organisateur (hors marketplace) | `host_id`, `created_at` — usage potentiel mais hors périmètre marketplace |

**N'existe pas aujourd'hui** : table d'avis/notes (`reviews`), table de paiement/règlement, historique des transitions de statut d'une commande (le statut est écrasé en place par `setOrderStatus`, sans trace des étapes précédentes ni de leur horodatage individuel, hormis `responded_at` que j'ai ajouté ce tour-ci pour la réactivité).

## 3. Flux de commande actuel

```
nouvelle → (acceptee, sautée en pratique par l'UI) → en_preparation → prete → recuperee
        ↘ annulee (à tout moment avant recuperee, cancelled_by = 'client' | 'traiteur')
```

Tout ce flux passe par **une seule fonction** : `setOrderStatus(orderId, status)` dans `app/marketplace/actions.ts`. C'est un point d'intégration unique et déjà centralisé — un vrai atout pour brancher des événements sans instrumenter 15 endroits différents.

Autres actions pertinentes, toutes déjà centralisées dans `app/marketplace/actions.ts` : `createOrder`, `sendOrderMessage`, `addSlot`/`deleteSlot`, `registerTraiteur`/`updateTraiteurProfile`, `approveTraiteur`/`rejectTraiteur`.

## 4. Données déjà exploitables vs données manquantes

**Déjà disponible** (traiteur) : temps de réponse (`responded_at - created_at`), annulations par le traiteur (`cancelled_by='traiteur'`), volume de commandes, nombre d'organisateurs distincts servis, panier moyen (`total_amount`), activité de chat, ancienneté (`traiteurs.created_at`).

**Déjà disponible** (organisateur) : annulations par le client, fréquence/volume de commandes, fidélité à un même traiteur (commandes répétées), réactivité dans le chat.

**Manquant, bloquant pour certaines métriques du cahier des charges** :
- Aucune note/satisfaction/qualité perçue — pas de table d'avis.
- Aucun suivi de paiement — le règlement se fait en direct au retrait, hors app (`app/marketplace/actions.ts`, commentaire *"Réservation (sans paiement)"*).
- Pas de ponctualité mesurable finement : `pickup_slot` est un libellé texte libre ("14h00–14h30"), pas une donnée structurée comparable à un horodatage réel de remise.
- Pas d'historique des transitions de statut (seul l'état courant + `responded_at` sont conservés) — nécessaire pour l'auditabilité et le recalcul exigés en §15-16-19 du brief.

## 5. Points d'intégration proposés

- **Émission des événements** : à la fin de `setOrderStatus`, `createOrder`, `sendOrderMessage` (et `approveTraiteur` pour l'activation) — juste après le `await supabase...update/insert` existant, dans la même server action, sans nouvelle infra (le call est synchrone, dans la même fonction serverless Vercel).
- **Lecture côté frontend** : nouvelles fonctions dans un module `lib/gamification/` miroir de `lib/marketplace.ts` (même convention `"server-only"` + types partagés dans un `-types.ts` client-safe), exposées à `app/devenir-traiteur/score/page.tsx` (à faire évoluer) et à une future page équivalente côté organisateur.
- Le badge de réactivité / "Traiteur du mois" / badges d'ancienneté livrés juste avant ce document sont un prototype à règles figées, à remplacer par des lectures sur le nouveau moteur (l'UI — `ReactivityBadge`, `MilestoneBadges`, `Sparkles` — reste réutilisable, seule la source de calcul change).

## 6. Modifications de base de données proposées

Nouveau schéma, additif uniquement (aucune table existante modifiée à part l'ajout d'un event-emit dans le code) :

- **`gamification_events`** — journal immuable des faits métier. `id, subject_type ('traiteur'|'organizer'), subject_id, event_type, order_id, occurred_at, payload jsonb, is_void, created_at`. Source de vérité unique.
- **`gamification_rules`** — règles versionnées, éditables par un admin. `id, rule_key, subject_type, value jsonb, valid_from, valid_to, created_by, created_at`. On ne modifie jamais une ligne passée : un changement de règle insère une nouvelle version et ferme l'ancienne (`valid_to = now()`), pour appliquer la règle en vigueur au moment de l'événement, jamais rétroactivement (§17 du brief).
- **`gamification_xp_ledger`** — grand livre append-only, comptabilité en partie double plutôt qu'un compteur : `id, subject_type, subject_id, event_id, delta_xp, reason, rule_version_id, created_at, voided_at`. XP courant = `sum(delta_xp) where voided_at is null`. Une commande requalifiée en annulée ne "soustrait" pas un nombre magique : elle **annule** (`voided_at`) l'écriture d'origine et en ajoute une nouvelle si besoin — reconstituable et auditable (§16).
- **`gamification_levels`** — définitions de palier par `subject_type` : `level_key, name, min_xp, min_metric_thresholds jsonb, sort_order`.
- **`gamification_subject_state`** — état courant matérialisé (cache) : `subject_type, subject_id, current_level_id, current_xp, metrics jsonb, last_recalculated_at`. Toujours reconstructible à partir des tables ci-dessus — jamais la source de vérité.
- **`gamification_badges`** + **`gamification_badge_awards`** (avec `revoked_at`).
- **`gamification_objectives`** (templates, conditions `jsonb`) + **`gamification_objective_progress`**.
- **`gamification_rewards`** (catalogue) + **`gamification_reward_grants`** (`granted_at, expires_at, used_at, revoked_at`).
- **`gamification_flags`** — signalements anti-abus pour revue admin : `subject_id, flag_type, severity, details jsonb, resolved_at, resolved_by`.

C'est beaucoup de tables d'un coup : je propose de les créer toutes (le schéma logique doit être pensé en entier pour être cohérent) mais d'implémenter en deux vagues — **vague 1** : `gamification_events` + `gamification_rules` + `gamification_xp_ledger` + `gamification_levels` + `gamification_subject_state` (le cœur : événements → XP → niveau, avec audit). **Vague 2**, une fois la vague 1 validée en usage réel : badges, objectifs, récompenses, anti-abus.

## 7. Moteur — décisions proposées (avec justification)

**Qualité des données / petit échantillon (§9 du brief)** — je recommande un **shrinkage bayésien** (moyenne pondérée vers une moyenne de cohorte, façon "note IMDB") plutôt qu'un simple seuil brut :
`score = (n / (n + k)) × valeur_observée + (k / (n + k)) × moyenne_de_référence`, où `k` est une "constante de crédibilité" configurable (ex. `k = 10` : il faut ~10 commandes pour que la performance individuelle pèse autant que la référence). Ça évite qu'un traiteur avec 2 commandes obtienne un score extrême dans un sens ou l'autre, sans pour autant le pénaliser en cachant sa progression — contrairement à un seuil dur qui affiche "pas de score" jusqu'à N commandes. Je garde **en plus** un seuil minimal d'affichage (comme le badge de réactivité actuel, masqué sous 3 commandes) : le score sous-jacent utilise le lissage, mais on ne *promeut/affiche* un badge qu'une fois qu'il y a assez de matière pour que ce soit lisible et pas trompeur.

**Fenêtre temporelle (§10)** — fenêtre adaptative : on part d'une fenêtre courte (90 jours), et si l'échantillon y est insuffisant (sous le seuil minimal), on élargit progressivement (180j → 365j → tout l'historique) jusqu'à atteindre le minimum. Ça favorise la performance récente quand il y a assez de volume (cohérent avec "je veux devenir meilleur qu'avant"), sans laisser un traiteur peu actif sans aucune donnée.

**Anti-flapping des niveaux (§4)** — un niveau recalculé à chaque événement peut osciller si un traiteur est pile à la frontière. Je propose une hystérésis simple : redescendre un niveau seulement si les métriques restent sous le seuil sur les *M* derniers événements consécutifs (pas au premier accroc), alors que la montée, elle, peut être immédiate dès que le seuil est atteint — cohérent avec "récompenser vite, sanctionner avec discernement".

**Détection d'abus (§20)** — calculée en parallèle du scoring (pas un système séparé) : taux d'acceptation anormalement élevé combiné à des durées de traitement anormalement courtes, pics d'activité incohérents avec l'historique, allers-retours commande/annulation répétés entre les deux mêmes comptes. Écrit dans `gamification_flags` pour revue humaine — **aucune sanction automatique en v1** (les faux positifs coûteraient cher en confiance), seulement une exclusion des événements flaggés du calcul du score le temps de la revue.

## 8. Décisions validées

| Question | Décision |
|---|---|
| Avis/notes (métriques qualité) | **On construit un mini système d'avis maintenant** — prérequis pour que "qualité" existe. |
| Paiement (délais de règlement, organisateur) | **Métrique abandonnée en v1**, faute de donnée fiable (règlement hors app). |
| Récompenses commerciales | **Déclaratives** — le système attribue/trace, l'admin honore à la main. Pas de moteur de frais/coupons à construire maintenant. |
| Recalcul des scores | **Événementiel** (comme le reste de l'app) **+ bouton de recalcul manuel admin**. Pas de cron à ajouter en v1. |

## 9. Système d'avis — nouvelle brique produit (prérequis)

Ce n'est pas qu'un input de gamification : c'est une fonctionnalité produit à part entière (visible sur la fiche traiteur), donc une table hors du namespace `gamification_*` :

**`marketplace_reviews`** : `id, order_id (unique, fk → marketplace_orders), traiteur_id, author_id (fk → profiles), rating smallint check (1..5), comment text, created_at`.

Règles proposées :
- Un avis par commande, seulement une fois la commande `recuperee` (empêche de noter avant d'avoir été servi).
- Auteur = l'organisateur de la commande (`author_id = auth.uid()` et `order.user_id = auth.uid()`), immuable après création en v1 (pas d'édition — simplicité, on peut ajouter une fenêtre d'édition courte plus tard si besoin).
- Visible publiquement sur la fiche du traiteur si celui-ci est approuvé (même logique que les produits), sinon réservé aux deux parties.
- Pas de suppression via l'app en v1 — la modération se fait comme le reste de l'admin aujourd'hui (accès direct à la table), un vrai outil de modération pourra suivre.

## 10. Portée v1 proposée (valeurs de départ, toutes modifiables ensuite via `gamification_rules` sans toucher au code)

**Événements émis** (traiteur) : `ORDER_RESPONDED`, `ORDER_COMPLETED`, `ORDER_CANCELLED_BY_TRAITEUR`, `REVIEW_RECEIVED`, `MESSAGE_RESPONDED`.
**Événements émis** (organisateur) : `ORDER_CREATED`, `ORDER_COMPLETED_AS_CLIENT`, `ORDER_CANCELLED_BY_CLIENT`, `REVIEW_LEFT`, `MESSAGE_RESPONDED`.

**Métriques traiteur** : fiabilité (part de commandes non annulées par lui), réactivité (généralise le badge actuel), qualité (moyenne des avis, lissée), activité (volume + organisateurs distincts, **échelle logarithmique** pour ne pas sur-récompenser le pur volume — exigence explicite du brief), régularité (stabilité des métriques dans le temps, pas juste un pic ponctuel).

**Métriques organisateur** : fiabilité (part de commandes non annulées par lui), communication (réactivité dans le chat), fidélité (commandes répétées chez un même traiteur), activité (volume, plafonné/log-scalé pour la même raison), respect des règles (proxy = absence de signalement anti-abus tant qu'il n'y a pas de règles de plateforme plus explicites).

**XP** (illustratif — ce sont des lignes de `gamification_rules`, pas du code) : commande complétée +20, réponse rapide (<15 min) +10, annulation traiteur −15, avis ≥4★ +15, avis ≤2★ −5 (volontairement peu punitif — le brief interdit la "frustration excessive"). Deux mécanismes transverses en plus des événements bruts : un **bonus de progression personnelle** (comparaison fenêtre courante vs fenêtre précédente sur une métrique) et un **bonus de régularité** (maintien d'un excellent niveau sur plusieurs fenêtres) — ce sont les deux mécanismes qui répondent explicitement au §6 du brief ("ne pas pénaliser qui n'a plus de marge de progression").

**Niveaux** (noms placeholder, à valider) : Débutant → Confirmé → Expert → Élite, mêmes paliers structurels pour les deux types d'utilisateurs, seuils spécifiques par type.

**Fenêtre temporelle** : adaptative — 90j, puis 180j/365j/tout l'historique si l'échantillon reste sous le seuil minimal (par défaut 5 événements).

---

Prêt à démarrer l'implémentation de la **vague 1** (`marketplace_reviews` + `gamification_events` + `gamification_rules` + `gamification_xp_ledger` + `gamification_levels` + `gamification_subject_state`, instrumentation des server actions existantes, lecture "Mon score" v2) dès ton feu vert.
