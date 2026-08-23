-- ============================================================
-- Lehaim — Journal des commandes (horodatage par étape)
--
-- marketplace_orders ne gardait que le statut courant : impossible de dire
-- à quelle heure une commande avait été acceptée, ou mise en préparation
-- (voir app/admin/service/actions.ts et app/commandes/[reference]/page.tsx,
-- qui documentaient tous deux cette absence). Plutôt que d'ajouter l'écriture
-- du journal dans chacun des quatre gestes qui changent un statut
-- (acceptOrder, refuseOrder, advanceOrder, cancelOrder), un trigger
-- capture chaque changement au même endroit — aucun des quatre n'a besoin
-- d'être modifié, et aucun futur geste ne pourra oublier de journaliser.
--
-- Écriture réservée au trigger (SECURITY DEFINER) : un client ne doit pas
-- pouvoir falsifier l'historique de sa propre commande. La lecture suit les
-- mêmes règles que la commande elle-même.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.marketplace_order_events (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.marketplace_orders(id) on delete cascade,
  status     text not null,
  created_at timestamptz not null default now()
);

create index if not exists marketplace_order_events_order_idx
  on public.marketplace_order_events (order_id, created_at);

alter table public.marketplace_order_events enable row level security;

drop policy if exists "Journal visible par client, traiteur ou admin" on public.marketplace_order_events;
create policy "Journal visible par client, traiteur ou admin"
  on public.marketplace_order_events for select
  to authenticated
  using (
    exists (
      select 1 from public.marketplace_orders o
      left join public.traiteurs t on t.id = o.traiteur_id
      where o.id = order_id
        and (o.user_id = auth.uid() or t.owner_id = auth.uid() or public.is_admin())
    )
  );

create or replace function public.log_order_status_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'INSERT' then
    insert into public.marketplace_order_events (order_id, status) values (new.id, new.status);
  elsif TG_OP = 'UPDATE' and new.status is distinct from old.status then
    insert into public.marketplace_order_events (order_id, status) values (new.id, new.status);
  end if;
  return new;
end;
$$;

drop trigger if exists marketplace_orders_log_status on public.marketplace_orders;
create trigger marketplace_orders_log_status
  after insert or update on public.marketplace_orders
  for each row execute function public.log_order_status_event();
