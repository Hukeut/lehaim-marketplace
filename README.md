# Lehaim

Organiser un Shabbat à plusieurs : l'hôte fixe la date et le lieu, invite par
lien WhatsApp ou par code, et chacun choisit ce qu'il apporte.

Le périmètre est **privé** : il n'y a ni Shabbat public, ni annuaire d'hôtes,
ni communauté. C'est inscrit jusque dans le schéma — `shabbats.visibility`
n'accepte que `invite` ou `link`, aucune valeur publique n'est représentable.

Next.js 16 (App Router) · React 19 · Supabase · next-intl · Tailwind 4.
Cinq langues à parité : français, anglais, espagnol, hébreu (RTL), russe.

## Démarrer

Node 22 (voir `.nvmrc`).

```bash
npm ci
cp .env.example .env.local   # puis renseigner les deux variables
npm run dev
```

`predev` fabrique `lib/updates.generated.json` à partir de l'historique git —
c'est ce qui alimente l'écran `/admin/mises-a-jour`. Le fichier n'est pas
versionné : il contient l'historique jusqu'au dernier commit, le versionner
obligerait à le recommitter après chaque commit.

## Commandes

| | |
|---|---|
| `npm run dev` | serveur de développement |
| `npm run build` | construction de production |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | typecheck |
| `npm run i18n:check` | parité des clés entre les cinq langues **et** texte en dur |
| `npm run i18n:missing` | clés manquantes, langue par langue |
| `npm run test:rls` | 15 vérifications d'autorisation contre la base liée |
| `npm run updates` | régénère le journal des mises à jour |

`npm run test:rls` s'exécute dans une transaction qui s'annule toujours : il
ne laisse rien en base, y compris lancé contre la production. Il demande une
CLI Supabase authentifiée et un projet lié (voir plus bas).

## Vérifications automatiques

`.github/workflows/deploy.yml` fait tourner lint, typecheck et parité des
traductions **sur toutes les branches**, avant tout déploiement. Le job de
déploiement n'écoute que `main`, `v2` et `refonte-aout` ; seule `v2` part en
production, le reste en préversion.

Next 16 n'exécute plus ESLint pendant `next build` : c'est l'étape de CI qui
l'applique. Le typecheck, lui, tourne à l'intérieur de `vercel build`, et
`next.config.ts` ne désactive ni `typescript.ignoreBuildErrors` ni
`eslint.ignoreDuringBuilds`.

## Base de données

Supabase (Postgres 17). Les migrations vivent dans `supabase/migrations`.

**Ne jamais lancer `supabase db push`** sur ce projet : l'historique n'est pas
enregistré côté serveur, la CLI croirait devoir tout rejouer depuis `0001`.
La procédure, les pièges et l'état réel du schéma sont dans
[docs/base-de-donnees.md](docs/base-de-donnees.md).

Pour lier la CLI :

```bash
npx supabase login
npx supabase link --project-ref <ref du projet>
```

## Repères de code

| | |
|---|---|
| `app/` | routes App Router, et les Server Actions à la racine |
| `components/` | design system et composants partagés |
| `lib/` | accès aux données, i18n, gabarits — protégé par `server-only` |
| `messages/` | les cinq catalogues de traduction |
| `proxy.ts` | session Supabase, résolution de langue, chemins publics |
| `supabase/` | migrations et tests d'autorisation |

Deux conventions valent d'être connues avant de toucher au code.

**Toute lecture ou écriture Supabase passe par `run()`** (`lib/db.ts`), qui lit
l'erreur et la journalise. Sans lui, une écriture refusée par RLS produit
exactement la même expérience qu'un succès — la page se rafraîchit, sans le
changement, sans un mot. Deux bugs ont vécu des mois dans ce silence.

**L'autorisation vit dans les politiques RLS**, pas dans les Server Actions ;
`lib/access.ts` ne sert qu'à l'affichage. Toute modification de politique
appelle donc un test dans `supabase/tests/rls.sql`.
