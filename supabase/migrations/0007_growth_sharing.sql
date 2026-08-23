-- ============================================================
-- Lehaim — Acquisition & partage (G01→G05)
--
-- 1. Co-organisateurs : un invité peut se voir déléguer la gestion.
-- 2. Aperçu par lien enrichi : moments et options, sans jamais exposer
--    l'adresse — elle n'est envoyée qu'après confirmation (écran G02).
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- 1 · Co-organisateurs
-- ------------------------------------------------------------
alter table public.invitations add column if not exists is_cohost boolean not null default false;

-- Périmètres délégués. Ils pilotent l'affichage ; l'autorisation réelle
-- passe par `is_host`, élargi plus bas aux co-organisateurs.
alter table public.invitations add column if not exists can_manage_missions boolean not null default true;
alter table public.invitations add column if not exists can_manage_guests   boolean not null default true;
alter table public.invitations add column if not exists can_manage_messages boolean not null default true;
alter table public.invitations add column if not exists can_manage_expenses boolean not null default false;

create index if not exists invitations_cohost_idx
  on public.invitations (shabbat_id) where is_cohost;

-- `is_host` couvre désormais les co-organisateurs : ils gèrent missions,
-- invités, matériel et moments. En revanche `shabbats_update` reste borné
-- au seul `host_id` — modifier la date, le lieu ou le mode de financement
-- demeure la prérogative de l'hôte principal (règle affichée en G03).
create or replace function public.is_host(sid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from shabbats s
    where s.id = sid and s.host_id = (select auth.uid())
  ) or exists (
    select 1 from invitations i
    where i.shabbat_id = sid
      and i.guest_id = (select auth.uid())
      and i.is_cohost
      and i.status = 'confirmed'
  );
$$;

-- ------------------------------------------------------------
-- 2 · Aperçu par lien enrichi (G02)
-- ------------------------------------------------------------
drop function if exists public.shabbat_preview(text);

create or replace function public.shabbat_preview(token text)
returns table (
  id            uuid,
  title         text,
  starts_at     timestamptz,
  neighbourhood text,
  host_name     text,
  guest_target  int,
  confirmed     bigint,
  visibility    text,
  moments       text[],
  has_sleepover boolean,
  funding_mode  text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.id,
    s.title,
    s.starts_at,
    s.neighbourhood,
    coalesce(nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Votre hôte'),
    s.guest_target,
    (select count(*) from invitations i
      where i.shabbat_id = s.id and i.status = 'confirmed'),
    s.visibility,
    coalesce(
      (select array_agg(m.label order by m.position) from moments m where m.shabbat_id = s.id),
      '{}'::text[]
    ),
    exists (select 1 from moments m where m.shabbat_id = s.id and m.kind = 'sleepover'),
    s.funding_mode
  from shabbats s
  left join profiles p on p.id = s.host_id
  where s.share_token = token
  limit 1;
$$;

revoke all on function public.shabbat_preview(text) from public;
grant execute on function public.shabbat_preview(text) to anon, authenticated;

-- ------------------------------------------------------------
-- 3 · Répondre directement depuis le lien (G02)
--     « Je viens » / « Je ne peux pas » sans passer par un écran
--     intermédiaire : on rejoint et on répond en une fois.
-- ------------------------------------------------------------
create or replace function public.respond_by_token(token text, answer text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  me     uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'authentification requise';
  end if;
  if answer not in ('confirmed', 'declined') then
    raise exception 'réponse invalide';
  end if;

  select s.id into target from shabbats s where s.share_token = token limit 1;
  if target is null then
    return null;
  end if;

  -- L'hôte n'a pas à répondre à sa propre invitation.
  if exists (select 1 from shabbats s where s.id = target and s.host_id = me) then
    return target;
  end if;

  insert into invitations (shabbat_id, guest_id, status)
  values (target, me, answer)
  on conflict (shabbat_id, guest_id) where guest_id is not null
  do update set status = excluded.status;

  return target;
end;
$$;

revoke all on function public.respond_by_token(text, text) from public;
grant execute on function public.respond_by_token(text, text) to authenticated;
