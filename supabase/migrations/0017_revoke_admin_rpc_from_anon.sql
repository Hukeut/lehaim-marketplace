-- ============================================================
-- Lehaim — P0 · Retirer les RPC d'administration au rôle anonyme
--
-- Remplace la migration 0017 initiale, qui devait activer RLS sur `profiles`.
-- Vérification faite sur la base réelle : `relrowsecurity` vaut déjà `true`,
-- et aucune table publique n'en est dépourvue. RLS a été activée après 0001,
-- probablement depuis le tableau de bord — d'où l'absence de trace dans les
-- migrations. Il n'y avait donc rien à corriger, et le commentaire prudent de
-- 0001 est devenu trompeur.
--
-- Ce qui, en revanche, est bien cassé et vérifié :
--
--   select has_function_privilege('anon','public.admin_set_role(uuid,text)','execute');
--   → true
--
-- 0012 écrivait pourtant `revoke all on function ... from public`. Le geste
-- paraît juste, il ne l'est pas : il retire la permission accordée au
-- pseudo-rôle PUBLIC, mais pas celle que les privilèges par défaut de Supabase
-- accordent *directement* aux rôles `anon` et `authenticated`. Il faut nommer
-- le rôle. La preuve par contraste est dans 0016, qui écrivait
-- `revoke execute ... from anon` : celle-là a bien mordu
-- (`code_preview` n'est plus appelable anonymement, vérifié).
--
-- Ce n'était pas exploitable — `admin_set_role` et `admin_user_list` appellent
-- toutes deux `is_admin()` et lèvent une exception sinon. Mais la seule chose
-- qui séparait un visiteur anonyme de la liste de tous les comptes était ce
-- test à l'intérieur du corps de la fonction. On remet la porte devant.
--
-- Idempotent.
-- ============================================================

set lock_timeout = '5s';

-- ------------------------------------------------------------
-- 1 · Les RPC d'administration ne sont pas publiques
-- ------------------------------------------------------------

revoke execute on function public.admin_set_role(uuid, text) from anon;
revoke execute on function public.admin_user_list() from anon;

-- ------------------------------------------------------------
-- 2 · search_path figé sur les deux fonctions qui l'avaient laissé libre
-- ------------------------------------------------------------
--
-- Signalé par `supabase db advisors --type security`. Sans `search_path`
-- fixe, une fonction peut être détournée en plaçant un objet homonyme dans un
-- schéma consulté en premier. Le reste du projet le fait déjà partout.

alter function public.generate_join_code() set search_path = public;

do $$
begin
  if exists (select 1 from pg_proc where proname = 'handle_updated_at') then
    execute 'alter function public.handle_updated_at() set search_path = public';
  end if;
end
$$;
