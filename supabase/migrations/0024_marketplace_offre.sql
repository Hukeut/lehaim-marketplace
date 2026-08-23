-- ============================================================
-- Lehaim Market — le côté offre : dossiers, documents, cacherout, logistique
--
-- La place de marché n'avait que deux tables, `shops` et `shop_products`,
-- toutes deux vides. Les maquettes livrées en supposent une quinzaine. Cette
-- migration pose la moitié « offre » : ce qu'il faut pour qu'un commerçant
-- dépose un dossier, qu'un administrateur le valide, et que la boutique passe
-- en ligne. Les commandes, livreurs, reversements et litiges viendront avec la
-- moitié « demande ».
--
-- Un principe traverse le tout : la cacherout est une donnée de confiance, pas
-- un champ libre. Elle a son organisme, ses dates de validité et ses mentions,
-- et c'est elle qui décide si une boutique peut rester en ligne.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · La boutique s'enrichit de ce que l'onboarding demande
-- ------------------------------------------------------------

alter table public.shops add column if not exists legal_name       text;
alter table public.shops add column if not exists siret            text;
alter table public.shops add column if not exists logo_url         text;
alter table public.shops add column if not exists cover_url        text;
-- Taux négocié par commerce : l'admin le modifie en ligne dans la table.
alter table public.shops add column if not exists commission_rate  numeric(5,2) not null default 18;
alter table public.shops add column if not exists prep_minutes     int not null default 20;
-- « Jeudi 18h » : au-delà, plus de pré-commande pour le vendredi.
alter table public.shops add column if not exists preorder_deadline text;
alter table public.shops add column if not exists slot_capacity    int not null default 8;
alter table public.shops add column if not exists delivery_modes   text[] not null default '{platform}';

-- Le statut gagne « review » : une boutique dont le dossier est déposé n'est
-- ni un brouillon ni en ligne.
alter table public.shops drop constraint if exists shops_status_check;
alter table public.shops add constraint shops_status_check
  check (status in ('draft', 'review', 'live', 'suspended'));

-- ------------------------------------------------------------
-- 2 · Le dossier de candidature — le LP-118 des maquettes
-- ------------------------------------------------------------

create sequence if not exists public.shop_application_seq start 100;

create table if not exists public.shop_applications (
  id           uuid primary key default gen_random_uuid(),
  shop_id      uuid not null references public.shops(id) on delete cascade,
  -- Référence lisible, celle qu'on se cite au téléphone.
  reference    text not null unique default 'LP-' || nextval('public.shop_application_seq'),
  status       text not null default 'draft'
                 check (status in ('draft', 'submitted', 'complement', 'approved', 'rejected')),
  -- Étape atteinte dans le tunnel en huit temps : c'est elle qui permet de
  -- reprendre là où on s'est arrêté, depuis l'e-mail de relance.
  step         int not null default 1 check (step between 1 and 8),
  submitted_at timestamptz,
  decided_at   timestamptz,
  decided_by   uuid references public.profiles(id) on delete set null,
  -- Motif écrit, obligatoire pour un refus ou une demande de complément :
  -- « le certificat est expiré depuis le 31 mars » vaut mieux qu'un rejet nu.
  decision_reason text,
  created_at   timestamptz not null default now()
);

create index if not exists shop_applications_shop_idx on public.shop_applications (shop_id);
create index if not exists shop_applications_status_idx on public.shop_applications (status, submitted_at);

-- ------------------------------------------------------------
-- 3 · Les pièces du dossier
-- ------------------------------------------------------------

create table if not exists public.shop_documents (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  kind        text not null
                check (kind in ('id_front', 'id_back', 'kbis', 'license', 'kashrut')),
  status      text not null default 'pending'
                check (status in ('pending', 'uploaded', 'rejected')),
  file_path   text,
  -- « Document illisible : reprenez la photo à plat, sans reflet. » Le motif
  -- se lit côté marchand, c'est ce qui lui évite de redéposer la même chose.
  rejected_reason text,
  uploaded_at timestamptz,
  created_at  timestamptz not null default now(),
  unique (shop_id, kind)
);

create index if not exists shop_documents_shop_idx on public.shop_documents (shop_id);

-- ------------------------------------------------------------
-- 4 · Le certificat de cacherout
-- ------------------------------------------------------------

create table if not exists public.kashrut_certificates (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops(id) on delete cascade,
  authority   text not null,
  detail      text,
  valid_from  date not null,
  valid_to    date not null,
  -- Halav Israel, Pat Israel, Bishoul Israel, viande, parvé. Tableau libre
  -- plutôt qu'énumération : les mentions varient d'un organisme à l'autre.
  mentions    text[] not null default '{}',
  document_id uuid references public.shop_documents(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint kashrut_dates check (valid_to > valid_from)
);

create index if not exists kashrut_shop_idx on public.kashrut_certificates (shop_id);
-- L'admin doit voir venir les expirations : « expire dans 12 jours ».
create index if not exists kashrut_expiry_idx on public.kashrut_certificates (valid_to);

-- ------------------------------------------------------------
-- 5 · Horaires et zones de livraison
-- ------------------------------------------------------------

create table if not exists public.shop_hours (
  id        uuid primary key default gen_random_uuid(),
  shop_id   uuid not null references public.shops(id) on delete cascade,
  -- 0 = dimanche, à la façon de Postgres et de JavaScript.
  weekday   int not null check (weekday between 0 and 6),
  opens_at  time not null,
  closes_at time not null,
  constraint shop_hours_order check (closes_at > opens_at)
);

create index if not exists shop_hours_shop_idx on public.shop_hours (shop_id, weekday);

create table if not exists public.delivery_zones (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops(id) on delete cascade,
  label         text not null,
  fee           numeric(10,2) not null default 0,
  minimum_order numeric(10,2) not null default 0,
  position      int not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists delivery_zones_shop_idx on public.delivery_zones (shop_id, position);

-- ------------------------------------------------------------
-- 6 · Le produit, avec ses allergènes sur trois niveaux
-- ------------------------------------------------------------
-- « Contient », « traces possibles », « sans » ne sont pas la même
-- information, et les confondre est un risque sanitaire réel. Trois colonnes
-- plutôt qu'une, avec la mention d'atelier à part.

alter table public.shop_products add column if not exists description       text;
alter table public.shop_products add column if not exists photo_path        text;
alter table public.shop_products add column if not exists allergens_contains text[] not null default '{}';
alter table public.shop_products add column if not exists allergens_traces   text[] not null default '{}';
alter table public.shop_products add column if not exists allergens_free     text[] not null default '{}';
alter table public.shop_products add column if not exists workshop_note      text;

-- ------------------------------------------------------------
-- 7 · Qui voit quoi
-- ------------------------------------------------------------
-- Même règle partout : le commerçant sur sa boutique, l'administration sur
-- tout, le public sur rien. Ces tables portent des pièces d'identité et des
-- numéros SIRET, elles ne s'ouvrent pas à `anon`.

alter table public.shop_applications   enable row level security;
alter table public.shop_documents      enable row level security;
alter table public.kashrut_certificates enable row level security;
alter table public.shop_hours          enable row level security;
alter table public.delivery_zones      enable row level security;

create or replace function public.owns_shop(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from shops s
     where s.id = target and s.owner_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_shop(uuid) from public;
revoke execute on function public.owns_shop(uuid) from anon;
grant execute on function public.owns_shop(uuid) to authenticated;

do $$
declare t text;
begin
  foreach t in array array['shop_applications', 'shop_documents', 'kashrut_certificates', 'shop_hours', 'delivery_zones']
  loop
    execute format('drop policy if exists %I on public.%I', t || '_owner', t);
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.owns_shop(shop_id) or public.is_admin()) with check (public.owns_shop(shop_id) or public.is_admin())',
      t || '_owner', t);
  end loop;
end
$$;

-- Les horaires et les zones sont la seule exception : ils s'affichent sur la
-- fiche publique d'une boutique en ligne, donc ils se lisent sans compte.
drop policy if exists shop_hours_public on public.shop_hours;
create policy shop_hours_public on public.shop_hours for select to anon, authenticated
  using (exists (select 1 from shops s where s.id = shop_id and s.status = 'live'));

drop policy if exists delivery_zones_public on public.delivery_zones;
create policy delivery_zones_public on public.delivery_zones for select to anon, authenticated
  using (exists (select 1 from shops s where s.id = shop_id and s.status = 'live'));

-- Le badge de cacherout est ce qui fonde la confiance : il se lit publiquement
-- sur une boutique en ligne. Le document scanné, lui, reste privé.
drop policy if exists kashrut_public on public.kashrut_certificates;
create policy kashrut_public on public.kashrut_certificates for select to anon, authenticated
  using (exists (select 1 from shops s where s.id = shop_id and s.status = 'live'));
