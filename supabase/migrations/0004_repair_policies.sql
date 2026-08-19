-- ============================================================
-- Lehaim — réparation des politiques RLS
--
-- Constat en test : la lecture passe (auth.uid() est bien vu dans les
-- politiques) mais l'insertion d'un Chabbat est refusée — la politique
-- `shabbats_insert` de la migration 0001 n'a pas été appliquée.
-- Ce script réaffirme l'ensemble des politiques d'écriture. Il est
-- idempotent : on peut le rejouer sans risque.
-- ============================================================

-- Sonde de contrôle : permet de vérifier depuis l'app quelles politiques
-- existent réellement. Supprimable une fois la mise au point terminée.
create or replace function public.lehaim_policy_report()
returns table (tbl text, policy_name text, cmd text)
language sql
security definer
stable
set search_path = public
as $$
  select tablename::text, policyname::text, cmd::text
  from pg_policies
  where schemaname = 'public'
    and tablename in ('shabbats','invitations','dishes','shopping_items',
                      'expenses','messages','moments','rsvps','missions',
                      'mission_claims','suggestions','suggestion_votes',
                      'equipment','swaps','contributions')
  order by tablename, policyname;
$$;

revoke all on function public.lehaim_policy_report() from public;
grant execute on function public.lehaim_policy_report() to authenticated;

-- ------------------------------------------------------------
-- Shabbats
-- ------------------------------------------------------------
alter table public.shabbats enable row level security;

drop policy if exists shabbats_select on public.shabbats;
create policy shabbats_select on public.shabbats for select to authenticated
  using (public.is_member(id));

drop policy if exists shabbats_insert on public.shabbats;
create policy shabbats_insert on public.shabbats for insert to authenticated
  with check (host_id = (select auth.uid()));

drop policy if exists shabbats_update on public.shabbats;
create policy shabbats_update on public.shabbats for update to authenticated
  using (host_id = (select auth.uid())) with check (host_id = (select auth.uid()));

drop policy if exists shabbats_delete on public.shabbats;
create policy shabbats_delete on public.shabbats for delete to authenticated
  using (host_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Invitations
-- ------------------------------------------------------------
alter table public.invitations enable row level security;

drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations for select to authenticated
  using (guest_id = (select auth.uid()) or public.is_member(shabbat_id));

drop policy if exists invitations_write_host on public.invitations;
create policy invitations_write_host on public.invitations for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));

drop policy if exists invitations_rsvp on public.invitations;
create policy invitations_rsvp on public.invitations for update to authenticated
  using (guest_id = (select auth.uid())) with check (guest_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Menu, courses, dépenses, messages
-- ------------------------------------------------------------
alter table public.dishes         enable row level security;
alter table public.shopping_items enable row level security;
alter table public.expenses       enable row level security;
alter table public.messages       enable row level security;

drop policy if exists dishes_all on public.dishes;
create policy dishes_all on public.dishes for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists shopping_all on public.shopping_items;
create policy shopping_all on public.shopping_items for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists expenses_all on public.expenses;
create policy expenses_all on public.expenses for all to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages for select to authenticated
  using (public.is_member(shabbat_id));

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_member(shabbat_id));

drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages for delete to authenticated
  using (sender_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Missions & ops
-- ------------------------------------------------------------
alter table public.moments          enable row level security;
alter table public.rsvps            enable row level security;
alter table public.missions         enable row level security;
alter table public.mission_claims   enable row level security;
alter table public.suggestions      enable row level security;
alter table public.suggestion_votes enable row level security;
alter table public.equipment        enable row level security;
alter table public.swaps            enable row level security;
alter table public.contributions    enable row level security;

drop policy if exists moments_select on public.moments;
create policy moments_select on public.moments for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists moments_write on public.moments;
create policy moments_write on public.moments for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));

drop policy if exists rsvps_all on public.rsvps;
create policy rsvps_all on public.rsvps for all to authenticated
  using (
    exists (select 1 from public.invitations i
            where i.id = rsvps.invitation_id
              and (i.guest_id = (select auth.uid()) or public.is_host(i.shabbat_id)))
  )
  with check (
    exists (select 1 from public.invitations i
            where i.id = rsvps.invitation_id
              and (i.guest_id = (select auth.uid()) or public.is_host(i.shabbat_id)))
  );

drop policy if exists missions_select on public.missions;
create policy missions_select on public.missions for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists missions_host on public.missions;
create policy missions_host on public.missions for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));
drop policy if exists missions_progress on public.missions;
create policy missions_progress on public.missions for update to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists claims_select on public.mission_claims;
create policy claims_select on public.mission_claims for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists claims_mine on public.mission_claims;
create policy claims_mine on public.mission_claims for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.mission_is_member(mission_id));

drop policy if exists suggestions_select on public.suggestions;
create policy suggestions_select on public.suggestions for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists suggestions_insert on public.suggestions;
create policy suggestions_insert on public.suggestions for insert to authenticated
  with check (author_id = (select auth.uid()) and public.mission_is_member(mission_id));
drop policy if exists suggestions_update on public.suggestions;
create policy suggestions_update on public.suggestions for update to authenticated
  using (public.mission_is_member(mission_id)) with check (public.mission_is_member(mission_id));
drop policy if exists suggestions_delete on public.suggestions;
create policy suggestions_delete on public.suggestions for delete to authenticated
  using (author_id = (select auth.uid()));

drop policy if exists votes_select on public.suggestion_votes;
create policy votes_select on public.suggestion_votes for select to authenticated
  using (public.suggestion_is_member(suggestion_id));
drop policy if exists votes_mine on public.suggestion_votes;
create policy votes_mine on public.suggestion_votes for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.suggestion_is_member(suggestion_id));

drop policy if exists equipment_select on public.equipment;
create policy equipment_select on public.equipment for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists equipment_host on public.equipment;
create policy equipment_host on public.equipment for all to authenticated
  using (public.is_host(shabbat_id)) with check (public.is_host(shabbat_id));
drop policy if exists equipment_claim on public.equipment;
create policy equipment_claim on public.equipment for update to authenticated
  using (public.is_member(shabbat_id)) with check (public.is_member(shabbat_id));

drop policy if exists swaps_select on public.swaps;
create policy swaps_select on public.swaps for select to authenticated
  using (public.mission_is_member(mission_id));
drop policy if exists swaps_insert on public.swaps;
create policy swaps_insert on public.swaps for insert to authenticated
  with check (from_id = (select auth.uid()) and public.mission_is_member(mission_id));
drop policy if exists swaps_resolve on public.swaps;
create policy swaps_resolve on public.swaps for update to authenticated
  using (from_id = (select auth.uid()) or to_id = (select auth.uid()))
  with check (from_id = (select auth.uid()) or to_id = (select auth.uid()));

drop policy if exists contributions_select on public.contributions;
create policy contributions_select on public.contributions for select to authenticated
  using (public.is_member(shabbat_id));
drop policy if exists contributions_mine on public.contributions;
create policy contributions_mine on public.contributions for all to authenticated
  using (profile_id = (select auth.uid()))
  with check (profile_id = (select auth.uid()) and public.is_member(shabbat_id));
