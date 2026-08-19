-- ============================================================
-- Lehaim — accès par lien de partage
--
-- Le document produit pose comme critère : « le produit doit rester
-- utilisable avec seulement un lien WhatsApp ». Les politiques RLS
-- réservent la lecture aux membres ; on ouvre donc deux fonctions
-- SECURITY DEFINER, strictement limitées à un jeton connu.
-- ============================================================

-- Aperçu public d'un Chabbat à partir de son jeton. Ne révèle ni adresse
-- exacte, ni liste d'invités : juste de quoi décider de rejoindre.
create or replace function public.shabbat_preview(token text)
returns table (
  id            uuid,
  title         text,
  starts_at     timestamptz,
  neighbourhood text,
  host_name     text,
  guest_target  int,
  confirmed     bigint,
  visibility    text
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
    s.visibility
  from shabbats s
  left join profiles p on p.id = s.host_id
  where s.share_token = token
  limit 1;
$$;

revoke all on function public.shabbat_preview(text) from public;
grant execute on function public.shabbat_preview(text) to anon, authenticated;

-- Rejoindre un Chabbat via son jeton. Idempotent : rappeler la fonction
-- ne crée pas de doublon et ne réinitialise pas un refus assumé.
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

  if exists (select 1 from shabbats s where s.id = target and s.host_id = me) then
    return target;
  end if;

  insert into invitations (shabbat_id, guest_id, status)
  values (target, me, 'pending')
  on conflict (shabbat_id, guest_id) do nothing;

  return target;
end;
$$;

revoke all on function public.join_by_token(text) from public;
grant execute on function public.join_by_token(text) to authenticated;
