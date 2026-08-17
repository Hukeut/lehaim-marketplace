-- ============================================================
-- Lehaim — Onboarding v2
--
-- Les réponses des deux parcours (création de compte obligatoire,
-- profil enrichi facultatif) se rangent sur `public.profiles`,
-- héritée de la version précédente.
--
-- Toutes les colonnes sont nullables et sans valeur par défaut :
-- l'app v1 continue de fonctionner sans rien savoir d'elles.
-- On ne touche PAS à `role`, contrainte à ('participant','organizer')
-- et déjà lue par la v1 — l'hôte/invité vit dans `hosting_style`.
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- A · Création de compte (4 questions obligatoires)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists country_code      text;
alter table public.profiles add column if not exists shabbat_frequency text;
alter table public.profiles add column if not exists hosting_style     text;

-- ------------------------------------------------------------
-- B · Profil enrichi (4 questions facultatives)
-- ------------------------------------------------------------
alter table public.profiles add column if not exists dish_specialty  text;
alter table public.profiles add column if not exists diet_tags       text[];
alter table public.profiles add column if not exists synagogue_habit text;
alter table public.profiles add column if not exists content_pref    text;

-- ------------------------------------------------------------
-- Progression : permet l'écran de reprise (O07) et de ne proposer
-- le profil enrichi qu'une seule fois.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists onboarding_step           text;
alter table public.profiles add column if not exists onboarding_done_at        timestamptz;
alter table public.profiles add column if not exists profile_survey_done_at    timestamptz;
alter table public.profiles add column if not exists profile_survey_skipped_at timestamptz;

-- ------------------------------------------------------------
-- Domaines de valeurs
-- ------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_shabbat_frequency_check') then
    alter table public.profiles add constraint profiles_shabbat_frequency_check
      check (shabbat_frequency in ('weekly','biweekly','sometimes','discovering'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_hosting_style_check') then
    alter table public.profiles add constraint profiles_hosting_style_check
      check (hosting_style in ('host','guest','both'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_dish_specialty_check') then
    alter table public.profiles add constraint profiles_dish_specialty_check
      check (dish_specialty in ('wine','dessert','cooked','bought'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_diet_tags_check') then
    alter table public.profiles add constraint profiles_diet_tags_check
      check (diet_tags <@ array['casher','vegetarien','sans-gluten','sans-lactose']::text[]);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_synagogue_habit_check') then
    alter table public.profiles add constraint profiles_synagogue_habit_check
      check (synagogue_habit in ('always','sometimes','rarely','never'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_content_pref_check') then
    alter table public.profiles add constraint profiles_content_pref_check
      check (content_pref in ('recipes','places','both'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'profiles_onboarding_step_check') then
    alter table public.profiles add constraint profiles_onboarding_step_check
      check (onboarding_step in ('prenom','telephone','frequence','role','done'));
  end if;
end
$$;
