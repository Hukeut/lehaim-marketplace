-- ============================================================
-- Lehaim — correction de join_by_token
--
-- Bug constaté en test : rejoindre un Chabbat par lien échouait avec
--   42P10 · there is no unique or exclusion constraint matching the
--   ON CONFLICT specification
-- L'index `invitations_unique_guest` est partiel (where guest_id is not
-- null) : un ON CONFLICT doit répéter la même condition pour le cibler.
-- ============================================================

create or replace function public.join_by_token(token text)
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

  select s.id into target from shabbats s where s.share_token = token limit 1;
  if target is null then
    return null;
  end if;

  -- L'hôte est déjà membre : rien à créer.
  if exists (select 1 from shabbats s where s.id = target and s.host_id = me) then
    return target;
  end if;

  insert into invitations (shabbat_id, guest_id, status)
  values (target, me, 'pending')
  on conflict (shabbat_id, guest_id) where guest_id is not null do nothing;

  return target;
end;
$$;

revoke all on function public.join_by_token(text) from public;
grant execute on function public.join_by_token(text) to authenticated;
