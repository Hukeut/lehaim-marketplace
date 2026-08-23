-- ============================================================
-- Lehaim — P0 · Durcir l'entrée par code
--
-- Le code d'invitation (0010) fait 6 caractères sur un alphabet de 25, soit
-- ~27,9 bits. Et `code_preview(code)` était accordée au rôle `anon` : un
-- attaquant non authentifié disposait donc d'un oracle gratuit pour balayer
-- l'espace des codes, avant d'appeler `join_by_code` — qui inscrit
-- directement en `confirmed`.
--
-- Deux gestes :
--   1. `code_preview` repasse à `authenticated`. Vérifié avant de le faire :
--      la fonction n'est appelée nulle part dans l'application, et
--      `/rejoindre` n'est pas dans les `PUBLIC_PATHS` de `proxy.ts` — cette
--      révocation ne retire donc aucune fonctionnalité.
--   2. Les nouveaux codes passent à 10 caractères, soit ~46,4 bits.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Plus d'oracle anonyme
-- ------------------------------------------------------------

revoke execute on function public.code_preview(text) from anon;

-- ------------------------------------------------------------
-- 2 · Codes plus longs
-- ------------------------------------------------------------

/**
 * Code d'invitation, sans les glyphes qu'on confond à l'oral ou à l'écrit
 * (0/O, 1/I/L, 2/Z, 5/S, 8/B).
 *
 * 10 caractères sur 25 glyphes ≈ 46 bits. C'est plus long à recopier qu'avant :
 * si l'usage montre que c'est pénible, 8 caractères (~37 bits) restent
 * défendables maintenant que l'aperçu demande un compte — mais pas 6.
 */
create or replace function public.generate_join_code()
returns text
language sql
volatile
as $$
  select string_agg(
    substr('ACDEFGHJKMNPQRTUVWXY34679', floor(random() * 25 + 1)::int, 1), ''
  )
  from generate_series(1, 10);
$$;

alter table public.shabbats alter column join_code set default public.generate_join_code();

-- ------------------------------------------------------------
-- 3 · Les codes déjà distribués — décision à prendre
-- ------------------------------------------------------------
--
-- Ce qui précède ne protège que les Chabbats créés à partir de maintenant.
-- Les codes existants gardent leurs 6 caractères, donc leur faiblesse.
--
-- Les régénérer invalide tous les liens et tous les codes déjà envoyés par
-- WhatsApp : les invités qui n'ont pas encore rejoint ne pourront plus le
-- faire, et il faudra leur renvoyer le message. C'est une décision produit,
-- pas une décision technique — d'où le fait qu'elle ne s'exécute pas toute
-- seule.
--
-- Pour l'appliquer, décommenter ce bloc et rejouer le fichier :
--
-- do $$
-- declare
--   target    record;
--   candidate text;
-- begin
--   for target in
--     select id from public.shabbats where length(join_code) < 10
--   loop
--     loop
--       candidate := public.generate_join_code();
--       exit when not exists (
--         select 1 from public.shabbats where join_code = candidate
--       );
--     end loop;
--     update public.shabbats set join_code = candidate where id = target.id;
--   end loop;
-- end
-- $$;
