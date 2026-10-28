-- ============================================================
--  ZIGZAM — Farces d'Halloween 🎃
--   Un élève paie des donuts pour envoyer une farce (animation plein écran
--   mignonne, jamais effrayante) à un autre élève. Réservé à la saison
--   Halloween active. Même modèle de débit atomique que `send_value` /
--   `buy_accessory` (verrou FOR UPDATE sur la ligne de l'expéditeur).
--  Idempotent.
-- ============================================================

-- ------------------------------------------------------------
--  Réglages globaux (ligne unique, id toujours = true).
--   prix    : coût en donuts d'une farce (facile à changer : un simple
--             `update public.farces_reglages set prix = ... where id = true;`).
--   actives : interrupteur superadmin pour couper toutes les farces.
-- ------------------------------------------------------------
create table if not exists public.farces_reglages (
  id      boolean primary key default true check (id),
  prix    int not null default 10,
  actives boolean not null default true
);
insert into public.farces_reglages (id, prix, actives)
values (true, 10, true)
on conflict (id) do nothing;
alter table public.farces_reglages enable row level security; -- accès via RPC uniquement

-- ------------------------------------------------------------
--  Opt-out : présence d'une ligne = l'élève ne veut plus recevoir de farces.
-- ------------------------------------------------------------
create table if not exists public.farces_desactivees (
  user_id    uuid primary key references public.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.farces_desactivees enable row level security; -- accès via RPC uniquement

-- ------------------------------------------------------------
--  Farces envoyées. `type` limité aux 4 animations mignonnes prévues.
-- ------------------------------------------------------------
create table if not exists public.farces (
  id              uuid primary key default gen_random_uuid(),
  expediteur_id   uuid not null references public.users(id) on delete cascade,
  destinataire_id uuid not null references public.users(id) on delete cascade,
  type            text not null check (type in ('araignee', 'fantome', 'chauves_souris', 'citrouille')),
  prix            int not null,
  created_at      timestamptz not null default now(),
  vue_at          timestamptz
);
alter table public.farces enable row level security; -- accès via RPC uniquement
create index if not exists idx_farces_destinataire on public.farces (destinataire_id, vue_at);
create index if not exists idx_farces_expediteur_jour on public.farces (expediteur_id, created_at);
create index if not exists idx_farces_expediteur_dest_jour on public.farces (expediteur_id, destinataire_id, created_at);

-- ------------------------------------------------------------
--  Public : réglages courants (prix + interrupteur), pour l'affichage client.
-- ------------------------------------------------------------
create or replace function public.get_farces_reglages()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select jsonb_build_object('prix', prix, 'actives', actives)
  into v from public.farces_reglages where id = true;
  return coalesce(v, jsonb_build_object('prix', 10, 'actives', true));
end; $$;

-- ------------------------------------------------------------
--  Envoyer une farce. Tout est vérifié côté serveur :
--   saison Halloween active, destinataire valide et pas opt-out, réglage
--   global actif, limites quotidiennes (5/jour au total, 2/jour par
--   destinataire), solde suffisant. Débit + insertion dans le même appel.
-- ------------------------------------------------------------
create or replace function public.send_farce(
  p_expediteur uuid, p_destinataire uuid, p_type text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_prix int; v_actives boolean; v_saison_ok boolean;
  v_donuts int; v_pseudo_exp text; v_pseudo_dest text;
  v_count_jour int; v_count_dest int; v_id uuid;
begin
  if p_type not in ('araignee', 'fantome', 'chauves_souris', 'citrouille') then
    return jsonb_build_object('error', 'type_invalide');
  end if;
  if p_expediteur = p_destinataire then
    return jsonb_build_object('error', 'soi_meme');
  end if;

  select exists (
    select 1 from public.saisons
    where slug = 'halloween' and actif
      and (date_debut is null or now() >= date_debut)
      and (date_fin is null or now() <= date_fin)
  ) into v_saison_ok;
  if not v_saison_ok then
    return jsonb_build_object('error', 'saison_inactive');
  end if;

  select coalesce(prix, 10), coalesce(actives, true) into v_prix, v_actives
  from public.farces_reglages where id = true;
  if not v_actives then
    return jsonb_build_object('error', 'farces_coupees');
  end if;

  -- Verrou sur l'expéditeur : protège le débit ET sérialise, pour un même
  -- envoyeur, les compteurs quotidiens ci-dessous (anti double-envoi
  -- concurrent qui dépasserait les limites).
  select donuts, pseudo into v_donuts, v_pseudo_exp
  from public.users where id = p_expediteur for update;
  if v_pseudo_exp is null then
    return jsonb_build_object('error', 'expediteur_introuvable');
  end if;

  select pseudo into v_pseudo_dest from public.users where id = p_destinataire;
  if v_pseudo_dest is null then
    return jsonb_build_object('error', 'dest_introuvable');
  end if;

  if exists (select 1 from public.farces_desactivees where user_id = p_destinataire) then
    return jsonb_build_object('error', 'destinataire_refuse');
  end if;

  select count(*) into v_count_jour from public.farces
    where expediteur_id = p_expediteur and created_at::date = current_date;
  if v_count_jour >= 5 then
    return jsonb_build_object('error', 'limite_quotidienne');
  end if;

  select count(*) into v_count_dest from public.farces
    where expediteur_id = p_expediteur and destinataire_id = p_destinataire
      and created_at::date = current_date;
  if v_count_dest >= 2 then
    return jsonb_build_object('error', 'limite_destinataire');
  end if;

  if v_donuts < v_prix then
    return jsonb_build_object('error', 'not_enough_donuts', 'donuts', v_donuts);
  end if;

  update public.users set donuts = donuts - v_prix where id = p_expediteur
    returning donuts into v_donuts;
  perform public._log_tx(p_expediteur, 'depense', -v_prix, 'donut',
    'Farce envoyée à ' || v_pseudo_dest || ' 🎃');

  insert into public.farces (expediteur_id, destinataire_id, type, prix)
  values (p_expediteur, p_destinataire, p_type, v_prix)
  returning id into v_id;

  return jsonb_build_object(
    'ok', true, 'id', v_id, 'donuts', v_donuts, 'prix', v_prix,
    'destinataire_pseudo', v_pseudo_dest, 'expediteur_pseudo', v_pseudo_exp
  );
end; $$;

-- ------------------------------------------------------------
--  Mes farces non vues (pour FarceOverlay : chargement + polling).
-- ------------------------------------------------------------
create or replace function public.get_my_farces_non_vues(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'type', f.type, 'created_at', f.created_at,
    'expediteur_pseudo', u.pseudo
  ) order by f.created_at asc), '[]'::jsonb)
  into v
  from public.farces f
  join public.users u on u.id = f.expediteur_id
  where f.destinataire_id = p_user and f.vue_at is null;
  return v;
end; $$;

-- ------------------------------------------------------------
--  Marque une farce comme vue (après l'animation).
-- ------------------------------------------------------------
create or replace function public.mark_farce_vue(p_user uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update public.farces set vue_at = now()
    where id = p_id and destinataire_id = p_user and vue_at is null;
  return jsonb_build_object('ok', true);
end; $$;

-- ------------------------------------------------------------
--  Opt-out : lire / écrire sa préférence « Recevoir des farces ».
-- ------------------------------------------------------------
create or replace function public.get_farces_desactivees(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  return jsonb_build_object('desactivees',
    exists(select 1 from public.farces_desactivees where user_id = p_user));
end; $$;

create or replace function public.set_farces_desactivees(p_user uuid, p_valeur boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if p_valeur then
    insert into public.farces_desactivees (user_id) values (p_user)
    on conflict (user_id) do nothing;
  else
    delete from public.farces_desactivees where user_id = p_user;
  end if;
  return jsonb_build_object('ok', true, 'desactivees', p_valeur);
end; $$;

-- ------------------------------------------------------------
--  Superadmin : couper/activer les farces, et historique des 30 dernières.
-- ------------------------------------------------------------
create or replace function public.admin_set_farces_actives(p_admin uuid, p_actif boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  update public.farces_reglages set actives = p_actif where id = true;
  return jsonb_build_object('ok', true, 'actives', p_actif);
end; $$;

create or replace function public.admin_list_farces(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', f.id, 'type', f.type, 'prix', f.prix,
    'created_at', f.created_at, 'vue_at', f.vue_at,
    'expediteur', jsonb_build_object('id', ue.id, 'pseudo', ue.pseudo),
    'destinataire', jsonb_build_object('id', ud.id, 'pseudo', ud.pseudo)
  ) order by f.created_at desc), '[]'::jsonb)
  into v
  from (select * from public.farces order by created_at desc limit 30) f
  join public.users ue on ue.id = f.expediteur_id
  join public.users ud on ud.id = f.destinataire_id;
  return v;
end; $$;

grant execute on function public.get_farces_reglages() to anon, authenticated;
grant execute on function public.send_farce(uuid, uuid, text) to anon, authenticated;
grant execute on function public.get_my_farces_non_vues(uuid) to anon, authenticated;
grant execute on function public.mark_farce_vue(uuid, uuid) to anon, authenticated;
grant execute on function public.get_farces_desactivees(uuid) to anon, authenticated;
grant execute on function public.set_farces_desactivees(uuid, boolean) to anon, authenticated;
grant execute on function public.admin_set_farces_actives(uuid, boolean) to anon, authenticated;
grant execute on function public.admin_list_farces(uuid) to anon, authenticated;
