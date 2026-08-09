-- ============================================================
--  ZIGZAM — Skins Sur Mesure ⭐ (skins complets créés à la demande
--  pour un membre précis, ex. le kimono de Penpen).
--
--   - public.skins_sur_mesure : une ligne par skin sur mesure.
--     statut 'en_attente' → visible UNIQUEMENT par le superadmin
--     (aperçu dans /admin) ; statut 'valide' → ajouté à l'avatar.owned
--     du membre concerné, devient équipable dans son Avatar.
--   - Le SVG du skin vit dans src/components/avatarParts.jsx
--     (registre CUSTOM_FULL), rendu par renderFull() comme un skin
--     complet classique (cf. « Skins complets » Disney).
--   - Pas de nouvelle RPC pour la « demande de correction » : le
--     bouton admin réutilise create_bug_report() (déjà en place).
--  Idempotent.
-- ============================================================

create table if not exists public.skins_sur_mesure (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  item_id    text unique not null,
  nom        text not null,
  category   text not null default 'full',
  description text not null default '',
  statut     text not null default 'en_attente' check (statut in ('en_attente', 'valide')),
  created_at timestamptz not null default now(),
  valide_at  timestamptz
);
alter table public.skins_sur_mesure enable row level security; -- accès via RPC uniquement
create index if not exists idx_skins_sur_mesure_user on public.skins_sur_mesure (user_id, statut);

-- ------------------------------------------------------------
--  get_my_custom_skins(p_user) — UNIQUEMENT les skins VALIDÉS de
--  l'utilisateur (jamais ceux en attente : c'est ce qui garde le
--  skin invisible pour lui tant qu'Asacool n'a pas validé).
-- ------------------------------------------------------------
create or replace function public.get_my_custom_skins(p_user uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', id, 'item_id', item_id, 'nom', nom, 'category', category
  ) order by created_at), '[]'::jsonb)
  into v
  from public.skins_sur_mesure
  where user_id = p_user and statut = 'valide';
  return v;
end; $$;

grant execute on function public.get_my_custom_skins(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  admin_list_custom_skins(p_admin) — superadmin only. TOUS les
--  skins (en attente + validés), avec pseudo/avatar du bénéficiaire
--  pour l'aperçu dans /admin.
-- ------------------------------------------------------------
create or replace function public.admin_list_custom_skins(p_admin uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v jsonb;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return '[]'::jsonb;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'item_id', s.item_id, 'nom', s.nom, 'category', s.category,
    'description', s.description, 'statut', s.statut,
    'created_at', s.created_at, 'valide_at', s.valide_at,
    'destinataire', jsonb_build_object(
      'id', u.id, 'pseudo', u.pseudo, 'avatar', u.avatar, 'role', u.role
    )
  ) order by (s.statut = 'en_attente') desc, s.created_at desc), '[]'::jsonb)
  into v
  from public.skins_sur_mesure s
  join public.users u on u.id = s.user_id;
  return v;
end; $$;

grant execute on function public.admin_list_custom_skins(uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  admin_create_custom_skin(p_admin, p_user, p_item_id, p_nom, ...)
--  superadmin only. Crée un nouveau skin sur mesure en attente pour
--  un membre (le SVG doit déjà exister dans avatarParts.jsx).
-- ------------------------------------------------------------
create or replace function public.admin_create_custom_skin(
  p_admin uuid, p_user uuid, p_item_id text, p_nom text,
  p_category text default 'full', p_description text default ''
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;
  if not exists (select 1 from public.users where id = p_user) then
    return jsonb_build_object('error', 'user_introuvable');
  end if;

  insert into public.skins_sur_mesure (user_id, item_id, nom, category, description)
  values (p_user, p_item_id, p_nom, coalesce(nullif(p_category, ''), 'full'), coalesce(p_description, ''))
  on conflict (item_id) do nothing
  returning id into v_id;

  if v_id is null then
    return jsonb_build_object('error', 'item_id_deja_utilise');
  end if;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;

grant execute on function public.admin_create_custom_skin(uuid, uuid, text, text, text, text) to anon, authenticated;

-- ------------------------------------------------------------
--  admin_validate_custom_skin(p_admin, p_id) — superadmin only.
--  Valide le skin : ajoute `<category>:<item_id>` à avatar.owned du
--  bénéficiaire (équipable gratuitement, comme un accessoire déjà
--  acquis) et lui envoie un message dans Discuter pour l'annoncer.
--  Réutilise/crée la discussion privée Asacool <-> bénéficiaire.
-- ------------------------------------------------------------
create or replace function public.admin_validate_custom_skin(p_admin uuid, p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_user uuid; v_item text; v_nom text; v_cat text; v_statut text;
  v_avatar jsonb; v_owned jsonb; v_key text;
  v_disc uuid;
begin
  if (select role from public.users where id = p_admin) <> 'superadmin' then
    return jsonb_build_object('error', 'forbidden');
  end if;

  select user_id, item_id, nom, category, statut
    into v_user, v_item, v_nom, v_cat, v_statut
  from public.skins_sur_mesure where id = p_id for update;

  if v_user is null then
    return jsonb_build_object('error', 'introuvable');
  end if;
  if v_statut = 'valide' then
    return jsonb_build_object('ok', true, 'deja_valide', true);
  end if;

  update public.skins_sur_mesure set statut = 'valide', valide_at = now() where id = p_id;

  v_key := v_cat || ':' || v_item;
  select coalesce(avatar, '{}'::jsonb) into v_avatar from public.users where id = v_user;
  v_owned := coalesce(v_avatar->'owned', '[]'::jsonb);
  if not (v_owned ? v_key) then
    v_owned := v_owned || to_jsonb(v_key);
    v_avatar := jsonb_set(v_avatar, '{owned}', v_owned, true);
    update public.users set avatar = v_avatar where id = v_user;
  end if;

  -- Discussion privée Asacool <-> bénéficiaire (réutilisée si elle existe déjà).
  select d.id into v_disc
  from public.discussions d
  where d.type = 'prive'
    and (select count(*) from public.participants p where p.discussion_id = d.id) = 2
    and exists (select 1 from public.participants p1 where p1.discussion_id = d.id and p1.user_id = p_admin)
    and exists (select 1 from public.participants p2 where p2.discussion_id = d.id and p2.user_id = v_user)
  limit 1;

  if v_disc is null then
    insert into public.discussions(titre, type, createur_id) values (null, 'prive', p_admin)
    returning id into v_disc;
    insert into public.participants(discussion_id, user_id) values (v_disc, p_admin), (v_disc, v_user)
    on conflict do nothing;
  end if;

  insert into public.messages(discussion_id, auteur_id, contenu)
  values (v_disc, p_admin,
    '🎉 Ton skin sur mesure « ' || v_nom || ' » est validé ! Va le voir dans Avatar ✨');

  return jsonb_build_object('ok', true, 'discussion_id', v_disc);
end; $$;

grant execute on function public.admin_validate_custom_skin(uuid, uuid) to anon, authenticated;

-- ------------------------------------------------------------
--  Seed : kimono de Penpen (statut en_attente — Asacool doit valider
--  depuis /admin). Pseudo comparé en ILIKE 'penpen%' car il porte des
--  emojis en suffixe (« Penpen😎🐶🍀 »). No-op si le membre n'existe pas.
-- ------------------------------------------------------------
do $$
declare v_user uuid;
begin
  select id into v_user from public.users where pseudo ilike 'penpen%' limit 1;
  if v_user is not null then
    insert into public.skins_sur_mesure (user_id, item_id, nom, category, description)
    values (
      v_user, 'penpenkimono', 'Kimono Sur Mesure', 'full',
      'Skin exclusif : corps beige/crème, kimono vert/rouge/noir à bandes verticales, col en V et obi.'
    )
    on conflict (item_id) do nothing;
  end if;
end $$;
