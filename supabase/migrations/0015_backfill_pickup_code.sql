-- ============================================================
-- Lehaim — Rattrapage des codes de retrait manquants
--
-- Les Shabbats créés avant l'ajout de pickup_code (migration 0011)
-- n'en ont pas : leur organisateur ne voit donc aucun code sur son
-- tableau de bord, et le traiteur ne reçoit rien à afficher pour
-- les commandes qui leur sont rattachées. On complète ici tous les
-- Shabbats existants avec un code unique.
-- Idempotent : relançable sans casse (ne touche que les NULL).
-- ============================================================

do $$
declare
  r record;
  new_code text;
  tries int;
begin
  for r in select id from public.shabbats where pickup_code is null loop
    tries := 0;
    loop
      new_code := lpad(floor(random() * 9000 + 1000)::int::text, 4, '0');
      exit when not exists (select 1 from public.shabbats where pickup_code = new_code);
      tries := tries + 1;
      exit when tries > 20;
    end loop;
    update public.shabbats set pickup_code = new_code where id = r.id;
  end loop;
end $$;
