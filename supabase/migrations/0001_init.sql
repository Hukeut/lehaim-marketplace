-- ============================================================
-- Lehaim — schéma privé (v2)
-- À exécuter tel quel dans Supabase → SQL Editor → New query.
-- Idempotent : relançable sans casse.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Profils — RÉUTILISÉS TELS QUELS
--
-- `public.profiles` existe déjà (version précédente de Lehaim) avec :
--   id, email, first_name, last_name, phone, whatsapp_number,
--   role, avatar_url, created_at, updated_at, deleted_at
-- L'app v2 lit ces colonnes directement. On n'ajoute qu'un champ libre,
-- nullable, sans valeur par défaut : aucun impact sur l'app précédente.
--
-- Les tables `events`, `bookings`, `organizer_profiles`, `favorites`,
-- `organizer_follows`, `support_tickets` et `support_messages` ne sont
-- PAS touchées par cette migration.
-- ------------------------------------------------------------
alter table public.profiles add column if not exists about text;

-- ------------------------------------------------------------
-- Shabbats
-- ------------------------------------------------------------
create table if not exists public.shabbats (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null default 'Shabbat chez vous',
  starts_at      timestamptz not null,
  address        text,
  neighbourhood  text,
  guest_target   int not null default 8 check (guest_target between 1 and 60),
  budget_planned numeric(10,2),
  visibility     text not null default 'invite' check (visibility in ('invite','link')),
  status         text not null default 'planning' check (status in ('planning','published','done')),
  share_token    text unique not null default encode(gen_random_bytes(6), 'hex'),
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Invitations (porte l'appartenance et le rôle)
-- ------------------------------------------------------------
create table if not exists public.invitations (
  id          uuid primary key default gen_random_uuid(),
  shabbat_id  uuid not null references public.shabbats(id) on delete cascade,
  guest_id    uuid references public.profiles(id) on delete set null,
  guest_name  text,
  guest_phone text,
  status      text not null default 'pending' check (status in ('pending','confirmed','declined')),
  role_name   text,
  role_detail text,
  created_at  timestamptz not null default now(),
  constraint invitations_identified check (guest_id is not null or guest_name is not null)
);

create unique index if not exists invitations_unique_guest
  on public.invitations (shabbat_id, guest_id)
  where guest_id is not null;

-- ------------------------------------------------------------
-- Menu, courses, dépenses, messages
-- ------------------------------------------------------------
create table if not exists public.dishes (
  id          uuid primary key default gen_random_uuid(),
  shabbat_id  uuid not null references public.shabbats(id) on delete cascade,
  name        text not null,
  course      text not null default 'plat' check (course in ('entree','plat','dessert')),
  assignee_id uuid references public.profiles(id) on delete set null,
  status      text not null default 'todo' check (status in ('todo','cooking','done')),
  position    int not null default 0
);

create table if not exists public.shopping_items (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  name       text not null,
  quantity   text,
  done       boolean not null default false,
  claimed_by uuid references public.profiles(id) on delete set null
);

create table if not exists public.expenses (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  label      text not null,
  amount     numeric(10,2) not null check (amount >= 0),
  paid_by    uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists shabbats_host_idx        on public.shabbats (host_id, starts_at desc);
create index if not exists invitations_shabbat_idx  on public.invitations (shabbat_id);
create index if not exists invitations_guest_idx    on public.invitations (guest_id);
create index if not exists dishes_shabbat_idx       on public.dishes (shabbat_id, position);
create index if not exists shopping_shabbat_idx     on public.shopping_items (shabbat_id);
create index if not exists expenses_shabbat_idx     on public.expenses (shabbat_id);
create index if not exists messages_shabbat_idx     on public.messages (shabbat_id, created_at);

-- ------------------------------------------------------------
-- Appartenance : SECURITY DEFINER pour éviter la récursion RLS
-- ------------------------------------------------------------
create or replace function public.is_host(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from shabbats s
    where s.id = sid and s.host_id = (select auth.uid())
  );
$$;

create or replace function public.is_member(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from shabbats s
    where s.id = sid and s.host_id = (select auth.uid())
  ) or exists (
    select 1 from invitations i
    where i.shabbat_id = sid and i.guest_id = (select auth.uid())
  );
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
-- On n'active PAS le RLS sur `profiles` : s'il était désactivé pour l'app
-- précédente, l'activer ici la casserait. Les politiques ajoutées plus bas
-- sont permissives (elles s'additionnent), donc sans effet de bord.
alter table public.shabbats       enable row level security;
alter table public.invitations    enable row level security;
alter table public.dishes         enable row level security;
alter table public.shopping_items enable row level security;
alter table public.expenses       enable row level security;
alter table public.messages       enable row level security;

-- Profils : chacun lit et modifie le sien ; on lit aussi celui des gens
-- avec qui on partage une table.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.invitations i
      where i.guest_id = profiles.id and public.is_member(i.shabbat_id)
    )
    or exists (
      select 1 from public.shabbats s
      where s.host_id = profiles.id and public.is_member(s.id)
    )
  );

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated
  with check (id = (select auth.uid()));

-- Shabbats : visibles par l'hôte et les invités ; modifiables par l'hôte seul.
drop policy if exists shabbats_select on public.shabbats;
create policy shabbats_select on public.shabbats for select to authenticated
  using (public.is_member(id));

drop policy if exists shabbats_insert on public.shabbats;
create policy shabbats_insert on public.shabbats for insert to authenticated
  with check (host_id = (select auth.uid()));

drop policy if exists shabbats_update on public.shabbats;
create policy shabbats_update on public.shabbats for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

drop policy if exists shabbats_delete on public.shabbats;
create policy shabbats_delete on public.shabbats for delete to authenticated
  using (host_id = (select auth.uid()));

-- Invitations : lisibles par les membres ; gérées par l'hôte.
-- Un invité peut mettre à jour sa propre ligne (accepter, décliner).
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations for select to authenticated
  using (guest_id = (select auth.uid()) or public.is_member(shabbat_id));

drop policy if exists invitations_write_host on public.invitations;
create policy invitations_write_host on public.invitations for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));

drop policy if exists invitations_rsvp on public.invitations;
create policy invitations_rsvp on public.invitations for update to authenticated
  using (guest_id = (select auth.uid())) with check (guest_id = (select auth.uid()));

-- Menu, courses, dépenses : tous les membres collaborent.
drop policy if exists dishes_all on public.dishes;
create policy dishes_all on public.dishes for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists shopping_all on public.shopping_items;
create policy shopping_all on public.shopping_items for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists expenses_all on public.expenses;
create policy expenses_all on public.expenses for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

-- Messages : lisibles par les membres, écrits en son nom propre, non modifiables.
drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (public.is_member(shabbat_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_member(shabbat_id));

drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete to authenticated
  using (sender_id = (select auth.uid()));
