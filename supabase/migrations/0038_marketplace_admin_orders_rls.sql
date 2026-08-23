-- ============================================================
-- Lehaim — Pilotage admin : accès aux commandes tous traiteurs
--
-- marketplace_orders n'ouvrait sa lecture qu'au client et au traiteur
-- propriétaire (0035) : /admin/pilotage, qui doit voir les commandes en
-- cours de tous les traiteurs, ne verrait sinon rien. Même logique que
-- 0036 pour traiteurs/traiteur_products : is_admin(), pas de second
-- mécanisme d'admin.
--
-- Idempotent : relançable sans casse.
-- ============================================================

drop policy if exists "L'administration voit toutes les commandes" on public.marketplace_orders;
create policy "L'administration voit toutes les commandes"
  on public.marketplace_orders for select
  to authenticated
  using (public.is_admin());
