-- ============================================================
-- Lehaim — Remettre les rôles déjà attribués en accord avec la table
--
-- `roleKeyFor` (lib/templates.ts) parcourt ses motifs dans l'ordre et retient
-- le premier qui accepte. Trois apports tombaient donc sur la mauvaise règle :
--
--   « Boissons softs »   → /vin|boisson|caviste/ avant /soft/  → le caviste
--   « Plata »            → /plat|chaud/                        → le chef du chaud
--   « Tables d'appoint » → /table|nappe/, écrite pour la nappe → le décorateur
--
-- Le rôle est figé dans `mission_claims.role_key` au moment de la prise : le
-- correctif applicatif ne vaut que pour les prises à venir. Celui qui apporte
-- les softs resterait annoncé « Le caviste », bouteille de vin à l'appui.
--
-- Ce CASE reproduit la table corrigée, dans le même ordre. Idempotent : il ne
-- touche que les lignes en désaccord.
-- ============================================================

set lock_timeout = '5s';

update public.mission_claims c
   set role_key = v.correct
  from public.missions m,
       lateral (
         select case
           when m.title ~* 'plata'                      then 'support'
           when m.title ~* 'soft|jus|soda|frais|glaç'   then 'cold'
           when m.title ~* 'dessert|pâtiss|gâteau'      then 'pastry'
           when m.title ~* 'vin|caviste|boisson'        then 'wine'
           when m.title ~* 'salade'                     then 'salad'
           when m.title ~* 'challah|hallot|pain'        then 'bread'
           when m.title ~* 'plat|chaud'                 then 'main'
           when m.title ~* 'vaisselle|assiette|table'   then 'table'
           when m.title ~* 'chaise|assise|tabouret'     then 'seats'
           when m.title ~* 'matelas|couchage|couverture|drap' then 'bedding'
           when m.title ~* 'bougie|flamme'              then 'candles'
           when m.title ~* 'entrée'                     then 'starter'
           when m.title ~* 'nappe|décor|fleur|bouquet'  then 'decor'
           else 'support'
         end as correct
       ) v
 where m.id = c.mission_id
   and c.role_key is distinct from v.correct;
