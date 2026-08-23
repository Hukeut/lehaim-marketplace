-- ============================================================
-- Lehaim — Marketplace traiteurs, portée depuis lehaim-marketplace
--
-- Contexte : deux dépôts ont avancé en parallèle sur la marketplace.
-- Celui-ci (Rraven666/lehaim, branche main) a surtout avancé côté
-- design (écrans /admin/boutique, /admin/carte, /admin/creneaux,
-- /admin/service sur les commerces "shops"). L'autre (lehaim-marketplace)
-- a le back-end testé et corrigé : c'est son schéma qu'on reprend ici,
-- tel quel (tables traiteurs / traiteur_products / traiteur_slots /
-- marketplace_orders / marketplace_order_items), pour rebrancher les
-- écrans de Rraven dessus.
--
-- Ne touche pas aux tables shops/shop_products/orders existantes : elles
-- restent en place, migration séparée le jour où on les retire.
--
-- Portée : uniquement le nécessaire au back-office marchand (boutique,
-- carte, créneaux, service). Les avis, la gamification et la validation
-- admin des traiteurs viendront avec les phases suivantes.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.traiteurs (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null references public.profiles(id) on delete cascade,
  name                text not null,
  address             text,
  phone               text,
  patente_number      text,
  hechsher_name       text,
  delivery_available  boolean not null default false,
  delivery_zone       text,
  status              text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rejection_reason    text,
  -- Ajouts propres au portage de l'écran "Ma boutique" (Rraven) :
  city                text,
  description         text,
  paused              boolean not null default false,
  prep_minutes        integer not null default 20,
  logo_url            text,
  cover_url           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table if not exists public.traiteur_products (
  id            uuid primary key default gen_random_uuid(),
  traiteur_id   uuid not null references public.traiteurs(id) on delete cascade,
  title         text not null,
  description   text,
  price         numeric(10, 2) not null default 0,
  image_url     text,
  category      text not null default 'plat' check (category in ('plat', 'entree', 'salade', 'dessert', 'boisson', 'autre')),
  quantity_hint text,
  active        boolean not null default true,
  -- Note interne, visible du seul commerçant (écran "Ma carte", Rraven).
  workshop_note text,
  created_at    timestamptz not null default now()
);

create table if not exists public.traiteur_slots (
  id          uuid primary key default gen_random_uuid(),
  traiteur_id uuid not null references public.traiteurs(id) on delete cascade,
  slot_date   date not null,
  slot_label  text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists traiteur_slots_unique
  on public.traiteur_slots (traiteur_id, slot_date, slot_label);

create index if not exists traiteur_slots_traiteur_idx
  on public.traiteur_slots (traiteur_id, slot_date);

create table if not exists public.marketplace_orders (
  id              uuid primary key default gen_random_uuid(),
  traiteur_id     uuid not null references public.traiteurs(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  status          text not null default 'nouvelle' check (status in ('nouvelle', 'acceptee', 'en_preparation', 'prete', 'recuperee', 'annulee')),
  fulfillment     text not null default 'retrait' check (fulfillment in ('retrait', 'livraison')),
  pickup_date     date,
  pickup_slot     text,
  total_amount    numeric(10, 2) not null default 0,
  notes           text,
  -- Qui a annulé (le client ou le traiteur) — sert aussi au refus, qui
  -- réutilise "annulee" plutôt que d'ajouter un statut supplémentaire.
  cancelled_by    text check (cancelled_by in ('client', 'traiteur')),
  refusal_reason  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.marketplace_order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.marketplace_orders(id) on delete cascade,
  product_id  uuid references public.traiteur_products(id) on delete set null,
  title       text not null,
  price       numeric(10, 2) not null default 0,
  quantity    integer not null default 1
);

alter table public.traiteurs enable row level security;
alter table public.traiteur_products enable row level security;
alter table public.traiteur_slots enable row level security;
alter table public.marketplace_orders enable row level security;
alter table public.marketplace_order_items enable row level security;

-- ------------------------------------------------------------
-- traiteurs
-- ------------------------------------------------------------
drop policy if exists "Traiteurs approuvés visibles par tous" on public.traiteurs;
create policy "Traiteurs approuvés visibles par tous"
  on public.traiteurs for select
  to authenticated
  using (status = 'approved' or owner_id = auth.uid());

drop policy if exists "Le propriétaire crée son établissement" on public.traiteurs;
create policy "Le propriétaire crée son établissement"
  on public.traiteurs for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "Le propriétaire modifie son établissement" on public.traiteurs;
create policy "Le propriétaire modifie son établissement"
  on public.traiteurs for update
  to authenticated
  using (owner_id = auth.uid());

-- ------------------------------------------------------------
-- traiteur_products
-- ------------------------------------------------------------
drop policy if exists "Produits visibles si traiteur approuvé" on public.traiteur_products;
create policy "Produits visibles si traiteur approuvé"
  on public.traiteur_products for select
  to authenticated
  using (
    exists (
      select 1 from public.traiteurs t
      where t.id = traiteur_id and (t.status = 'approved' or t.owner_id = auth.uid())
    )
  );

drop policy if exists "Le propriétaire ajoute ses produits" on public.traiteur_products;
create policy "Le propriétaire ajoute ses produits"
  on public.traiteur_products for insert
  to authenticated
  with check (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

drop policy if exists "Le propriétaire modifie ses produits" on public.traiteur_products;
create policy "Le propriétaire modifie ses produits"
  on public.traiteur_products for update
  to authenticated
  using (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

drop policy if exists "Le propriétaire supprime ses produits" on public.traiteur_products;
create policy "Le propriétaire supprime ses produits"
  on public.traiteur_products for delete
  to authenticated
  using (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- traiteur_slots
-- ------------------------------------------------------------
drop policy if exists "Créneaux visibles si traiteur approuvé" on public.traiteur_slots;
create policy "Créneaux visibles si traiteur approuvé"
  on public.traiteur_slots for select
  to authenticated
  using (
    exists (
      select 1 from public.traiteurs t
      where t.id = traiteur_id and (t.status = 'approved' or t.owner_id = auth.uid())
    )
  );

drop policy if exists "Le propriétaire ajoute ses créneaux" on public.traiteur_slots;
create policy "Le propriétaire ajoute ses créneaux"
  on public.traiteur_slots for insert
  to authenticated
  with check (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

drop policy if exists "Le propriétaire supprime ses créneaux" on public.traiteur_slots;
create policy "Le propriétaire supprime ses créneaux"
  on public.traiteur_slots for delete
  to authenticated
  using (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- marketplace_orders
-- ------------------------------------------------------------
drop policy if exists "Commandes visibles par client ou traiteur" on public.marketplace_orders;
create policy "Commandes visibles par client ou traiteur"
  on public.marketplace_orders for select
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

drop policy if exists "Le client crée sa commande" on public.marketplace_orders;
create policy "Le client crée sa commande"
  on public.marketplace_orders for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "Client ou traiteur met à jour la commande" on public.marketplace_orders;
create policy "Client ou traiteur met à jour la commande"
  on public.marketplace_orders for update
  to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

-- ------------------------------------------------------------
-- marketplace_order_items
-- ------------------------------------------------------------
drop policy if exists "Lignes visibles via la commande" on public.marketplace_order_items;
create policy "Lignes visibles via la commande"
  on public.marketplace_order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.marketplace_orders o
      left join public.traiteurs t on t.id = o.traiteur_id
      where o.id = order_id and (o.user_id = auth.uid() or t.owner_id = auth.uid())
    )
  );

drop policy if exists "Le client ajoute des lignes à sa commande" on public.marketplace_order_items;
create policy "Le client ajoute des lignes à sa commande"
  on public.marketplace_order_items for insert
  to authenticated
  with check (
    exists (select 1 from public.marketplace_orders o where o.id = order_id and o.user_id = auth.uid())
  );
