-- ============================================================
-- Lehaim Market — « Les plus commandés »
--
-- La fiche d'un commerce met en avant ses deux produits les plus commandés.
-- Le décompte ne peut pas se faire à la lecture : `order_items` n'est ouvert
-- qu'au client de la commande, au commerce et à l'administration — un
-- visiteur qui n'a jamais rien acheté compterait zéro partout.
--
-- Le compteur vit donc sur le produit, entretenu par un trigger. C'est une
-- dénormalisation assumée : la valeur se lit avec la carte, sans jointure et
-- sans fonction à droits élevés.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

alter table public.shop_products add column if not exists sold_count int not null default 0;

create index if not exists shop_products_sold_idx
  on public.shop_products (shop_id, sold_count desc);

/** Une ligne de commande de plus, un produit vendu de plus. */
create or replace function public.bump_sold_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.product_id is not null then
    update shop_products
       set sold_count = sold_count + new.quantity
     where id = new.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists bump_sold on public.order_items;
create trigger bump_sold
  after insert on public.order_items
  for each row execute function public.bump_sold_count();

-- Reprise de l'existant : les commandes déjà passées comptent aussi.
-- `is distinct from` plutôt qu'une comparaison simple pour que la reprise
-- soit rejouable sans fausser le total.
update shop_products p
   set sold_count = coalesce(v.total, 0)
  from (
    select product_id, sum(quantity)::int as total
      from order_items where product_id is not null
     group by product_id
  ) v
 where v.product_id = p.id and p.sold_count is distinct from coalesce(v.total, 0);
