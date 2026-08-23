-- ============================================================
-- Lehaim — chambres pour le couchage, et code d'invitation court
--
-- 1. Le couchage se détaille par chambre : combien de chambres, combien de
--    places dans chacune, et qui dort où.
-- 2. Un code court se dicte au téléphone ou se recopie à la main, là où le
--    lien suppose qu'on puisse cliquer.
--
-- À exécuter en TROIS passes (voir les séparateurs) : garder en même temps le
-- verrou de `shabbats` et celui d'une nouvelle table provoque un interblocage
-- avec l'application en production.
-- Idempotent.
-- ============================================================

-- ------------------------------------------------------------
-- Passe 1 · Chambres
-- ------------------------------------------------------------
set lock_timeout = '5s';

create table if not exists public.sleeping_rooms (
  id         uuid primary key default gen_random_uuid(),
  shabbat_id uuid not null references public.shabbats(id) on delete cascade,
  label      text not null,
  capacity   int not null default 2 check (capacity between 1 and 20),
  policy     text check (policy is null or policy in ('mixed', 'girls', 'boys')),
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sleeping_rooms_shabbat_idx on public.sleeping_rooms (shabbat_id);

alter table public.sleeping_rooms enable row level security;

drop policy if exists sleeping_rooms_select on public.sleeping_rooms;
create policy sleeping_rooms_select on public.sleeping_rooms for select to authenticated
  using (public.is_member(shabbat_id));

drop policy if exists sleeping_rooms_write on public.sleeping_rooms;
create policy sleeping_rooms_write on public.sleeping_rooms for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));

-- Où dort chaque invité. Null = ne dort pas sur place.
alter table public.invitations add column if not exists sleeping_room_id uuid
  references public.sleeping_rooms(id) on delete set null;

-- ------------------------------------------------------------
-- Passe 2 · Code d'invitation court
-- ------------------------------------------------------------
set lock_timeout = '5s';

alter table public.shabbats add column if not exists join_code text;

/**
 * Code de six caractères, sans les glyphes qu'on confond à l'oral ou à
 * l'écrit (0/O, 1/I/L, 2/Z, 5/S, 8/B).
 */
create or replace function public.generate_join_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ACDEFGHJKMNPQRTUVWXY34679', floor(random() * 25 + 1)::int, 1), ''
  )
  from generate_series(1, 6);
$$;

do $$
declare
  target record;
  candidate text;
begin
  for target in select id from public.shabbats where join_code is null loop
    loop
      candidate := public.generate_join_code();
      exit when not exists (select 1 from public.shabbats where join_code = candidate);
    end loop;
    update public.shabbats set join_code = candidate where id = target.id;
  end loop;
end
$$;

alter table public.shabbats alter column join_code set default public.generate_join_code();
alter table public.shabbats alter column join_code set not null;

create unique index if not exists shabbats_join_code_idx on public.shabbats (join_code);

/**
 * Rejoindre par code. Même contrat que `join_by_token` : la personne devient
 * invitée confirmée, et on renvoie l'identifiant du Chabbat pour rediriger.
 * Insensible à la casse et aux espaces, parce qu'un code se recopie à la main.
 */
create or replace function public.join_by_code(code text)
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

  select s.id into target
    from shabbats s
   where s.join_code = upper(regexp_replace(code, '\s', '', 'g'))
   limit 1;

  if target is null then
    return null;
  end if;

  -- L'hôte n'a pas à se rejoindre lui-même.
  if exists (select 1 from shabbats s where s.id = target and s.host_id = me) then
    return target;
  end if;

  insert into invitations (shabbat_id, guest_id, status)
  values (target, me, 'confirmed')
  on conflict (shabbat_id, guest_id) where guest_id is not null
  do update set status = 'confirmed';

  return target;
end;
$$;

revoke all on function public.join_by_code(text) from public;
grant execute on function public.join_by_code(text) to authenticated;

/** Aperçu d'un code, avant de rejoindre : on montre ce qu'on rejoint. */
create or replace function public.code_preview(code text)
returns table (title text, starts_at timestamptz, host_name text)
language sql
security definer
stable
set search_path = public
as $$
  select
    s.title,
    s.starts_at,
    coalesce(nullif(btrim(concat_ws(' ', p.first_name, p.last_name)), ''), 'Votre hôte')
  from shabbats s
  left join profiles p on p.id = s.host_id
  where s.join_code = upper(regexp_replace(code, '\s', '', 'g'))
  limit 1;
$$;

revoke all on function public.code_preview(text) from public;
grant execute on function public.code_preview(text) to anon, authenticated;

-- ------------------------------------------------------------
-- Passe 3 · Suppression de compte
-- ------------------------------------------------------------

/**
 * Supprime définitivement le compte de la personne connectée.
 *
 * `profiles.id` référence `auth.users` en cascade, et les Chabbats organisés
 * référencent `profiles` en cascade : effacer la ligne d'authentification
 * emporte donc le profil, les Chabbats organisés et tout ce qui en dépend.
 * Les participations à d'autres Chabbats se détachent (`on delete set null`)
 * plutôt que d'effacer le travail des autres.
 */
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'authentification requise';
  end if;

  delete from auth.users where id = me;
end;
$$;

revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
