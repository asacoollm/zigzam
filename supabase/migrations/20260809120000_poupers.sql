-- ============================================================
--  ZIGZAM — Poupers Collectore 🪆
--   9 poupées vaudou, une par record du site. Le détenteur actuel du
--   record possède la poupée ; elle change de mains dès que quelqu'un
--   bat son record. Asacool (superadmin) ne peut jamais en gagner.
--
--   - public.poupers               : les 9 poupées + leur détenteur actuel
--   - public.pouper_notifications  : file d'attente « tu as gagné/perdu »
--     (remise au prochain login/passage sur le dashboard, même si
--     l'ancien détenteur n'est pas connecté au moment du transfert)
--   - check_pouper_records()       : recalcule les 9 records, transfère
--     les poupées, journalise les notifs. Appelée à la connexion et
--     après chaque action significative (voir src/lib/modules.js).
--   - get_poupers()                       : liste publique (page /poupers)
--   - get_pending_pouper_notifications()  : notifs en attente d'un user
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  0. Colonne de suivi du temps de connexion cumulé (secondes).
--     Incrémentée par ping_activity() à chaque heartbeat (toutes les
--     2 min), seulement si le heartbeat précédent est récent (session
--     active continue) — évite de compter les longues absences.
-- ------------------------------------------------------------
alter table public.users
  add column if not exists temps_connexion_secondes bigint not null default 0;

create or replace function public.ping_activity(p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
declare v_last timestamptz; v_delta int;
begin
  select derniere_activite into v_last from public.users where id = p_user;

  if v_last is not null and now() - v_last < interval '3 minutes' then
    v_delta := greatest(0, least(180, extract(epoch from (now() - v_last))::int));
    update public.users
      set derniere_activite = now(),
          temps_connexion_secondes = temps_connexion_secondes + v_delta
      where id = p_user;
  else
    update public.users set derniere_activite = now() where id = p_user;
  end if;
end; $$;

grant execute on function public.ping_activity(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  1. TABLE poupers
-- ------------------------------------------------------------
create table if not exists public.poupers (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  nom           text not null,
  record_type   text not null,
  description   text not null default '',
  image_url     text not null,
  detenteur_id  uuid references public.users(id) on delete set null,
  record_valeur numeric not null default 0,
  updated_at    timestamptz not null default now()
);
alter table public.poupers enable row level security; -- accès via RPC uniquement

insert into public.poupers (slug, nom, record_type, description, image_url) values
  ('contacts',    'La Connectée',      'nb_contacts',     'Offerte à qui a le plus de contacts sur Zigzam !',              '/poupers/contacts.png'),
  ('donuts',      'La Gourmande',      'nb_donuts',        'Elle rejoint qui a le plus de 🍩 donuts en poche !',            '/poupers/donuts.png'),
  ('gemmes',      'La Précieuse',      'nb_gemmes',        'Réservée au plus grand collectionneur de 💎 gemmes !',         '/poupers/gemmes.png'),
  ('actus',       'La Journaliste',    'nb_actus',         'Elle suit qui publie le plus d''actus sur le fil !',            '/poupers/actus.png'),
  ('messages',    'La Bavarde',        'nb_messages',      'Pour qui envoie le plus de messages dans Discuter !',           '/poupers/messages.png'),
  ('lava',        'La Volcanique',     'niveau_lava',      'Elle grimpe avec le meilleur niveau à Floor is Lava !',         '/poupers/lava.png'),
  ('temps',       'La Fidèle',         'temps_connexion',  'Fidèle à qui passe le plus de temps sur Zigzam !',              '/poupers/temps.png'),
  ('boites',      'La Collectionneuse','nb_boites',        'Elle adore qui a reçu le plus de boîtes mystères !',            '/poupers/boites.png'),
  ('accessoires', 'La Stylée',         'nb_accessoires',   'Pour le look le plus stylé, le plus d''accessoires débloqués !', '/poupers/accessoires.png')
on conflict (slug) do update
  set nom = excluded.nom,
      record_type = excluded.record_type,
      description = excluded.description,
      image_url = excluded.image_url;

-- ------------------------------------------------------------
--  2. TABLE pouper_notifications — file d'attente « gain / perte »
-- ------------------------------------------------------------
create table if not exists public.pouper_notifications (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  pouper_slug  text not null,
  pouper_nom   text not null,
  record_type  text not null,
  type         text not null check (type in ('gain', 'perte')),
  autre_pseudo text,
  vue          boolean not null default false,
  created_at   timestamptz not null default now()
);
alter table public.pouper_notifications enable row level security; -- accès via RPC uniquement
create index if not exists idx_pouper_notif_user on public.pouper_notifications (user_id, vue);

-- ------------------------------------------------------------
--  3. Helper interne : compare le meilleur (utilisateur, valeur) d'un
--     record à l'état actuel de la poupée, transfère si besoin et
--     journalise les notifications (gain pour le nouveau, perte pour
--     l'ancien). Retire aussi la poupée de l'avatar de l'ancien
--     détenteur si elle y était affichée.
-- ------------------------------------------------------------
create or replace function public._pouper_apply(p_slug text, p_best_id uuid, p_best_value numeric)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_pouper_id uuid; v_nom text; v_record_type text;
  v_old_id uuid; v_old_value numeric;
  v_new_id uuid; v_new_value numeric;
  v_old_pseudo text; v_new_pseudo text;
begin
  select id, nom, record_type, detenteur_id, record_valeur
    into v_pouper_id, v_nom, v_record_type, v_old_id, v_old_value
  from public.poupers where slug = p_slug for update;

  if v_pouper_id is null then return; end if;

  v_new_value := coalesce(p_best_value, 0);
  v_new_id := case when v_new_value > 0 then p_best_id else null end;

  -- Pas de changement de détenteur : on rafraîchit juste la valeur affichée.
  if v_new_id is not distinct from v_old_id then
    if v_new_value is distinct from v_old_value then
      update public.poupers set record_valeur = v_new_value, updated_at = now() where id = v_pouper_id;
    end if;
    return;
  end if;

  update public.poupers
    set detenteur_id = v_new_id, record_valeur = v_new_value, updated_at = now()
    where id = v_pouper_id;

  if v_new_id is not null then
    select pseudo into v_new_pseudo from public.users where id = v_new_id;
    insert into public.pouper_notifications(user_id, pouper_slug, pouper_nom, record_type, type, autre_pseudo)
    values (v_new_id, p_slug, v_nom, v_record_type, 'gain', v_old_pseudo);
  end if;

  if v_old_id is not null then
    select pseudo into v_old_pseudo from public.users where id = v_old_id;
    insert into public.pouper_notifications(user_id, pouper_slug, pouper_nom, record_type, type, autre_pseudo)
    values (v_old_id, p_slug, v_nom, v_record_type, 'perte', v_new_pseudo);

    -- La poupée disparaît de l'avatar de l'ancien détenteur si elle y était affichée.
    update public.users
      set avatar = avatar - 'pouperEquipped'
      where id = v_old_id
        and avatar->'pouperEquipped'->>'slug' = p_slug;
  end if;
end; $$;

-- ------------------------------------------------------------
--  4. check_pouper_records() — recalcule les 9 records (superadmin
--     toujours exclu) et transfère les poupées si besoin.
-- ------------------------------------------------------------
create or replace function public.check_pouper_records()
returns void language plpgsql security definer set search_path = public as $$
declare r record;
begin
  -- 1. contacts
  select u.id as id, (select count(*) from public.contacts c where c.user_id = u.id) as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('contacts', r.id, r.v);

  -- 2. donuts
  select u.id as id, u.donuts as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('donuts', r.id, r.v);

  -- 3. gemmes
  select u.id as id, u.gemmes as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('gemmes', r.id, r.v);

  -- 4. actus publiées
  select u.id as id,
    (select count(*) from public.actualites a where a.auteur_id = u.id and a.statut = 'publie') as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('actus', r.id, r.v);

  -- 5. messages envoyés
  select u.id as id, (select count(*) from public.messages m where m.auteur_id = u.id) as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('messages', r.id, r.v);

  -- 6. niveau Floor is Lava
  select u.id as id, u.flava_niveau as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('lava', r.id, r.v);

  -- 7. temps de connexion cumulé
  select u.id as id, u.temps_connexion_secondes as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('temps', r.id, r.v);

  -- 8. boîtes reçues (mystères + méga)
  select u.id as id,
    ((select count(*) from public.boites_mysteres b where b.destinataire_id = u.id)
     + (select count(*) from public.mega_boites mb where mb.user_id = u.id)) as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('boites', r.id, r.v);

  -- 9. accessoires débloqués (avatar.owned)
  select u.id as id, coalesce(jsonb_array_length(u.avatar->'owned'), 0) as v
  from public.users u where u.role <> 'superadmin'
  order by v desc, u.id asc limit 1 into r;
  perform public._pouper_apply('accessoires', r.id, r.v);
end; $$;

grant execute on function public.check_pouper_records() to anon, authenticated;

-- ------------------------------------------------------------
--  5. get_poupers() — liste publique pour la page /poupers.
-- ------------------------------------------------------------
create or replace function public.get_poupers()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'nom', p.nom, 'record_type', p.record_type,
    'description', p.description, 'image_url', p.image_url,
    'record_valeur', p.record_valeur, 'updated_at', p.updated_at,
    'detenteur', case when u.id is null then null else jsonb_build_object(
      'id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role,
      'vip', coalesce(u.vip_expire_at > now(), false)
    ) end
  ) order by p.nom), '[]'::jsonb)
  into v
  from public.poupers p
  left join public.users u on u.id = p.detenteur_id;
  return v;
end; $$;

grant execute on function public.get_poupers() to anon, authenticated;

-- ------------------------------------------------------------
--  6. get_pending_pouper_notifications(p_user) — notifs en attente,
--     marquées vues au passage (remise unique, appelée au dashboard).
-- ------------------------------------------------------------
create or replace function public.get_pending_pouper_notifications(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'pouper_slug', pouper_slug, 'pouper_nom', pouper_nom,
    'record_type', record_type, 'type', type, 'autre_pseudo', autre_pseudo,
    'created_at', created_at
  ) order by created_at), '[]'::jsonb)
  into v
  from public.pouper_notifications
  where user_id = p_user and vue = false;

  update public.pouper_notifications set vue = true where user_id = p_user and vue = false;

  return v;
end; $$;

grant execute on function public.get_pending_pouper_notifications(uuid) to anon, authenticated;
