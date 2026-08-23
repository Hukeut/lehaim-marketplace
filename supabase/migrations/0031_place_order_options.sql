-- ============================================================
-- Lehaim Market — `place_order` sait compter les options
--
-- Un produit peut porter des groupes d'options (0030) : « Cuisson »,
-- « Taille · 4 personnes à 26 €, 6 personnes à 36 € », « Suppléments ».
-- Certains changent le prix, certains sont obligatoires.
--
-- Trois choses en découlent, et toutes vivent ici plutôt qu'à l'écran :
--
--   · le prix unitaire devient `prix du produit + somme des écarts choisis` ;
--   · un groupe obligatoire sans choix fait refuser la commande — l'écran le
--     signale déjà, mais l'écran se contourne ;
--   · les libellés et les écarts sont recopiés dans `order_items.options`.
--     Un supplément renommé ou retiré ne réécrit pas un ticket déjà émis.
--
-- Seules comptent les options réellement rattachées au produit et encore
-- disponibles : un identifiant glissé dans le panier à la main ne facture
-- rien et n'ajoute rien.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

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
  v_manque   int;
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

  if v_shop.paused then
    raise exception 'ce commerce a suspendu ses commandes'
      using errcode = '23514', hint = 'shop_paused';
  end if;

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

  -- Un groupe obligatoire sans choix arrête tout. La fiche produit le
  -- signale déjà en rouge, mais une fiche s'ignore ; une transaction non.
  select count(*) into v_manque
    from cart_items ci
    join shop_products p on p.id = ci.product_id
    join product_option_groups g on g.product_id = p.id and g.required
   where ci.cart_id = v_cart and p.available and p.shop_id = p_shop
     and not exists (
       select 1 from product_options o
        where o.group_id = g.id and o.id = any (ci.option_ids) and o.available
     );

  if v_manque > 0 then
    raise exception 'un choix obligatoire manque sur % produit(s)', v_manque
      using errcode = '23514', hint = 'options_required';
  end if;

  -- Les prix viennent de la table, jamais du panier — options comprises.
  with lignes as (
    select ci.quantity,
           p.price + coalesce((
             select sum(o.price_delta)
               from product_options o
               join product_option_groups g on g.id = o.group_id
              where o.id = any (ci.option_ids) and g.product_id = p.id and o.available
           ), 0) as unitaire
      from cart_items ci
      join shop_products p on p.id = ci.product_id
     where ci.cart_id = v_cart and p.available and p.shop_id = p_shop
  )
  select coalesce(sum(unitaire * quantity), 0) into v_items from lignes;

  if v_items = 0 then
    raise exception 'aucun produit disponible dans votre panier'
      using errcode = '23514', hint = 'nothing_available';
  end if;

  if v_items < v_zone_min then
    raise exception 'le minimum de commande pour cette zone n''est pas atteint'
      using errcode = '23514', hint = 'below_minimum';
  end if;

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

  insert into order_items (order_id, product_id, name, unit_price, quantity, line_total, note, options)
  select v_order, p.id, p.name, l.unitaire, ci.quantity, l.unitaire * ci.quantity, ci.note,
         coalesce((
           select jsonb_agg(jsonb_build_object('label', o.label, 'delta', o.price_delta)
                            order by g.position, o.position)
             from product_options o
             join product_option_groups g on g.id = o.group_id
            where o.id = any (ci.option_ids) and g.product_id = p.id and o.available
         ), '[]'::jsonb)
    from cart_items ci
    join shop_products p on p.id = ci.product_id
    cross join lateral (
      select p.price + coalesce((
               select sum(o.price_delta)
                 from product_options o
                 join product_option_groups g on g.id = o.group_id
                where o.id = any (ci.option_ids) and g.product_id = p.id and o.available
             ), 0) as unitaire
    ) l
   where ci.cart_id = v_cart and p.available and p.shop_id = p_shop;

  delete from carts where id = v_cart;

  return v_reference;
end;
$$;

revoke all on function public.place_order(uuid, text, uuid, text, uuid, text) from public;
revoke execute on function public.place_order(uuid, text, uuid, text, uuid, text) from anon;
grant execute on function public.place_order(uuid, text, uuid, text, uuid, text) to authenticated;
