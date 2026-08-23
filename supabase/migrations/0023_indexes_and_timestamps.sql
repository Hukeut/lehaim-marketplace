-- ============================================================
-- Lehaim — P3 · Index de clés étrangères et horodatage
--
-- Postgres n'indexe pas automatiquement le côté enfant d'une clé étrangère.
-- Conséquence concrète : toute suppression d'une ligne parente impose un
-- balayage séquentiel de la table enfant pour vérifier la contrainte. Sur
-- `profiles`, cinq tables étaient dans ce cas — donc supprimer un compte les
-- parcourait toutes intégralement.
--
-- Les tables héritées de la v1 (`messages`, `support_*`) sont laissées de
-- côté : elles ne sont plus lues, les indexer ne servirait personne.
--
-- S'ajoutent `updated_at` sur les deux tables qu'on modifie le plus, avec le
-- trigger qui l'entretient. Sans lui, rien ne dit quand une ligne a bougé —
-- ce qui manquera le jour où on voudra notifier « l'hôte a changé l'heure ».
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Clés étrangères non indexées
-- ------------------------------------------------------------

create index if not exists contributions_profile_idx on public.contributions (profile_id);
create index if not exists equipment_claimed_by_idx  on public.equipment (claimed_by) where claimed_by is not null;
create index if not exists expenses_paid_by_idx      on public.expenses (paid_by) where paid_by is not null;
create index if not exists expenses_mission_idx      on public.expenses (mission_id) where mission_id is not null;
create index if not exists missions_moment_idx       on public.missions (moment_id) where moment_id is not null;
create index if not exists suggestions_author_idx    on public.suggestions (author_id);
create index if not exists swaps_from_idx            on public.swaps (from_id);
create index if not exists swaps_to_idx              on public.swaps (to_id) where to_id is not null;

-- Les jetons servent au chemin d'entrée principal du produit — le lien reçu
-- par WhatsApp. Ils sont uniques, donc déjà indexés ; on le vérifie ici plutôt
-- que de le supposer.
create unique index if not exists shabbats_share_token_idx  on public.shabbats (share_token);
create unique index if not exists shabbats_cohost_token_idx on public.shabbats (cohost_token);

-- ------------------------------------------------------------
-- 2 · Horodatage des modifications
-- ------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.shabbats    add column if not exists updated_at timestamptz not null default now();
alter table public.invitations add column if not exists updated_at timestamptz not null default now();

drop trigger if exists touch_shabbats on public.shabbats;
create trigger touch_shabbats
  before update on public.shabbats
  for each row execute function public.touch_updated_at();

drop trigger if exists touch_invitations on public.invitations;
create trigger touch_invitations
  before update on public.invitations
  for each row execute function public.touch_updated_at();
