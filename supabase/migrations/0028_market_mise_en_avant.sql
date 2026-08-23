-- ============================================================
-- Lehaim Market — la mise en avant
--
-- Un rang, et une accroche. Les boutiques qui en ont un passent en tête de la
-- vitrine, dans l'ordre du rang ; les autres suivent, par ordre alphabétique.
--
-- Un entier nullable plutôt qu'un booléen `featured` : quand deux commerces
-- sont mis en avant, il faut bien décider lequel est premier, et un booléen
-- oblige à trancher ailleurs — par date de création, ce qui n'a aucun rapport.
--
-- La mise en avant est une décision de l'administration, pas du commerçant :
-- la garde de 0026 l'ajoute à la liste de ce qu'un propriétaire ne modifie
-- pas sur sa propre boutique. Sans cela, chacun se mettrait au rang 1.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

alter table public.shops add column if not exists featured_rank int;
alter table public.shops add column if not exists featured_note text;

-- Index partiel : la vitrine ne lit que les quelques boutiques mises en
-- avant, jamais les autres par cette colonne.
create index if not exists shops_featured_idx on public.shops (featured_rank)
  where featured_rank is not null;

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

  -- La place en tête de vitrine se décide, elle ne se prend pas.
  if new.featured_rank is distinct from old.featured_rank
  or new.featured_note is distinct from old.featured_note then
    raise exception 'la mise en avant est décidée par l''administration'
      using errcode = '42501';
  end if;

  return new;
end;
$$;
