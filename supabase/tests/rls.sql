-- ============================================================
-- Lehaim — tests d'autorisation
--
-- Ce que ces tests couvrent : les politiques RLS et les gardes en base. C'est
-- là qu'est le risque de ce projet — les 36 Server Actions ne vérifient que
-- l'existence d'une session, jamais les droits, et les politiques ont déjà
-- nécessité trois migrations correctives (0004, 0005, 0006). Un test unitaire
-- de `lib/access.ts` ne prouverait rien : ce qu'il faut éprouver, c'est la
-- politique, avec un vrai rôle `authenticated` agissant sur le Chabbat d'un
-- autre.
--
-- Pourquoi ça peut tourner contre la production sans rien casser : tout se
-- passe dans une seule transaction, et la dernière instruction lève une
-- exception. Postgres annule donc l'intégralité — fixtures comprises — quel
-- que soit le résultat des tests. Le compte-rendu voyage dans le message de
-- cette exception, qui est la seule chose qui sorte.
--
-- Conséquence pratique : ni Docker, ni second projet Supabase, ni jeu de
-- données à maintenir. Les tests s'appuient sur les profils réels, sans
-- jamais les modifier durablement.
--
--   npm run test:rls
-- ============================================================

do $$
declare
  resultats text[] := '{}';
  ok        boolean;
  n         integer;

  hote      uuid;
  invite    uuid;
  etranger  uuid;

  s         uuid;   -- le Chabbat de test
  inv       uuid;   -- l'invitation de `invite`
  m         uuid;   -- un apport à une seule place
  ch        uuid;   -- une chambre à une seule place
  mom       uuid;   -- un moment
  inv2      uuid;   -- une seconde invitation, pour la chambre

  -- Place de marché
  boutique  uuid;
  dossier   uuid;
  marchand  uuid;   -- le profil propriétaire de la boutique
  produit   uuid;   -- un produit à 10,00 €
  groupe    uuid;   -- un groupe d'options obligatoire
  choix     uuid;   -- un choix à + 2,50 €
  creneau   uuid;   -- un créneau à une seule place
  commande  uuid;
  ref       text;
  montant   numeric;
begin
  -- ----------------------------------------------------------
  -- Fixtures. Posées sous le rôle propriétaire, avant tout test.
  -- On réutilise des profils existants : en créer supposerait d'écrire dans
  -- `auth.users`, et ces tests n'ont pas à connaître ce schéma.
  -- ----------------------------------------------------------
  select id into hote     from profiles where back_office_role is null order by id limit 1;
  select id into invite   from profiles where id <> hote order by id limit 1;
  select id into etranger from profiles where id not in (hote, invite) order by id limit 1;

  if etranger is null then
    raise exception 'Il faut au moins trois profils en base pour jouer ces tests.';
  end if;

  insert into shabbats (host_id, title, starts_at)
  values (hote, 'Chabbat de test', now() + interval '7 days')
  returning id into s;

  insert into invitations (shabbat_id, guest_id, status)
  values (s, invite, 'confirmed') returning id into inv;

  insert into missions (shabbat_id, category, title, slots)
  values (s, 'food', 'apport de test', 1) returning id into m;

  insert into sleeping_rooms (shabbat_id, label, capacity)
  values (s, 'chambre de test', 1) returning id into ch;

  insert into moments (shabbat_id, kind, label)
  values (s, 'friday_dinner', 'Vendredi soir') returning id into mom;

  insert into invitations (shabbat_id, guest_name) values (s, 'Test B') returning id into inv2;

  -- ----------------------------------------------------------
  -- 1 · Un invité ne peut pas se nommer administrateur
  -- ----------------------------------------------------------
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', invite)::text, true);
    update profiles set back_office_role = 'admin' where id = invite;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · escalade administrateur refusée');

  -- ----------------------------------------------------------
  -- 2 · Un invité ne peut pas se nommer co-organisateur
  -- ----------------------------------------------------------
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', invite)::text, true);
    update invitations set is_cohost = true where id = inv;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · escalade co-organisateur refusée');

  -- ----------------------------------------------------------
  -- 3 · Témoin : répondre à son invitation reste possible
  -- ----------------------------------------------------------
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', invite)::text, true);
    update invitations set status = 'declined' where id = inv;
    ok := found;
  exception when others then ok := false;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un invité peut décliner (témoin : pas de faux positif)');
  update invitations set status = 'confirmed' where id = inv;

  -- ----------------------------------------------------------
  -- 4 · Un invité ne peut pas supprimer le Chabbat
  -- ----------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', invite)::text, true);
  delete from shabbats where id = s;
  ok := not found;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un invité ne peut pas supprimer le Chabbat');

  -- ----------------------------------------------------------
  -- 5 · Un invité ne peut pas modifier le Chabbat
  -- ----------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', invite)::text, true);
  update shabbats set title = 'détourné' where id = s;
  ok := not found;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un invité ne peut pas modifier le Chabbat');

  -- ----------------------------------------------------------
  -- 6 · Un non-membre ne voit pas le Chabbat
  -- ----------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from shabbats where id = s;
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · un non-membre ne voit pas le Chabbat');

  -- ----------------------------------------------------------
  -- 7 · `moment_attendance` ne rend rien à un non-membre (0019)
  -- ----------------------------------------------------------
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from moment_attendance(s);
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · le décompte des présents est fermé aux non-membres');

  -- ----------------------------------------------------------
  -- 8 · La place de trop est refusée (0020)
  -- ----------------------------------------------------------
  insert into mission_claims (mission_id, profile_id) values (m, invite);
  ok := false;
  begin
    insert into mission_claims (mission_id, profile_id) values (m, hote);
  exception when check_violation then ok := true;
  end;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un apport à une place ne s''en laisse pas prendre deux');

  -- ----------------------------------------------------------
  -- 9 · Sa propre prise reste modifiable, apport complet ou non
  -- ----------------------------------------------------------
  ok := false;
  begin
    insert into mission_claims (mission_id, profile_id) values (m, invite)
      on conflict (mission_id, profile_id) do update set dish_custom = 'houmous';
    ok := true;
  exception when others then ok := false;
  end;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · on peut préciser son plat sur un apport complet (témoin)');

  -- ----------------------------------------------------------
  -- 10 · La chambre de trop est refusée (0020)
  -- ----------------------------------------------------------
  update invitations set sleeping_room_id = ch where id = inv;
  ok := false;
  begin
    update invitations set sleeping_room_id = ch where id = inv2;
  exception when check_violation then ok := true;
  end;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · une chambre à une place ne s''en laisse pas prendre deux');

  -- ----------------------------------------------------------
  -- 11 · Une invitation entrée par lien peut être anonymisée (0015)
  --
  -- C'est le mécanisme exact qui cassait la suppression de compte : sans
  -- `guest_name`, détacher l'invitation viole `invitations_identified`.
  -- ----------------------------------------------------------
  update invitations set sleeping_room_id = null where id = inv;
  ok := false;
  begin
    update invitations set guest_id = null where id = inv;
  exception when check_violation then ok := true;
  end;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · détacher une invitation sans nom échoue (le bug d''origine)');

  ok := false;
  begin
    update invitations
       set guest_name = coalesce(nullif(btrim(guest_name), ''), 'Invité'), guest_phone = null
     where id = inv;
    update invitations set guest_id = null where id = inv;
    ok := true;
  exception when others then ok := false;
  end;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · après anonymisation, le détachement passe (le correctif)');

  -- ----------------------------------------------------------
  -- MARKET · le dossier d'un marchand ne se lit pas de l'extérieur
  --
  -- Ces tables portent des pièces d'identité et des numéros SIRET. La règle
  -- est plus stricte qu'ailleurs : le commerçant sur sa boutique,
  -- l'administration sur tout, et personne d'autre.
  -- ----------------------------------------------------------
  marchand := invite;

  insert into shops (slug, name, category, owner_id, status, siret, address)
  values ('test-' || substr(md5(random()::text), 1, 8), 'Commerce de test', 'caterer',
          marchand, 'review', '812 447 902 00018', '12 rue des Écouffes, Paris 4e')
  returning id into boutique;

  insert into shop_applications (shop_id, status, step, submitted_at)
  values (boutique, 'submitted', 8, now() - interval '2 days') returning id into dossier;

  insert into shop_documents (shop_id, kind, status) values (boutique, 'id_front', 'uploaded');
  insert into kashrut_certificates (shop_id, authority, valid_from, valid_to, mentions)
  values (boutique, 'Badatz Paris', current_date - 30, current_date + 200, array['halav_israel']);

  -- Le propriétaire voit son dossier.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
  select count(*) into n from shop_applications where id = dossier;
  reset role;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le marchand voit son propre dossier');

  -- Un tiers ne le voit pas.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from shop_applications where id = dossier;
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · un tiers ne voit pas le dossier d''un marchand');

  -- Ni ses pièces d'identité.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from shop_documents where shop_id = boutique;
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · un tiers ne voit pas les pièces d''identité déposées');

  -- Le badge de cacherout, lui, est public — mais seulement si la boutique
  -- est en ligne. En revue, il ne se voit pas encore.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from kashrut_certificates where shop_id = boutique;
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · le certificat d''une boutique en revue reste privé');

  update shops set status = 'live' where id = boutique;
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  select count(*) into n from kashrut_certificates where shop_id = boutique;
  reset role;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le certificat d''une boutique en ligne est public (témoin)');

  -- La référence du dossier est engendrée, lisible et unique.
  select count(*) into n from shop_applications where id = dossier and reference ~ '^LP-[0-9]+$';
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le dossier reçoit une référence LP-xxx');

  -- ----------------------------------------------------------
  -- 12 · MARKET · une boutique ne se met pas en ligne toute seule
  -- ----------------------------------------------------------
  -- `shops_write` ouvre toutes les colonnes au propriétaire. Sans la garde de
  -- 0026, un marchand se passait 'live' sans validation et se donnait 0 % de
  -- commission. Les deux plus grosses failles de la place de marché.
  -- ----------------------------------------------------------
  update shops set status = 'draft' where id = boutique;

  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
    update shops set status = 'live' where id = boutique;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un marchand ne met pas sa boutique en ligne');

  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
    update shops set commission_rate = 0 where id = boutique;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un marchand ne baisse pas sa commission');

  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
    update shops set featured_rank = 1 where id = boutique;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un marchand ne se met pas en tête de vitrine');

  -- Témoin : déposer son dossier reste permis, sinon la garde serait un mur.
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
    update shops set status = 'review' where id = boutique;
    ok := found;
  exception when others then ok := false;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · déposer son dossier reste permis (témoin)');

  -- La garde recopie 18 en dur à la création ; si le défaut de la colonne
  -- change sans qu'on y touche, les deux se contredisent en silence.
  select count(*) into n from information_schema.columns
   where table_schema = 'public' and table_name = 'shops'
     and column_name = 'commission_rate' and column_default like '18%';
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · la garde et le défaut de commission concordent');

  -- ----------------------------------------------------------
  -- 13 · MARKET · une commande ne se fabrique pas depuis le client
  -- ----------------------------------------------------------
  update shops set status = 'live', delivery_modes = array['pickup', 'platform'],
                   slot_capacity = 1, commission_rate = 20
   where id = boutique;

  insert into shop_products (shop_id, name, price, available)
  values (boutique, 'Rôti de test', 10.00, true) returning id into produit;

  insert into delivery_slots (shop_id, starts_at, ends_at, mode, capacity)
  values (boutique, now() + interval '1 day', now() + interval '1 day 1 hour', 'pickup', 1)
  returning id into creneau;

  -- Aucune politique d'INSERT sur `orders` : le seul chemin est `place_order`.
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
    insert into orders (shop_id, customer_id, mode, total, items_total)
    values (boutique, etranger, 'pickup', 0, 0);
  exception when others then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · une commande ne s''insère pas directement');

  -- Le parcours normal : panier, puis `place_order`. Deux articles à 10 €,
  -- commission à 20 % — les montants doivent être calculés en base.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
  insert into carts (customer_id, shop_id) values (etranger, boutique);
  insert into cart_items (cart_id, product_id, quantity)
  select id, produit, 2 from carts where customer_id = etranger and shop_id = boutique;
  select public.place_order(boutique, 'pickup', creneau) into ref;
  reset role;

  select id, total into commande, montant from orders where reference = ref;
  resultats := resultats || ((case when montant = 20.00 then 'OK' else 'KO' end) || ' · les montants sont calculés en base (2 × 10 = ' || coalesce(montant::text, 'null') || ')');

  select commission_amount into montant from orders where id = commande;
  resultats := resultats || ((case when montant = 4.00 then 'OK' else 'KO' end) || ' · la commission est figée au taux du jour (20 % = ' || coalesce(montant::text, 'null') || ')');

  select count(*) into n from carts where customer_id = etranger and shop_id = boutique;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · le panier est vidé par la commande');

  -- ----------------------------------------------------------
  -- 14 · MARKET · un créneau ne se laisse pas prendre deux fois
  -- ----------------------------------------------------------
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
    insert into carts (customer_id, shop_id) values (hote, boutique);
    insert into cart_items (cart_id, product_id, quantity)
    select id, produit, 1 from carts where customer_id = hote and shop_id = boutique;
    perform public.place_order(boutique, 'pickup', creneau);
  exception when others then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un créneau complet refuse la commande suivante');

  -- ----------------------------------------------------------
  -- MARKET · la pause coupe vraiment les commandes
  -- ----------------------------------------------------------
  -- Elle est vérifiée dans `place_order` et pas seulement à l'affichage : un
  -- client qui a ouvert la fiche avant la pause validerait sinon une commande
  -- que le commerce ne peut plus prendre.
  -- ----------------------------------------------------------

  -- Témoin : mettre en pause appartient bien au commerçant, contrairement au
  -- statut et à la commission.
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', marchand)::text, true);
    update shops set paused = true where id = boutique;
    ok := found;
  exception when others then ok := false;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un marchand met sa boutique en pause (témoin)');

  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
    delete from carts where customer_id = hote and shop_id = boutique;
    insert into carts (customer_id, shop_id) values (hote, boutique);
    insert into cart_items (cart_id, product_id, quantity)
    select id, produit, 1 from carts where customer_id = hote and shop_id = boutique;
    perform public.place_order(boutique, 'pickup');
  exception when others then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · une boutique en pause refuse la commande');

  update shops set paused = false where id = boutique;

  -- ----------------------------------------------------------
  -- MARKET · les options changent le prix, et peuvent le bloquer
  -- ----------------------------------------------------------
  insert into product_option_groups (product_id, label, required, multiple)
  values (produit, 'Taille', true, false) returning id into groupe;

  insert into product_options (group_id, label, price_delta)
  values (groupe, 'Grande', 2.50) returning id into choix;

  -- Sans choix sur un groupe obligatoire, la commande ne part pas.
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
    delete from carts where customer_id = hote and shop_id = boutique;
    insert into carts (customer_id, shop_id) values (hote, boutique);
    insert into cart_items (cart_id, product_id, quantity)
    select id, produit, 1 from carts where customer_id = hote and shop_id = boutique;
    perform public.place_order(boutique, 'pickup');
  exception when others then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · un choix obligatoire manquant bloque la commande');

  -- Avec le choix, la commande part et l'écart de prix est facturé.
  --
  -- Le panier est refait ici, et pas seulement complété : l'exception du test
  -- précédent a ramené la transaction à son point de sauvegarde, emportant
  -- avec elle le panier qu'on venait d'y créer. Un bloc de test qui échoue
  -- délibérément ne laisse rien derrière lui.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
  delete from carts where customer_id = hote and shop_id = boutique;
  insert into carts (customer_id, shop_id) values (hote, boutique);
  insert into cart_items (cart_id, product_id, quantity, option_ids)
  select id, produit, 1, array[choix] from carts where customer_id = hote and shop_id = boutique;
  select public.place_order(boutique, 'pickup') into ref;
  reset role;

  select total into montant from orders where reference = ref;
  resultats := resultats || ((case when montant = 12.50 then 'OK' else 'KO' end) || ' · l''option est facturée (10 + 2,50 = ' || coalesce(montant::text, 'null') || ')');

  select count(*) into n from order_items oi
   where oi.order_id = (select id from orders where reference = ref)
     and oi.options @> '[{"label": "Grande"}]'::jsonb;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le libellé de l''option est recopié sur la ligne');

  -- Un identifiant qui n'appartient pas au produit ne facture rien.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
  delete from carts where customer_id = hote and shop_id = boutique;
  insert into carts (customer_id, shop_id) values (hote, boutique);
  insert into cart_items (cart_id, product_id, quantity, option_ids)
  select id, produit, 1, array[choix, gen_random_uuid()]
    from carts where customer_id = hote and shop_id = boutique;
  select public.place_order(boutique, 'pickup') into ref;
  reset role;

  select total into montant from orders where reference = ref;
  resultats := resultats || ((case when montant = 12.50 then 'OK' else 'KO' end) || ' · un identifiant d''option inventé ne facture rien (' || coalesce(montant::text, 'null') || ')');

  -- ----------------------------------------------------------
  -- 15 · MARKET · ce qu'on a le droit de changer sur une commande
  -- ----------------------------------------------------------
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
    update orders set total = 0 where id = commande;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · le client ne ramène pas son total à zéro');

  -- Renoncer tant que le commerce n'a rien accepté : permis.
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
    update orders set status = 'cancelled' where id = commande;
    ok := found;
  exception when others then ok := false;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · le client annule tant que c''est en attente (témoin)');

  -- Mais il ne se déclare pas livré.
  update orders set status = 'accepted' where id = commande;
  ok := false;
  begin
    perform set_config('role', 'authenticated', true);
    perform set_config('request.jwt.claims', json_build_object('sub', etranger)::text, true);
    update orders set status = 'completed' where id = commande;
  exception when insufficient_privilege then ok := true;
  end;
  reset role;
  resultats := resultats || ((case when ok then 'OK' else 'KO' end) || ' · le client ne clôt pas sa commande lui-même');

  -- Un tiers ne voit rien de tout cela. `hote` et pas `invite` : `invite` est
  -- le marchand propriétaire de la boutique, il voit cette commande à bon
  -- droit — ce n'est pas un tiers.
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', hote)::text, true);
  select count(*) into n from orders where id = commande;
  reset role;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · un tiers ne voit pas la commande d''un autre');

  -- Le journal se tient tout seul : passée, annulée, acceptée.
  select count(*) into n from order_events where order_id = commande;
  resultats := resultats || ((case when n >= 3 then 'OK' else 'KO' end) || ' · chaque changement d''état laisse une trace (' || n || ')');

  -- ----------------------------------------------------------
  -- 16 · Fumée : les objets que le code suppose existent bien
  -- ----------------------------------------------------------
  select count(*) into n from pg_proc
   where proname in ('moment_attendance', 'delete_my_account', 'is_client_write',
                     'guard_profile_privileges', 'guard_invitation_privileges',
                     'enforce_mission_slots', 'enforce_room_capacity');
  resultats := resultats || ((case when n >= 7 then 'OK' else 'KO' end) || ' · les 7 fonctions de garde et d''agrégat sont en place (' || n || ')');

  select count(*) into n from information_schema.columns
   where table_schema = 'public'
     and (table_name, column_name) in (
       ('profiles', 'locale'), ('profiles', 'back_office_role'),
       ('invitations', 'sleeping_room_id'), ('invitations', 'is_cohost'),
       ('shabbats', 'join_code')
     );
  resultats := resultats || ((case when n = 5 then 'OK' else 'KO' end) || ' · les 5 colonnes ajoutées par migration existent (' || n || ')');

  -- ----------------------------------------------------------
  -- Le seau des pièces d'identité doit rester privé. Une migration future qui
  -- le basculerait en public exposerait des cartes d'identité par URL devinée,
  -- sans qu'aucune politique ne s'y oppose — les seaux publics court-circuitent
  -- la RLS en lecture. C'est le genre d'erreur qui ne se voit pas à l'œil.
  -- ----------------------------------------------------------
  select count(*) into n from storage.buckets
   where id = 'shop-documents' and public = false;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le seau des pièces justificatives est privé');

  select count(*) into n from storage.buckets
   where id = 'shop-media' and public = true;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · le seau des médias est public (témoin)');

  -- La propriété d'un fichier se lit dans le premier segment de son chemin :
  -- c'est là-dessus que reposent les politiques de stockage. Un chemin mal
  -- formé ne doit appartenir à personne, pas au premier venu.
  select count(*) into n
   where public.shop_of_path('11111111-1111-1111-1111-111111111111/cni.jpg')
         = '11111111-1111-1111-1111-111111111111'::uuid
     and public.shop_of_path('cni.jpg') is null;
  resultats := resultats || ((case when n = 1 then 'OK' else 'KO' end) || ' · un chemin de fichier désigne bien sa boutique');

  select count(*) into n from pg_class
   where relnamespace = 'public'::regnamespace and relkind = 'r' and not relrowsecurity;
  resultats := resultats || ((case when n = 0 then 'OK' else 'KO' end) || ' · aucune table publique sans RLS (' || n || ' trouvée(s))');

  -- ----------------------------------------------------------
  -- Le compte-rendu sort par l'exception, qui annule tout.
  -- ----------------------------------------------------------
  raise exception E'\n%', array_to_string(resultats, E'\n');
end
$$;
