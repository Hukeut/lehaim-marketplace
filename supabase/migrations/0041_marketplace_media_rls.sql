-- ============================================================
-- Lehaim — Dépôt d'images pour les traiteurs, dans le seau existant
--
-- `shop-media` (0025_market_stockage_contrat.sql) n'autorisait le dépôt qu'au
-- propriétaire lu via `owns_shop()`, qui interroge la table `shops` — pas
-- `traiteurs`. Un traiteur qui dépose son logo ou la photo d'un produit sous
-- son propre id se serait vu refuser l'écriture. Même schéma que
-- `owns_shop()` : SECURITY DEFINER, une seule table.
--
-- Le seau reste public en lecture (policy déjà en place, pas de changement),
-- et la convention de chemin ne bouge pas : `{traiteur_id}/{fichier}`.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create or replace function public.owns_traiteur(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from traiteurs t
     where t.id = target and t.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_traiteur(uuid) from public;
revoke execute on function public.owns_traiteur(uuid) from anon;
grant execute on function public.owns_traiteur(uuid) to authenticated;

drop policy if exists shop_media_owner on storage.objects;
create policy shop_media_owner on storage.objects for all to authenticated
  using (
    bucket_id = 'shop-media'
    and (
      public.owns_shop(public.shop_of_path(name))
      or public.owns_traiteur(public.shop_of_path(name))
      or public.is_admin()
    )
  )
  with check (
    bucket_id = 'shop-media'
    and (
      public.owns_shop(public.shop_of_path(name))
      or public.owns_traiteur(public.shop_of_path(name))
      or public.is_admin()
    )
  );
