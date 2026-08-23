-- ============================================================
-- Lehaim — Avis client sur une commande
--
-- Porté depuis lehaim-marketplace (0018_marketplace_reviews.sql) tel quel :
-- un avis par commande, uniquement une fois celle-ci récupérée, immuable une
-- fois posé (pas de policy update/delete — modération via l'éditeur de
-- tables Supabase). Le hook de gamification de lehaim-marketplace
-- (handleReviewSubmitted) n'est pas repris ici : voir la migration dédiée
-- si/quand la gamification est portée.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.marketplace_reviews (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null unique references public.marketplace_orders(id) on delete cascade,
  traiteur_id uuid not null references public.traiteurs(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  rating      smallint not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);

create index if not exists marketplace_reviews_traiteur_idx
  on public.marketplace_reviews (traiteur_id, created_at desc);

alter table public.marketplace_reviews enable row level security;

drop policy if exists "Avis visibles par les parties ou publiquement si approuvé" on public.marketplace_reviews;
create policy "Avis visibles par les parties ou publiquement si approuvé"
  on public.marketplace_reviews for select
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.traiteurs t
      where t.id = traiteur_id and (t.status = 'approved' or t.owner_id = auth.uid())
    )
  );

drop policy if exists "Le client note sa commande récupérée" on public.marketplace_reviews;
create policy "Le client note sa commande récupérée"
  on public.marketplace_reviews for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from public.marketplace_orders o
      where o.id = order_id
        and o.user_id = auth.uid()
        and o.status = 'recuperee'
        and o.traiteur_id = traiteur_id
    )
  );
