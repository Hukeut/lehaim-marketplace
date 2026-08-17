-- ============================================================
-- Lehaim — correction de la politique de lecture des shabbats
--
-- Symptôme : créer un Chabbat depuis l'app échouait avec
--   42501 · new row violates row-level security policy for table "shabbats"
-- alors qu'une insertion REST équivalente passait.
--
-- Cause : l'app fait `insert(...).select("id")`. PostgreSQL évalue alors
-- AUSSI la politique SELECT sur la ligne retournée, et signale son échec
-- avec le message d'erreur de WITH CHECK — d'où la fausse piste.
-- Or `shabbats_select` appelait `is_member(id)`, fonction STABLE qui relit
-- `shabbats` : dans l'instantané de l'instruction en cours, la ligne
-- fraîchement insérée n'existe pas encore, donc la fonction renvoyait faux.
--
-- Correctif : pour le cas de l'hôte, on lit directement `host_id`, colonne
-- de la ligne elle-même — disponible immédiatement. Le cas de l'invité
-- reste dans une fonction SECURITY DEFINER, qui interroge une autre table
-- et évite la récursion entre politiques.
-- ============================================================

create or replace function public.is_guest_of(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from invitations i
    where i.shabbat_id = sid and i.guest_id = (select auth.uid())
  );
$$;

revoke all on function public.is_guest_of(uuid) from public;
grant execute on function public.is_guest_of(uuid) to authenticated;

drop policy if exists shabbats_select on public.shabbats;
create policy shabbats_select on public.shabbats for select to authenticated
  using (
    host_id = (select auth.uid())
    or public.is_guest_of(id)
  );
