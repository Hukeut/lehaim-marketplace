-- ============================================================
-- Lehaim — Chat par commande (organisateur ↔ traiteur)
--
-- Pendant qu'une commande attend d'être acceptée (et après), le
-- client et le traiteur peuvent échanger quelques messages liés à
-- CETTE commande précise. Même schéma que le chat de groupe des
-- Shabbats (`messages`), mais scindé en 1:1 par commande.
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.marketplace_order_messages (
  id         uuid primary key default gen_random_uuid(),
  order_id   uuid not null references public.marketplace_orders(id) on delete cascade,
  sender_id  uuid not null references public.profiles(id) on delete cascade,
  body       text not null check (length(btrim(body)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists marketplace_order_messages_order_idx
  on public.marketplace_order_messages (order_id, created_at);

-- SECURITY DEFINER pour éviter la récursion RLS, même pattern que is_member().
create or replace function public.is_order_party(oid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from marketplace_orders o
    left join traiteurs t on t.id = o.traiteur_id
    where o.id = oid
      and (o.user_id = (select auth.uid()) or t.owner_id = (select auth.uid()))
  );
$$;

alter table public.marketplace_order_messages enable row level security;

drop policy if exists "Lisible par les deux parties de la commande" on public.marketplace_order_messages;
create policy "Lisible par les deux parties de la commande"
  on public.marketplace_order_messages for select
  to authenticated
  using (public.is_order_party(order_id));

drop policy if exists "Une des deux parties écrit" on public.marketplace_order_messages;
create policy "Une des deux parties écrit"
  on public.marketplace_order_messages for insert
  to authenticated
  with check (sender_id = (select auth.uid()) and public.is_order_party(order_id));

drop policy if exists "L'auteur supprime son message" on public.marketplace_order_messages;
create policy "L'auteur supprime son message"
  on public.marketplace_order_messages for delete
  to authenticated
  using (sender_id = (select auth.uid()));
