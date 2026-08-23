-- ============================================================
-- Lehaim — table `profiles` (base manquante)
--
-- Les migrations 0001 à 0007 supposent toutes que `public.profiles`
-- existe déjà (héritée de la version précédente de l'app, jamais
-- committée en tant que migration). Ce fichier la recrée à partir
-- de tout ce que le code v2 lit/écrit dessus, pour les nouveaux
-- projets Supabase qui n'ont pas cet historique.
--
-- Reconstitué à partir du code (lib/profile.ts, lib/onboarding-state.ts,
-- et du commentaire d'en-tête de 0001_init.sql) — pas garanti identique
-- à 100% au schéma original de Rraven, mais couvre tout ce que l'app
-- utilise. À exécuter en premier, avant 0001.
-- Idempotent : relançable sans casse.
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  first_name      text,
  last_name       text,
  phone           text,
  whatsapp_number text,
  role            text check (role in ('participant','organizer')) default 'participant',
  avatar_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  deleted_at      timestamptz
);

alter table public.profiles enable row level security;

drop policy if exists "Profils visibles par les utilisateurs connectés" on public.profiles;
create policy "Profils visibles par les utilisateurs connectés"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "Chacun peut modifier son propre profil" on public.profiles;
create policy "Chacun peut modifier son propre profil"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Chacun peut créer son propre profil" on public.profiles;
create policy "Chacun peut créer son propre profil"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Crée automatiquement une ligne `profiles` à chaque inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
