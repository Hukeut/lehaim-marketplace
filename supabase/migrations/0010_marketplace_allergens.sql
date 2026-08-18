-- ============================================================
-- Lehaim — Allergènes sur les fiches produits (badges côté catalogue)
-- Idempotent : relançable sans casse.
-- ============================================================

alter table public.traiteur_products
  add column if not exists allergens text[] not null default '{}';
