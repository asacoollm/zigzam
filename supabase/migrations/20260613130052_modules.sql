-- ============================================================
--  ZIGZAM — Modules : Discuter, Actualités, Admin, Économie,
--  Paramètres, Contacts. Tables + fonctions RPC (SECURITY DEFINER).
--  Idempotent. Accès uniquement via RPC (RLS active, aucune policy).
-- ============================================================

-- ------------------------------------------------------------
--  TABLES
-- ------------------------------------------------------------
create table if not exists public.discussions (
  id          uuid primary key default gen_random_uuid(),
  titre       text,
  type        text not null default 'prive',           -- 'prive' | 'public'
  createur_id uuid not null references public.users(id) on delete cascade,
  date        timestamptz not null default now()
);

create table if not exists public.participants (
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  user_id       uuid not null references public.users(id) on delete cascade,
  rejoint_le    timestamptz not null default now(),
  lu_le         timestamptz,
  primary key (discussion_id, user_id)
);

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  discussion_id uuid not null references public.discussions(id) on delete cascade,
  auteur_id     uuid not null references public.users(id) on delete cascade,
  contenu       text not null,
  date          timestamptz not null default now()
);

create table if not exists public.actualites (
  id        uuid primary key default gen_random_uuid(),
  auteur_id uuid not null references public.users(id) on delete cascade,
  titre     text not null,
  contenu   text not null,
  image     text,
  statut    text not null default 'en_attente',        -- 'en_attente' | 'publie' | 'refuse'
  date      timestamptz not null default now()
);

create table if not exists public.vues_actualites (
  actu_id uuid not null references public.actualites(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  date    timestamptz not null default now(),
  primary key (actu_id, user_id)
);

create table if not exists public.commentaires (
  id        uuid primary key default gen_random_uuid(),
  actu_id   uuid not null references public.actualites(id) on delete cascade,
  auteur_id uuid not null references public.users(id) on delete cascade,
  contenu   text not null,
  date      timestamptz not null default now()
);

create table if not exists public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        text not null,                            -- 'gain' | 'depense' | 'echange' | 'don' ...
  montant     integer not null,                         -- + ou - (selon devise)
  devise      text not null default 'donut',            -- 'donut' | 'gemme'
  description text,
  date        timestamptz not null default now()
);

create table if not exists public.contacts (
  user_id    uuid not null references public.users(id) on delete cascade,
  contact_id uuid not null references public.users(id) on delete cascade,
  date_ajout timestamptz not null default now(),
  primary key (user_id, contact_id)
);

alter table public.discussions      enable row level security;
alter table public.participants     enable row level security;
alter table public.messages         enable row level security;
alter table public.actualites       enable row level security;
alter table public.vues_actualites  enable row level security;
alter table public.commentaires     enable row level security;
alter table public.transactions     enable row level security;
alter table public.contacts         enable row level security;

create index if not exists idx_messages_discussion on public.messages(discussion_id, date);
create index if not exists idx_participants_user on public.participants(user_id);
create index if not exists idx_actus_statut on public.actualites(statut, date);

-- ------------------------------------------------------------
--  Helper interne : journalise une transaction
-- ------------------------------------------------------------
create or replace function public._log_tx(p_user uuid, p_type text, p_montant int, p_devise text, p_desc text)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.transactions(user_id, type, montant, devise, description)
  values (p_user, p_type, p_montant, p_devise, p_desc);
end; $$;

-- ============================================================
--  MODULE DISCUTER
-- ============================================================
create or replace function public.create_discussion(
  p_createur uuid, p_titre text, p_type text, p_numeros text[]
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_num text; v_uid uuid;
begin
  insert into public.discussions(titre, type, createur_id)
  values (nullif(p_titre, ''), coalesce(p_type, 'prive'), p_createur)
  returning id into v_id;

  insert into public.participants(discussion_id, user_id)
  values (v_id, p_createur) on conflict do nothing;

  if p_numeros is not null then
    foreach v_num in array p_numeros loop
      select id into v_uid from public.users where numero = v_num;
      if v_uid is not null then
        insert into public.participants(discussion_id, user_id)
        values (v_id, v_uid) on conflict do nothing;
      end if;
    end loop;
  end if;
  return v_id;
end; $$;

create or replace function public.add_participants(p_discussion uuid, p_numeros text[])
returns void language plpgsql security definer set search_path = public as $$
declare v_num text; v_uid uuid;
begin
  foreach v_num in array p_numeros loop
    select id into v_uid from public.users where numero = v_num;
    if v_uid is not null then
      insert into public.participants(discussion_id, user_id)
      values (p_discussion, v_uid) on conflict do nothing;
    end if;
  end loop;
end; $$;

create or replace function public.join_discussion(p_user uuid, p_discussion uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into public.participants(discussion_id, user_id)
  values (p_discussion, p_user) on conflict do nothing;
end; $$;

create or replace function public.leave_discussion(p_user uuid, p_discussion uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.participants where discussion_id = p_discussion and user_id = p_user;
end; $$;

create or replace function public.delete_discussion(p_discussion uuid, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.discussions where id = p_discussion and createur_id = p_user) then
    return 'not_owner';
  end if;
  delete from public.discussions where id = p_discussion;
  return 'ok';
end; $$;

create or replace function public.mark_read(p_user uuid, p_discussion uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.participants set lu_le = now()
  where discussion_id = p_discussion and user_id = p_user;
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
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar))
  into v from public.users u where u.id = p_auteur;
  return v;
end; $$;

create or replace function public.get_messages(p_discussion uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'contenu', m.contenu, 'date', m.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar)
  ) order by m.date), '[]'::jsonb)
  into v
  from public.messages m join public.users u on u.id = m.auteur_id
  where m.discussion_id = p_discussion;
  return v;
end; $$;

create or replace function public.get_discussions(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(t) order by t.derniere_date desc nulls last), '[]'::jsonb)
  into v from (
    select d.id, d.titre, d.type, d.createur_id,
      (d.createur_id = p_user) as est_createur,
      (select count(*) from public.participants where discussion_id = d.id) as nb_participants,
      (select array_agg(uu.pseudo) from public.participants pp
         join public.users uu on uu.id = pp.user_id where pp.discussion_id = d.id) as pseudos,
      lm.contenu as dernier_message,
      lm.date as derniere_date,
      (lm.date is not null and (pt.lu_le is null or lm.date > pt.lu_le)) as non_lu
    from public.participants pt
    join public.discussions d on d.id = pt.discussion_id
    left join lateral (
      select contenu, date from public.messages
      where discussion_id = d.id order by date desc limit 1
    ) lm on true
    where pt.user_id = p_user
  ) t;
  return v;
end; $$;

create or replace function public.get_public_discussions(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(to_jsonb(t) order by t.date desc), '[]'::jsonb)
  into v from (
    select d.id, d.titre, d.type, d.date,
      (select count(*) from public.participants where discussion_id = d.id) as nb_participants,
      exists (select 1 from public.participants where discussion_id = d.id and user_id = p_user) as rejoint
    from public.discussions d
    where d.type = 'public'
  ) t;
  return v;
end; $$;

-- ============================================================
--  MODULE ACTUALITÉS
-- ============================================================
create or replace function public.create_actu(p_auteur uuid, p_titre text, p_contenu text, p_image text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_count int; v_donuts int; v_id uuid;
begin
  select count(*) into v_count from public.actualites where auteur_id = p_auteur;

  if v_count >= 2 then
    select donuts into v_donuts from public.users where id = p_auteur for update;
    if v_donuts < 10 then
      return jsonb_build_object('error', 'not_enough_donuts', 'donuts', v_donuts);
    end if;
    update public.users set donuts = donuts - 10 where id = p_auteur returning donuts into v_donuts;
    perform public._log_tx(p_auteur, 'depense', -10, 'donut', 'Publication d''une actu');
  else
    select donuts into v_donuts from public.users where id = p_auteur;
  end if;

  insert into public.actualites(auteur_id, titre, contenu, image)
  values (p_auteur, p_titre, p_contenu, nullif(p_image, ''))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'donuts', v_donuts);
end; $$;

create or replace function public.get_actus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'publie';
  return v;
end; $$;

create or replace function public.get_pending_actus(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'en_attente';
  return v;
end; $$;

create or replace function public.moderate_actu(p_admin uuid, p_actu uuid, p_statut text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return 'forbidden';
  end if;
  update public.actualites set statut = p_statut where id = p_actu;
  return 'ok';
end; $$;

create or replace function public.view_actu(p_actu uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_count int;
begin
  insert into public.vues_actualites(actu_id, user_id)
  values (p_actu, p_user) on conflict do nothing;
  get diagnostics v_count = row_count;

  if v_count > 0 then
    select auteur_id into v_author from public.actualites where id = p_actu;
    if v_author is not null and v_author <> p_user then
      update public.users set donuts = donuts + 2 where id = v_author;
      perform public._log_tx(v_author, 'gain', 2, 'donut', 'Vue sur une actu');
    end if;
  end if;
  return jsonb_build_object('counted', v_count > 0);
end; $$;

create or replace function public.add_comment(p_actu uuid, p_auteur uuid, p_contenu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v jsonb;
begin
  insert into public.commentaires(actu_id, auteur_id, contenu)
  values (p_actu, p_auteur, p_contenu) returning id into v_id;
  select jsonb_build_object('id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar))
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.id = v_id;
  return v;
end; $$;

create or replace function public.get_comments(p_actu uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar)
  ) order by c.date), '[]'::jsonb)
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.actu_id = p_actu;
  return v;
end; $$;

-- ============================================================
--  PANEL ADMIN  (toutes vérifient role = 'admin' côté serveur)
-- ============================================================
create or replace function public.admin_create_user(p_admin uuid, p_pseudo text, p_password text)
returns jsonb language plpgsql security definer set search_path = public, extensions as $$
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if exists (select 1 from public.users where pseudo = p_pseudo) then
    return jsonb_build_object('error', 'pseudo_pris');
  end if;
  insert into public.users(pseudo, mot_de_passe, role)
  values (p_pseudo, crypt(p_password, gen_salt('bf')), 'user');
  return jsonb_build_object('ok', true);
end; $$;

create or replace function public.admin_list_users(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'numero', numero, 'donuts', donuts,
    'gemmes', gemmes, 'role', role, 'avatar', avatar, 'premiere_connexion', premiere_connexion
  ) order by pseudo), '[]'::jsonb)
  into v from public.users;
  return v;
end; $$;

create or replace function public.admin_set_balance(p_admin uuid, p_user uuid, p_donuts int, p_gemmes int)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return 'forbidden';
  end if;
  update public.users set donuts = p_donuts, gemmes = p_gemmes where id = p_user;
  return 'ok';
end; $$;

create or replace function public.admin_delete_user(p_admin uuid, p_user uuid)
returns text language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'admin' then
    return 'forbidden';
  end if;
  if p_admin = p_user then
    return 'cannot_delete_self';
  end if;
  delete from public.users where id = p_user;
  return 'ok';
end; $$;

-- ============================================================
--  MODULE ÉCONOMIE (donuts / gemmes) — taux : 5 donuts = 1 gemme
-- ============================================================
create or replace function public.exchange(p_user uuid, p_sens text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_d int; v_g int;
begin
  select donuts, gemmes into v_d, v_g from public.users where id = p_user for update;

  if p_sens = 'donut_to_gem' then
    if v_d < 5 then return jsonb_build_object('error', 'not_enough'); end if;
    update public.users set donuts = donuts - 5, gemmes = gemmes + 1 where id = p_user
      returning donuts, gemmes into v_d, v_g;
    perform public._log_tx(p_user, 'echange', -5, 'donut', '5 donuts -> 1 gemme');
    perform public._log_tx(p_user, 'echange', 1, 'gemme', '5 donuts -> 1 gemme');
  elsif p_sens = 'gem_to_donut' then
    if v_g < 1 then return jsonb_build_object('error', 'not_enough'); end if;
    update public.users set gemmes = gemmes - 1, donuts = donuts + 5 where id = p_user
      returning donuts, gemmes into v_d, v_g;
    perform public._log_tx(p_user, 'echange', -1, 'gemme', '1 gemme -> 5 donuts');
    perform public._log_tx(p_user, 'echange', 5, 'donut', '1 gemme -> 5 donuts');
  else
    return jsonb_build_object('error', 'bad_sens');
  end if;
  return jsonb_build_object('ok', true, 'donuts', v_d, 'gemmes', v_g);
end; $$;

create or replace function public.send_value(p_from uuid, p_numero text, p_devise text, p_montant int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_to uuid; v_d int; v_g int; v_pseudo text;
begin
  if p_montant <= 0 then return jsonb_build_object('error', 'bad_amount'); end if;
  select id, pseudo into v_to, v_pseudo from public.users where numero = p_numero;
  if v_to is null then return jsonb_build_object('error', 'numero_introuvable'); end if;
  if v_to = p_from then return jsonb_build_object('error', 'soi_meme'); end if;

  select donuts, gemmes into v_d, v_g from public.users where id = p_from for update;

  if p_devise = 'donut' then
    if v_d < p_montant then return jsonb_build_object('error', 'not_enough'); end if;
    update public.users set donuts = donuts - p_montant where id = p_from returning donuts, gemmes into v_d, v_g;
    update public.users set donuts = donuts + p_montant where id = v_to;
    perform public._log_tx(p_from, 'don', -p_montant, 'donut', 'Don a ' || v_pseudo);
    perform public._log_tx(v_to, 'don', p_montant, 'donut', 'Don recu');
  elsif p_devise = 'gemme' then
    if v_g < p_montant then return jsonb_build_object('error', 'not_enough'); end if;
    update public.users set gemmes = gemmes - p_montant where id = p_from returning donuts, gemmes into v_d, v_g;
    update public.users set gemmes = gemmes + p_montant where id = v_to;
    perform public._log_tx(p_from, 'don', -p_montant, 'gemme', 'Don a ' || v_pseudo);
    perform public._log_tx(v_to, 'don', p_montant, 'gemme', 'Don recu');
  else
    return jsonb_build_object('error', 'bad_devise');
  end if;
  return jsonb_build_object('ok', true, 'donuts', v_d, 'gemmes', v_g);
end; $$;

create or replace function public.get_transactions(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'type', type, 'montant', montant, 'devise', devise,
    'description', description, 'date', date
  ) order by date desc), '[]'::jsonb)
  into v from (select * from public.transactions where user_id = p_user order by date desc limit 100) s;
  return v;
end; $$;

-- ============================================================
--  MODULE PARAMÈTRES
-- ============================================================
create or replace function public.change_password(p_user uuid, p_old text, p_new text)
returns text language plpgsql security definer set search_path = public, extensions as $$
begin
  if not exists (select 1 from public.users where id = p_user and mot_de_passe = crypt(p_old, mot_de_passe)) then
    return 'mauvais_mdp';
  end if;
  update public.users set mot_de_passe = crypt(p_new, gen_salt('bf')) where id = p_user;
  return 'ok';
end; $$;

create or replace function public.change_pseudo(p_user uuid, p_pseudo text)
returns text language plpgsql security definer set search_path = public as $$
begin
  if exists (select 1 from public.users where pseudo = p_pseudo and id <> p_user) then
    return 'pseudo_pris';
  end if;
  update public.users set pseudo = p_pseudo where id = p_user;
  return 'ok';
end; $$;

-- ============================================================
--  MODULE CONTACTS
-- ============================================================
create or replace function public.add_contact(p_user uuid, p_numero text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_cid uuid; v jsonb;
begin
  select id into v_cid from public.users where numero = p_numero;
  if v_cid is null then return jsonb_build_object('error', 'numero_introuvable'); end if;
  if v_cid = p_user then return jsonb_build_object('error', 'soi_meme'); end if;

  insert into public.contacts(user_id, contact_id) values (p_user, v_cid) on conflict do nothing;

  select jsonb_build_object('ok', true, 'contact', jsonb_build_object(
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar))
  into v from public.users u where u.id = v_cid;
  return v;
end; $$;

create or replace function public.remove_contact(p_user uuid, p_contact uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.contacts where user_id = p_user and contact_id = p_contact;
end; $$;

create or replace function public.get_contacts(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar
  ) order by u.pseudo), '[]'::jsonb)
  into v from public.contacts c join public.users u on u.id = c.contact_id
  where c.user_id = p_user;
  return v;
end; $$;

create or replace function public.search_users(p_query text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'numero', numero, 'avatar', avatar
  ) order by pseudo), '[]'::jsonb)
  into v from (
    select id, pseudo, numero, avatar from public.users
    where pseudo ilike '%' || p_query || '%' or numero = p_query
    limit 20
  ) s;
  return v;
end; $$;

-- ============================================================
--  DASHBOARD — badges de notification
-- ============================================================
create or replace function public.get_badges(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_disc int; v_actu int;
begin
  select count(*) into v_disc
  from public.participants pt
  join public.discussions d on d.id = pt.discussion_id
  where pt.user_id = p_user
    and exists (
      select 1 from public.messages m
      where m.discussion_id = d.id
        and m.auteur_id <> p_user
        and m.date > coalesce(pt.lu_le, pt.rejoint_le)
    );

  select count(*) into v_actu
  from public.actualites a
  where a.statut = 'publie'
    and not exists (select 1 from public.vues_actualites v where v.actu_id = a.id and v.user_id = p_user);

  return jsonb_build_object('discuter', v_disc, 'actus', v_actu);
end; $$;

-- ------------------------------------------------------------
--  GRANTS (appel depuis le client avec la clé anon)
-- ------------------------------------------------------------
grant execute on function public.create_discussion(uuid, text, text, text[]) to anon, authenticated;
grant execute on function public.add_participants(uuid, text[]) to anon, authenticated;
grant execute on function public.join_discussion(uuid, uuid) to anon, authenticated;
grant execute on function public.leave_discussion(uuid, uuid) to anon, authenticated;
grant execute on function public.delete_discussion(uuid, uuid) to anon, authenticated;
grant execute on function public.mark_read(uuid, uuid) to anon, authenticated;
grant execute on function public.send_message(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_messages(uuid) to anon, authenticated;
grant execute on function public.get_discussions(uuid) to anon, authenticated;
grant execute on function public.get_public_discussions(uuid) to anon, authenticated;
grant execute on function public.create_actu(uuid, text, text, text) to anon, authenticated;
grant execute on function public.get_actus() to anon, authenticated;
grant execute on function public.get_pending_actus(uuid) to anon, authenticated;
grant execute on function public.moderate_actu(uuid, uuid, text) to anon, authenticated;
grant execute on function public.view_actu(uuid, uuid) to anon, authenticated;
grant execute on function public.add_comment(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_comments(uuid) to anon, authenticated;
grant execute on function public.admin_create_user(uuid, text, text) to anon, authenticated;
grant execute on function public.admin_list_users(uuid) to anon, authenticated;
grant execute on function public.admin_set_balance(uuid, uuid, int, int) to anon, authenticated;
grant execute on function public.admin_delete_user(uuid, uuid) to anon, authenticated;
grant execute on function public.exchange(uuid, text) to anon, authenticated;
grant execute on function public.send_value(uuid, text, text, int) to anon, authenticated;
grant execute on function public.get_transactions(uuid) to anon, authenticated;
grant execute on function public.change_password(uuid, text, text) to anon, authenticated;
grant execute on function public.change_pseudo(uuid, text) to anon, authenticated;
grant execute on function public.add_contact(uuid, text) to anon, authenticated;
grant execute on function public.remove_contact(uuid, uuid) to anon, authenticated;
grant execute on function public.get_contacts(uuid) to anon, authenticated;
grant execute on function public.search_users(text) to anon, authenticated;
grant execute on function public.get_badges(uuid) to anon, authenticated;
