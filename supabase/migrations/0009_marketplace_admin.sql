-- ============================================================
-- Lehaim — Espace admin de validation des traiteurs
--
-- Ajoute une liste blanche d'e-mails admin (table marketplace_admins),
-- une fonction is_marketplace_admin() utilisable dans les policies RLS
-- et via RPC côté app, et les policies qui donnent aux admins un accès
-- complet (lecture + écriture) sur la table `traiteurs`, quel que soit
-- son statut. Idempotent : relançable sans casse.
-- ============================================================

create table if not exists public.marketplace_admins (
  email text primary key
);

-- RLS activée sans aucune policy : personne ne peut lire/écrire cette
-- table via l'API, y compris les admins eux-mêmes. Seule la fonction
-- security definer ci-dessous peut la consulter.
alter table public.marketplace_admins enable row level security;

create or replace function public.is_marketplace_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.marketplace_admins
    where email = coalesce(auth.jwt() ->> 'email', '')
  );
$$;

grant execute on function public.is_marketplace_admin() to authenticated;

drop policy if exists "Admin voit tous les traiteurs" on public.traiteurs;
create policy "Admin voit tous les traiteurs"
  on public.traiteurs for select
  to authenticated
  using (public.is_marketplace_admin());

drop policy if exists "Admin modifie tous les traiteurs" on public.traiteurs;
create policy "Admin modifie tous les traiteurs"
  on public.traiteurs for update
  to authenticated
  using (public.is_marketplace_admin());

-- ------------------------------------------------------------
-- À exécuter une fois, en remplaçant par vos e-mails de connexion
-- lehaim (ceux utilisés pour /connexion, pas forcément votre e-mail
-- GitHub) :
--
--   insert into public.marketplace_admins (email) values
--     ('hugo.canton-bacara@epita.fr'),
--     ('email-de-rraven@exemple.com')
--   on conflict (email) do nothing;
-- ------------------------------------------------------------
