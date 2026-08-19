-- ============================================================
-- Lehaim — Missions & Ops
-- Moments, missions à slots, suggestions, matériel, échanges,
-- financement, compte à rebours et verrouillage.
-- Idempotent. Ne touche à aucune table de la version précédente.
-- ============================================================

-- ------------------------------------------------------------
-- Shabbats : financement, deadline, verrouillage, modèle
-- ------------------------------------------------------------
alter table public.shabbats add column if not exists template     text;
alter table public.shabbats add column if not exists ready_by     timestamptz;
alter table public.shabbats add column if not exists locked_at    timestamptz;
alter table public.shabbats add column if not exists funding_mode text not null default 'byo';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'shabbats_funding_mode_check') then
    alter table public.shabbats add constraint shabbats_funding_mode_check
      check (funding_mode in ('byo','split','pot','host_pays','free'));
  end if;
end
$$;

-- ------------------------------------------------------------
-- Moments : vendredi soir, samedi midi, couchage, synagogue…
-- ------------------------------------------------------------
create table if not exists public.moments (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  kind       text not null check (kind in (
               'friday_dinner','saturday_lunch','sleepover',
               'synagogue_evening','synagogue_morning','other')),
  label      text not null,
  detail     text,
  position   int not null default 0,
  unique (shabbat_id, kind)
);

-- ------------------------------------------------------------
-- RSVP par moment
-- ------------------------------------------------------------
create table if not exists public.rsvps (
  id            uuid primary key default gen_random_uuid(),
  moment_id     uuid not null references public.moments(id) on delete cascade,
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  attending     boolean not null default true,
  unique (moment_id, invitation_id)
);

-- ------------------------------------------------------------
-- Missions et places
-- ------------------------------------------------------------
create table if not exists public.missions (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  moment_id  uuid references public.moments(id) on delete set null,
  category   text not null default 'food'
             check (category in ('food','drinks','equipment','hosting','other')),
  title      text not null,
  emoji      text,
  slots      int not null default 1 check (slots between 1 and 20),
  quantity   text,
  priority   text not null default 'standard' check (priority in ('essential','standard')),
  notes      text,
  status     text not null default 'todo' check (status in ('todo','in_progress','done')),
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.mission_claims (
  id         uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (mission_id, profile_id)
);

-- ------------------------------------------------------------
-- Suggestions rattachées à une mission
-- ------------------------------------------------------------
create table if not exists public.suggestions (
  id         uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.missions(id) on delete cascade,
  author_id  uuid references public.profiles(id) on delete set null,
  body       text not null check (length(btrim(body)) > 0),
  chosen     boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.suggestion_votes (
  suggestion_id uuid not null references public.suggestions(id) on delete cascade,
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  primary key (suggestion_id, profile_id)
);

-- ------------------------------------------------------------
-- Matériel : ce que l'hôte possède vs ce qui manque
-- ------------------------------------------------------------
create table if not exists public.equipment (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  name       text not null,
  emoji      text,
  owned      int not null default 0 check (owned >= 0),
  needed     int not null default 0 check (needed >= 0),
  claimed_by uuid references public.profiles(id) on delete set null,
  position   int not null default 0
);

-- ------------------------------------------------------------
-- Échanges de mission
-- ------------------------------------------------------------
create table if not exists public.swaps (
  id          uuid primary key default gen_random_uuid(),
  mission_id  uuid not null references public.missions(id) on delete cascade,
  from_id     uuid not null references public.profiles(id) on delete cascade,
  to_id       uuid references public.profiles(id) on delete set null,
  status      text not null default 'pending'
              check (status in ('pending','accepted','declined','cancelled')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- ------------------------------------------------------------
-- Cagnotte et règlements
-- ------------------------------------------------------------
create table if not exists public.contributions (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  amount     numeric(10,2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

alter table public.expenses add column if not exists mission_id uuid
  references public.missions(id) on delete set null;
alter table public.expenses add column if not exists settled boolean not null default false;

create index if not exists moments_shabbat_idx      on public.moments (shabbat_id, position);
create index if not exists rsvps_invitation_idx     on public.rsvps (invitation_id);
create index if not exists missions_shabbat_idx     on public.missions (shabbat_id, position);
create index if not exists claims_mission_idx       on public.mission_claims (mission_id);
create index if not exists claims_profile_idx       on public.mission_claims (profile_id);
create index if not exists suggestions_mission_idx  on public.suggestions (mission_id);
create index if not exists equipment_shabbat_idx    on public.equipment (shabbat_id, position);
create index if not exists swaps_mission_idx        on public.swaps (mission_id, status);
create index if not exists contributions_shabbat_ix on public.contributions (shabbat_id);

-- ------------------------------------------------------------
-- Appartenance déduite d'une mission / d'un moment
-- ------------------------------------------------------------
create or replace function public.mission_is_member(mid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.is_member((select m.shabbat_id from missions m where m.id = mid));
$$;

create or replace function public.suggestion_is_member(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select public.mission_is_member((select s.mission_id from suggestions s where s.id = sid));
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.moments          enable row level security;
alter table public.rsvps            enable row level security;
alter table public.missions         enable row level security;
alter table public.mission_claims   enable row level security;
alter table public.suggestions      enable row level security;
alter table public.suggestion_votes enable row level security;
alter table public.equipment        enable row level security;
alter table public.swaps            enable row level security;
alter table public.contributions    enable row level security;

-- Moments : lecture pour les membres, écriture pour l'hôte.
drop policy if exists moments_select on public.moments;
create policy moments_select on public.moments for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists moments_write on public.moments;
create policy moments_write on public.moments for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));

-- RSVP : chacun gère le sien, l'hôte voit et corrige tout.
drop policy if exists rsvps_all on public.rsvps;
create policy rsvps_all on public.rsvps for all to authenticated
  using (
    exists (
      select 1 from public.invitations i
      where i.id = rsvps.invitation_id
        and (i.guest_id = (select auth.uid()) or public.is_host(i.shabbat_id))
    )
  )
  with check (
    exists (
      select 1 from public.invitations i
      where i.id = rsvps.invitation_id
        and (i.guest_id = (select auth.uid()) or public.is_host(i.shabbat_id))
    )
  );

-- Missions : tous les membres lisent ; l'hôte structure, chacun avance le statut.
drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists missions_host on public.missions;
create policy missions_host on public.missions for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));
drop policy if exists missions_progress on public.missions;
create policy missions_progress on public.missions for update to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

-- Places prises : on ne prend et ne libère que la sienne.
drop policy if exists claims_select on public.mission_claims;
create policy claims_select on public.mission_claims for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists claims_mine on public.mission_claims;
create policy claims_mine on public.mission_claims for all to authenticated
  using (profile_id = (select auth.uid())) with check (
    profile_id = (select auth.uid()) and public.mission_is_member(mission_id)
  );

-- Suggestions : tous proposent, l'auteur supprime, tous les membres modifient
-- le choix (le responsable ou l'hôte tranche dans l'interface).
drop policy if exists suggestions_select on public.suggestions;
create policy suggestions_select on public.suggestions for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions for insert to authenticated
  with check (author_id = (select auth.uid()) and public.mission_is_member(mission_id));
drop policy if exists suggestions_update on public.suggestions;
create policy suggestions_update on public.suggestions for update to authenticated
  using (public.mission_is_member(mission_id)) with check (public.mission_is_member(mission_id));
drop policy if exists suggestions_delete on public.suggestions;
create policy suggestions_delete on public.suggestions for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists votes_select on public.suggestion_votes;
create policy votes_select on public.suggestion_votes for select to authenticated
  using (public.suggestion_is_member(suggestion_id));
drop policy if exists votes_mine on public.suggestion_votes;
create policy votes_mine on public.suggestion_votes for all to authenticated
  using (profile_id = (select auth.uid())) with check (
    profile_id = (select auth.uid()) and public.suggestion_is_member(suggestion_id)
  );

-- Matériel : lecture membres, structure hôte, prise en charge par tous.
drop policy if exists equipment_select on public.equipment;
create policy equipment_select on public.equipment for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists equipment_host on public.equipment;
create policy equipment_host on public.equipment for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));
drop policy if exists equipment_claim on public.equipment;
create policy equipment_claim on public.equipment for update to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

-- Échanges : visibles par les membres, gérés par les deux parties.
drop policy if exists swaps_select on public.swaps;
create policy swaps_select on public.swaps for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists swaps_insert on public.swaps;
create policy swaps_insert on public.swaps for insert to authenticated
  with check (from_id = (select auth.uid()) and public.mission_is_member(mission_id));
drop policy if exists swaps_resolve on public.swaps;
create policy swaps_resolve on public.swaps for update to authenticated
  using (from_id = (select auth.uid()) or to_id = (select auth.uid()))
  with check (from_id = (select auth.uid()) or to_id = (select auth.uid()));

-- Cagnotte : chacun voit le total, chacun ajoute sa part.
drop policy if exists contributions_select on public.contributions;
create policy contributions_select on public.contributions for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists contributions_mine on public.contributions;
create policy contributions_mine on public.contributions for all to authenticated
  using (profile_id = (select auth.uid())) with check (
    profile_id = (select auth.uid()) and public.is_member(shabbat_id)
  );
