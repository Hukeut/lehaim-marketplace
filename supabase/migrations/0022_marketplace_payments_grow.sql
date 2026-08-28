-- ============================================================
-- Lehaim — Paiement en ligne via Grow (ex-Meshulam)
--
-- Grow encaisse en shekels (pas de conversion en agorot, contrairement à
-- Stripe) — marketplace_orders.total_amount est déjà en ILS, aucune
-- conversion n'est nécessaire au moment de la charge.
--
-- payment_status suit le cycle : unpaid -> paid -> refunded, ou -> failed
-- si le paiement échoue. Les colonnes grow_* mémorisent process/transaction
-- pour rapprocher le callback serveur-à-serveur de Grow avec la commande,
-- et pour pouvoir rembourser (refundTransaction a besoin de transactionId +
-- transactionToken).
--
-- payment_methods est le "portefeuille" du client : les cartes qu'il a
-- choisi de mémoriser (tokenisation Grow), pour payer en un clic aux
-- commandes suivantes. Un jeton (card_token) ne révèle jamais le numéro de
-- carte — seuls les 4 derniers chiffres et la marque sont stockés pour
-- l'affichage.
-- ============================================================

alter table public.marketplace_orders
  add column if not exists payment_status         text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded', 'failed')),
  add column if not exists currency                text not null default 'ils',
  add column if not exists grow_page_code          text,
  add column if not exists grow_process_id         text,
  add column if not exists grow_process_token      text,
  add column if not exists grow_transaction_id     text,
  add column if not exists grow_transaction_token  text,
  add column if not exists grow_asmachta           text;

create index if not exists marketplace_orders_payment_status_idx
  on public.marketplace_orders (payment_status);

-- ------------------------------------------------------------
-- Portefeuille client : cartes mémorisées (jetons Grow)
-- ------------------------------------------------------------

create table if not exists public.payment_methods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  card_token  text not null,
  card_brand  text,
  card_suffix text,
  card_exp    text,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now()
);

create unique index if not exists payment_methods_user_token_idx
  on public.payment_methods (user_id, card_token);

create index if not exists payment_methods_user_idx
  on public.payment_methods (user_id, created_at desc);

alter table public.payment_methods enable row level security;

drop policy if exists "Le client gère ses propres moyens de paiement" on public.payment_methods;
create policy "Le client gère ses propres moyens de paiement"
  on public.payment_methods for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- Suivi des demandes d'ajout de carte (save-token-only)
--
-- Le callback serveur-à-serveur de Grow pour un ajout de carte ne porte que
-- processId/processToken — cette table fait le lien entre cette paire et le
-- client qui a lancé la demande, le temps que Grow réponde. Nettoyée après
-- usage (consumed_at) ; les lignes non consommées après 24h sont mortes et
-- peuvent être ignorées ou purgées manuellement.
-- ------------------------------------------------------------

create table if not exists public.payment_method_intents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  process_id     text not null,
  process_token  text not null,
  created_at     timestamptz not null default now(),
  consumed_at    timestamptz
);

create unique index if not exists payment_method_intents_process_idx
  on public.payment_method_intents (process_id);

alter table public.payment_method_intents enable row level security;

-- Aucune policy select/insert/update pour les clients : cette table n'est
-- lue/écrite que par le service role (webhook Grow) et par les server
-- actions via le client marketplace authentifié pour l'insert initial.
drop policy if exists "Le client crée sa propre intention d'ajout de carte" on public.payment_method_intents;
create policy "Le client crée sa propre intention d'ajout de carte"
  on public.payment_method_intents for insert
  to authenticated
  with check (user_id = auth.uid());
