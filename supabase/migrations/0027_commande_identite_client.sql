-- ============================================================
-- Lehaim Market — le nom du client sur la commande
--
-- Un commerçant qui prépare une commande a besoin de savoir à qui la remettre,
-- et de pouvoir appeler si le client ne vient pas. Or la RLS de `profiles`
-- n'ouvre un profil qu'à son titulaire, à l'administration, et aux membres
-- d'un même Chabbat : un marchand ne lit rien de son client, et chaque ligne
-- de son écran de service afficherait « Client ».
--
-- Deux façons de le régler :
--
--   · Ouvrir `profiles` en lecture au commerce qui a reçu une commande. Mais
--     la RLS est par ligne, pas par colonne — donner accès à la ligne donnerait
--     accès à l'e-mail, au numéro WhatsApp, aux habitudes de synagogue et aux
--     restrictions alimentaires. Bien au-delà du besoin.
--
--   · Recopier sur la commande le prénom et le téléphone, au moment de la
--     passer. C'est ce qu'on fait ici, et c'est cohérent avec le reste : une
--     commande est un contrat figé, ses libellés et ses montants y sont déjà
--     recopiés. Le client qui change de numéro ne réécrit pas une commande
--     d'il y a trois semaines — c'est celui-là qu'il faut appeler.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

alter table public.orders add column if not exists customer_name  text;
alter table public.orders add column if not exists customer_phone text;

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

-- Ces deux colonnes sont recopiées à la création et ne bougent plus. La garde
-- des montants les protège de la même façon.
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
  or new.customer_name     is distinct from old.customer_name
  or new.customer_phone    is distinct from old.customer_phone
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

-- Une commande livrée porte l'heure de sa remise, sans que personne y pense.
create or replace function public.stamp_order_completion()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    new.completed_at := now();
  end if;
  if new.status in ('accepted', 'refused') and old.status = 'pending' then
    new.decided_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists stamp_orders on public.orders;
create trigger stamp_orders
  before update on public.orders
  for each row execute function public.stamp_order_completion();
