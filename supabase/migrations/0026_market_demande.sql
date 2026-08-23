-- ============================================================
-- Lehaim Market — le côté demande : créneaux, panier, commandes
--
-- L'offre était posée (0024, 0025) : un commerçant dépose un dossier, on le
-- valide, sa boutique passe en ligne. Il lui manquait ce pour quoi elle
-- existe — recevoir des commandes.
--
-- Deux principes portent tout le reste :
--
--   · Une commande est un CONTRAT FIGÉ. Les prix bougent, les taux se
--     renégocient, un produit se retire de la carte. Rien de tout cela ne doit
--     changer une commande déjà passée. Les libellés, les prix unitaires et le
--     taux de commission sont donc recopiés dans la commande, pas référencés.
--
--   · Le client n'insère JAMAIS de commande. Aucune politique ne l'y autorise.
--     Le seul chemin est `place_order`, qui verrouille le créneau, relit les
--     prix en base et calcule les totaux lui-même. Un panier envoyé avec ses
--     propres montants ne serait pas une commande, ce serait une proposition.
--
-- S'y ajoute une garde qui manquait depuis le début sur `shops` : voir le
-- point 1.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Une boutique ne se met pas en ligne toute seule
-- ------------------------------------------------------------
-- `shops_write` (0011) ouvre toutes les colonnes au propriétaire. Tant que
-- les boutiques étaient créées à la main par l'administration, cela ne se
-- voyait pas. Depuis que le tunnel marchand laisse n'importe qui créer sa
-- boutique, cela veut dire : passer soi-même son `status` à 'live' sans
-- validation, et ramener `commission_rate` à zéro.
--
-- La garde est SECURITY INVOKER — impérativement. Dans un corps SECURITY
-- DEFINER, `current_user` vaut le propriétaire de la fonction et jamais
-- `authenticated` : la garde se croirait toujours appelée par le serveur et
-- ne bloquerait rien.

create or replace function public.guard_shop_privileges()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_client_write() or public.is_admin() then
    return new;
  end if;

  -- Le seul changement de statut qu'un marchand s'accorde lui-même : déposer
  -- son dossier. Passer en ligne, ou revenir en ligne après suspension, est
  -- une décision de l'administration.
  if new.status is distinct from old.status
     and not (old.status = 'draft' and new.status = 'review') then
    raise exception 'le statut d''une boutique est décidé par l''administration'
      using errcode = '42501';
  end if;

  if new.commission_rate is distinct from old.commission_rate then
    raise exception 'le taux de commission est négocié, pas modifiable en ligne'
      using errcode = '42501';
  end if;

  if new.owner_id is distinct from old.owner_id then
    raise exception 'une boutique ne se transfère pas depuis le client'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_shops on public.shops;
create trigger guard_shops
  before update on public.shops
  for each row execute function public.guard_shop_privileges();

-- À la création, un marchand ne se donne ni un statut ni un taux choisis.
create or replace function public.guard_shop_insert()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if public.is_client_write() and not public.is_admin() then
    new.status := 'draft';
    -- Doit suivre le défaut de la colonne ; une vérification le rappelle dans
    -- `supabase/tests/rls.sql` pour que les deux ne dérivent pas en silence.
    new.commission_rate := 18;
    new.owner_id := (select auth.uid());
  end if;
  return new;
end;
$$;

drop trigger if exists guard_shops_insert on public.shops;
create trigger guard_shops_insert
  before insert on public.shops
  for each row execute function public.guard_shop_insert();

-- ------------------------------------------------------------
-- 2 · Les créneaux
-- ------------------------------------------------------------
-- Matérialisés en lignes plutôt que déduits des horaires à la volée. C'est ce
-- qui permet de verrouiller un créneau (`for update`) au moment où deux
-- clients le prennent en même temps — on ne verrouille pas un calcul.

create table if not exists public.delivery_slots (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  mode       text not null check (mode in ('pickup', 'delivery')),
  -- Recopiée depuis `shops.slot_capacity` à la création : abaisser sa capacité
  -- ne doit pas invalider des créneaux déjà ouverts et déjà pris.
  capacity   int not null default 8 check (capacity > 0),
  closed     boolean not null default false,
  created_at timestamptz not null default now(),
  constraint delivery_slots_order check (ends_at > starts_at),
  unique (shop_id, starts_at, mode)
);

create index if not exists delivery_slots_shop_idx on public.delivery_slots (shop_id, starts_at);

-- ------------------------------------------------------------
-- 3 · Le panier
-- ------------------------------------------------------------
-- Un panier par client et par boutique : le créneau, les frais et le minimum
-- de commande sont propres à un commerce, mélanger deux boutiques dans un
-- panier n'aurait pas de sens à la validation.
--
-- Il ne porte aucun prix. Les montants se lisent sur les produits à
-- l'affichage, et se figent à la commande — pas avant.

create table if not exists public.carts (
  id          uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  shop_id     uuid not null references public.shops(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (customer_id, shop_id)
);

create table if not exists public.cart_items (
  id         uuid primary key default gen_random_uuid(),
  cart_id    uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.shop_products(id) on delete cascade,
  quantity   int not null default 1 check (quantity between 1 and 99),
  note       text,
  unique (cart_id, product_id)
);

create index if not exists cart_items_cart_idx on public.cart_items (cart_id);

-- ------------------------------------------------------------
-- 4 · La commande
-- ------------------------------------------------------------

create sequence if not exists public.order_seq start 1000;

create table if not exists public.orders (
  id          uuid primary key default gen_random_uuid(),
  -- La référence qu'on se cite au téléphone : « bonjour, c'est pour MK-1042 ».
  reference   text not null unique default 'MK-' || nextval('public.order_seq'),
  shop_id     uuid not null references public.shops(id) on delete restrict,
  customer_id uuid not null references public.profiles(id) on delete restrict,

  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'preparing', 'ready',
                                  'delivering', 'completed', 'cancelled', 'refused')),
  mode        text not null check (mode in ('pickup', 'delivery')),
  slot_id     uuid references public.delivery_slots(id) on delete set null,
  -- Recopiés, pas référencés : le créneau peut être supprimé, la commande
  -- doit continuer de dire pour quand elle était.
  slot_starts_at timestamptz,
  slot_ends_at   timestamptz,

  delivery_address text,
  delivery_zone    text,
  delivery_fee     numeric(10,2) not null default 0,

  -- Les montants sont calculés par `place_order`, jamais transmis.
  items_total       numeric(10,2) not null default 0,
  total             numeric(10,2) not null default 0,
  commission_rate   numeric(5,2)  not null default 18,
  commission_amount numeric(10,2) not null default 0,
  payout_amount     numeric(10,2) not null default 0,

  customer_note  text,
  refusal_reason text,

  placed_at    timestamptz not null default now(),
  decided_at   timestamptz,
  completed_at timestamptz
);

create index if not exists orders_shop_idx     on public.orders (shop_id, status, placed_at desc);
create index if not exists orders_customer_idx on public.orders (customer_id, placed_at desc);
create index if not exists orders_slot_idx     on public.orders (slot_id) where slot_id is not null;

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  -- Le produit peut disparaître de la carte ; la ligne, elle, reste lisible.
  product_id uuid references public.shop_products(id) on delete set null,
  name       text not null,
  unit_price numeric(10,2) not null,
  quantity   int not null check (quantity > 0),
  line_total numeric(10,2) not null,
  note       text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- Le journal de la commande. C'est lui que lit le pilotage live, et lui qui
-- permet de répondre à « qui a annulé, et quand ».
create table if not exists public.order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.orders(id) on delete cascade,
  status     text not null,
  note       text,
  author_id  uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_idx on public.order_events (order_id, created_at);

-- ------------------------------------------------------------
-- 5 · Qui voit quoi, qui écrit quoi
-- ------------------------------------------------------------

alter table public.delivery_slots enable row level security;
alter table public.carts          enable row level security;
alter table public.cart_items     enable row level security;
alter table public.orders         enable row level security;
alter table public.order_items    enable row level security;
alter table public.order_events   enable row level security;

-- Les créneaux d'une boutique en ligne se lisent sans compte : c'est ce que
-- le client regarde avant même de se connecter.
drop policy if exists delivery_slots_public on public.delivery_slots;
create policy delivery_slots_public on public.delivery_slots for select to anon, authenticated
  using (exists (select 1 from shops s where s.id = shop_id and s.status = 'live'));

drop policy if exists delivery_slots_owner on public.delivery_slots;
create policy delivery_slots_owner on public.delivery_slots for all to authenticated
  using (public.owns_shop(shop_id) or public.is_admin())
  with check (public.owns_shop(shop_id) or public.is_admin());

drop policy if exists carts_own on public.carts;
create policy carts_own on public.carts for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

drop policy if exists cart_items_own on public.cart_items;
create policy cart_items_own on public.cart_items for all to authenticated
  using (exists (select 1 from carts c where c.id = cart_id and c.customer_id = (select auth.uid())))
  with check (exists (select 1 from carts c where c.id = cart_id and c.customer_id = (select auth.uid())));

-- Une commande se lit par son client, par le commerce qui la prépare, et par
-- l'administration. Personne d'autre.
drop policy if exists orders_read on public.orders;
create policy orders_read on public.orders for select to authenticated
  using (customer_id = (select auth.uid()) or public.owns_shop(shop_id) or public.is_admin());

-- Pas de politique d'INSERT, et c'est délibéré : le seul chemin est
-- `place_order`. Un client qui poste sa propre commande fixerait ses propres
-- montants.
drop policy if exists orders_write on public.orders;
create policy orders_write on public.orders for update to authenticated
  using (customer_id = (select auth.uid()) or public.owns_shop(shop_id) or public.is_admin())
  with check (customer_id = (select auth.uid()) or public.owns_shop(shop_id) or public.is_admin());

drop policy if exists order_items_read on public.order_items;
create policy order_items_read on public.order_items for select to authenticated
  using (exists (
    select 1 from orders o
     where o.id = order_id
       and (o.customer_id = (select auth.uid()) or public.owns_shop(o.shop_id) or public.is_admin())
  ));

drop policy if exists order_events_read on public.order_events;
create policy order_events_read on public.order_events for select to authenticated
  using (exists (
    select 1 from orders o
     where o.id = order_id
       and (o.customer_id = (select auth.uid()) or public.owns_shop(o.shop_id) or public.is_admin())
  ));

-- ------------------------------------------------------------
-- 6 · Ce qu'une mise à jour de commande a le droit de toucher
-- ------------------------------------------------------------
-- La politique d'UPDATE ci-dessus dit QUI peut écrire, pas QUOI. Sans cette
-- garde, un client pourrait ramener son total à zéro, et un commerçant
-- s'attribuer une commission de zéro pour cent.

create or replace function public.guard_order_update()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_client_write() or public.is_admin() then
    return new;
  end if;

  if new.items_total       is distinct from old.items_total
  or new.total             is distinct from old.total
  or new.commission_rate   is distinct from old.commission_rate
  or new.commission_amount is distinct from old.commission_amount
  or new.payout_amount     is distinct from old.payout_amount
  or new.delivery_fee      is distinct from old.delivery_fee
  or new.shop_id           is distinct from old.shop_id
  or new.customer_id       is distinct from old.customer_id
  or new.reference         is distinct from old.reference then
    raise exception 'les montants d''une commande sont figés'
      using errcode = '42501';
  end if;

  -- Le client n'a qu'un geste sur sa commande : y renoncer, et seulement tant
  -- que le commerce ne l'a pas acceptée. Après, il appelle.
  if old.customer_id = (select auth.uid()) and not public.owns_shop(old.shop_id) then
    if new.status is distinct from old.status
       and not (old.status = 'pending' and new.status = 'cancelled') then
      raise exception 'une commande acceptée ne s''annule plus depuis l''application'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists guard_orders on public.orders;
create trigger guard_orders
  before update on public.orders
  for each row execute function public.guard_order_update();

-- Chaque changement d'état laisse une trace, sans que personne ait à y penser.
create or replace function public.log_order_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into order_events (order_id, status, note, author_id)
    values (new.id, new.status,
            case when new.status = 'refused' then new.refusal_reason end,
            (select auth.uid()));
  end if;
  return new;
end;
$$;

drop trigger if exists log_orders on public.orders;
create trigger log_orders
  after insert or update on public.orders
  for each row execute function public.log_order_status();

-- ------------------------------------------------------------
-- 7 · Passer commande
-- ------------------------------------------------------------
-- Tout se joue ici, dans une seule transaction : le créneau est verrouillé,
-- les prix sont relus en base, les totaux sont calculés, le panier est vidé.
-- Rien de ce que le client envoie n'entre dans un montant.
--
-- Chaque refus porte un motif en clair dans `hint` — 'slot_full',
-- 'below_minimum', 'cart_empty'. Le message, lui, est en français et destiné
-- aux journaux ; c'est le motif que l'application traduit. Sans lui, tous ces
-- refus retomberaient sur le même « une valeur ne convient pas », et
-- « ce créneau est complet » ne se dirait plus.

create or replace function public.place_order(
  p_shop    uuid,
  p_mode    text,
  p_slot    uuid default null,
  p_address text default null,
  p_zone    uuid default null,
  p_note    text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer uuid := (select auth.uid());
  v_cart     uuid;
  v_shop     record;
  -- Des scalaires, pas des `record` : un `record` jamais affecté lève dès
  -- qu'on lit un de ses champs, et ces deux-là ne le sont que si le client a
  -- choisi un créneau ou une zone.
  v_slot_start timestamptz;
  v_slot_end   timestamptz;
  v_slot_cap   int;
  v_slot_shut  boolean;
  v_zone_label text;
  v_zone_min   numeric(10,2) := 0;
  v_taken    int;
  v_items    numeric(10,2);
  v_fee      numeric(10,2) := 0;
  v_order    uuid;
  v_reference text;
begin
  if v_customer is null then
    raise exception 'il faut être connecté pour commander' using errcode = '42501', hint = 'signed_out';
  end if;

  select * into v_shop from shops where id = p_shop and status = 'live';
  if not found then
    raise exception 'cette boutique n''est pas ouverte aux commandes' using errcode = '42501', hint = 'not_live';
  end if;

  -- `delivery_modes` parle logistique — retrait, livraison par la plateforme,
  -- livraison par le commerce. Une commande, elle, n'a que deux formes.
  if not (
       (p_mode = 'pickup'   and 'pickup' = any (v_shop.delivery_modes))
    or (p_mode = 'delivery' and v_shop.delivery_modes && array['platform', 'own'])
  ) then
    raise exception 'ce mode de remise n''est pas proposé par ce commerce' using errcode = '23514', hint = 'mode_unavailable';
  end if;

  select id into v_cart from carts where customer_id = v_customer and shop_id = p_shop;
  if v_cart is null then
    raise exception 'votre panier est vide' using errcode = '23514', hint = 'cart_empty';
  end if;

  -- Le créneau se verrouille AVANT d'être compté. Sans ce verrou, deux
  -- clients qui valident à la même seconde lisent tous deux « il reste une
  -- place » et la prennent tous les deux.
  if p_slot is not null then
    select starts_at, ends_at, capacity, closed
      into v_slot_start, v_slot_end, v_slot_cap, v_slot_shut
      from delivery_slots
     where id = p_slot and shop_id = p_shop
       for update;
    if not found then
      raise exception 'ce créneau n''existe plus' using errcode = '23514', hint = 'slot_gone';
    end if;
    if v_slot_shut then
      raise exception 'ce créneau est fermé' using errcode = '23514', hint = 'slot_closed';
    end if;

    select count(*) into v_taken from orders
     where slot_id = p_slot and status not in ('cancelled', 'refused');
    if v_taken >= v_slot_cap then
      raise exception 'ce créneau est complet' using errcode = '23514', hint = 'slot_full';
    end if;
  end if;

  if p_mode = 'delivery' and p_zone is not null then
    select label, fee, minimum_order
      into v_zone_label, v_fee, v_zone_min
      from delivery_zones where id = p_zone and shop_id = p_shop;
    if not found then
      v_fee := 0;
      v_zone_min := 0;
    end if;
  end if;

  -- Les prix viennent de la table, jamais du panier. Un produit retiré de la
  -- carte entre-temps ne part pas dans la commande.
  select coalesce(sum(p.price * ci.quantity), 0) into v_items
    from cart_items ci
    join shop_products p on p.id = ci.product_id
   where ci.cart_id = v_cart and p.available and p.shop_id = p_shop;

  if v_items = 0 then
    raise exception 'aucun produit disponible dans votre panier' using errcode = '23514', hint = 'nothing_available';
  end if;

  if v_items < v_zone_min then
    raise exception 'le minimum de commande pour cette zone n''est pas atteint'
      using errcode = '23514', hint = 'below_minimum';
  end if;

  insert into orders (
    shop_id, customer_id, mode, slot_id, slot_starts_at, slot_ends_at,
    delivery_address, delivery_zone, delivery_fee,
    items_total, total, commission_rate, commission_amount, payout_amount,
    customer_note
  ) values (
    p_shop, v_customer, p_mode, p_slot, v_slot_start, v_slot_end,
    case when p_mode = 'delivery' then p_address end,
    v_zone_label, v_fee,
    v_items, v_items + v_fee, v_shop.commission_rate,
    round(v_items * v_shop.commission_rate / 100, 2),
    v_items - round(v_items * v_shop.commission_rate / 100, 2),
    p_note
  )
  returning id, reference into v_order, v_reference;

  insert into order_items (order_id, product_id, name, unit_price, quantity, line_total, note)
  select v_order, p.id, p.name, p.price, ci.quantity, p.price * ci.quantity, ci.note
    from cart_items ci
    join shop_products p on p.id = ci.product_id
   where ci.cart_id = v_cart and p.available and p.shop_id = p_shop;

  delete from carts where id = v_cart;

  return v_reference;
end;
$$;

revoke all on function public.place_order(uuid, text, uuid, text, uuid, text) from public;
revoke execute on function public.place_order(uuid, text, uuid, text, uuid, text) from anon;
grant execute on function public.place_order(uuid, text, uuid, text, uuid, text) to authenticated;

-- ------------------------------------------------------------
-- 8 · Ouvrir des créneaux à partir des horaires
-- ------------------------------------------------------------
-- Un commerçant ne va pas saisir soixante créneaux à la main. Ceux-ci se
-- déduisent de ses horaires, par tranches d'une heure, et s'ajoutent sans
-- toucher à ceux déjà ouverts — donc sans perdre les commandes qui s'y
-- rattachent.

create or replace function public.generate_slots(p_shop uuid, p_days int default 7)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_shop  record;
  v_added int := 0;
  v_mode  text;
  d       int;
  h       record;
  v_start timestamptz;
begin
  -- Le contrôle ne porte que sur les appels venus du client. Un appel fait
  -- depuis le serveur — script de maintenance, tâche planifiée qui ouvre les
  -- créneaux de la semaine — n'a pas d'`auth.uid()` et échouerait sur une
  -- condition de propriété qu'il n'a aucun moyen de satisfaire.
  if public.is_client_write() and not (public.owns_shop(p_shop) or public.is_admin()) then
    raise exception 'cette boutique n''est pas la vôtre'
      using errcode = '42501', hint = 'not_your_shop';
  end if;

  select * into v_shop from shops where id = p_shop;
  if not found then return 0; end if;

  for d in 0 .. greatest(p_days, 1) - 1 loop
    for h in
      select * from shop_hours
       where shop_id = p_shop
         and weekday = extract(dow from (current_date + d))::int
    loop
      v_start := (current_date + d) + h.opens_at;
      while v_start + interval '1 hour' <= (current_date + d) + h.closes_at loop
        foreach v_mode in array array['pickup', 'delivery'] loop
          continue when v_mode = 'pickup'
                    and not ('pickup' = any (v_shop.delivery_modes));
          continue when v_mode = 'delivery'
                    and not (v_shop.delivery_modes && array['platform', 'own']);

          insert into delivery_slots (shop_id, starts_at, ends_at, mode, capacity)
          values (p_shop, v_start, v_start + interval '1 hour', v_mode, v_shop.slot_capacity)
          on conflict (shop_id, starts_at, mode) do nothing;
          if found then v_added := v_added + 1; end if;
        end loop;
        v_start := v_start + interval '1 hour';
      end loop;
    end loop;
  end loop;

  return v_added;
end;
$$;

revoke all on function public.generate_slots(uuid, int) from public;
revoke execute on function public.generate_slots(uuid, int) from anon;
grant execute on function public.generate_slots(uuid, int) to authenticated;
