-- ============================================================
-- Lehaim — les plats apportés par la personne qui prend une mission
--
-- Une seule table touchée, en une passe : le verrou est court.
-- `dish_keys` renvoie au catalogue illustré de lib/dishes.ts (plusieurs
-- plats possibles pour une même mission) ; `dish_custom` recueille le plat
-- saisi à la main quand aucune vignette ne convient.
-- Idempotent : rejouable sans risque, y compris si une première version
-- n'ajoutant que `dish_key` est déjà passée.
-- ============================================================

set lock_timeout = '5s';

alter table public.mission_claims add column if not exists dish_keys text[];
alter table public.mission_claims add column if not exists dish_custom text;

-- Reprise de la colonne unique de la première version, si elle existe.
do $$
begin
  if exists (
    select 1 from information_schema.columns
     where table_schema = 'public' and table_name = 'mission_claims' and column_name = 'dish_key'
  ) then
    update public.mission_claims
       set dish_keys = array[dish_key]
     where dish_key is not null and dish_keys is null;
    alter table public.mission_claims drop column dish_key;
  end if;
end
$$;
