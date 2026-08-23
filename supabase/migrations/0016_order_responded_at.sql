-- Horodatage de la première sortie du statut "nouvelle" par le traiteur.
-- Sert de base au badge de réactivité (temps de réponse moyen).
alter table marketplace_orders add column if not exists responded_at timestamptz;
