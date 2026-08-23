-- ============================================================
-- Lehaim — Créneaux à capacité
--
-- `traiteur_slots` n'avait ni capacité ni lien depuis la commande : une
-- commande ne stockait que la date/libellé recopiés (`pickup_date`,
-- `pickup_slot`), pas une référence au créneau — impossible de compter
-- combien de commandes tiennent sur un créneau donné. `capacity` reste
-- optionnel : un créneau sans capacité renseignée reste illimité, comme
-- avant cette migration. Le contrôle du plafond se fait côté Server Action
-- (createOrder), pas par contrainte SQL — même choix que la relecture des
-- prix, déjà faite là plutôt qu'en base.
--
-- Idempotent : relançable sans casse.
-- ============================================================

alter table public.traiteur_slots
  add column if not exists capacity integer check (capacity is null or capacity > 0);

alter table public.marketplace_orders
  add column if not exists slot_id uuid references public.traiteur_slots(id) on delete set null;

create index if not exists marketplace_orders_slot_idx
  on public.marketplace_orders (slot_id) where slot_id is not null;
