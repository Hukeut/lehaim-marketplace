-- ============================================================
-- Lehaim — Gamification, valeurs de départ (vague 1)
--
-- Points de départ raisonnables, pas des constantes figées : elles
-- vivent en base pour être ajustées sans redéploiement (voir
-- docs/gamification-architecture-proposal.md). Idempotent :
-- relançable sans casse (upsert par level_key ; les règles ne sont
-- (ré)insérées que s'il n'existe pas déjà une règle active pour
-- cette clé, pour ne jamais écraser un ajustement déjà fait par un
-- admin).
-- ============================================================

insert into public.gamification_levels (subject_type, level_key, name, min_xp, min_metric_thresholds, sort_order) values
  ('traiteur',  'debutant', 'Débutant', 0,   '{}'::jsonb, 0),
  ('traiteur',  'confirme', 'Confirmé', 100, '{"reliability": 60}'::jsonb, 1),
  ('traiteur',  'expert',   'Expert',   300, '{"reliability": 75, "quality": 65}'::jsonb, 2),
  ('traiteur',  'elite',    'Élite',    700, '{"reliability": 85, "quality": 80}'::jsonb, 3),
  ('organizer', 'debutant', 'Débutant', 0,   '{}'::jsonb, 0),
  ('organizer', 'confirme', 'Confirmé', 100, '{"reliability": 60}'::jsonb, 1),
  ('organizer', 'expert',   'Expert',   300, '{"reliability": 75, "communication": 60}'::jsonb, 2),
  ('organizer', 'elite',    'Élite',    700, '{"reliability": 85, "communication": 75}'::jsonb, 3)
on conflict (subject_type, level_key) do update set
  name = excluded.name,
  min_xp = excluded.min_xp,
  min_metric_thresholds = excluded.min_metric_thresholds,
  sort_order = excluded.sort_order;

insert into public.gamification_rules (rule_key, subject_type, value)
select v.rule_key, v.subject_type, v.value
from (values
  ('xp.order_completed', 'traiteur', '20'::jsonb),
  ('xp.order_responded_fast', 'traiteur', '10'::jsonb),
  ('xp.order_cancelled_by_traiteur', 'traiteur', '-15'::jsonb),
  ('xp.review_received_positive', 'traiteur', '15'::jsonb),
  ('xp.review_received_negative', 'traiteur', '-5'::jsonb),
  ('xp.order_completed_as_client', 'organizer', '10'::jsonb),
  ('xp.order_cancelled_by_client', 'organizer', '-15'::jsonb),
  ('xp.review_left', 'organizer', '5'::jsonb)
) as v(rule_key, subject_type, value)
where not exists (
  select 1 from public.gamification_rules r
  where r.rule_key = v.rule_key and r.subject_type = v.subject_type and r.valid_to is null
);
