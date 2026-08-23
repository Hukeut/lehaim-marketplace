-- ============================================================
-- Lehaim — back-office : rôles, boutiques du marketplace, produits
--
-- Le marketplace vivait jusqu'ici en dur dans le code. Il passe en base
-- pour qu'on puisse créer et administrer des boutiques.
--
-- À exécuter en DEUX passes (voir le séparateur) : la première touche
-- `profiles`, table très lue par l'app en production.
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- Passe 1 · Rôles
-- ------------------------------------------------------------
set lock_timeout = '5s';

-- Colonne dédiée, et non la colonne `role` héritée de l'ancienne version
-- publique : celle-ci porte un vocabulaire qui lui est propre, encore
-- utilisé par les comptes existants. Nul = simple utilisateur.
alter table public.profiles add column if not exists back_office_role text;

alter table public.profiles drop constraint if exists profiles_back_office_role_check;

alter table public.profiles add constraint profiles_back_office_role_check
  check (back_office_role is null or back_office_role in ('merchant', 'admin'));

/** Vrai si la personne connectée administre l'application. */
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles p
     where p.id = (select auth.uid()) and p.back_office_role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- ------------------------------------------------------------
-- Passe 2 · Boutiques et produits
-- ------------------------------------------------------------
set lock_timeout = '5s';

create table if not exists public.shops (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  name        text not null,
  category    text not null default 'grocery'
                check (category in ('butcher', 'bakery', 'wine', 'grocery', 'caterer')),
  description text,
  address     text,
  city        text,
  phone       text,
  -- Horaires libres, une ligne par jour : « lundi 9h00-19h00 ».
  hours       jsonb not null default '{}'::jsonb,
  emoji       text not null default '🛍️',
  tone        text not null default 'teal',
  status      text not null default 'draft' check (status in ('draft', 'live', 'suspended')),
  -- Le commerçant qui gère cette boutique, s'il en existe un.
  owner_id    uuid references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists shops_owner_idx on public.shops (owner_id);

create table if not exists public.shop_products (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  name       text not null,
  hint       text,
  price      numeric(10, 2) not null default 0,
  category   text not null default 'other',
  dish_key   text,
  available  boolean not null default true,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists shop_products_shop_idx on public.shop_products (shop_id, position);

alter table public.shops enable row level security;
alter table public.shop_products enable row level security;

-- Tout le monde voit les boutiques en ligne ; l'admin et le commerçant
-- propriétaire voient aussi les brouillons.
drop policy if exists shops_select on public.shops;
create policy shops_select on public.shops for select to anon, authenticated
  using (status = 'live' or public.is_admin() or owner_id = (select auth.uid()));

drop policy if exists shops_write on public.shops;
create policy shops_write on public.shops for all to authenticated
  using (public.is_admin() or owner_id = (select auth.uid()))
  with check (public.is_admin() or owner_id = (select auth.uid()));

drop policy if exists shop_products_select on public.shop_products;
create policy shop_products_select on public.shop_products for select to anon, authenticated
  using (
    exists (
      select 1 from shops s
       where s.id = shop_id
         and (s.status = 'live' or public.is_admin() or s.owner_id = (select auth.uid()))
    )
  );

drop policy if exists shop_products_write on public.shop_products;
create policy shop_products_write on public.shop_products for all to authenticated
  using (
    exists (
      select 1 from shops s
       where s.id = shop_id and (public.is_admin() or s.owner_id = (select auth.uid()))
    )
  )
  with check (
    exists (
      select 1 from shops s
       where s.id = shop_id and (public.is_admin() or s.owner_id = (select auth.uid()))
    )
  );

-- L'admin lit tous les profils et tous les Chabbats : sans ça, le
-- back-office ne verrait que ses propres lignes.
drop policy if exists profiles_admin_select on public.profiles;
create policy profiles_admin_select on public.profiles for select to authenticated
  using (public.is_admin());

drop policy if exists shabbats_admin_select on public.shabbats;
create policy shabbats_admin_select on public.shabbats for select to authenticated
  using (public.is_admin());
