-- ============================================================
-- Lehaim — P3 · Supprimer le modèle v1, resté en parallèle
--
-- Deux modèles décrivaient « qui apporte quoi » :
--
--   · `dishes` + `shopping_items`, hérités de la v1 ;
--   · `missions` + `mission_claims`, écrits pour la refonte.
--
-- Les deux étaient lus. `getShabbat` calculait un taux de préparation sur les
-- plats et les courses, `getOps` en calculait un autre sur les places
-- d'apports : le même Shabbat pouvait afficher deux pourcentages selon
-- l'écran. L'audit estimait le chantier à deux jours de migration.
--
-- Vérification faite avant de trancher, la réponse était plus simple :
--
--   select count(*) from dishes;          -- 0
--   select count(*) from shopping_items;  -- 0
--   select count(*) from missions;        -- 53
--
-- Le modèle v1 n'a jamais servi. Les barres « Menu » et « Courses » de
-- l'accueil affichaient donc 0/0 depuis toujours, et la tuile « Plats servis »
-- du bilan un zéro constant. Il n'y a rien à migrer, seulement à retirer.
--
-- Les écrans dédiés avaient déjà disparu ; restaient sept Server Actions sans
-- appelant, supprimées dans le même commit.
--
-- Idempotent. Réversible par la seule reprise de 0001 — mais sans données à
-- restaurer, puisqu'il n'y en a jamais eu.
-- ============================================================

set lock_timeout = '5s';

drop table if exists public.shopping_items;
drop table if exists public.dishes;
