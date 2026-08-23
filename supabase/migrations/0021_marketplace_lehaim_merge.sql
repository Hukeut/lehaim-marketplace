-- ============================================================
-- Lehaim-marketplace — Réconciliation avec les écrans portés depuis lehaim
--
-- Fusion ciblée « marketplace uniquement » : les écrans/back-end de lehaim
-- (app/admin/**, app/marketplace/**, app/partenaire/**, app/commandes/**,
-- app/panier/**, la gamification simplifiée) remplacent les écrans
-- équivalents de ce dépôt, mais restent branchés sur SON schéma et SON
-- mécanisme d'admin existants (marketplace_admins / is_marketplace_admin(),
-- voir 0009_marketplace_admin.sql) — pas de second mécanisme d'admin.
--
-- Cette migration n'ajoute que ce qui manque réellement : les colonnes que
-- les écrans portés attendent et qui n'existaient pas ici, la table de
-- favoris, le journal d'événements de commande, le seau de stockage des
-- photos, et les policies admin manquantes sur traiteur_products /
-- marketplace_orders (traiteurs les a déjà, via 0009).
--
-- Idempotent : relançable sans casse.
-- ============================================================

-- ------------------------------------------------------------
-- Colonnes additives attendues par les écrans portés
-- ------------------------------------------------------------

alter table public.traiteurs
  add column if not exists city         text,
  add column if not exists description  text,
  add column if not exists paused       boolean not null default false,
  add column if not exists prep_minutes integer not null default 20,
  add column if not exists logo_url     text,
  add column if not exists cover_url    text;

alter table public.traiteur_products
  add column if not exists workshop_note text;

-- cancelled_by existe déjà (0014_order_cancelled_by.sql) ; refusal_reason et
-- delivery_address sont nouveaux pour ce dépôt.
alter table public.marketplace_orders
  add column if not exists refusal_reason  text,
  add column if not exists delivery_address text;

alter table public.traiteur_slots
  add column if not exists capacity integer check (capacity is null or capacity > 0);

alter table public.marketplace_orders
  add column if not exists slot_id uuid references public.traiteur_slots(id) on delete set null;

create index if not exists marketplace_orders_slot_idx
  on public.marketplace_orders (slot_id) where slot_id is not null;

-- ------------------------------------------------------------
-- Favoris (app/marketplace/favoris, app/marketplace/actions-favoris.ts)
-- ------------------------------------------------------------

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

-- ------------------------------------------------------------
-- Journal des commandes (app/commandes/[reference], frise horodatée)
-- ------------------------------------------------------------

create table if not exists public.marketplace_order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.marketplace_orders(id) on delete cascade,
  status     text not null,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_order_events_order_idx
  on public.marketplace_order_events (order_id, created_at);

alter table public.marketplace_order_events enable row level security;

drop policy if exists "Journal visible par client, traiteur ou admin" on public.marketplace_order_events;
create policy "Journal visible par client, traiteur ou admin"
  on public.marketplace_order_events for select
  to authenticated
  using (
    exists (
      select 1 from public.marketplace_orders o
      left join public.traiteurs t on t.id = o.traiteur_id
      where o.id = order_id
        and (o.user_id = auth.uid() or t.owner_id = auth.uid() or public.is_marketplace_admin())
    )
  );

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.marketplace_order_events (order_id, status) values (new.id, new.status);
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    insert into public.marketplace_order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_orders_log_status on public.marketplace_orders;
create trigger marketplace_orders_log_status
  after insert or update on public.marketplace_orders
  for each row execute function public.log_order_status_event();

-- ------------------------------------------------------------
-- Policies admin manquantes (traiteurs a déjà les siennes, cf. 0009)
-- ------------------------------------------------------------

drop policy if exists "Admin voit tous les produits" on public.traiteur_products;
create policy "Admin voit tous les produits"
  on public.traiteur_products for select
  to authenticated
  using (public.is_marketplace_admin());

drop policy if exists "Admin voit toutes les commandes" on public.marketplace_orders;
create policy "Admin voit toutes les commandes"
  on public.marketplace_orders for select
  to authenticated
  using (public.is_marketplace_admin());

-- ------------------------------------------------------------
-- Seau de stockage des photos (logo, couverture, produits)
--
-- Ce dépôt n'avait encore aucun seau de stockage pour la marketplace : on le
-- crée ici, public en lecture, écriture réservée au propriétaire du traiteur
-- (chemin `{traiteur_id}/{fichier}`, voir components/marketplace/
-- ImageUploader.tsx) ou à un admin.
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('shop-media', 'shop-media', true)
on conflict (id) do nothing;

create or replace function public.owns_traiteur(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.traiteurs t
     where t.id = target and t.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_traiteur(uuid) from public;
revoke execute on function public.owns_traiteur(uuid) from anon;
grant execute on function public.owns_traiteur(uuid) to authenticated;

drop policy if exists "Lecture publique du seau shop-media" on storage.objects;
create policy "Lecture publique du seau shop-media"
  on storage.objects for select
  using (bucket_id = 'shop-media');

drop policy if exists "Le traiteur ou l'admin dépose ses photos" on storage.objects;
create policy "Le traiteur ou l'admin dépose ses photos"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'shop-media'
    and (
      public.owns_traiteur(split_part(name, '/', 1)::uuid)
      or public.is_marketplace_admin()
    )
  )
  with check (
    bucket_id = 'shop-media'
    and (
      public.owns_traiteur(split_part(name, '/', 1)::uuid)
      or public.is_marketplace_admin()
    )
  );
