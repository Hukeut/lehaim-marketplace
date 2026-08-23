-- ============================================================
-- Lehaim — Réparer `/admin/utilisateurs` : la colonne `locale` manquait
--
-- Trouvé en interrogeant la base, pas le code. `admin_user_list()` (0012)
-- sélectionne `p.locale` :
--
--   ERROR: 42703: column p.locale does not exist
--   HINT:  Perhaps you meant to reference the column "p.role".
--
-- L'écran /admin/utilisateurs échouait donc en bloc, depuis toujours.
--
-- La colonne n'est déclarée nulle part : ni dans 0001, qui documente pourtant
-- l'héritage de la v1, ni dans 0007_onboarding qui ajoute le reste du profil
-- enrichi. Elle a simplement été supposée par le code.
--
-- Second effet, plus discret : `switchLanguage` (app/actions.ts:358) écrit
-- `{ locale }` dans `profiles` sans jamais lire l'erreur retournée. Le choix
-- de langue échouait donc en silence à chaque fois — il ne survivait que par
-- le cookie `NEXT_LOCALE`, ce qui le perdait sur un autre appareil. C'est un
-- cas d'école du défaut relevé par l'audit : 62 écritures Supabase pour 14
-- lectures de `error`.
--
-- Nullable à dessein : une valeur nulle signifie « pas encore choisi », et la
-- résolution retombe alors sur le cookie puis sur `Accept-Language`, comme le
-- fait déjà `proxy.ts`. Aucun remplissage rétroactif : on n'invente pas une
-- préférence que personne n'a exprimée.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

alter table public.profiles add column if not exists locale text;

alter table public.profiles drop constraint if exists profiles_locale_check;

-- Doit rester aligné sur LOCALES dans lib/i18n/locale.ts.
alter table public.profiles add constraint profiles_locale_check
  check (locale is null or locale in ('fr', 'en', 'es', 'he', 'ru'));
