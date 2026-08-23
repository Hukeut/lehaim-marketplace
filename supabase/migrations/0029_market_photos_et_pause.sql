-- ============================================================
-- Lehaim Market — les photos, et la pause
--
-- 1 · Deux conventions de nommage cohabitaient sans raison. `shop_products`
--     range un chemin de stockage dans `photo_path`, `shop_documents` dans
--     `file_path` — mais `shops` annonçait `logo_url` et `cover_url`, comme si
--     ces deux-là contenaient des adresses complètes. Les deux colonnes sont
--     vides et n'ont jamais servi : on les renomme plutôt que d'entretenir
--     deux conventions dans les mêmes écrans.
--
--     Un chemin plutôt qu'une URL, parce que l'URL publique d'un seau se
--     dérive du chemin et pas l'inverse : stocker l'URL fige le domaine du
--     projet Supabase dans chaque ligne.
--
-- 2 · La pause. Un commerçant débordé un vendredi midi doit pouvoir fermer le
--     robinet sans appeler l'administration. C'est distinct du statut, qui est
--     une décision de validation : une boutique en pause reste `live`, elle
--     n'accepte simplement plus de commande. `place_order` la refuse, avec un
--     motif qui le dit.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Un chemin, pas une URL
-- ------------------------------------------------------------

do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'shops' and column_name = 'logo_url')
     and not exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'shops' and column_name = 'logo_path') then
    alter table public.shops rename column logo_url to logo_path;
  end if;

  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'shops' and column_name = 'cover_url')
     and not exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'shops' and column_name = 'cover_path') then
    alter table public.shops rename column cover_url to cover_path;
  end if;
end
$$;

alter table public.shops add column if not exists logo_path  text;
alter table public.shops add column if not exists cover_path text;

-- ------------------------------------------------------------
-- 2 · La pause
-- ------------------------------------------------------------

alter table public.shops add column if not exists paused boolean not null default false;

-- La pause appartient au commerçant : c'est la seule chose qu'il décide seul
-- sur la visibilité de sa boutique. La garde ne la mentionne donc pas — mais
-- elle continue de protéger le statut, la commission et la mise en avant.

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
  v_slot_start timestamptz;
  v_slot_end   timestamptz;
  v_slot_cap   int;
  v_slot_shut  boolean;
  v_zone_label text;
  v_zone_min   numeric(10,2) := 0;
  v_name     text;
  v_phone    text;
  v_taken    int;
  v_items    numeric(10,2);
  v_fee      numeric(10,2) := 0;
  v_order    uuid;
  v_reference text;
begin
  if v_customer is null then
    raise exception 'il faut être connecté pour commander'
      using errcode = '42501', hint = 'signed_out';
  end if;

  select * into v_shop from shops where id = p_shop and status = 'live';
  if not found then
    raise exception 'cette boutique n''est pas ouverte aux commandes'
      using errcode = '42501', hint = 'not_live';
  end if;

  -- La pause est vérifiée ici et pas seulement à l'affichage : un client qui a
  -- ouvert la fiche avant la pause validerait sinon une commande que le
  -- commerce ne peut plus prendre.
  if v_shop.paused then
    raise exception 'ce commerce a suspendu ses commandes'
      using errcode = '23514', hint = 'shop_paused';
  end if;

  -- `delivery_modes` parle logistique — retrait, livraison par la plateforme,
  -- livraison par le commerce. Une commande, elle, n'a que deux formes.
  if not (
       (p_mode = 'pickup'   and 'pickup' = any (v_shop.delivery_modes))
    or (p_mode = 'delivery' and v_shop.delivery_modes && array['platform', 'own'])
  ) then
    raise exception 'ce mode de remise n''est pas proposé par ce commerce'
      using errcode = '23514', hint = 'mode_unavailable';
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
    raise exception 'aucun produit disponible dans votre panier'
      using errcode = '23514', hint = 'nothing_available';
  end if;

  if v_items < v_zone_min then
    raise exception 'le minimum de commande pour cette zone n''est pas atteint'
      using errcode = '23514', hint = 'below_minimum';
  end if;

  -- Recopiés, pas joints : c'est tout ce que le commerce a besoin de savoir
  -- de son client, et il ne le lit nulle part ailleurs.
  select coalesce(nullif(trim(first_name), ''), 'Client'), phone
    into v_name, v_phone
    from profiles where id = v_customer;

  insert into orders (
    shop_id, customer_id, mode, slot_id, slot_starts_at, slot_ends_at,
    delivery_address, delivery_zone, delivery_fee,
    items_total, total, commission_rate, commission_amount, payout_amount,
    customer_note, customer_name, customer_phone
  ) values (
    p_shop, v_customer, p_mode, p_slot, v_slot_start, v_slot_end,
    case when p_mode = 'delivery' then p_address end,
    v_zone_label, v_fee,
    v_items, v_items + v_fee, v_shop.commission_rate,
    round(v_items * v_shop.commission_rate / 100, 2),
    v_items - round(v_items * v_shop.commission_rate / 100, 2),
    p_note, coalesce(v_name, 'Client'), v_phone
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
