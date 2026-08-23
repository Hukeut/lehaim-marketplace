-- ============================================================
-- Lehaim — Adresse de livraison dédiée sur les commandes
--
-- Jusqu'ici, l'adresse de livraison saisie par le client était repliée dans
-- `notes` (voir app/marketplace/actions.ts, createOrder) faute de colonne :
-- un pis-aller signalé dans le code (lib/merchant.ts, MerchantOrder.
-- deliveryAddress restait toujours à null) et dans l'affichage commerçant
-- (app/admin/service/page.tsx l'attendait déjà, sans jamais la recevoir).
--
-- Idempotent : relançable sans casse.
-- ============================================================

alter table public.marketplace_orders
  add column if not exists delivery_address text;
