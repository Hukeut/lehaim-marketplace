-- ============================================================
-- Lehaim — Favoris marketplace
--
-- Reprend le même modèle que shop_favorites côté main (profile_id +
-- shop_id), adapté aux traiteurs. Un favori n'appartient qu'à celui qui l'a
-- posé : aucune politique n'ouvre la table à qui que ce soit d'autre, pas
-- même au traiteur concerné — savoir qui vous suit n'est pas la même chose
-- que savoir combien.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.traiteur_favorites (
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  traiteur_id uuid not null references public.traiteurs(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (profile_id, traiteur_id)
);

create index if not exists traiteur_favorites_profile_idx
  on public.traiteur_favorites (profile_id);

alter table public.traiteur_favorites enable row level security;

drop policy if exists "Chacun voit ses propres favoris" on public.traiteur_favorites;
create policy "Chacun voit ses propres favoris"
  on public.traiteur_favorites for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "Chacun pose ses propres favoris" on public.traiteur_favorites;
create policy "Chacun pose ses propres favoris"
  on public.traiteur_favorites for insert
  to authenticated
  with check (profile_id = auth.uid());

drop policy if exists "Chacun retire ses propres favoris" on public.traiteur_favorites;
create policy "Chacun retire ses propres favoris"
  on public.traiteur_favorites for delete
  to authenticated
  using (profile_id = auth.uid());
