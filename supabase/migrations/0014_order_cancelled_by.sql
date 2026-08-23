-- ============================================================
-- Lehaim — Qui a annulé la commande ?
--
-- Une commande peut être annulée par le client ou par le traiteur ;
-- on garde une trace de qui, pour l'afficher dans « Mes commandes ».
-- Idempotent : relançable sans casse.
-- ============================================================

alter table public.marketplace_orders
  add column if not exists cancelled_by text check (cancelled_by in ('client', 'traiteur'));
