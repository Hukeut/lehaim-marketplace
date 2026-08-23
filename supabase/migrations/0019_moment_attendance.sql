-- ============================================================
-- Lehaim — P1 · Un décompte des présents qui soit juste pour tout le monde
--
-- `getOps` (lib/missions.ts) comptait les présents ainsi :
--
--   supabase.from("rsvps").select("moment_id, attending").eq("attending", true)
--
-- Deux défauts dans une seule ligne.
--
-- 1 · Aucun filtre sur le Chabbat. La requête s'en remettait à la RLS pour
--     restreindre, puis filtrait en JavaScript. Pour l'hôte, elle rapatriait
--     donc tous les RSVP de tous ses Chabbats à chaque rendu — coût linéaire
--     dans la taille de la table, sur un chemin appelé partout.
--
-- 2 · Surtout, le résultat était faux. `rsvps_all` (0003) ne laisse voir à un
--     convive que ses propres réponses :
--
--       exists (select 1 from invitations i
--                where i.id = rsvps.invitation_id
--                  and (i.guest_id = auth.uid() or is_host(i.shabbat_id)))
--
--     Un invité lisait donc toujours 0 ou 1 — et c'est ce chiffre qui
--     s'affichait comme « N inscrits » sur l'écran de réponse. L'hôte, lui,
--     voyait le vrai total. Deux personnes, deux nombres, sur le même écran.
--
-- La bonne réponse n'est pas d'assouplir la politique : un convive n'a pas à
-- lire les réponses des autres ligne à ligne. Il a seulement à en connaître
-- le nombre. C'est exactement ce qu'une fonction en SECURITY DEFINER sait
-- faire — agréger au-dessus de la RLS, et ne rendre que l'agrégat.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · L'index qui manquait
-- ------------------------------------------------------------
-- `rsvps` n'était indexée que sur `invitation_id` (0003). Or la jointure
-- utile, ici comme ailleurs, se fait sur le moment.

create index if not exists rsvps_moment_idx on public.rsvps (moment_id);

-- ------------------------------------------------------------
-- 2 · Le décompte
-- ------------------------------------------------------------

/**
 * Nombre de personnes attendues à chaque moment d'un Chabbat.
 *
 * SECURITY DEFINER pour voir tous les RSVP, mais la porte est refermée juste
 * derrière : `is_member` conditionne la requête entière, donc quelqu'un qui
 * n'est ni hôte ni invité obtient zéro ligne. On rend un agrégat, jamais le
 * détail — personne n'apprend qui a répondu quoi.
 *
 * Les moments sans aucune réponse sont renvoyés à 0 plutôt qu'omis : l'appelant
 * peut ainsi lire le résultat sans distinguer « personne » de « pas de ligne ».
 */
create or replace function public.moment_attendance(shabbat uuid)
returns table (moment_id uuid, attending integer)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, count(*) filter (where r.attending)::integer
    from moments m
    left join rsvps r on r.moment_id = m.id
   where m.shabbat_id = shabbat
     and public.is_member(shabbat)
   group by m.id;
$$;

-- On nomme les rôles : `revoke ... from public` ne retire pas les privilèges
-- que Supabase accorde directement à `anon` et `authenticated` (cf. 0017).
revoke all on function public.moment_attendance(uuid) from public;
revoke execute on function public.moment_attendance(uuid) from anon;
grant execute on function public.moment_attendance(uuid) to authenticated;
