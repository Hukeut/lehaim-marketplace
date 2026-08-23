-- Dernier palier de réactivité vu par le traiteur (acquitté depuis la page
-- "Mon score"). Sert à ne déclencher l'animation "Niveau débloqué" qu'une
-- seule fois par montée de palier, même après un rechargement de page.
alter table traiteurs add column if not exists last_seen_tier text;
