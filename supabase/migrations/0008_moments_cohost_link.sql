-- ============================================================
-- Lehaim — détail des moments, lien de co-organisateur
--
-- 1. Un moment porte désormais son heure de rendez-vous, et le couchage
--    précise combien de places et pour qui.
-- 2. Un jeton distinct du lien d'invitation permet de nommer quelqu'un
--    co-organisateur : on ne veut pas que le lien envoyé à tout le groupe
--    donne les droits de gestion.
-- Idempotent.
--
-- À exécuter en TROIS passes séparées dans l'éditeur SQL : celui-ci enveloppe
-- tout le script dans une seule transaction, et garder en même temps les
-- verrous exclusifs de `moments` et de `shabbats` provoque un interblocage
-- avec l'application en production. Le `lock_timeout` fait échouer vite plutôt
-- que d'attendre indéfiniment.
-- ============================================================

-- ------------------------------------------------------------
-- Passe 1 · Détail des moments
-- ------------------------------------------------------------
set lock_timeout = '5s';

-- Heure de rendez-vous propre au moment : le déjeuner de samedi et les
-- offices n'ont pas lieu à l'heure du dîner de vendredi.
alter table public.moments add column if not exists meet_at time;

-- Couchage : combien de places, et pour qui.
alter table public.moments add column if not exists capacity int;
alter table public.moments add column if not exists sleeping_policy text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'moments_capacity_check') then
    alter table public.moments add constraint moments_capacity_check
      check (capacity is null or capacity between 0 and 60);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'moments_sleeping_policy_check') then
    alter table public.moments add constraint moments_sleeping_policy_check
      check (sleeping_policy is null or sleeping_policy in ('mixed', 'girls', 'boys'));
  end if;
end
$$;

-- ------------------------------------------------------------
-- Passe 2 · Lien de co-organisateur (colonne et jetons)
-- ------------------------------------------------------------
set lock_timeout = '5s';
alter table public.shabbats add column if not exists cohost_token text;

update public.shabbats
   set cohost_token = encode(gen_random_bytes(8), 'hex')
 where cohost_token is null;

alter table public.shabbats alter column cohost_token set default encode(gen_random_bytes(8), 'hex');
alter table public.shabbats alter column cohost_token set not null;

create unique index if not exists shabbats_cohost_token_idx
  on public.shabbats (cohost_token);

-- ------------------------------------------------------------
-- Passe 3 · Fonctions (aucun verrou de table)
-- ------------------------------------------------------------

/**
 * Promeut la personne connectée au rang de co-organisateur. Le jeton est
 * distinct de `share_token` : le lien d'invitation envoyé au groupe ne doit
 * jamais conférer de droits de gestion.
 */
create or replace function public.become_cohost(token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  me     uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'authentification requise';
  end if;

  select s.id into target from shabbats s where s.cohost_token = token limit 1;
  if target is null then
    return null;
  end if;

  -- L'hôte principal l'est déjà : rien à faire.
  if exists (select 1 from shabbats s where s.id = target and s.host_id = me) then
    return target;
  end if;

  insert into invitations (shabbat_id, guest_id, status, is_cohost)
  values (target, me, 'confirmed', true)
  on conflict (shabbat_id, guest_id) where guest_id is not null
  do update set is_cohost = true, status = 'confirmed';

  return target;
end;
$$;

revoke all on function public.become_cohost(text) from public;
grant execute on function public.become_cohost(text) to authenticated;

/** Aperçu du lien de co-organisation, avant connexion. */
create or replace function public.cohost_preview(token text)
returns table (title text, starts_at timestamptz, host_name text)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.title,
    s.starts_at,
    coalesce(nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Votre hôte')
  from shabbats s
  left join profiles p on p.id = s.host_id
  where s.cohost_token = token
  limit 1;
$$;

revoke all on function public.cohost_preview(text) from public;
grant execute on function public.cohost_preview(text) to anon, authenticated;
