-- ============================================================
-- Lehaim — P1 · Les places d'apports et de couchage se tiennent en base
--
-- `claimMission` (app/mission-actions.ts) prend une place ainsi :
--
--   supabase.from("mission_claims")
--     .upsert({ mission_id, profile_id }, { onConflict: "mission_id,profile_id" })
--
-- L'unique `(mission_id, profile_id)` de 0003 empêche qu'une personne prenne
-- deux fois le même apport. Il n'empêche absolument pas que trois personnes
-- prennent deux places. Le seul garde-fou était visuel — `free > 0` dans
-- `app/shabbat/[id]/missions/page.tsx` — c'est-à-dire lu avant le clic, par
-- chaque convive séparément.
--
-- Deux personnes qui appuient en même temps sur le dernier apport le prennent
-- donc toutes les deux. Et personne ne s'en aperçoit : ça ne casse rien, ça
-- se découvre à table, avec deux plats identiques et un manquant. Même trou
-- sur `sleeping_rooms.capacity`, où `chooseRoom` a exactement la même forme.
--
-- Un `SELECT ... FOR UPDATE` sur la ligne parente sérialise les prétendants :
-- la seconde transaction attend la première, puis recompte. C'est le seul
-- endroit où cette garantie peut exister — l'application, elle, ne peut que
-- constater après coup.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Places d'un apport
-- ------------------------------------------------------------

create or replace function public.enforce_mission_slots()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  places integer;
  prises integer;
begin
  -- Le verrou porte sur la mission, pas sur les prises : c'est lui qui fait
  -- attendre la seconde transaction.
  select slots into places from missions where id = new.mission_id for update;
  if places is null then
    return new;
  end if;

  -- On s'exclut du décompte : l'upsert repasse par ce trigger quand quelqu'un
  -- met à jour sa propre prise (choix du plat), et il serait absurde de lui
  -- refuser sa place au motif qu'il l'occupe déjà.
  select count(*) into prises
    from mission_claims
   where mission_id = new.mission_id
     and profile_id <> new.profile_id;

  if prises >= places then
    raise exception 'cet apport est déjà complet' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_mission_slots on public.mission_claims;
create trigger enforce_mission_slots
  before insert on public.mission_claims
  for each row execute function public.enforce_mission_slots();

-- ------------------------------------------------------------
-- 2 · Capacité d'une chambre
-- ------------------------------------------------------------

create or replace function public.enforce_room_capacity()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  places integer;
  occupe integer;
begin
  -- Rien à vérifier quand on libère sa place, ni quand on ne bouge pas.
  if new.sleeping_room_id is null
     or new.sleeping_room_id is not distinct from old.sleeping_room_id then
    return new;
  end if;

  select capacity into places from sleeping_rooms where id = new.sleeping_room_id for update;
  if places is null then
    return new;
  end if;

  select count(*) into occupe
    from invitations
   where sleeping_room_id = new.sleeping_room_id
     and id <> new.id;

  if occupe >= places then
    raise exception 'cette chambre est déjà complète' using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_room_capacity on public.invitations;
create trigger enforce_room_capacity
  before update on public.invitations
  for each row execute function public.enforce_room_capacity();

-- ------------------------------------------------------------
-- 3 · Index de soutien
-- ------------------------------------------------------------
-- Le décompte ci-dessus lit les invitations par chambre, et `listRooms`
-- (lib/rooms.ts) fait la même chose à chaque affichage.

create index if not exists invitations_sleeping_room_idx
  on public.invitations (sleeping_room_id)
  where sleeping_room_id is not null;
