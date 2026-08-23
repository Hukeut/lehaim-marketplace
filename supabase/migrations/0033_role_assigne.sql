-- ============================================================
-- Lehaim — le rôle est assigné, pas deviné
--
-- Prendre un apport donne un rôle : « le chef du chaud », « le gardien des
-- hallot ». Jusqu'ici ce rôle était recalculé à chaque affichage à partir du
-- titre de la mission, par une table d'expressions régulières côté
-- TypeScript. Trois conséquences :
--
--   · le rôle changeait si l'hôte renommait la mission — quelqu'un pouvait
--     s'endormir « gardien de la flamme » et se réveiller « renfort » ;
--   · rien ne marquait le moment où on le reçoit, alors que c'est ce moment
--     qui donne envie de prendre une mission ;
--   · les libellés étaient du français en dur, injecté dans des phrases
--     traduites — l'app parle cinq langues.
--
-- La colonne ne garde qu'une CLÉ. Les libellés vivent dans `messages/*.json`,
-- comme tout le reste de ce qui se lit.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

alter table public.mission_claims add column if not exists role_key text;

-- Les prises déjà faites reçoivent leur rôle. Les mêmes motifs que côté
-- application, dans le même ordre : le premier qui correspond gagne.
update mission_claims c
   set role_key = case
     when m.title ~* 'dessert|pâtiss'            then 'pastry'
     when m.title ~* 'vin|boisson|caviste'       then 'wine'
     when m.title ~* 'salade'                    then 'salad'
     when m.title ~* 'challah|hallot|pain'       then 'bread'
     when m.title ~* 'plat|chaud'                then 'main'
     when m.title ~* 'jus|soft|frais|glaç'       then 'cold'
     when m.title ~* 'vaisselle|assiette'        then 'table'
     when m.title ~* 'chaise|assise'             then 'seats'
     when m.title ~* 'matelas|couchage|couverture' then 'bedding'
     when m.title ~* 'bougie'                    then 'candles'
     when m.title ~* 'entrée'                    then 'starter'
     when m.title ~* 'table|nappe'               then 'decor'
     else 'support'
   end
  from missions m
 where m.id = c.mission_id and c.role_key is null;
