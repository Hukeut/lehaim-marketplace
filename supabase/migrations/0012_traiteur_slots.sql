-- ============================================================
-- Lehaim — Créneaux de retrait proposés par le traiteur
--
-- Auparavant, le client choisissait une date libre + un créneau
-- générique identique pour tous les traiteurs. Désormais, c'est le
-- traiteur qui propose ses dates/heures disponibles ; le client ne
-- choisit que parmi celles-ci.
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.traiteur_slots (
  id          uuid primary key default gen_random_uuid(),
  traiteur_id uuid not null references public.traiteurs(id) on delete cascade,
  slot_date   date not null,
  slot_label  text not null,
  created_at  timestamptz not null default now()
);

create unique index if not exists traiteur_slots_unique
  on public.traiteur_slots (traiteur_id, slot_date, slot_label);

create index if not exists traiteur_slots_traiteur_idx
  on public.traiteur_slots (traiteur_id, slot_date);

alter table public.traiteur_slots enable row level security;

drop policy if exists "Créneaux visibles si traiteur approuvé" on public.traiteur_slots;
create policy "Créneaux visibles si traiteur approuvé"
  on public.traiteur_slots for select
  to authenticated
  using (
    exists (
      select 1 from public.traiteurs t
      where t.id = traiteur_id and (t.status = 'approved' or t.owner_id = auth.uid())
    )
  );

drop policy if exists "Le propriétaire ajoute ses créneaux" on public.traiteur_slots;
create policy "Le propriétaire ajoute ses créneaux"
  on public.traiteur_slots for insert
  to authenticated
  with check (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );

drop policy if exists "Le propriétaire supprime ses créneaux" on public.traiteur_slots;
create policy "Le propriétaire supprime ses créneaux"
  on public.traiteur_slots for delete
  to authenticated
  using (
    exists (select 1 from public.traiteurs t where t.id = traiteur_id and t.owner_id = auth.uid())
  );
