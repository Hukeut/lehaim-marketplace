-- ============================================================
-- Lehaim — P0 · Réparer la suppression de compte
--
-- `delete_my_account()` (0010) échouait pour la majorité des comptes.
--
-- Le mécanisme : `invitations.guest_id` est en `on delete set null` (0001),
-- pour ne pas effacer le travail des autres quand quelqu'un s'en va. Mais la
-- même migration pose
--
--     constraint invitations_identified
--       check (guest_id is not null or guest_name is not null)
--
-- et les fonctions d'entrée par lien ou par code — `join_by_token`,
-- `join_by_code`, `become_cohost` — insèrent `(shabbat_id, guest_id, status)`
-- sans jamais remplir `guest_name`. Au moment du `delete from auth.users`, la
-- cascade repassait `guest_id` à null, la contrainte était réévaluée sur
-- l'UPDATE et levait une 23514 : toute la transaction échouait, et
-- `components/DeleteAccount.tsx` affichait l'erreur Postgres brute.
--
-- Autrement dit : le droit à l'effacement était inopérant pour le parcours
-- d'entrée principal du produit.
--
-- On nomme donc l'invitation avant de partir, et on en profite pour purger le
-- téléphone — qui, lui, n'avait aucune raison de survivre à la suppression.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'authentification requise';
  end if;

  -- Les participations aux Chabbats des autres se détachent plutôt que de
  -- disparaître : le groupe garde son compte d'invités et l'historique de qui
  -- apportait quoi. Il faut donc qu'elles restent identifiables une fois
  -- `guest_id` à null — sans quoi la contrainte fait tout échouer.
  --
  -- Le nom générique est délibéré : c'est une anonymisation, pas une
  -- conservation. Le téléphone, lui, part.
  update public.invitations
     set guest_name  = coalesce(nullif(btrim(guest_name), ''), 'Invité'),
         guest_phone = null
   where guest_id = me;

  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
