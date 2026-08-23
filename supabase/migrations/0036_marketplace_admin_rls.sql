-- ============================================================
-- Lehaim — Marketplace traiteurs, accès administrateur
--
-- La migration 0035 portait les tables et leurs politiques telles quelles
-- depuis lehaim-marketplace : propriétaire et client seulement, aucun accès
-- admin. Ça convenait tant qu'aucun écran d'administration n'existait ici.
-- La validation des dossiers (/admin/validation) en a besoin pour voir et
-- décider des traiteurs "pending" qu'il ne possède pas.
--
-- On réutilise is_admin() (0011_backoffice.sql), déjà utilisé par tout le
-- reste du back-office de ce dépôt — pas de second mécanisme d'admin
-- (lehaim-marketplace utilisait marketplace_admins/is_marketplace_admin(),
-- qui n'existe pas ici et qu'on ne recrée pas).
--
-- Idempotent : relançable sans casse.
-- ============================================================

drop policy if exists "L'administration voit tous les traiteurs" on public.traiteurs;
create policy "L'administration voit tous les traiteurs"
  on public.traiteurs for select
  to authenticated
  using (public.is_admin());

drop policy if exists "L'administration décide des dossiers traiteurs" on public.traiteurs;
create policy "L'administration décide des dossiers traiteurs"
  on public.traiteurs for update
  to authenticated
  using (public.is_admin());

drop policy if exists "L'administration voit tous les produits" on public.traiteur_products;
create policy "L'administration voit tous les produits"
  on public.traiteur_products for select
  to authenticated
  using (public.is_admin());
