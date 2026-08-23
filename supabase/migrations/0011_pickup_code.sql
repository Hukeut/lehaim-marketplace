-- ============================================================
-- Lehaim — Code de retrait par Shabbat
--
-- Chaque Shabbat reçoit un code court (ex. "4821"), généré à sa
-- création et unique parmi tous les Shabbats existants. Ce code est
-- recopié sur chaque commande marketplace qui lui est rattachée :
-- le traiteur voit ce code au lieu du nom du client dans son suivi
-- de commandes, pour préserver la confidentialité.
-- Idempotent : relançable sans casse.
-- ============================================================

alter table public.shabbats add column if not exists pickup_code text;

-- Index unique partiel : autorise plusieurs NULL (anciens Shabbats sans
-- code) tout en garantissant l'unicité de chaque code généré.
create unique index if not exists shabbats_pickup_code_key
  on public.shabbats (pickup_code)
  where pickup_code is not null;

alter table public.marketplace_orders
  add column if not exists shabbat_id uuid references public.shabbats(id) on delete set null;

alter table public.marketplace_orders
  add column if not exists pickup_code text;
