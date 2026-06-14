-- ============================================================
--  ZIGZAM — 3 évolutions serveur :
--   1. Skin sur mesure : buy_custom_skin accepte la description de
--      l'élève (+ référence image) et la poste dans la discussion Asacool.
--   2. Badge de rôle : toutes les RPC qui renvoient un avatar exposent
--      désormais le `role` de l'auteur (pour afficher A / ★ sur le ventre).
--   3. Donuts : un commentaire rapporte +2 🍩 à l'auteur de l'actu à
--      CHAQUE fois (illimité). Seules les vues restent limitées à 1/personne.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. SKIN SUR MESURE — description fournie par l'élève
-- ------------------------------------------------------------
-- L'ancienne signature (uuid) est remplacée par (uuid, text, text).
drop function if exists public.buy_custom_skin(uuid);

create or replace function public.buy_custom_skin(p_user uuid, p_description text, p_reference text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_gemmes int; v_pseudo text; v_asacool uuid; v_disc uuid; v_ref text;
begin
  select gemmes, pseudo into v_gemmes, v_pseudo from public.users where id = p_user for update;
  if v_gemmes is null then
    return jsonb_build_object('error', 'not_found');
  end if;
  if v_gemmes < 20 then
    return jsonb_build_object('error', 'not_enough', 'gemmes', v_gemmes);
  end if;

  select id into v_asacool
  from public.users
  where numero = '6767' or pseudo = 'Asacool'
  order by (pseudo = 'Asacool') desc
  limit 1;
  if v_asacool is null then
    return jsonb_build_object('error', 'asacool_introuvable');
  end if;
  if v_asacool = p_user then
    return jsonb_build_object('error', 'cest_toi');
  end if;

  -- Débit des gemmes + trace
  update public.users set gemmes = gemmes - 20 where id = p_user returning gemmes into v_gemmes;
  perform public._log_tx(p_user, 'achat', -20, 'gemme', 'Skin sur mesure (Asacool)');

  -- Discussion privée acheteur <-> Asacool
  insert into public.discussions(titre, type, createur_id)
  values (null, 'prive', p_user) returning id into v_disc;
  insert into public.participants(discussion_id, user_id)
  values (v_disc, p_user), (v_disc, v_asacool)
  on conflict do nothing;

  v_ref := nullif(btrim(coalesce(p_reference, '')), '');

  -- Message officiel créé côté serveur (auteur = acheteur), avec la demande détaillée
  insert into public.messages(discussion_id, auteur_id, contenu)
  values (
    v_disc, p_user,
    '✅ Achat vérifié — 🎨 Demande de skin sur mesure de ' || v_pseudo || ' (20 💎 débités) :' || chr(10) ||
    coalesce(nullif(btrim(coalesce(p_description, '')), ''), '(aucune description fournie)') || chr(10) ||
    'Référence : ' || coalesce(v_ref, 'aucune')
  );

  return jsonb_build_object('ok', true, 'gemmes', v_gemmes, 'discussion_id', v_disc);
end; $$;

grant execute on function public.buy_custom_skin(uuid, text, text) to anon, authenticated;

-- ------------------------------------------------------------
--  3. COMMENTAIRE — +2 🍩 à l'auteur de l'actu À CHAQUE commentaire
-- ------------------------------------------------------------
create or replace function public.add_comment(p_actu uuid, p_auteur uuid, p_contenu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v jsonb; v_author uuid;
begin
  insert into public.commentaires(actu_id, auteur_id, contenu)
  values (p_actu, p_auteur, p_contenu) returning id into v_id;

  -- Chaque commentaire (illimité) crédite +2 🍩 à l'auteur de l'actu.
  -- On exclut le cas où l'auteur commente sa propre actu (anti-farming).
  select auteur_id into v_author from public.actualites where id = p_actu;
  if v_author is not null and v_author <> p_auteur then
    update public.users set donuts = donuts + 2 where id = v_author;
    perform public._log_tx(v_author, 'gain', 2, 'donut', 'Commentaire sur ton actu');
  end if;

  select jsonb_build_object('id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.id = v_id;
  return v;
end; $$;

-- ------------------------------------------------------------
--  2. RÔLE exposé partout où un avatar est renvoyé
-- ------------------------------------------------------------

-- Messages (chat)
create or replace function public.get_messages(p_discussion uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'contenu', m.contenu, 'date', m.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
  ) order by m.date), '[]'::jsonb)
  into v
  from public.messages m join public.users u on u.id = m.auteur_id
  where m.discussion_id = p_discussion;
  return v;
end; $$;

create or replace function public.send_message(p_discussion uuid, p_auteur uuid, p_contenu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  insert into public.messages(discussion_id, auteur_id, contenu)
  values (p_discussion, p_auteur, p_contenu)
  returning jsonb_build_object(
    'id', id, 'contenu', contenu, 'date', date, 'discussion_id', discussion_id
  ) into v;
  select v || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role))
  into v from public.users u where u.id = p_auteur;
  return v;
end; $$;

-- Actualités (fil public)
create or replace function public.get_actus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'publie';
  return v;
end; $$;

-- Mes actualités (tous statuts)
create or replace function public.get_my_actus(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image,
    'date', a.date, 'statut', a.statut,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.auteur_id = p_user;
  return v;
end; $$;

-- Commentaires d'une actu
create or replace function public.get_comments(p_actu uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
  ) order by c.date), '[]'::jsonb)
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.actu_id = p_actu;
  return v;
end; $$;

-- Modération : actus par statut (panel admin)
create or replace function public.get_admin_actus(p_admin uuid, p_statut text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image,
    'date', a.date, 'statut', a.statut,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = p_statut;
  return v;
end; $$;

-- Contacts
create or replace function public.get_contacts(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar, 'role', u.role
  ) order by u.pseudo), '[]'::jsonb)
  into v from public.contacts c join public.users u on u.id = c.contact_id
  where c.user_id = p_user;
  return v;
end; $$;

create or replace function public.add_contact(p_user uuid, p_numero text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cid uuid; v jsonb;
begin
  select id into v_cid from public.users where numero = p_numero;
  if v_cid is null then return jsonb_build_object('error', 'numero_introuvable'); end if;
  if v_cid = p_user then return jsonb_build_object('error', 'soi_meme'); end if;

  insert into public.contacts(user_id, contact_id) values (p_user, v_cid) on conflict do nothing;

  select jsonb_build_object('ok', true, 'contact', jsonb_build_object(
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar, 'role', u.role))
  into v from public.users u where u.id = v_cid;
  return v;
end; $$;

-- Recherche d'utilisateurs
create or replace function public.search_users(p_query text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'numero', numero, 'avatar', avatar, 'role', role
  ) order by pseudo), '[]'::jsonb)
  into v from (
    select id, pseudo, numero, avatar, role from public.users
    where pseudo ilike '%' || p_query || '%' or numero = p_query
    limit 20
  ) t;
  return v;
end; $$;
