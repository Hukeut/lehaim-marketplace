-- ============================================================
-- Lehaim — P0 · Verrouiller les colonnes de privilège
--
-- Deux politiques laissaient un utilisateur modifier sa propre ligne sans
-- restreindre les colonnes, alors que des colonnes de privilège y ont été
-- ajoutées depuis :
--
--   · `profiles_update`  (0001) + `profiles.back_office_role`      (0011)
--     → n'importe qui pouvait se poser `back_office_role = 'admin'`
--       et obtenir le back-office complet, dont `admin_user_list()`.
--
--   · `invitations_rsvp` (0001, reconduite en 0004) + `is_cohost` (0007)
--     → n'importe quel invité pouvait se poser `is_cohost = true`
--       et devenir gestionnaire du Chabbat.
--
-- Une politique RLS ne peut pas comparer l'ancienne et la nouvelle ligne :
-- `with check` ne voit que NEW. On passe donc par des triggers, qui ont accès
-- à OLD et à NEW.
--
-- Les fonctions légitimes qui écrivent ces colonnes — `admin_set_role()`,
-- `become_cohost()`, `join_by_code()`, `join_by_token()` — sont en
-- SECURITY DEFINER : leur corps s'exécute sous le rôle propriétaire, pas sous
-- `authenticated`. Les triggers s'en servent comme laissez-passer, ce qui
-- évite tout drapeau de session que le client pourrait poser lui-même.
--
-- Idempotent. Sans verrou long : `create trigger` ne réécrit pas les tables.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- Laissez-passer commun
-- ------------------------------------------------------------

/**
 * Vrai quand l'écriture vient directement du client (PostgREST se met en
 * `authenticated` ou `anon`), faux quand elle vient du corps d'une fonction
 * SECURITY DEFINER, qui s'exécute sous le rôle propriétaire.
 */
create or replace function public.is_client_write()
returns boolean
language sql
stable
set search_path = public
as $$
  select current_user in ('authenticated', 'anon');
$$;

-- ------------------------------------------------------------
-- profiles.back_office_role
-- ------------------------------------------------------------

-- SECURITY INVOKER (le défaut), et c'est tout l'intérêt : la fonction hérite
-- du rôle effectif au moment du déclenchement. Depuis PostgREST, c'est
-- `authenticated` ; depuis le corps d'une fonction SECURITY DEFINER, c'est le
-- propriétaire. La distinguer en SECURITY DEFINER rendrait le trigger inerte,
-- puisque `current_user` vaudrait alors toujours le propriétaire.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Écriture interne (admin_set_role) : on laisse passer.
  if not public.is_client_write() then
    return new;
  end if;

  if new.back_office_role is distinct from old.back_office_role then
    raise exception
      'back_office_role ne se modifie que par admin_set_role()'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_profile_privileges on public.profiles;
create trigger guard_profile_privileges
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- ------------------------------------------------------------
-- invitations : ce qu'un invité peut changer sur sa propre ligne
-- ------------------------------------------------------------

/**
 * Un invité répond à l'invitation et choisit où il dort — rien d'autre.
 *
 * On compare les deux lignes en JSON en neutralisant les colonnes autorisées,
 * plutôt que d'énumérer les colonnes interdites : toute colonne ajoutée plus
 * tard sera protégée par défaut, ce qui est exactement l'erreur que cette
 * migration corrige.
 */
-- SECURITY INVOKER, pour la même raison que ci-dessus.
create or replace function public.guard_invitation_privileges()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  -- Écriture interne (become_cohost, join_by_code, join_by_token).
  if not public.is_client_write() then
    return new;
  end if;

  -- L'hôte et les co-organisateurs gèrent les lignes des autres : c'est le
  -- rôle de la politique `invitations_write_host`, on ne s'en mêle pas.
  if new.guest_id is distinct from (select auth.uid()) then
    return new;
  end if;

  if public.is_host(new.shabbat_id) then
    return new;
  end if;

  if (to_jsonb(new) - 'status' - 'sleeping_room_id')
     is distinct from
     (to_jsonb(old) - 'status' - 'sleeping_room_id') then
    raise exception
      'sur sa propre invitation, seuls status et sleeping_room_id sont modifiables'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_invitation_privileges on public.invitations;
create trigger guard_invitation_privileges
  before update on public.invitations
  for each row execute function public.guard_invitation_privileges();

-- ------------------------------------------------------------
-- Ménage
-- ------------------------------------------------------------

-- Sonde de diagnostic de 0004, exécutable par tout compte authentifié :
-- elle divulguait la configuration RLS complète, ce qui aide surtout à
-- chercher les trous. Son commentaire la déclarait supprimable.
drop function if exists public.lehaim_policy_report();
