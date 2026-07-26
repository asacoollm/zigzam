-- ============================================================
--  ZIGZAM — Saison 2, Update Monumentale 🍔🛍️📦👑💸
--   1. Nouvelle monnaie : les Burgers 🍔 (+ échange 1 💎 = 10 🍔)
--   2. Shop 🛍️ : cadeau du jour, achat de burgers, catalogue accessoires
--   3. Méga boîtes 📦 : versions plus généreuses des boîtes mystères,
--      achetables en burgers
--   4. Pass VIP 👑 : avantages temporaires (2 semaines)
--   5. Impôts 💸 : prélèvement automatique toutes les 2 semaines
--  Idempotent (create or replace / add column if not exists / etc.).
-- ============================================================

-- ------------------------------------------------------------
--  0. COLONNES users
-- ------------------------------------------------------------
alter table public.users add column if not exists burgers integer not null default 0;
alter table public.users add column if not exists vip_expire_at timestamptz;
alter table public.users add column if not exists last_tax_date timestamptz not null default now();

-- ------------------------------------------------------------
--  login() : on ajoute burgers + vip_expire_at au retour.
--  Le type de retour change → il faut DROP puis recréer.
-- ------------------------------------------------------------
drop function if exists public.login(text, text);

create or replace function public.login(p_pseudo text, p_password text)
returns table (
  id uuid,
  pseudo text,
  numero char(4),
  role text,
  donuts integer,
  gemmes integer,
  burgers integer,
  avatar jsonb,
  premiere_connexion boolean,
  tutoriel_vu boolean,
  derniere_activite timestamptz,
  date_naissance date,
  vip_expire_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    u.id, u.pseudo, u.numero, u.role, u.donuts, u.gemmes, u.burgers, u.avatar,
    u.premiere_connexion, u.tutoriel_vu, u.derniere_activite, u.date_naissance, u.vip_expire_at
  from public.users u
  where u.pseudo = p_pseudo
    and u.mot_de_passe = crypt(p_password, u.mot_de_passe);
end;
$$;

grant execute on function public.login(text, text) to anon, authenticated;

-- ------------------------------------------------------------
--  0b. Bonus VIP : +20% de donuts sur les gains d'activité (actus,
--      commentaires…). Arrondi au supérieur pour rester visible même sur
--      de petits montants (2 🍩 -> 3 🍩 pour un VIP, pas 2.4 arrondi à 2).
-- ------------------------------------------------------------
create or replace function public._donut_gain_amount(p_user uuid, p_base int)
returns int language sql security definer set search_path = public as $$
  select case
    when p_base <= 0 then p_base
    when coalesce((select vip_expire_at from public.users where id = p_user) > now(), false)
      then ceil(p_base * 1.2)::int
    else p_base
  end;
$$;

-- ------------------------------------------------------------
--  1. BADGE VIP 👑 — exposé partout où un avatar est renvoyé
--     (chat, actualités, contacts), en plus du rôle.
-- ------------------------------------------------------------

-- Actualités (fil public)
create or replace function public.get_actus()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image, 'date', a.date,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.statut = 'publie';
  return v;
end; $$;

-- Mes actualités (tous statuts sauf refusées)
create or replace function public.get_my_actus(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', a.id, 'titre', a.titre, 'contenu', a.contenu, 'image', a.image,
    'date', a.date, 'statut', a.statut,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)),
    'vues', (select count(*) from public.vues_actualites where actu_id = a.id),
    'commentaires', (select count(*) from public.commentaires where actu_id = a.id)
  ) order by a.date desc), '[]'::jsonb)
  into v
  from public.actualites a join public.users u on u.id = a.auteur_id
  where a.auteur_id = p_user and a.statut <> 'refuse';
  return v;
end; $$;

-- Commentaires d'une actu
create or replace function public.get_comments(p_actu uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false))
  ) order by c.date), '[]'::jsonb)
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.actu_id = p_actu;
  return v;
end; $$;

create or replace function public.add_comment(p_actu uuid, p_auteur uuid, p_contenu text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid; v jsonb; v_author uuid; v_gain int;
begin
  insert into public.commentaires(actu_id, auteur_id, contenu)
  values (p_actu, p_auteur, p_contenu) returning id into v_id;

  select auteur_id into v_author from public.actualites where id = p_actu;
  if v_author is not null and v_author <> p_auteur then
    v_gain := public._donut_gain_amount(v_author, 2);
    update public.users set donuts = donuts + v_gain where id = v_author;
    perform public._log_tx(v_author, 'gain', v_gain, 'donut', 'Commentaire sur ton actu');
  end if;

  select jsonb_build_object('id', c.id, 'contenu', c.contenu, 'date', c.date,
    'auteur', jsonb_build_object('pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)))
  into v from public.commentaires c join public.users u on u.id = c.auteur_id
  where c.id = v_id;
  return v;
end; $$;

-- Vue d'une actu : +2 🍩 à l'auteur (première vue seulement), bonus VIP inclus.
create or replace function public.view_actu(p_actu uuid, p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_author uuid; v_count int; v_gain int;
begin
  insert into public.vues_actualites(actu_id, user_id)
  values (p_actu, p_user) on conflict do nothing;
  get diagnostics v_count = row_count;

  if v_count > 0 then
    select auteur_id into v_author from public.actualites where id = p_actu;
    if v_author is not null and v_author <> p_user then
      v_gain := public._donut_gain_amount(v_author, 2);
      update public.users set donuts = donuts + v_gain where id = v_author;
      perform public._log_tx(v_author, 'gain', v_gain, 'donut', 'Vue sur une actu');
    end if;
  end if;
  return jsonb_build_object('counted', v_count > 0);
end; $$;

-- Messages (chat)
create or replace function public.get_messages(p_discussion uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', m.id, 'contenu', m.contenu, 'date', m.date,
    'type', m.type, 'audio_url', m.audio_url,
    'auteur', jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false))
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
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)))
  into v from public.users u where u.id = p_auteur;
  return v;
end; $$;

create or replace function public.send_vocal_message(p_discussion uuid, p_auteur uuid, p_audio_url text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  insert into public.messages(discussion_id, auteur_id, contenu, type, audio_url)
  values (p_discussion, p_auteur, '', 'vocal', p_audio_url)
  returning jsonb_build_object(
    'id', id, 'contenu', contenu, 'date', date, 'discussion_id', discussion_id,
    'type', type, 'audio_url', audio_url
  ) into v;
  select v || jsonb_build_object('auteur',
    jsonb_build_object('id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)))
  into v from public.users u where u.id = p_auteur;
  return v;
end; $$;

-- Contacts
create or replace function public.get_contacts(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar, 'role', u.role,
    'vip', coalesce(u.vip_expire_at > now(), false)
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
    'id', u.id, 'pseudo', u.pseudo, 'numero', u.numero, 'avatar', u.avatar, 'role', u.role,
    'vip', coalesce(u.vip_expire_at > now(), false)))
  into v from public.users u where u.id = v_cid;
  return v;
end; $$;

create or replace function public.search_users(p_query text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pseudo', pseudo, 'numero', numero, 'avatar', avatar, 'role', role,
    'vip', coalesce(vip_expire_at > now(), false)
  ) order by pseudo), '[]'::jsonb)
  into v from (
    select id, pseudo, numero, avatar, role, vip_expire_at from public.users
    where pseudo ilike '%' || p_query || '%' or numero = p_query
    limit 20
  ) t;
  return v;
end; $$;

grant execute on function public.get_actus() to anon, authenticated;
grant execute on function public.get_my_actus(uuid) to anon, authenticated;
grant execute on function public.get_comments(uuid) to anon, authenticated;
grant execute on function public.add_comment(uuid, uuid, text) to anon, authenticated;
grant execute on function public.view_actu(uuid, uuid) to anon, authenticated;
grant execute on function public.get_messages(uuid) to anon, authenticated;
grant execute on function public.send_message(uuid, uuid, text) to anon, authenticated;
grant execute on function public.send_vocal_message(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_contacts(uuid) to anon, authenticated;
grant execute on function public.add_contact(uuid, text) to anon, authenticated;
grant execute on function public.search_users(text) to anon, authenticated;

-- ============================================================
--  2. MONNAIE — Les Burgers 🍔  (taux : 1 💎 = 10 🍔)
-- ============================================================
create or replace function public.exchange_to_burgers(p_user uuid, p_gemmes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_g int; v_b int;
begin
  if p_gemmes is null or p_gemmes <= 0 then
    return jsonb_build_object('error', 'bad_amount');
  end if;

  select gemmes, burgers into v_g, v_b from public.users where id = p_user for update;
  if v_g is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_g < p_gemmes then return jsonb_build_object('error', 'not_enough'); end if;

  update public.users
    set gemmes = gemmes - p_gemmes, burgers = burgers + p_gemmes * 10
    where id = p_user
    returning gemmes, burgers into v_g, v_b;

  perform public._log_tx(p_user, 'echange', -p_gemmes, 'gemme',
    p_gemmes || ' gemmes -> ' || (p_gemmes * 10) || ' burgers');
  perform public._log_tx(p_user, 'echange', p_gemmes * 10, 'burger',
    p_gemmes || ' gemmes -> ' || (p_gemmes * 10) || ' burgers');

  return jsonb_build_object('ok', true, 'gemmes', v_g, 'burgers', v_b);
end; $$;

grant execute on function public.exchange_to_burgers(uuid, int) to anon, authenticated;

-- ============================================================
--  3. SHOP 🛍️
-- ============================================================

-- ------------------------------------------------------------
--  3a. Achat de burgers contre des gemmes (offres fixes, validées serveur)
-- ------------------------------------------------------------
create or replace function public.buy_burgers(p_user uuid, p_amount int, p_cost_gemmes int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_g int; v_b int; v_ok boolean;
begin
  v_ok := (p_amount = 10 and p_cost_gemmes = 1)
       or (p_amount = 50 and p_cost_gemmes = 4)
       or (p_amount = 100 and p_cost_gemmes = 7);
  if not v_ok then
    return jsonb_build_object('error', 'offre_invalide');
  end if;

  select gemmes, burgers into v_g, v_b from public.users where id = p_user for update;
  if v_g is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_g < p_cost_gemmes then return jsonb_build_object('error', 'not_enough'); end if;

  update public.users
    set gemmes = gemmes - p_cost_gemmes, burgers = burgers + p_amount
    where id = p_user
    returning gemmes, burgers into v_g, v_b;

  perform public._log_tx(p_user, 'achat', -p_cost_gemmes, 'gemme', 'Achat de ' || p_amount || ' burgers 🍔');
  perform public._log_tx(p_user, 'achat', p_amount, 'burger', 'Achat de burgers');

  return jsonb_build_object('ok', true, 'gemmes', v_g, 'burgers', v_b);
end; $$;

grant execute on function public.buy_burgers(uuid, int, int) to anon, authenticated;

-- ------------------------------------------------------------
--  3b. Cadeau du jour 🎁 (un par utilisateur, reset à minuit serveur)
-- ------------------------------------------------------------
create table if not exists public.daily_gifts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  date_reclamation date not null default (now()::date),
  recompense       jsonb not null,
  date             timestamptz not null default now(),
  constraint daily_gifts_unique unique (user_id, date_reclamation)
);
alter table public.daily_gifts enable row level security; -- accès via RPC uniquement
create index if not exists idx_daily_gifts_user on public.daily_gifts (user_id, date_reclamation desc);

-- Statut du cadeau du jour (déjà réclamé ? prochain reset ?), sans le réclamer.
create or replace function public.get_daily_gift_status(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_claimed boolean;
begin
  select exists(
    select 1 from public.daily_gifts where user_id = p_user and date_reclamation = now()::date
  ) into v_claimed;
  return jsonb_build_object(
    'claimed', v_claimed,
    'next_reset', (date_trunc('day', now()) + interval '1 day')
  );
end; $$;

-- Réclame le cadeau du jour : tirage parmi 3 options, doublé si VIP actif.
create or replace function public.claim_daily_gift(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_today date := now()::date;
  v_vip boolean;
  v_roll int;
  v_type text; v_amount int;
  v_donuts int := 0; v_gemmes int := 0; v_burgers int := 0;
  v_new_d int; v_new_g int; v_new_b int;
begin
  if exists (select 1 from public.daily_gifts where user_id = p_user and date_reclamation = v_today) then
    return jsonb_build_object('error', 'deja_recupere', 'next_reset', (date_trunc('day', now()) + interval '1 day'));
  end if;

  select coalesce(vip_expire_at > now(), false) into v_vip from public.users where id = p_user for update;
  if v_vip is null then
    return jsonb_build_object('error', 'not_found');
  end if;

  -- Tirage parmi 3 options : 2 gemmes, 5 burgers, 10 donuts.
  v_roll := floor(random() * 3)::int;
  if v_roll = 0 then v_type := 'gemme';  v_amount := 2;
  elsif v_roll = 1 then v_type := 'burger'; v_amount := 5;
  else v_type := 'donut'; v_amount := 10;
  end if;

  -- Cadeau du jour amélioré pour les VIP : récompense doublée.
  if v_vip then v_amount := v_amount * 2; end if;

  if v_type = 'gemme' then v_gemmes := v_amount;
  elsif v_type = 'burger' then v_burgers := v_amount;
  else v_donuts := v_amount;
  end if;

  update public.users
    set donuts = donuts + v_donuts, gemmes = gemmes + v_gemmes, burgers = burgers + v_burgers
    where id = p_user
    returning donuts, gemmes, burgers into v_new_d, v_new_g, v_new_b;

  insert into public.daily_gifts(user_id, date_reclamation, recompense)
  values (p_user, v_today, jsonb_build_object('type', v_type, 'montant', v_amount, 'vip_double', v_vip));

  if v_donuts > 0 then perform public._log_tx(p_user, 'gain', v_donuts, 'donut', 'Cadeau du jour 🎁'); end if;
  if v_gemmes > 0 then perform public._log_tx(p_user, 'gain', v_gemmes, 'gemme', 'Cadeau du jour 🎁'); end if;
  if v_burgers > 0 then perform public._log_tx(p_user, 'gain', v_burgers, 'burger', 'Cadeau du jour 🎁'); end if;

  return jsonb_build_object(
    'ok', true, 'type', v_type, 'montant', v_amount, 'vip_double', v_vip,
    'soldes', jsonb_build_object('donuts', v_new_d, 'gemmes', v_new_g, 'burgers', v_new_b)
  );
end; $$;

grant execute on function public.get_daily_gift_status(uuid) to anon, authenticated;
grant execute on function public.claim_daily_gift(uuid) to anon, authenticated;

-- ============================================================
--  4. MÉGA BOÎTES 📦 — versions généreuses des boîtes mystères,
--     achetées en burgers. Même mécanique de tirage que open_boite.
-- ============================================================
create table if not exists public.mega_boites_templates (
  niveau       text primary key,
  nom          text not null,
  prix_burgers int  not null,
  contenu_fixe jsonb not null,   -- {donuts:[min,max], gemmes:[min,max], burger_bonus:[min,max]|null}
  probabilites jsonb not null    -- {skin:<0..1>, pool:'payants'|'rares'|'legendaires'}
);
insert into public.mega_boites_templates (niveau, nom, prix_burgers, contenu_fixe, probabilites) values
  ('normal',     'Normal 🟢',         40,  '{"donuts":[15,25], "gemmes":[2,3],  "burger_bonus":null}',       '{"skin":0.25,"pool":"payants"}'),
  ('rare',       'Rare 🔵',           55,  '{"donuts":[30,50], "gemmes":[4,6],  "burger_bonus":null}',       '{"skin":0.5, "pool":"payants"}'),
  ('super_rare', 'Super Rare 🟣',     80,  '{"donuts":[60,100],"gemmes":[8,12], "burger_bonus":null}',       '{"skin":1,   "pool":"payants"}'),
  ('incroyable', 'Incroyable 🟠',     120, '{"donuts":[150,200],"gemmes":[20,25],"burger_bonus":[20,20]}',   '{"skin":1,   "pool":"rares"}'),
  ('impossible', 'IMPOSSIBLE !!! 🔴', 200, '{"donuts":[300,500],"gemmes":[40,50],"burger_bonus":[50,50]}',   '{"skin":1,   "pool":"legendaires"}')
on conflict (niveau) do update
  set nom = excluded.nom,
      prix_burgers = excluded.prix_burgers,
      contenu_fixe = excluded.contenu_fixe,
      probabilites = excluded.probabilites;
alter table public.mega_boites_templates enable row level security; -- accès via RPC uniquement
revoke all on public.mega_boites_templates from anon, authenticated;

create table if not exists public.mega_boites (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  niveau         text not null,
  contenu        jsonb,
  ouverte        boolean not null default false,
  date_achat     timestamptz not null default now(),
  date_ouverture timestamptz
);
alter table public.mega_boites enable row level security; -- accès via RPC uniquement
create index if not exists idx_mega_boites_user on public.mega_boites (user_id, ouverte);

-- Méga boîtes non ouvertes de l'utilisateur.
create or replace function public.get_my_mega_boites(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'niveau', b.niveau, 'date_achat', b.date_achat
  ) order by b.date_achat desc), '[]'::jsonb)
  into v
  from public.mega_boites b
  where b.user_id = p_user and b.ouverte = false;
  return v;
end; $$;

-- Achat d'une méga boîte contre des burgers.
create or replace function public.buy_mega_boite(p_user uuid, p_niveau text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_prix int; v_burgers int; v_id uuid;
begin
  select prix_burgers into v_prix from public.mega_boites_templates where niveau = p_niveau;
  if v_prix is null then
    return jsonb_build_object('error', 'niveau_invalide');
  end if;

  select burgers into v_burgers from public.users where id = p_user for update;
  if v_burgers is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_burgers < v_prix then return jsonb_build_object('error', 'not_enough'); end if;

  update public.users set burgers = burgers - v_prix where id = p_user returning burgers into v_burgers;
  perform public._log_tx(p_user, 'achat', -v_prix, 'burger', 'Méga boîte ' || p_niveau || ' achetée');

  insert into public.mega_boites (user_id, niveau, contenu)
  values (p_user, p_niveau, jsonb_build_object('mode', 'aleatoire', 'niveau', p_niveau))
  returning id into v_id;

  return jsonb_build_object('ok', true, 'id', v_id, 'burgers', v_burgers);
end; $$;

-- Ouverture d'une méga boîte : tirage + crédit côté serveur (anti-triche).
-- Doublon de skin → compensation en gemmes (comme les boîtes mystères classiques).
create or replace function public.open_mega_boite(p_user uuid, p_boite uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_niveau text; v_ouverte boolean;
  v_fixe jsonb; v_prob jsonb; v_pool text; v_minprice int;
  v_donuts int; v_gemmes int; v_burger_bonus int := 0;
  v_cat text; v_item text; v_skin jsonb := null;
  v_avatar jsonb; v_owned jsonb; v_key text;
  v_price int; v_compense int := 0;
  v_new_d int; v_new_g int; v_new_b int;
begin
  select niveau, ouverte into v_niveau, v_ouverte
  from public.mega_boites
  where id = p_boite and user_id = p_user
  for update;

  if v_niveau is null then
    return jsonb_build_object('error', 'introuvable');
  end if;
  if v_ouverte then
    return jsonb_build_object('error', 'deja_ouverte');
  end if;

  select contenu_fixe, probabilites into v_fixe, v_prob
  from public.mega_boites_templates where niveau = v_niveau;
  if v_fixe is null then
    return jsonb_build_object('error', 'niveau_invalide');
  end if;

  v_donuts := floor(random() * ((v_fixe->'donuts'->>1)::int - (v_fixe->'donuts'->>0)::int + 1))::int
              + (v_fixe->'donuts'->>0)::int;
  v_gemmes := floor(random() * ((v_fixe->'gemmes'->>1)::int - (v_fixe->'gemmes'->>0)::int + 1))::int
              + (v_fixe->'gemmes'->>0)::int;
  if v_fixe->'burger_bonus' is not null and jsonb_typeof(v_fixe->'burger_bonus') = 'array' then
    v_burger_bonus := floor(random() * ((v_fixe->'burger_bonus'->>1)::int - (v_fixe->'burger_bonus'->>0)::int + 1))::int
                       + (v_fixe->'burger_bonus'->>0)::int;
  end if;

  -- Tirage du skin selon la probabilité et le pool du niveau.
  v_pool := v_prob->>'pool';
  if v_pool is not null and random() < coalesce((v_prob->>'skin')::float, 0) then
    v_minprice := case v_pool when 'legendaires' then 5 when 'rares' then 4 else 1 end;
    select category, item_id into v_cat, v_item
    from public.accessoires_catalogue
    where price >= v_minprice
    order by random() limit 1;
  end if;

  -- Skin éventuel : si déjà possédé → compensation en gemmes ; sinon ajout + équipement.
  if v_cat is not null and v_item is not null then
    v_avatar := coalesce((select avatar from public.users where id = p_user), '{}'::jsonb);
    v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);
    v_key := v_cat || ':' || v_item;

    if v_owned ? v_key then
      select price into v_price from public.accessoires_catalogue
        where category = v_cat and item_id = v_item;
      v_price := coalesce(v_price, 1);
      v_compense := case when v_price <= 2 then 2 when v_price <= 4 then 4 else 6 end;
      v_gemmes := v_gemmes + v_compense;
      v_skin := null;
    else
      v_owned := v_owned || to_jsonb(v_key);
      v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
      v_avatar := jsonb_set(v_avatar, array[v_cat], to_jsonb(v_item), true);
      update public.users set avatar = v_avatar where id = p_user;
      v_skin := jsonb_build_object('category', v_cat, 'item', v_item);
    end if;
  end if;

  update public.users
    set donuts = donuts + v_donuts, gemmes = gemmes + v_gemmes, burgers = burgers + v_burger_bonus
    where id = p_user
    returning donuts, gemmes, burgers, avatar into v_new_d, v_new_g, v_new_b, v_avatar;

  if v_donuts > 0 then perform public._log_tx(p_user, 'gain', v_donuts, 'donut', 'Méga boîte 📦'); end if;
  if v_gemmes > 0 then
    perform public._log_tx(p_user, 'gain', v_gemmes, 'gemme',
      case when v_compense > 0 then 'Méga boîte 📦 (doublon compensé)' else 'Méga boîte 📦' end);
  end if;
  if v_burger_bonus > 0 then perform public._log_tx(p_user, 'gain', v_burger_bonus, 'burger', 'Méga boîte 📦 (bonus)'); end if;

  update public.mega_boites
    set ouverte = true,
        date_ouverture = now(),
        contenu = jsonb_build_object(
          'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes,
          'burger_bonus', v_burger_bonus, 'skin', v_skin, 'doublon', v_compense)
    where id = p_boite;

  return jsonb_build_object(
    'ok', true, 'niveau', v_niveau, 'donuts', v_donuts, 'gemmes', v_gemmes,
    'burger_bonus', v_burger_bonus, 'skin', v_skin, 'doublon', v_compense, 'avatar', v_avatar,
    'soldes', jsonb_build_object('donuts', v_new_d, 'gemmes', v_new_g, 'burgers', v_new_b)
  );
end; $$;

grant execute on function public.get_my_mega_boites(uuid) to anon, authenticated;
grant execute on function public.buy_mega_boite(uuid, text) to anon, authenticated;
grant execute on function public.open_mega_boite(uuid, uuid) to anon, authenticated;

-- ============================================================
--  5. PASS VIP 👑 — 40 🍩 + 5 💎 + 30 🍔, durée 2 semaines (cumulable)
-- ============================================================
create or replace function public.buy_vip_pass(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_d int; v_g int; v_b int; v_vip timestamptz; v_new_vip timestamptz; v_boite_id uuid;
begin
  select donuts, gemmes, burgers, vip_expire_at into v_d, v_g, v_b, v_vip
  from public.users where id = p_user for update;
  if v_d is null then return jsonb_build_object('error', 'not_found'); end if;
  if v_d < 40 or v_g < 5 or v_b < 30 then
    return jsonb_build_object('error', 'not_enough', 'donuts', v_d, 'gemmes', v_g, 'burgers', v_b);
  end if;

  -- Cumulable : un pass déjà actif prolonge son expiration de 14 jours de plus.
  v_new_vip := greatest(now(), coalesce(v_vip, now())) + interval '14 days';

  update public.users
    set donuts = donuts - 40, gemmes = gemmes - 5, burgers = burgers - 30,
        vip_expire_at = v_new_vip
    where id = p_user
    returning donuts, gemmes, burgers into v_d, v_g, v_b;

  perform public._log_tx(p_user, 'achat', -40, 'donut', 'Pass VIP 👑');
  perform public._log_tx(p_user, 'achat', -5, 'gemme', 'Pass VIP 👑');
  perform public._log_tx(p_user, 'achat', -30, 'burger', 'Pass VIP 👑');

  -- 1 méga boîte "Rare" offerte à l'achat du pass.
  insert into public.mega_boites (user_id, niveau, contenu)
  values (p_user, 'rare', jsonb_build_object('mode', 'aleatoire', 'niveau', 'rare'))
  returning id into v_boite_id;

  return jsonb_build_object(
    'ok', true, 'vip_expire_at', v_new_vip,
    'donuts', v_d, 'gemmes', v_g, 'burgers', v_b, 'mega_boite_id', v_boite_id
  );
end; $$;

grant execute on function public.buy_vip_pass(uuid) to anon, authenticated;

-- ============================================================
--  6. IMPÔTS 💸 — toutes les 2 semaines : -10% donuts, -5% gemmes
--     (les burgers ne sont pas taxés, VIP non exempté).
--     Idempotent côté serveur : no-op si < 14 jours depuis last_tax_date.
-- ============================================================
create or replace function public.apply_taxes(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_last timestamptz; v_d int; v_g int;
  v_perte_d int; v_perte_g int;
  v_new_d int; v_new_g int;
begin
  select last_tax_date, donuts, gemmes into v_last, v_d, v_g
  from public.users where id = p_user for update;
  if v_d is null then return jsonb_build_object('error', 'not_found'); end if;

  if v_last is not null and now() < v_last + interval '14 days' then
    return jsonb_build_object('ok', true, 'applied', false, 'next_tax_date', v_last + interval '14 days');
  end if;

  v_perte_d := floor(v_d * 0.10)::int;
  v_perte_g := floor(v_g * 0.05)::int;

  update public.users
    set donuts = donuts - v_perte_d, gemmes = gemmes - v_perte_g, last_tax_date = now()
    where id = p_user
    returning donuts, gemmes into v_new_d, v_new_g;

  if v_perte_d > 0 then perform public._log_tx(p_user, 'impot', -v_perte_d, 'donut', 'Impôts 💸'); end if;
  if v_perte_g > 0 then perform public._log_tx(p_user, 'impot', -v_perte_g, 'gemme', 'Impôts 💸'); end if;

  return jsonb_build_object(
    'ok', true, 'applied', true,
    'donuts_perdus', v_perte_d, 'gemmes_perdus', v_perte_g,
    'donuts', v_new_d, 'gemmes', v_new_g
  );
end; $$;

grant execute on function public.apply_taxes(uuid) to anon, authenticated;
