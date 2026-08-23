-- ============================================================
-- Lehaim Market — stockage des pièces, et les champs du contrat
--
-- Le tunnel marchand demande de déposer une pièce d'identité, un Kbis, une
-- licence et un certificat de cacherout. La colonne `file_path` existait
-- depuis 0022 ; il lui manquait un endroit où pointer.
--
-- Deux seaux, parce que deux régimes :
--
--   · `shop-documents` est PRIVÉ. Il contient des pièces d'identité. Personne
--     ne le lit sans y avoir droit, pas même par URL devinée.
--   · `shop-media` est public : logos, photos de couverture et de produits
--     s'affichent sur la fiche client, il serait absurde de les protéger.
--
-- Convention de chemin, et elle porte la sécurité : `{shop_id}/{fichier}`.
-- Le premier segment du chemin EST la boutique, ce qui permet aux politiques
-- de vérifier la propriété sans jointure.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Les seaux
-- ------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('shop-documents', 'shop-documents', false, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('shop-media', 'shop-media', true, 5242880,
   array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ------------------------------------------------------------
-- 2 · Qui dépose et qui lit
-- ------------------------------------------------------------

/** La boutique à laquelle appartient un fichier, lue dans son chemin. */
create or replace function public.shop_of_path(name text)
returns uuid
language sql
immutable
set search_path = public
as $$
  -- `12345678-.../cni-recto.jpg` → l'uuid. Null si le premier segment n'en
  -- est pas un : un chemin mal formé n'appartient à personne.
  --
  -- La forme est vérifiée avant la conversion, et pas seulement par propreté :
  -- un `::uuid` qui échoue lève une exception, et une exception levée dans une
  -- politique de stockage fait répondre 500 au lieu de refuser. Le refus doit
  -- être un refus.
  select case
           when (string_to_array(name, '/'))[1]
                ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
           then ((string_to_array(name, '/'))[1])::uuid
         end;
$$;

drop policy if exists shop_documents_owner on storage.objects;
create policy shop_documents_owner on storage.objects for all to authenticated
  using (
    bucket_id = 'shop-documents'
    and (public.owns_shop(public.shop_of_path(name)) or public.is_admin())
  )
  with check (
    bucket_id = 'shop-documents'
    and (public.owns_shop(public.shop_of_path(name)) or public.is_admin())
  );

drop policy if exists shop_media_owner on storage.objects;
create policy shop_media_owner on storage.objects for all to authenticated
  using (
    bucket_id = 'shop-media'
    and (public.owns_shop(public.shop_of_path(name)) or public.is_admin())
  )
  with check (
    bucket_id = 'shop-media'
    and (public.owns_shop(public.shop_of_path(name)) or public.is_admin())
  );

-- Les médias se lisent sans compte : c'est ce que voit le client sur la fiche.
drop policy if exists shop_media_public_read on storage.objects;
create policy shop_media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'shop-media');

-- ------------------------------------------------------------
-- 3 · Les champs du contrat
-- ------------------------------------------------------------
-- L'IBAN sert aux reversements. Il vit sur `shops`, table dont la RLS
-- n'ouvre la lecture qu'au propriétaire et à l'administration — mais il
-- faudra le chiffrer avant d'avoir de vrais volumes.

alter table public.shops add column if not exists iban               text;
alter table public.shops add column if not exists payout_frequency   text not null default 'weekly'
  check (payout_frequency in ('weekly', 'biweekly', 'monthly'));
alter table public.shops add column if not exists contract_signature text;
alter table public.shops add column if not exists contract_signed_at timestamptz;
