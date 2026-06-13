-- ============================================================
--  ZIGZAM — Gestion des rôles, modération tracée + listes par statut,
--  dons de donuts sur les commentaires.
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  1. Changer le rôle d'un utilisateur (superadmin uniquement)
-- ------------------------------------------------------------
create or replace function public.set_user_role(p_admin uuid, p_target uuid, p_role text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return 'forbidden';
  end if;
  if p_role not in ('user', 'admin') then
    return 'bad_role';
  end if;
  if (select role from public.users where id = p_target) = 'superadmin' then
    return 'cannot_modify_superadmin';
  end if;
  update public.users set role = p_role where id = p_target;
  return 'ok';
end; $$;

-- ------------------------------------------------------------
--  2. Liste des actus par statut pour le panel admin
-- ------------------------------------------------------------
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
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = p_statut;
  return v;
end; $$;

-- ------------------------------------------------------------
--  3. Modération tracée dans transactions
-- ------------------------------------------------------------
create or replace function public.moderate_actu(p_admin uuid, p_actu uuid, p_statut text)
returns text language plpgsql security definer set search_path = public as $$
declare v_titre text; v_admin text;
begin
  if (select role from public.users where id = p_admin) not in ('admin', 'superadmin') then
    return 'forbidden';
  end if;
  update public.actualites set statut = p_statut where id = p_actu;
  select titre into v_titre from public.actualites where id = p_actu;
  select pseudo into v_admin from public.users where id = p_admin;
  perform public._log_tx(
    p_admin, 'moderation', 0, 'donut',
    'Actu "' || coalesce(v_titre, '') || '" '
      || (case p_statut when 'publie' then 'validée' when 'refuse' then 'refusée' else p_statut end)
      || ' par ' || coalesce(v_admin, 'admin')
  );
  return 'ok';
end; $$;

-- ------------------------------------------------------------
--  4. Commentaire : crédite +2 donuts à l'auteur de l'actu
-- ------------------------------------------------------------
create or replace function public.add_comment(p_actu uuid, p_auteur uuid, p_contenu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v jsonb; v_author uuid;
begin
  insert into public.commentaires(actu_id, auteur_id, contenu)
  values (p_actu, p_auteur, p_contenu) returning id into v_id;

  select auteur_id into v_author from public.actualites where id = p_actu;
  if v_author is not null and v_author <> p_auteur then
    update public.users set donuts = donuts + 2 where id = v_author;
    perform public._log_tx(v_author, 'gain', 2, 'donut', 'Commentaire sur ton actu');
  end if;

  select jsonb_build_object('id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar))
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.id = v_id;
  return v;
end; $$;

-- ------------------------------------------------------------
--  GRANTS
-- ------------------------------------------------------------
grant execute on function public.set_user_role(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_admin_actus(uuid, text) to anon, authenticated;
