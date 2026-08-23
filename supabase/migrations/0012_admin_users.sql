-- ============================================================
-- Lehaim — le back-office lit les vrais comptes
--
-- `profiles` ne contient que les personnes qui ont ouvert l'app assez loin
-- pour qu'une ligne y soit écrite. La liste qui fait foi est `auth.users`,
-- que le rôle `authenticated` ne peut pas lire directement : on passe donc
-- par une fonction, réservée à l'administrateur.
--
-- Au passage : on rattrape les profils manquants, et on en crée un
-- automatiquement à chaque inscription pour que l'écart ne se recreuse pas.
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Un profil pour chaque compte, présent et à venir
-- ------------------------------------------------------------

insert into public.profiles (id, email)
select u.id, u.email
  from auth.users u
  left join public.profiles p on p.id = u.id
 where p.id is null;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- 2 · La liste des comptes, telle que Supabase la connaît
-- ------------------------------------------------------------

/**
 * Comptes réels, avec ce que seule la table d'authentification sait :
 * l'e-mail vérifié, la date d'inscription, la dernière connexion.
 * Réservée à l'administrateur — la fonction refuse tout le monde d'autre.
 */
create or replace function public.admin_user_list()
returns table (
  id               uuid,
  email            text,
  first_name       text,
  last_name        text,
  phone            text,
  locale           text,
  back_office_role text,
  created_at       timestamptz,
  last_sign_in_at  timestamptz,
  confirmed_at     timestamptz,
  hosted           bigint,
  joined           bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'réservé à l''administration';
  end if;

  return query
    select
      u.id,
      u.email::text,
      p.first_name,
      p.last_name,
      p.phone,
      p.locale,
      p.back_office_role,
      u.created_at,
      u.last_sign_in_at,
      u.email_confirmed_at,
      (select count(*) from shabbats s where s.host_id = u.id),
      (select count(*) from invitations i where i.guest_id = u.id)
    from auth.users u
    left join profiles p on p.id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_user_list() from public;
grant execute on function public.admin_user_list() to authenticated;

/** Promeut ou rétrograde quelqu'un dans le back-office. */
create or replace function public.admin_set_role(target uuid, next_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'réservé à l''administration';
  end if;
  if next_role is not null and next_role not in ('merchant', 'admin') then
    raise exception 'rôle inconnu';
  end if;

  update profiles set back_office_role = next_role where id = target;
end;
$$;

revoke all on function public.admin_set_role(uuid, text) from public;
grant execute on function public.admin_set_role(uuid, text) to authenticated;
