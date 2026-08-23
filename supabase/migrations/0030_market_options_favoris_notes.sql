-- ============================================================
-- Lehaim Market — options de produit, favoris, notes
--
-- Les maquettes de la fiche produit montrent trois choses que le modèle ne
-- savait pas porter :
--
--   · des GROUPES D'OPTIONS — « Cuisson : bien doré ou peu coloré », « Taille :
--     4 personnes à 100, 6 personnes à 140 ». Certains sont obligatoires, et
--     l'écran affiche une erreur tant qu'on n'a pas choisi. Certains changent
--     le prix.
--   · des SUPPLÉMENTS — mêmes objets, mais à choix multiple.
--   · une NOTE par commerce, et un cœur de mise en favori.
--
-- Un seul modèle pour les deux premiers : un groupe est obligatoire ou non,
-- à choix unique ou multiple. « Suppléments » n'est qu'un groupe facultatif à
-- choix multiple — inventer une seconde table pour lui aurait dupliqué toute
-- la logique de prix.
--
-- Le prix suit la même règle que le reste : il est recalculé par
-- `place_order` et figé dans la commande. Le panier ne retient que des
-- identifiants de choix.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Groupes d'options et choix
-- ------------------------------------------------------------

create table if not exists public.product_option_groups (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.shop_products(id) on delete cascade,
  label      text not null,
  -- Obligatoire : l'écran refuse d'ajouter au panier tant qu'aucun choix
  -- n'est fait, et `place_order` le refuse aussi — le premier peut être
  -- contourné, le second non.
  required   boolean not null default false,
  multiple   boolean not null default false,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists product_option_groups_product_idx
  on public.product_option_groups (product_id, position);

create table if not exists public.product_options (
  id          uuid primary key default gen_random_uuid(),
  group_id    uuid not null references public.product_option_groups(id) on delete cascade,
  label       text not null,
  -- Écart de prix, positif ou négatif. « + 18 € » sur les maquettes.
  price_delta numeric(10,2) not null default 0,
  available   boolean not null default true,
  position    int not null default 0
);

create index if not exists product_options_group_idx on public.product_options (group_id, position);

-- Le panier ne porte que des identifiants : les libellés et les prix se
-- relisent à l'affichage, et se figent à la commande.
alter table public.cart_items add column if not exists option_ids uuid[] not null default '{}';

-- La commande, elle, garde une photographie : libellé et écart de prix, tels
-- qu'ils étaient. Un supplément renommé ou retiré ne réécrit pas un ticket.
alter table public.order_items add column if not exists options jsonb not null default '[]'::jsonb;

-- ------------------------------------------------------------
-- 2 · Favoris
-- ------------------------------------------------------------

-- `shop_favorites` et non `favorites` : une table `favorites` existe déjà,
-- héritée de la v1 — `(id, user_id, event_id)`, pour des événements qui n'ont
-- plus rien à voir. Le `create table if not exists` ne faisait donc rien, et
-- la politique échouait ensuite sur une colonne absente. Le préfixe évite la
-- collision sans toucher à l'héritage.
create table if not exists public.shop_favorites (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, shop_id)
);

create index if not exists shop_favorites_shop_idx on public.shop_favorites (shop_id);

-- ------------------------------------------------------------
-- 3 · Notes
-- ------------------------------------------------------------
-- Une note se rattache à une COMMANDE, pas à un commerce : c'est ce qui
-- empêche de noter un commerce où l'on n'a jamais rien acheté, et de le noter
-- vingt fois. La moyenne se lit par une vue.

create table if not exists public.order_ratings (
  order_id   uuid primary key references public.orders(id) on delete cascade,
  shop_id    uuid not null references public.shops(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  rating     int not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);

create index if not exists order_ratings_shop_idx on public.order_ratings (shop_id);

/**
 * La note moyenne d'un commerce, et le nombre d'avis.
 *
 * `security_invoker` : la vue applique la RLS de l'appelant sur les tables
 * qu'elle lit. Sans cela, une vue appartenant au propriétaire de la base
 * ouvrirait en lecture tout ce qu'elle touche, à tout le monde.
 */
create or replace view public.shop_ratings
with (security_invoker = true) as
  select shop_id,
         round(avg(rating)::numeric, 1) as average,
         count(*)::int                  as reviews
    from order_ratings
   group by shop_id;

-- ------------------------------------------------------------
-- 4 · Qui lit, qui écrit
-- ------------------------------------------------------------

alter table public.product_option_groups enable row level security;
alter table public.product_options       enable row level security;
alter table public.shop_favorites        enable row level security;
alter table public.order_ratings         enable row level security;

-- Les options d'un produit se lisent partout où le produit se lit : c'est la
-- carte publique d'une boutique en ligne.
drop policy if exists option_groups_public on public.product_option_groups;
create policy option_groups_public on public.product_option_groups for select to anon, authenticated
  using (exists (
    select 1 from shop_products p join shops s on s.id = p.shop_id
     where p.id = product_id
       and (s.status = 'live' or public.is_admin() or s.owner_id = (select auth.uid()))
  ));

drop policy if exists option_groups_owner on public.product_option_groups;
create policy option_groups_owner on public.product_option_groups for all to authenticated
  using (exists (
    select 1 from shop_products p where p.id = product_id
       and (public.owns_shop(p.shop_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from shop_products p where p.id = product_id
       and (public.owns_shop(p.shop_id) or public.is_admin())
  ));

drop policy if exists options_public on public.product_options;
create policy options_public on public.product_options for select to anon, authenticated
  using (exists (
    select 1 from product_option_groups g
      join shop_products p on p.id = g.product_id
      join shops s on s.id = p.shop_id
     where g.id = group_id
       and (s.status = 'live' or public.is_admin() or s.owner_id = (select auth.uid()))
  ));

drop policy if exists options_owner on public.product_options;
create policy options_owner on public.product_options for all to authenticated
  using (exists (
    select 1 from product_option_groups g join shop_products p on p.id = g.product_id
     where g.id = group_id and (public.owns_shop(p.shop_id) or public.is_admin())
  ))
  with check (exists (
    select 1 from product_option_groups g join shop_products p on p.id = g.product_id
     where g.id = group_id and (public.owns_shop(p.shop_id) or public.is_admin())
  ));

-- Un favori n'appartient qu'à celui qui l'a posé. Personne d'autre ne le lit,
-- pas même le commerce concerné.
drop policy if exists shop_favorites_own on public.shop_favorites;
create policy shop_favorites_own on public.shop_favorites for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()));

-- Les notes se lisent publiquement — c'est leur raison d'être. Elles ne
-- s'écrivent que par le client de la commande, et seulement une fois celle-ci
-- livrée : noter une commande refusée n'aurait aucun sens.
drop policy if exists ratings_public on public.order_ratings;
create policy ratings_public on public.order_ratings for select to anon, authenticated using (true);

drop policy if exists ratings_own on public.order_ratings;
create policy ratings_own on public.order_ratings for all to authenticated
  using (profile_id = (select auth.uid()))
  -- Le commerce noté doit être celui de la commande. Écrit en sous-requête
  -- scalaire et non dans l'`exists` : à l'intérieur de celui-ci, un `shop_id`
  -- non qualifié désignerait celui d'`orders`, et le qualifier du nom de la
  -- table sur laquelle porte la politique n'est pas permis.
  with check (
    profile_id = (select auth.uid())
    and shop_id = (select o.shop_id from orders o where o.id = order_id)
    and exists (
      select 1 from orders o
       where o.id = order_id
         and o.customer_id = (select auth.uid())
         and o.status = 'completed'
    )
  );

grant select on public.shop_ratings to anon, authenticated;
