-- ============================================================
-- Lehaim — Gamification, cœur du moteur (vague 1)
--
-- Journal d'événements immuable + grand livre XP en partie double
-- (jamais un compteur qu'on incrémente/décrémente à l'aveugle) +
-- règles versionnées + paliers + état courant matérialisé.
--
-- `subject_id` est polymorphe (traiteurs.id si subject_type =
-- 'traiteur', profiles.id si 'organizer') : pas de FK directe
-- possible, donc pas de contrainte FK dessus. La légitimité des
-- écritures est validée par les fonctions security definer
-- ci-dessous, pas par des policies RLS classiques — même approche
-- que `is_marketplace_admin()` / `marketplace_admins` (0009) : RLS
-- activée, aucune policy d'écriture, tout passe par des fonctions.
--
-- Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.gamification_events (
  id           uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('traiteur', 'organizer')),
  subject_id   uuid not null,
  event_type   text not null,
  order_id     uuid references public.marketplace_orders(id) on delete set null,
  payload      jsonb not null default '{}'::jsonb,
  is_void      boolean not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists gamification_events_subject_idx
  on public.gamification_events (subject_type, subject_id, created_at desc);

-- Empêche de forger deux fois le même événement "terminal" pour la
-- même commande (protection anti-abus : sans ça, rejouer l'appel
-- RPC directement suffirait à dupliquer du XP).
create unique index if not exists gamification_events_order_type_once
  on public.gamification_events (order_id, event_type)
  where order_id is not null and event_type in (
    'ORDER_COMPLETED', 'ORDER_COMPLETED_AS_CLIENT',
    'ORDER_CANCELLED_BY_TRAITEUR', 'ORDER_CANCELLED_BY_CLIENT',
    'REVIEW_RECEIVED', 'REVIEW_LEFT'
  );

create table if not exists public.gamification_rules (
  id              uuid primary key default gen_random_uuid(),
  rule_key        text not null,
  subject_type    text not null check (subject_type in ('traiteur', 'organizer')),
  value           jsonb not null,
  valid_from      timestamptz not null default now(),
  valid_to        timestamptz,
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists gamification_rules_active_idx
  on public.gamification_rules (rule_key, subject_type, valid_from desc);

create table if not exists public.gamification_xp_ledger (
  id              uuid primary key default gen_random_uuid(),
  subject_type    text not null check (subject_type in ('traiteur', 'organizer')),
  subject_id      uuid not null,
  event_id        uuid references public.gamification_events(id) on delete set null,
  delta_xp        integer not null,
  reason          text not null,
  rule_version_id uuid references public.gamification_rules(id) on delete set null,
  dedupe_key      text unique,
  created_at      timestamptz not null default now(),
  voided_at       timestamptz
);

create index if not exists gamification_xp_ledger_subject_idx
  on public.gamification_xp_ledger (subject_type, subject_id, created_at desc);

create table if not exists public.gamification_levels (
  id                    uuid primary key default gen_random_uuid(),
  subject_type          text not null check (subject_type in ('traiteur', 'organizer')),
  level_key             text not null,
  name                  text not null,
  min_xp                integer not null default 0,
  min_metric_thresholds jsonb not null default '{}'::jsonb,
  sort_order            integer not null,
  unique (subject_type, level_key)
);

create table if not exists public.gamification_subject_state (
  subject_type         text not null check (subject_type in ('traiteur', 'organizer')),
  subject_id           uuid not null,
  current_level_id     uuid references public.gamification_levels(id) on delete set null,
  current_xp           integer not null default 0,
  metrics              jsonb not null default '{}'::jsonb,
  last_recalculated_at timestamptz not null default now(),
  primary key (subject_type, subject_id)
);

-- ------------------------------------------------------------
-- Légitimité d'accès à un "sujet" de gamification : le sujet
-- lui-même, un admin, ou quelqu'un ayant réellement transigé avec
-- lui (commande marketplace commune). Centralisé ici plutôt que
-- dupliqué dans chaque fonction/policy ci-dessous.
-- ------------------------------------------------------------
create or replace function public.is_gamification_subject(p_subject_type text, p_subject_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select case p_subject_type
    when 'organizer' then p_subject_id = auth.uid()
    when 'traiteur' then exists (
      select 1 from public.traiteurs t where t.id = p_subject_id and t.owner_id = auth.uid()
    )
    else false
  end;
$$;
grant execute on function public.is_gamification_subject(text, uuid) to authenticated;

create or replace function public.can_touch_gamification_subject(p_subject_type text, p_subject_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select
    public.is_marketplace_admin()
    or public.is_gamification_subject(p_subject_type, p_subject_id)
    or exists (
      select 1 from public.marketplace_orders o
      where (
        (p_subject_type = 'traiteur' and o.traiteur_id = p_subject_id)
        or (p_subject_type = 'organizer' and o.user_id = p_subject_id)
      )
      and (
        o.user_id = auth.uid()
        or exists (select 1 from public.traiteurs t where t.id = o.traiteur_id and t.owner_id = auth.uid())
      )
    );
$$;
grant execute on function public.can_touch_gamification_subject(text, uuid) to authenticated;

-- ------------------------------------------------------------
-- Écriture d'un événement métier. Seul point d'entrée pour peupler
-- gamification_events (aucune policy INSERT n'est accordée sur la
-- table). Retourne l'id créé, ou null si refusé/déjà existant.
--
-- Deux garde-fous anti-abus au-delà de `can_touch_gamification_subject` :
--  1. pour les événements "terminaux" liés à une commande, l'état
--     réel de la commande en base doit correspondre à ce qui est
--     déclaré (impossible de forger un ORDER_COMPLETED sur une
--     commande qui n'est pas "recuperee") ;
--  2. pour les événements liés à un avis, l'avis doit réellement
--     exister en base pour cette commande.
-- ------------------------------------------------------------
create or replace function public.record_gamification_event(
  p_subject_type text,
  p_subject_id uuid,
  p_event_type text,
  p_order_id uuid,
  p_payload jsonb
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_touch_gamification_subject(p_subject_type, p_subject_id) then
    return null;
  end if;

  if p_order_id is not null then
    if p_event_type in ('ORDER_COMPLETED', 'ORDER_COMPLETED_AS_CLIENT')
       and not exists (select 1 from public.marketplace_orders where id = p_order_id and status = 'recuperee') then
      return null;
    end if;
    if p_event_type in ('ORDER_CANCELLED_BY_TRAITEUR', 'ORDER_CANCELLED_BY_CLIENT')
       and not exists (select 1 from public.marketplace_orders where id = p_order_id and status = 'annulee') then
      return null;
    end if;
    if p_event_type in ('REVIEW_RECEIVED', 'REVIEW_LEFT')
       and not exists (select 1 from public.marketplace_reviews where order_id = p_order_id) then
      return null;
    end if;
  end if;

  begin
    insert into public.gamification_events (subject_type, subject_id, event_type, order_id, payload)
    values (p_subject_type, p_subject_id, p_event_type, p_order_id, coalesce(p_payload, '{}'::jsonb))
    returning id into v_id;
  exception when unique_violation then
    return null;
  end;

  return v_id;
end;
$$;
grant execute on function public.record_gamification_event(text, uuid, text, uuid, jsonb) to authenticated;

-- ------------------------------------------------------------
-- Écriture d'une ligne du grand livre XP. `p_dedupe_key`, quand
-- fourni, empêche un double octroi (ex. le même événement recalculé
-- deux fois) via la contrainte unique — conflit ignoré, pas d'erreur.
-- ------------------------------------------------------------
create or replace function public.grant_gamification_xp(
  p_subject_type text,
  p_subject_id uuid,
  p_event_id uuid,
  p_delta_xp integer,
  p_reason text,
  p_rule_version_id uuid,
  p_dedupe_key text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.can_touch_gamification_subject(p_subject_type, p_subject_id) then
    return null;
  end if;

  insert into public.gamification_xp_ledger
    (subject_type, subject_id, event_id, delta_xp, reason, rule_version_id, dedupe_key)
  values
    (p_subject_type, p_subject_id, p_event_id, p_delta_xp, p_reason, p_rule_version_id, p_dedupe_key)
  on conflict (dedupe_key) do nothing
  returning id into v_id;

  return v_id;
end;
$$;
grant execute on function public.grant_gamification_xp(text, uuid, uuid, integer, text, uuid, text) to authenticated;

-- ------------------------------------------------------------
-- Annule une ligne du grand livre (ex. commande requalifiée après
-- coup) sans jamais la supprimer : traçabilité intégrale conservée.
-- ------------------------------------------------------------
create or replace function public.void_gamification_xp(p_ledger_id uuid)
returns boolean
language plpgsql security definer set search_path = public
as $$
declare
  v_subject_type text;
  v_subject_id uuid;
begin
  select subject_type, subject_id into v_subject_type, v_subject_id
  from public.gamification_xp_ledger where id = p_ledger_id;

  if v_subject_type is null then
    return false;
  end if;
  if not public.can_touch_gamification_subject(v_subject_type, v_subject_id) then
    return false;
  end if;

  update public.gamification_xp_ledger set voided_at = now()
  where id = p_ledger_id and voided_at is null;

  return true;
end;
$$;
grant execute on function public.void_gamification_xp(uuid) to authenticated;

-- ------------------------------------------------------------
-- Matérialise l'état courant recalculé côté application (niveau,
-- XP, snapshot des métriques). Jamais la source de vérité — un
-- cache reconstructible à tout moment depuis les tables ci-dessus.
-- ------------------------------------------------------------
create or replace function public.upsert_gamification_subject_state(
  p_subject_type text,
  p_subject_id uuid,
  p_level_id uuid,
  p_current_xp integer,
  p_metrics jsonb
) returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  if not public.can_touch_gamification_subject(p_subject_type, p_subject_id) then
    return false;
  end if;

  insert into public.gamification_subject_state
    (subject_type, subject_id, current_level_id, current_xp, metrics, last_recalculated_at)
  values
    (p_subject_type, p_subject_id, p_level_id, p_current_xp, coalesce(p_metrics, '{}'::jsonb), now())
  on conflict (subject_type, subject_id) do update set
    current_level_id = excluded.current_level_id,
    current_xp = excluded.current_xp,
    metrics = excluded.metrics,
    last_recalculated_at = now();

  return true;
end;
$$;
grant execute on function public.upsert_gamification_subject_state(text, uuid, uuid, integer, jsonb) to authenticated;

-- ------------------------------------------------------------
-- RLS : lecture seule via policies classiques (le sujet voit ses
-- propres données, l'admin voit tout) ; aucune policy d'écriture —
-- tout passe par les fonctions ci-dessus. `gamification_levels` est
-- lisible par tous (nécessaire pour afficher "encore X XP pour
-- Confirmé" côté UI) ; `gamification_rules` reste interne à l'admin
-- (les formules exactes n'ont pas à être exposées, §14 du cahier
-- des charges).
-- ------------------------------------------------------------
alter table public.gamification_events enable row level security;
alter table public.gamification_xp_ledger enable row level security;
alter table public.gamification_levels enable row level security;
alter table public.gamification_subject_state enable row level security;
alter table public.gamification_rules enable row level security;

drop policy if exists "Le sujet et l'admin lisent les événements" on public.gamification_events;
create policy "Le sujet et l'admin lisent les événements"
  on public.gamification_events for select
  to authenticated
  using (public.is_gamification_subject(subject_type, subject_id) or public.is_marketplace_admin());

drop policy if exists "Le sujet et l'admin lisent le grand livre XP" on public.gamification_xp_ledger;
create policy "Le sujet et l'admin lisent le grand livre XP"
  on public.gamification_xp_ledger for select
  to authenticated
  using (public.is_gamification_subject(subject_type, subject_id) or public.is_marketplace_admin());

drop policy if exists "Les paliers sont visibles par tous" on public.gamification_levels;
create policy "Les paliers sont visibles par tous"
  on public.gamification_levels for select
  to authenticated
  using (true);

drop policy if exists "Le sujet et l'admin lisent l'état courant" on public.gamification_subject_state;
create policy "Le sujet et l'admin lisent l'état courant"
  on public.gamification_subject_state for select
  to authenticated
  using (public.is_gamification_subject(subject_type, subject_id) or public.is_marketplace_admin());

drop policy if exists "Seul l'admin lit les règles" on public.gamification_rules;
create policy "Seul l'admin lit les règles"
  on public.gamification_rules for select
  to authenticated
  using (public.is_marketplace_admin());

-- `gamification_levels` / `gamification_rules` s'éditent pour
-- l'instant côté admin via l'éditeur de tables Supabase (comme
-- `marketplace_admins`), pas via l'API — pas de policy d'écriture.
